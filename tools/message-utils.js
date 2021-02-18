module.exports = {
    insertNewMessage: insertNewMessage,
    captureMessage: captureMessage,
    deleteMessage: deleteMessage,
    updateEditedMessage: updateEditedMessage,
    convertEmbedToText: convertEmbedToText,
};

const {snowflakeToTimestamp,logMessage} = require("./utils");

//mysql
const mysql = require("mysql2/promise");
const db = require("../config/db");
const pool = mysql.createPool({
    ...db,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
});

insertNewMessage = async function insertNewMessage(message, lastEditTimestamp = null) {
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
    logMessage(`Guild: ${JSON.stringify(message.guild)}...${JSON.stringify(guild_values)}`,4);
    logMessage(`Channel: ${JSON.stringify(message.channel)}...${JSON.stringify(channel_values)}`,4);
    logMessage(`Author: ${JSON.stringify(message.author)}...${JSON.stringify(author_values)}`,4);
    logMessage(`Cached Author:${JSON.stringify(message.guild.members.cache.get(author_values.id))}`,4);
    logMessage(`Message: ${JSON.stringify(message)}...${JSON.stringify(message_values)}`,4);
    logMessage(`Attachments: ${JSON.stringify(message.attachments)}`,4);

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
    }
    logMessage(`Successfully inserted guild ${guild_values.id}`, 4);
    logMessage(`Successfully inserted channel ${channel_values.id}`, 4);
    logMessage(`Successfully inserted author ${author_values.id}`, 4);
    logMessage(`Successfully inserted message ${message_values.id}`, 4);
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
        pool.query("INSERT INTO attachments SET ? ON DUPLICATE KEY UPDATE ?", [attachment_values, attachment_values], (err) => {
            if (err) throw err;
            console.log(`Successfully inserted attachment ${attachment_values.id} (${i} of ${message.attachments.size})`);
            i++;
        });
    }
    return 1; // added
}

captureMessage = async function captureMessage (client, message, includeBotMessages = false) {
    try {
        let [rows] = await pool.execute("SELECT * FROM messages WHERE id = ?", [message.id]);
        if (rows.length === 0) { // if message doesn't already exist in DB
            const author = message.guild.members.cache.get(message.author.id);
            if (!author) {
                console.log(`Author was not able to be fetched for message ${message.id}`);
                return 4; // no author
            } else {
                if (!author.user.bot || includeBotMessages) {
                    insertNewMessage(message);
                    return 1; // added
                } else {
                    console.log("Message was from a bot and includeBotMessages is false.");
                    return 3; // bot message
                }
            }
        } else {
            console.log(`Message ${message.id} already exists in DB, skipping...`);
            return 2; // skipped
        }
    } catch (err) {
        await message.channel.send(`Error occurred inserting message: ${err}`);
        console.log(err);
    }
}

deleteMessage = async function deleteMessage(deletedMessage) {
    console.log(`Deleted message: ${JSON.stringify(deletedMessage)}`);
    const now = +new Date();
    try {
        await pool.query("UPDATE messages SET deleted = ? WHERE id = ?", [now, deletedMessage.id]);
        console.log(`Set deleted timestamp on message ${deletedMessage.id}.`);
    } catch (e) {
        throw e;
    }
}

updateEditedMessage = async function updateEditedMessage(oldMessage, newMessage) {
    insertNewMessage(newMessage, Date.now());
    if (oldMessage.partial) {
        try {
            const fetchedMessage = await oldMessage.fetch();
            await addMessageEdit(fetchedMessage, newMessage);
        } catch (e) {
            throw e;
        }
    } else {
        await addMessageEdit(oldMessage, newMessage);
    }
}

convertEmbedToText = function convertEmbedToText(embed) {
    let textEmbed = "";
    textEmbed += "\n\n";
    textEmbed += "\*\*\*\*\*Embedded Content\*\*\*\*\*";
    if (embed.title) {
        if (embed.url) {
            textEmbed += `\n[**${embed.title}**](${embed.url})`;
        }
        textEmbed += `\n${embed.title}`;
    }
    if (embed.description) {
        textEmbed += `\n${embed.description}`;
    }
    for (const field of embed.fields) {
        textEmbed += `\n**${field.name}**`;
        textEmbed += `\n    ${field.value}`;
    }
    if (embed.author && embed.author.name) {
        textEmbed += `\n${embed.author.name}`;
    }
    if (embed.timestamp) {
        const formattedTimestamp = moment(embed.timestamp).format("MMM Do YYYY h:mm:ssa");
        textEmbed += `at ${formattedTimestamp}`;
    }
    return textEmbed;
}

async function addMessageEdit(oldMessage, newMessage) {
    let oldMessageContent = oldMessage.content;
    let newMessageContent = newMessage.content;
    for (const embed of oldMessage.embeds) {
        oldMessageContent += convertEmbedToText(embed);
    }
    for (const embed of newMessage.embeds) {
        newMessageContent += convertEmbedToText(embed);
    }
    const oldMessageParams = {
        messageId: oldMessage.id,
        newContent: newMessageContent,
        oldContent: oldMessageContent,
        editTimestamp: Date.now(),
    }
    try {
        await pool.query("INSERT INTO messageEdits SET ?", oldMessageParams);
    } catch (error) {
        throw error;
    }
}