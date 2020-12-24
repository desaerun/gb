const Discord = require("discord.js");

//mysql
const mysql = require("mysql2/promise");
const db = require("../../config/db");
const pool = mysql.createPool({
    ...db,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
});

const moment = require("moment");

module.exports = {
    name: 'message-history',
    description: "Retrieves history for the specified message ID.",
    args: [
        {
            name: 'messageID',
            description: 'The ID of the message',
            type: 'Snowflake',
            default: '[REQUIRED]',
        },
    ],
    execute: async function (client, message, args) {
        if (args.length !== 1) {
            message.channel.send("You must provide the message ID.")
            return false;
        }
        let messageID = args[0];
        let dbMessageResult, currentMessage, messageHistory, fields;
        try {
            [dbMessageResult, fields] = await pool.query("SELECT m.guild,m.channel,m.content,m.timestamp,m.lastEditTimestamp,a.displayName AS author_displayName FROM messages m LEFT JOIN authors a ON m.author = a.id WHERE m.id = ? LIMIT 1", messageID);
            [messageHistory, fields] = await pool.query("SELECT * FROM messageEdits WHERE messageId = ? ORDER BY editTimestamp DESC", messageID);

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
        let originalContent;
        if (messageHistory.length > 0) { // if the message has an edit history
            const mostRecentEdit = messageHistory.shift();
            embedMessage.addField(`Current Content (edited on ${moment(mostRecentEdit.editTimestamp).format("MMM Do YYYY h:mm:ssa")}`, mostRecentEdit.newContent);
            for (const edit of messageHistory) {
                let formattedDatetime = moment(edit.editTimestamp).format("MMM Do YYYY h:mm:ssa");
                embedMessage.addField(`Edit on ${formattedDatetime}`, edit.newContent);
            }
            originalContent = messageHistory[messageHistory.length-1].oldContent;
        } else {
            originalContent = currentMessage.content;
        }
        embedMessage.addField(`Original Content (posted ${moment(currentMessage.timestamp).format("MMM Do YYYY h:mm:ssa")})`, originalContent);
        try {
            await message.channel.send(embedMessage);
        } catch (e) {
            throw e;
        }
        return true;
    }
}