//imports
const Discord = require("discord.js");
const moment = require("moment");
const {sendMessage} = require("../../tools/utils");

// mysql
const mysql = require("mysql2/promise");
const db = require("../../config/db");
const pool = mysql.createPool({
    ...db,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
});

//module settings
const name = "message-history";
const description = "Retrieves history for the specified message ID.";
const params = [
    {
        param: "messageID",
        description: "The ID of the message",
        type: "Snowflake",
        //no default, a message ID must be given
    },
];

//main
async function execute(client, message, args) {
    if (args.length !== 1) {
        await sendMessage(`You must provide the message ID.`, message.channel);
        return false;
    }
    let messageID = args[0];
    let dbMessageResult, currentMessage, messageHistory;
    try {
        [dbMessageResult] = await pool.query("SELECT m.guild,m.channel,m.content,m.timestamp,m.lastEditTimestamp,m.deleted,a.displayName AS author_displayName FROM messages m LEFT JOIN authors a ON m.author = a.id WHERE m.id = ? LIMIT 1", messageID);
        [messageHistory] = await pool.query("SELECT * FROM messageEdits WHERE messageId = ? ORDER BY editTimestamp DESC", messageID);

        currentMessage = dbMessageResult[0];
    } catch (e) {
        throw e;
    }
    if (dbMessageResult.length === 0) {
        await sendMessage(`That message ID does not exist.`, message.channel);
        return false;
    }
    const dateFormat = "dddd, MMMM Do YYYY @ hh:mm:ss a";
    const embedMessage = new Discord.MessageEmbed()
        .setTitle(`Message History for ${messageID}`)
        .setURL(`https://discord.com/channels/${currentMessage.guild}/${currentMessage.channel}/${messageID}`)
        .setDescription(`Posted by: **${currentMessage.author_displayName}**`);
    let originalContent = currentMessage.content;
    if (currentMessage.deleted) {
        embedMessage.addField(":x: Deleted:", moment(currentMessage.deleted).format(dateFormat));
    }
    if (messageHistory.length > 0) { // if the message has an edit history
        originalContent = messageHistory[messageHistory.length - 1].oldContent;
        const mostRecentEdit = messageHistory.shift();
        embedMessage.addField(`Current Content (edited on ${moment(mostRecentEdit.editTimestamp).format(dateFormat)}):`, mostRecentEdit.newContent);
        if ((currentMessage.deleted && messageHistory.length <= 8) || (!currentMessage.deleted && messageHistory.length <= 9)) {
            for (const edit of messageHistory) {
                let formattedDatetime = moment(edit.editTimestamp).format(dateFormat);
                embedMessage.addField(`Edit on ${formattedDatetime}:`, edit.newContent);
            }
            embedMessage.addField(`Original Content (posted ${moment(currentMessage.timestamp).format(dateFormat)}):`, originalContent);
            try {
                await sendMessage(embedMessage, message.channel);
            } catch (e) {
                throw e;
            }
        } else {
            //in case there are more edits than can fit in the MessageEmbed (it only supports 10 fields total)
            for (var currentMessagePointer = 0; (currentMessage.deleted && currentMessagePointer < 7) || (!currentMessage.deleted && currentMessagePointer < 8); currentMessagePointer++) {
                let formattedDatetime = moment(messageHistory[currentMessagePointer].editTimestamp).format(dateFormat);
                embedMessage.addField(`Edit on ${formattedDatetime}:`, messageHistory[currentMessagePointer].newContent);
            }
            try {
                await sendMessage(embedMessage, message.channel);
            } catch (e) {
                throw e;
            }
            //loop through more edits until end of edit history is reached
            for (; currentMessagePointer < messageHistory.length - 1; currentMessagePointer += internalMessagePointer) {
                const furtherEdits = new Discord.MessageEmbed()
                    .setURL(`https://discord.com/channels/${currentMessage.guild}/${currentMessage.channel}/${messageID}`);
                for (var internalMessagePointer = 0; internalMessagePointer < 9 && messageHistory.length - 1 - (currentMessagePointer + internalMessagePointer) >= 0; internalMessagePointer++) {
                    let pointer = currentMessagePointer + internalMessagePointer;
                    let formattedDatetime = moment(messageHistory[pointer].editTimestamp).format(dateFormat);
                    furtherEdits.addField(`Edit on ${formattedDatetime}:`, messageHistory[pointer].newContent);
                }
                if (messageHistory.length - (currentMessagePointer + internalMessagePointer) === 0) {
                    furtherEdits.addField(`Original Content (posted ${moment(currentMessage.timestamp).format(dateFormat)}):`, originalContent);
                }
                try {
                    await sendMessage(furtherEdits, message.channel);
                } catch (e) {
                    throw e;
                }
            }
        }
    } else {
        embedMessage.addField(`Original Content (posted ${moment(currentMessage.timestamp).format(dateFormat)}):`, originalContent);
        try {
            await sendMessage(embedMessage, message.channel);
        } catch (e) {
            throw e;
        }
    }

    return true;
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
}

//helper functions
