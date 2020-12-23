//mysql
const mysql = require("mysql2/promise");
const db = require("../../config/db");
const pool = mysql.createPool({
    ...db,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
});

const insertNewMessage = require ("./insertNewMessage");

const snowflakeToTimestamp = require("../snowflakeToTimestamp");

module.exports = async function updateEditedMessage(oldMessage, newMessage) {
    insertNewMessage(newMessage,Date.now());
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
    console.log(`old Message: ${JSON.stringify(oldMessage)}`);
    console.log(`new Message: ${JSON.stringify(newMessage)}`);
    const oldMessageParams = {
        messageId: oldMessage.id,
        newContent: newMessage.content,
        oldContent: oldMessage.content,
        editTimestamp: Date.now(),
    }
    try {
        await pool.query("INSERT INTO messageEdits SET ?", oldMessageParams);
    }  catch (error) {
        throw error;
    } finally {
        console.log(`Added edit history for message ${oldMessage.id}`);
    }
}