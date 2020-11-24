const { MessageAttachment } = require("discord.js");
const mysql = require('mysql');
const db = require("../../config/db");
const conn = mysql.createConnection(db);
conn.connect();

module.exports = {
    name: 'send-attachment',
    description: "Sends a message with an attachment from the DB",
    execute: function (client, message, args) {
        conn.query("SELECT * FROM attachments WHERE 1 ORDER BY timestamp DESC LIMIT 5 ", async (error, result, fields) => {
            if (error) throw error;
            console.log(result);
            console.log(fields);
            for (const attachmentRow of result) {
                const attachmentURL = attachmentRow.url;
                console.log(`Attachment URL: ${attachmentURL}`);
                let attachment = new MessageAttachment(attachmentURL);
                await message.channel.send(`Test attachment`, attachment);
            }
        })
    }
}