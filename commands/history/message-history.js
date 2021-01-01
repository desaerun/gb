//imports
const Discord = require("discord.js");
const moment = require("moment");

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
const args = [
    {
        name: 'messageID',
        description: 'The ID of the message',
        type: 'Snowflake',
        //no default, a message ID must be given
        required: true,
    },
];

//main
async function execute(client, message, args) {
    if (args.length !== 1) {
        message.channel.send("You must provide the message ID.")
        return false;
    }
    let messageID = args[0];
    let dbMessageResult, currentMessage, messageHistory;
    try {
        [dbMessageResult] = await pool.query("SELECT m.guild,m.channel,m.content,m.timestamp,m.lastEditTimestamp,a.displayName AS author_displayName FROM messages m LEFT JOIN authors a ON m.author = a.id WHERE m.id = ? LIMIT 1", messageID);
        [messageHistory] = await pool.query("SELECT * FROM messageEdits WHERE messageId = ? ORDER BY editTimestamp DESC", messageID);

        currentMessage = dbMessageResult[0];
    } catch (e) {
        throw e;
    }
    if (dbMessageResult.length === 0) {
        message.channel.send("That message ID does not exist.");
        return false;
    }

    const embedMessage = new Discord.MessageEmbed()
        .setTitle(`Message History for ${messageID}`)
        .setURL(`https://discord.com/channels/${currentMessage.guild}/${currentMessage.channel}/${messageID}`)
        .addField("Posted by:", currentMessage.author_displayName);
    let originalContent = currentMessage.content;
    if (currentMessage.deleted) {
        embedMessage.addField("Deleted:", moment(currentMessage.deleted).format("dddd, MMMM Do YYYY @ hh:mm:ss a"));
    }
    if (messageHistory.length > 0) { // if the message has an edit history
        console.log(`messageHistory: ${messageHistory}`);
        originalContent = messageHistory[messageHistory.length - 1].oldContent;
        const mostRecentEdit = messageHistory.shift();
        embedMessage.addField(`Current Content (edited on ${moment(mostRecentEdit.editTimestamp).format("MMM Do YYYY h:mm:ssa")}`, mostRecentEdit.newContent);
        if ((currentMessage.deleted && messageHistory.length <= 7) || (!currentMessage.deleted && messageHistory.length <= 8)) {
            for (const edit of messageHistory) {
                let formattedDatetime = moment(edit.editTimestamp).format("MMM Do YYYY h:mm:ssa");
                embedMessage.addField(`Edit on ${formattedDatetime}`, edit.newContent);
            }
            embedMessage.addField(`Original Content (posted ${moment(currentMessage.timestamp).format("MMM Do YYYY h:mm:ssa")})`, originalContent);
            try {
                await message.channel.send(embedMessage);
            } catch (e) {
                throw e;
            }
        } else {
            //in case there are more edits than can fit in the MessageEmbed (it only supports 10 fields total)
            let l;
            for (let i = 0; (currentMessage.deleted && i < 6) || (!currentMessage.deleted && i < 7); i++) {
                let formattedDatetime = moment(messageHistory[i].editTimestamp).format("MMM Do YYYY h:mm:ssa");
                embedMessage.addField(`Edit on ${formattedDatetime}`, messageHistory[i].newContent);
                l++;
            }
            try {
                await message.channel.send(embedMessage);
            } catch (e) {
                throw e;
            }
            for (let k = i; k < messageHistory.length - k; k=k+j) {
                    const furtherEdits = new Discord.MessageEmbed()
                    .setURL(`https://discord.com/channels/${currentMessage.guild}/${currentMessage.channel}/${messageID}`)
                for (let j = 0; j < 9 && j < messageHistory.length - k + j; j++) {
                    furtherEdits.addField(`Edit on ${formattedDatetime}`, messageHistory[k+j].newContent);
                }
                if (messageHistory.length-k+j === 0) {
                    furtherEdits.addField(`Original Content (posted ${moment(currentMessage.timestamp).format("MMM Do YYYY h:mm:ssa")})`, originalContent);
                }
                try {
                    await message.channel.send(furtherEdits);
                } catch (e) {
                    throw e;
                }
            }
        }
    } else {
        embedMessage.addField(`Original Content (posted ${moment(currentMessage.timestamp).format("MMM Do YYYY h:mm:ssa")})`, originalContent);
        try {
            await message.channel.send(embedMessage);
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
    args: args,
    execute: execute,
}

//helper functions
