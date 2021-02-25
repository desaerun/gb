//imports
const Discord = require("discord.js");
const moment = require("moment");
const {sendMessage} = require("../../tools/sendMessage");

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
const description = "Retrieves the recently deleted messages by the mentioned user";
const params = [
    {
        param: "user",
        type: "Snowflake|Mention",
        description: "A user ID or @mention",
        default: "current user",
    },
    {
        param: "numMessages",
        type: "Integer",
        description: "The number of messages to retrieve",
        default: 5,
    },
];

//main
async function execute(client, message, args) {
    let userID = args[0];
    if (message.mentions.users.first()) {
        userID = message.mentions.users.first().id;
    }
    const numMessages = args[1] ? args[1] : params[1].default;
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
            "    m.author = ?" +
            " AND" +
            "    m.deleted IS NOT NULL" +
            " AND" +
            "    m.deletedBy = ?" +
            " ORDER BY" +
            "    m.timestamp" +
            " DESC" +
            " LIMIT ?", [userID, "user", +numMessages]);
    } catch (e) {
        throw e;
    }
    try {
        await sendMessage(`${deletedMessages[0].author_displayName}'s last ${numMessages} deleted messages:`, message.channel);
    } catch (e) {
        console.error("There was an error sending the embed message:", e);
        throw e;
    }
    for (const deletedMessage of deletedMessages) {
        let deletedMessageEmbed = new Discord.MessageEmbed()
            .setAuthor(deletedMessage.author_displayName, deletedMessage.author_avatarURL)
            .setFooter(`Message ID: ${deletedMessage.id}`);
        if (deletedMessage.content) {
            deletedMessageEmbed.addField("\u200b", deletedMessage.content)
        }
        deletedMessageEmbed.addField("Posted:", moment(deletedMessage.timestamp).format("dddd, MMMM Do YYYY @ hh:mm:ss a"));
        deletedMessageEmbed.addField("Deleted:", moment(deletedMessage.deleted).format("dddd, MMMM Do YYYY @ hh:mm:ss a"))
        if (deletedMessage.attachmentURL) {
            deletedMessageEmbed.setImage(deletedMessage.attachmentURL);
        }
        try {
            await sendMessage(deletedMessageEmbed, message.channel);
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
    params: params,
    execute: execute,
}

//helper functions