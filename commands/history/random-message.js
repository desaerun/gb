const {MessageAttachment} = require("discord.js");
const locutus = require("locutus");
const moment = require("moment");
const mysql = require('mysql');
const db = require("../../config/db");
const conn = mysql.createConnection(db);
const Discord = require("discord.js");
conn.connect();

module.exports = {
    name: 'random-message',
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
        const message_sql = "SELECT" +
            "    m.id," +
            "    m.content," +
            "    m.guild," +
            "    m.channel," +
            "    m.author," +
            "    m.timestamp," +
            "    a.url AS attachmentURL," +
            "    author.displayName as author_displayName," +
            "    author.avatarURL as author_avatarURL," +
            "    author.isBot as author_isBot" +
            " FROM" +
            "    messages m" +
            " LEFT JOIN attachments a ON" +
            "    m.id = a.message_id" +
            " LEFT JOIN users author ON" +
            "    m.author=author.id" +
            " WHERE" +
            "    m.channel = ? AND m.timestamp BETWEEN ? AND ?" +
            " ORDER BY" +
            "    m.timestamp" +
            " DESC";
        conn.query(message_sql, [message.channel.id, timestamp, end_timestamp], async (error, result, fields) => {
            if (error) throw error;

            //select a random message from the DB
            let selectedMessages = [];
            if (result.length < 3) {
                selectedMessages = result;
            } else {
                //try to select a non-bot message
                const humanMessageResults = result.filter(element => !element.author_isBot);
                if (humanMessageResults.length === 0) {
                    var noHumanMessages = true;
                } else {
                    const randomHumanMessage = humanMessageResults[Math.floor(Math.random() * humanMessageResults.length)];

                    let randomHumanMessageIndex = result.findIndex(message => message.id = randomHumanMessage.id);
                    //if the first or last message of the day, choose the 2nd from first or last instead
                    if (randomHumanMessageIndex === 0) {
                        randomHumanMessageIndex++;
                    } else if (randomHumanMessageIndex === result.length) {
                        randomHumanMessageIndex--;
                    }

                    //add the selected messages to the array
                    selectedMessages.push(result[randomHumanMessageIndex + 1]);
                    selectedMessages.push(result[randomHumanMessageIndex]);
                    selectedMessages.push(result[randomHumanMessageIndex - 1]);
                }
            }
            if (noHumanMessages) {
                message.channel.send(`There were no messages on ${moment(timestamp).format('dddd MMMM Do YYYY')}`);
            } else {
                console.log(`Selected messages: ${JSON.stringify(selectedMessages)}`);

                for (const messageRow of selectedMessages) {
                    console.log(`Current message: ${JSON.stringify(messageRow)}`);
                    let messageTimestamp = new Date(messageRow.timestamp);
                    let humanTimedate = moment(messageTimestamp).format("dddd, MMMM Do YYYY @ hh:mm:ss a");
                    let embedMessage = new Discord.MessageEmbed()
                        .setAuthor(messageRow.author_displayName, messageRow.author_avatarURL)
                        .setThumbnail(messageRow.author_avatarURL)
                        .setTitle(humanTimedate)
                        .setDescription(`[**Jump to Message**](https://discord.com/channels/${messageRow.guild}/${messageRow.channel}/${messageRow.id})`);
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
                }
            }
        });
    }
}