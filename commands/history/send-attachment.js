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
            let arg_str = args.join(" ");
            let timestamp = locutus.php.datetime.strtotime(arg_str) * 1000; //convert string to timestamp
            console.log(`Locutus timestamp: ${timestamp}`);
            timestamp -= timestamp % (24 * 60 * 60 * 1000); //subtract minutes since midnight
            let end_timestamp = timestamp + (24 *60 * 60 * 1000);
            console.log(`${timestamp} :: ${end_timestamp}`);
            conn.query("SELECT * FROM attachments WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC",[timestamp,end_timestamp], async (error, result, fields) => {
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