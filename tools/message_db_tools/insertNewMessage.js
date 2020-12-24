const snowflakeToTimestamp = require("../snowflakeToTimestamp");
const convertEmbedToText = require("../convertEmbedToText");
const moment = require("moment");

//mysql
const mysql = require("mysql2/promise");
const db = require("../../config/db");
const pool = mysql.createPool({
    ...db,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
});

module.exports = async function insertNewMessage(message,lastEditTimestamp = null) {
    const author = message.guild.members.cache.get(message.author.id);
    let guild_values = {
        id: message.guild.id,
        name: message.guild.name,
    }
    let channel_values = {
        id: message.channel.id,
        guild: guild_values.id,
        name: message.channel.name,
    }
    let author_values = {
        id: message.author.id,
        guild: guild_values.id,
        displayName: author.displayName,
        avatarURL: author.user.displayAvatarURL(),
        isBot: author.user.bot,
    }
    let messageContent = message.content;
    for (const embed of message.embeds) {
        messageContent += convertEmbedToText(embed)
    }
    let message_values = {
        id: message.id,
        author: author_values.id,
        guild: guild_values.id,
        channel: channel_values.id,
        content: messageContent,
        timestamp: snowflakeToTimestamp(message.id),
        lastEditTimestamp: lastEditTimestamp,
    }
    /*
    todo: make this log on high verbosity
    console.log("Guild: " + JSON.stringify(message.guild) + "..." + JSON.stringify(guild_values));
    console.log("Channel: " + JSON.stringify(message.channel) + "..." + JSON.stringify(channel_values));
    console.log("Author: " + JSON.stringify(message.author) + "..." + JSON.stringify(author_values));
    console.log("Cached Author:" + JSON.stringify(message.guild.members.cache.get(author_values.id)));
    console.log("Message: " + JSON.stringify(message) + "..." + JSON.stringify(message_values));
    console.log("Attachments: " + JSON.stringify(message.attachments));
    */

    // await pool.query("START TRANSACTION;");
    try {
        await pool.query("INSERT INTO guilds SET ? ON DUPLICATE KEY UPDATE ?", [guild_values, guild_values]);
        await pool.query("INSERT INTO channels SET ? ON DUPLICATE KEY UPDATE ?", [channel_values, channel_values]);
        await pool.query("INSERT INTO authors SET ? ON DUPLICATE KEY UPDATE ?", [author_values, author_values]);
        await pool.query("INSERT INTO messages SET ? ON DUPLICATE KEY UPDATE ?", [message_values, message_values]);
        // await pool.query("COMMIT");
    } catch (err) {
        // await pool.query("ROLLBACK");
        throw err;
    } finally {
        console.log(`Successfully inserted guild ${guild_values.id}`);
        console.log(`Successfully inserted channel ${channel_values.id}`);
        console.log(`Successfully inserted author ${author_values.id}`);
        console.log(`Successfully inserted message ${message_values.id}`);
    }
    let i = 1;
    for (let attachment of message.attachments) {
        const attachment_data = attachment[1];
        let attachment_values = {
            id: attachment_data.id,
            messageId: message.id,
            name: attachment_data.name,
            url: attachment_data.url,
            proxyURL: attachment_data.proxyURL,
            size: attachment_data.size,
            height: attachment_data.height,
            width: attachment_data.width,
            timestamp: snowflakeToTimestamp(attachment_data.id),
        };
        pool.query("INSERT INTO attachments SET ? ON DUPLICATE KEY UPDATE ?", [attachment_values, attachment_values], (error, result, fields) => {
            if (error) throw error;
            console.log(`Successfully inserted attachment ${attachment_values.id} (${i} of ${message.attachments.size})`);
            i++;
        });
    }
    return 1; // added
}