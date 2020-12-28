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
    name: 'get-deleted-messages',
    description: "Retrieves message history for the current channel and stores it to the DB",
    args: [
        {
            param: 'user',
            type: 'Snowflake|Mention',
            description: 'A user ID or @mention',
            default: 'current channel',
        },
    ],
    execute: async function (client, message, args) {
        let userID = args[0];
        if (message.mentions.users.first()) {
            userID = message.mentions.users.first().id;
        }
        let deletedMessages;
        try {
            [deletedMessages] = await pool.query("SELECT" +
                "    m.id," +
                "    m.content," +
                "    m.guild," +
                "    m.channel," +
                "    m.author," +
                "    m.timestamp," +
                "    m.deleted," +
                "    a.url AS attachmentURL," +
                "    author.displayName AS author_displayName," +
                "    author.avatarURL AS author_avatarURL," +
                "    author.isBot AS author_isBot" +
                " FROM" +
                "    messages m" +
                " LEFT JOIN attachments a ON" +
                "    m.id = a.messageId" +
                " LEFT JOIN authors author ON" +
                "    m.author=author.id" +
                " WHERE" +
                "    m.deleted IS NOT NULL and m.author = ?" +
                " ORDER BY" +
                "    m.timestamp" +
                " DESC", userID);
            console.log(`userID: ${userID}`);
            console.log(`deleted messages: ${JSON.stringify(deletedMessages)}`);
        } catch (e) {
            throw e;
        }
        for (const deletedMessage of deletedMessages) {
            console.log(`Current message: ${JSON.stringify(deletedMessage)}`);
            let embedMessage = new Discord.MessageEmbed()
                .setAuthor(deletedMessage.author_displayName, deletedMessage.author_avatarURL)
                .setThumbnail(deletedMessage.author_avatarURL)
                .addField("Posted:", moment(deletedMessage.timestamp).format("dddd, MMMM Do YYYY @ hh:mm:ss a"))
                .addField("Deleted:",moment(deletedMessage.deleted).format("dddd, MMMM Do YYYY @ hh:mm:ss a"));

            if (deletedMessage.content) {
                embedMessage.addField('\u200b', deletedMessage.content)
            }
            if (deletedMessage.attachmentURL) {
                embedMessage.setImage(deletedMessage.attachmentURL);
            }
            try {
                await message.channel.send(embedMessage);
            } catch (err) {
                console.error("There was an error sending the embed message:", err);
                return false;
            }
        }
    }
}