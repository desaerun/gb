const {MessageAttachment} = require("discord.js");
const locutus = require("locutus");
const mysql = require('mysql');
const db = require("../../config/db");
const conn = mysql.createConnection(db);
const Discord = require("discord.js");
conn.connect();

module.exports = {
    name: 'send-attachment',
    description: "Chooses a random message from the DB from the day that is specified as an argument.",
    args: [
        {
            param: 'date',
            type: 'String',
            description: 'A string representing from when the historical message should be retrieved',
            default: 'now',
        },
    ],
    execute: function (client, message, args) {
        //if no argument is given, default day string to "now";
        let arg_str = "now";
        if (args.length > 0) {
            arg_str = args.join(" ");
        }

        //convert string to timestamp using php-esque "strtotime"
        //https://www.php.net/manual/en/function.strtotime.php
        let timestamp = locutus.php.datetime.strtotime(arg_str) * 1000;
        console.log(`Locutus timestamp: ${timestamp}`);

        //calculate midnight on both ends of the day provided
        timestamp -= timestamp % (24 * 60 * 60 * 1000); //subtract minutes since midnight
        let end_timestamp = timestamp + (24 * 60 * 60 * 1000);
        console.log(`${timestamp} :: ${end_timestamp}`);

        //select messages from the DB that are between the two timestamps retrieved previously
        conn.query("SELECT `m`.`id`,`m`.`content`,`m`.`author`,`m`.`timestamp`,`a`.`url` AS `attachmentURL` FROM `messages` `m` LEFT JOIN `attachments` `a` ON `m`.`id`=`a`.`message_id` WHERE `m`.`channel` = ? AND `m`.`timestamp` >= ? AND `m`.`timestamp` <= ? ORDER BY `m`.`timestamp` DESC", [message.channel.id, timestamp, end_timestamp], async (error, result, fields) => {
            if (error) throw error;
            console.log(result);

            //select a random message from the DB
            let selectedMessages = [];
            if (result.length < 3) {
                selectedMessages = result.length;
            } else {
                let randomMessageIndex = Math.floor(Math.random() * result.length);

                //if the first or last message of the day, choose the 2nd from first or last instead
                if (randomMessageIndex === 0) {
                    randomMessageIndex++;
                } else if (randomMessageIndex === result.length) {
                    randomMessageIndex--;
                }

                //add the selected messages to the array
                selectedMessages.push(randomMessageIndex - 1);
                selectedMessages.push(randomMessageIndex);
                selectedMessages.push(randomMessageIndex + 1);
            }

            for (const messageRow of selectedMessages) {
                conn.query("SELECT * FROM `users` WHERE `id` = ? LIMIT 1", messageRow.author, async (error, authors, fields) => {
                    let author = authors[0];
                    //let attachment = new MessageAttachment(attachmentURL);
                    let messageTimestamp = new Date(messageRow.timestamp);
                    let embedMessage = new Discord.MessageEmbed()
                        .setAuthor(author.displayName, author.avatarURL)
                        .setTimestamp(messageTimestamp.toISOString());
                    if (messageRow.content) {
                        embedMessage.addField('\u200b', messageRow.content)
                    }
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