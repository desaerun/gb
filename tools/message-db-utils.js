const {snowflakeToTimestamp, logMessage} = require("./utils");
const moment = require("moment");

//mysql
const mysql = require("mysql2/promise");
const db = require("../config/db");
const pool = mysql.createPool({
    ...db,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
});

/**
 * Inserts a new message into the Database.  Also inserts and/or updates the Channel, Guild, and Author tables with
 * information from the message.
 * @param message -- a Discord.Message object representing the message.
 * @param lastEditTimestamp -- the timestamp the message was last edited.
 * @returns {Boolean} -- Returns true if successful.
 */
insertNewMessage = async function insertNewMessage(message, lastEditTimestamp = null) {
    if (message.channel.type === "text") {
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
        logMessage(`Guild: ${JSON.stringify(message.guild)}...${JSON.stringify(guild_values)}`, 4);
        logMessage(`Channel: ${JSON.stringify(message.channel)}...${JSON.stringify(channel_values)}`, 4);
        logMessage(`Author: ${JSON.stringify(message.author)}...${JSON.stringify(author_values)}`, 4);
        logMessage(`Cached Author:${JSON.stringify(message.guild.members.cache.get(author_values.id))}`, 4);
        logMessage(`Message: ${JSON.stringify(message)}...${JSON.stringify(message_values)}`, 4);
        logMessage(`Attachments: ${JSON.stringify(message.attachments)}`, 4);

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
        //realistically, messages can only have one attachment
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
                logMessage(`Successfully inserted attachment ${attachment_values.id} (${i} of ${message.attachments.size})`, 4);
                i++;
            });
        }
        return true; // added
    } else if (message.channel.type === "dm") {

    }
}
exports.insertNewMessage = insertNewMessage;

/**
 * This function is called every time a message is posted, or when running the cache message history command.
 * Scrapes information about the message and adds it to the DB.
 * @param client -- A Discord.Client object representing the bot
 * @param message -- The message to be parsed
 * @param includeBotMessages -- Whether or not Bot messages should be added to the DB or skipped over.
 * @returns {Promise<number>} -- A status code:
 * 1: Successfully added,
 * 2: Skipped,
 * 3: Bot Message that was skipped over
 * 4: Author is no longer a part of the Discord Guild that is being parsed.  This would cause an error with
 * several functions, so these messages are skipped over.
 */
captureMessage = async function captureMessage(client, message, includeBotMessages = false) {
    try {
        let [rows] = await pool.execute("SELECT * FROM messages WHERE id = ?", [message.id]);
        if (rows.length === 0) { // if message doesn't already exist in DB
            let author;
            if (message.channel.type === "text") {
                author = message.guild.members.cache.get(message.author.id);
            }
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
exports.captureMessage = captureMessage;

/**
 * Updates the DB with information about when a message was deleted.
 * @param deletedMessage
 * @returns {Promise<void>}
 */
deleteMessageFromDb = async function deleteMessageFromDb(deletedMessage) {
    const now = +new Date();
    try {
        await pool.query("UPDATE messages SET deleted = ? WHERE id = ?", [now, deletedMessage.id]);
    } catch (e) {
        throw e;
    }
}
exports.deleteMessageFromDb = deleteMessageFromDb;

/**
 * sets the deletedBy field in the DB for the message ID given.
 * @param message -- A Discord.Message representing the message
 * @param deletedBy -- A "reason" or "source" of the deletion.
 * @returns {Promise<void>}
 */
setDeletedBy = async function setDeletedBy(message, deletedBy) {
    try {
        await pool.query("UPDATE messages SET deletedBy = ? WHERE id = ?", [deletedBy, message.id]);
    } catch (e) {
        throw e;
    }
}
exports.setDeletedBy = setDeletedBy;

/**
 * Retrieves the message if it is a partial before passing it along to the addMessageEdit function,
 * where it will be stored in the DB.
 * @param oldMessage
 * @param newMessage
 * @returns {Promise<void>}
 */
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
exports.updateEditedMessage = updateEditedMessage;

/**
 * Converts a Discord embedded message into a big chunk of text, for storing in DB purposes or including
 * the text into another embed.
 * @param embed -- the Discord.MessageEmbed object
 * @returns {string} -- a string representing the embed object
 */
convertEmbedToText = function convertEmbedToText(embed) {
    let textEmbedLines = [];
    textEmbedLines.push(``);
    textEmbedLines.push(`\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*`);
    textEmbedLines += "\\*\\*\\*\\*\\**Embedded Content*\\*\\*\\*\\*\\*";
    if (embed.title) {
        if (embed.url) {
            textEmbedLines.push(`[**${embed.title}**](${embed.url})`)
        }
        textEmbedLines.push(`${embed.title}`)
    }
    if (embed.description) {
        textEmbedLines.push(`${embed.description}`)
    }
    for (const field of embed.fields) {
        textEmbedLines.push(`**${field.name}**`)
        textEmbedLines.push(`    ${field.value}`)
    }
    if (embed.author && embed.author.name) {
        textEmbedLines.push(`${embed.author.name}`)
    }
    if (embed.timestamp) {
        const formattedTimestamp = moment(embed.timestamp).format("MMM Do YYYY h:mm:ssa [GMT]Z");
        textEmbedLines += `at ${formattedTimestamp}`;
    }
    textEmbedLines.push(`\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*`);

    return textEmbedLines.join("\n");
}
exports.convertEmbedToText = convertEmbedToText;

/**
 * Adds a message edit entry to the DB
 * @param oldMessage -- A Discord.Message object representing the message prior to editing
 * @param newMessage -- A Discord.Message object representing the message after editing
 * @returns {Promise<void>}
 */
addMessageEdit = async function addMessageEdit(oldMessage, newMessage) {
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