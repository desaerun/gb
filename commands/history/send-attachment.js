const {MessageAttachment} = require("discord.js");
const locutus = require("locutus");
const mysql = require('mysql');
const db = require("../../config/db");
const conn = mysql.createConnection(db);
const Discord = require("discord.js");
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
            });
        } else {
            let arg_str = args.join(" ");
            let timestamp = locutus.php.datetime.strtotime(arg_str) * 1000; //convert string to timestamp
            console.log(`Locutus timestamp: ${timestamp}`);
            timestamp -= timestamp % (24 * 60 * 60 * 1000); //subtract minutes since midnight
            let end_timestamp = timestamp + (24 * 60 * 60 * 1000);
            // let timestamp_now = new Date().now();
            console.log(`${timestamp} :: ${end_timestamp}`);
            conn.query("SELECT `m`.`content`,`m`.`author`,`a`.`url` AS `attachmentURL` FROM `messages` `m` LEFT JOIN `attachments` `a` ON `m`.`id`=`a`.`message_id` WHERE `m`.`channel` = ? AND `m`.`timestamp` >= ? AND `m`.`timestamp` <= ? ORDER BY `m`.`timestamp` DESC LIMIT 2", [message.channel.id, timestamp, end_timestamp], async (error, result, fields) => {
                if (error) throw error;
                console.log(result);
                for (const messageRow of result) {
                    conn.query("SELECT * FROM `users` WHERE `id` = ? LIMIT 1", messageRow.author, async (error, authors, fields) => {
                        let author = authors[0];
                        //let attachment = new MessageAttachment(attachmentURL);
                        let embedMessage = new Discord.MessageEmbed()
                            .setAuthor(author.displayName, author.avatarURL)
                            .addField('\u200b', messageRow.content)
                            .setTimestamp(messageRow.timestamp);
                        if (messageRow.attachmentURL) {
                            embedMessage.setImage(messageRow.attachmentURL);
                        }
                        try {
                            await message.channel.send(embedMessage);
                        } catch (err) {
                            console.error("There was an error sending the embed message:", err);
                        }
                    });
                }
            });
        }
    }
}