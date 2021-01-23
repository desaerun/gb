//mysql
const mysql = require("mysql2/promise");
const db = require("../../config/db");
const pool = mysql.createPool({
    ...db,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
});

const insertNewMessage = require("./insertNewMessage");

const snowflakeToTimestamp = require("../snowflakeToTimestamp");
const convertEmbedToText = require("../convertEmbedToText");

module.exports = async function updateEditedMessage(oldMessage, newMessage) {
    insertNewMessage(newMessage, Date.now());
    if (oldMessage.partial) {
        oldMessage.fetch()
            .then(async (fetchedMessage) => {
                await addMessageEdit(fetchedMessage, newMessage);
            })
            .catch(
                console.log()
            );
    } else {
        await addMessageEdit(oldMessage, newMessage);
    }
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