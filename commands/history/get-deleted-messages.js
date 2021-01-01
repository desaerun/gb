//imports
const Discord = require("discord.js");
const moment = require("moment");

// mysql
const mysql = require("mysql2/promise");
const db = require("../../config/db");
const pool = mysql.createPool({
    ...db,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
});

//module settings
const name = "get-deleted-messages";
const description = "Retrieves the last numMessages messages";
const args = [
    {
        param: 'user',
        type: 'Snowflake|Mention',
        description: 'A user ID or @mention',
        default: 'current user',
    },
    {
        param: 'numMessages',
        type: 'int',
        description: 'The number of messages to retrieve',
        default: 5,
    },

];

//main
async function execute(client, message, args) {
    let userID = args[0];
    if (message.mentions.users.first()) {
        userID = message.mentions.users.first().id;
    }
    const numMessages = args[1] ? args[1] : this.args[1].default;
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
            " DESC" +
            " LIMIT ?", [userID, +numMessages]);
    } catch (e) {
        throw e;
    }
    try {
        message.channel.send(`Last ${numMessages} messages sent by ${deletedMessages[0].author_displayName}:`);
    } catch (e) {
        console.error("There was an error sending the embed message:", e);
        throw e;
    }
    for (const deletedMessage of deletedMessages) {
        console.log(`Current message: ${JSON.stringify(deletedMessage)}`);
        console.log
        let embedMessage = new Discord.MessageEmbed()
            .setAuthor(deletedMessage.author_displayName, deletedMessage.author_avatarURL)
            .setThumbnail(deletedMessage.author_avatarURL)
            .addField("Posted:", moment(deletedMessage.timestamp).format("dddd, MMMM Do YYYY @ hh:mm:ss a"))
            .addField("Deleted:", moment(deletedMessage.deleted).format("dddd, MMMM Do YYYY @ hh:mm:ss a"));

        if (deletedMessage.content) {
            embedMessage.addField('\u200b', deletedMessage.content)
        }
        if (deletedMessage.attachmentURL) {
            embedMessage.setImage(deletedMessage.attachmentURL);
        }
        try {
            await message.channel.send(embedMessage);
        } catch (e) {
            console.error("There was an error sending the embed message:", e);
            return false;
        }
    }
}

//module export
module.exports = {
    name: name,
    description: description,
    args: args,
    execute: execute,
}

//helper functions
