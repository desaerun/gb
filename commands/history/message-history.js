//imports
const Discord = require("discord.js");
const moment = require("moment");

// mysql
const mysql = require("mysql2/promise");
const db = require("../../config/db");
const logMessage = require("../../tools/logMessage");
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
        name: "messageID",
        description: "The ID of the message",
        type: "Snowflake",
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
        console.log(`messageHistory: ${JSON.stringify(messageHistory)}`);
        originalContent = messageHistory[messageHistory.length - 1].oldContent;
        const mostRecentEdit = messageHistory.shift();
        embedMessage.addField(`Current Content (edited on ${moment(mostRecentEdit.editTimestamp).format("MMM Do YYYY h:mm:ssa")})`, mostRecentEdit.newContent);
        if ((currentMessage.deleted && messageHistory.length <= 7) || (!currentMessage.deleted && messageHistory.length <= 8)) {
            logMessage(`There is edit history but it will fit in one Embed: ${messageHistory.length}`);
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
            logMessage(`There are more edits than can fit in one MessageEmbed: ${messageHistory.length}`);
            var currentMessagePointer = 0;
            for (let currentMessagePointer = 0; (currentMessage.deleted && currentMessagePointer < 6) || (!currentMessage.deleted && currentMessagePointer < 7); currentMessagePointer++) {
                logMessage(`currentMessagePointer: ${currentMessagePointer}`);
                let formattedDatetime = moment(messageHistory[currentMessagePointer].editTimestamp).format("MMM Do YYYY h:mm:ssa");
                embedMessage.addField(`Edit on ${formattedDatetime}`, messageHistory[currentMessagePointer].newContent);
            }
            try {
                logMessage(`Sending first message`);
                await message.channel.send(embedMessage);
            } catch (e) {
                throw e;
            }
            //loop through more edits until end of edit history is reached
            for (; currentMessagePointer < messageHistory.length - 1;currentMessagePointer+=internalMessagePointer) {
                logMessage(`currentMessagePointer: ${currentMessagePointer} | internalMessagePointer: ${internalMessagePointer}`);
                const furtherEdits = new Discord.MessageEmbed()
                    .setURL(`https://discord.com/channels/${currentMessage.guild}/${currentMessage.channel}/${messageID}`)
                for (var internalMessagePointer = 0;internalMessagePointer < 9 && messageHistory.length - 1 - (currentMessagePointer + internalMessagePointer) >= 0; internalMessagePointer++) {
                    let pointer = currentMessagePointer + internalMessagePointer;
                    logMessage(`pointer: ${pointer} | currentMessagePointer: ${currentMessagePointer} | internalMessagePointer: ${internalMessagePointer}`)
                    let formattedDatetime = moment(messageHistory[pointer].editTimestamp).format("MMM Do YYYY h:mm:ssa");
                    furtherEdits.addField(`Edit on ${formattedDatetime}`, messageHistory[pointer].newContent);
                }
                if (messageHistory.length - (currentMessagePointer + internalMessagePointer) === 0) {
                    furtherEdits.addField(`Original Content (posted ${moment(currentMessage.timestamp).format("MMM Do YYYY h:mm:ssa")})`, originalContent);
                }
                try {
                    logMessage(`Attempting to send further edit embed`);
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
