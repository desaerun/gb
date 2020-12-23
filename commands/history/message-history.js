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
        let messageEdited = false;
        try {
            [dbMessageResult, fields] = await pool.query("SELECT * FROM messages WHERE id = ? LIMIT 1", messageID);
            [messageHistory, fields] = await pool.query("SELECT * FROM messageEdits WHERE messageId = ? ORDER BY editTimestamp DESC", messageID);

            currentMessage = dbMessageResult[0];
        } catch (e) {
            throw e;
        }
        console.log(`dbMessage: ${JSON.stringify(dbMessageResult)}`);
        console.log(`currentMessage: ${JSON.stringify(currentMessage)}`);
        console.log(`messageHistory: ${JSON.stringify(messageHistory)}`);
        if (dbMessageResult.length === 0) {
            message.channel.send("That message ID does not exist.");
            return false;
        }
        if (messageHistory.length > 0) {
            messageEdited = true;
        }
        const embedMessage = new Discord.MessageEmbed()
            .setTitle(`Message History for ${messageID}`);
        if (messageEdited) {
            const firstEdit = messageHistory.pop();
            embedMessage.addField(`Current Content (edited on ${moment(currentMessage.lastEditTimestamp).format("MMMM Do YYYY HH:mm:ss a Z")}`, currentMessage.content);
            for (const edit of messageHistory) {
                let formattedDatetime = moment(edit.timestamp).format("MMMM Do YYYY HH:mm:ss aT");
                embedMessage.addField(`Edit on  ${formattedDatetime}`, edit.newContent);
            }
            embedMessage.addField(`Original Content (posted ${moment(firstEdit.oldContent).format("MMMM Do YYYY HH:mm:ss aT")}`, firstEdit.oldContent);
        } else {
            embedMessage.addField(`Original Content (posted ${moment(currentMessage.content).format("MMMM Do YYYY HH:mm:ss aT")}`, currentMessage.content);
        }
        try {
            await message.channel.send(embedMessage);
        } catch (e) {
            throw e;
        }
        return true;
    }
}