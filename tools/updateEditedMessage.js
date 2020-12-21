const mysql = require("mysql");
const db = require("../config/db");
const conn = mysql.createConnection(db);
conn.connect();

const insertNewMessage = require ("./insertNewMessage");

const snowflakeToTimestamp = require("./snowflakeToTimestamp");

module.exports = function updateEditedMessage(oldMessage, newMessage) {
    insertNewMessage(newMessage,Date.now());
    if (oldMessage.partial) {
        oldMessage.fetch()
            .then((fetchedMessage) => {
                addMessageEdit(fetchedMessage, newMessage);
            })
            .catch(
                console.log()
            )
    } else {
        addMessageEdit(oldMessage, newMessage);
    }
}

function addMessageEdit(oldMessage, newMessage) {
    const oldMessageParams = {
        messageId: oldMessage.id,
        newContent: newMessage.content,
        oldContent: oldMessage.content,
        editTimestamp: Date.now(),
    }
    conn.query("INSERT INTO messageEdits SET ?", oldMessageParams, (error) => {
        if (error) throw error;
        console.log(`Added edit history for message ${oldMessage.id}`);
    });
}