const { MessageAttachment } = require("discord.js");
const locutus = require("locutus");
const mysql = require('mysql');
const db = require("../../config/db");
const conn = mysql.createConnection(db);
conn.connect();

module.exports = {
    name: 'send-attachment',
    description: "Sends a message with an attachment from the DB",
    execute: function (client, message, args) {
        if (args.length === 0) {
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
        else {
            let timestamp = locutus.php.datetime.strtotime(args); //convert string to timestamp
            timestamp -= timestamp % (24 * 60 * 60 * 1000); //subtract minutes since midnight
            let end_timestamp = timestamp + (24 *60 * 60 * 1000);
            conn.query("SELECT * FROM attachments WHERE timestamp < ? AND timestamp > ? ORDER BY timestamp DESC", async (error, result, fields) => {
                if (error) throw error;
                console.log(result);
                for (const attachmentRow of result) {
                    const attachmentURL = attachmentRow.url;
                    console.log(`Attachment URL: ${attachmentURL}`);
                    let attachment = new MessageAttachment(attachmentURL);
                    await message.channel.send(`Test attachment`, attachment);
                }
            });
        }
    }
}