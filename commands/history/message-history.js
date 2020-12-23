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
        let dbMessage,messageHistory,fields;
        let messageEdited = false;
        try {
            [dbMessage,fields] = await pool.query("SELECT * FROM messages WHERE id = ? LIMIT 1", messageID);
            [messageHistory,fields] = await pool.query("SELECT * FROM messageEdits WHERE messageId = ? ORDER BY editTimestamp DESC", messageID);
        } catch (e) {
            throw e;
        }
        console.log(`dbMessage: ${JSON.stringify(dbMessage)}`);
        console.log(`messageHistory: ${JSON.stringify(messageHistory)}`);
        if (dbMessage.length === 0 ) {
            message.channel.send("That message ID does not exist.");
            return false;
        }
        if (messageHistory.length > 0) {
            messageEdited = true;
        }
        const embedMessage = new Discord.MessageEmbed()
            .setTitle(`Message History for ${messageID}`);
        const originalMessage = (messageEdited) ? messageHistory.pop() : dbMessage[0];
        if (messageEdited) {
            embedMessage.addField(`Current Content (edited on ${moment(originalMessage.lastEditTimestamp).format("MMMM Do YYYY HH:mm:ss a Z")}`, originalMessage.content);
            for (const edit of messageHistory) {
                let formattedDatetime = moment(edit.timestamp).format("MMMM Do YYYY HH:mm:ss aT");
                embedMessage.addField(`Edit on  ${formattedDatetime}`, edit.newContent);
            }
        }
        embedMessage.addField(`Original Content (posted ${moment(originalMessage.content).format("MMMM Do YYYY HH:mm:ss aT")}`,originalMessage.content);
        try {
            await message.channel.send(embedMessage);
        } catch (e) {
            throw e;
        }
        return true;
    }
}