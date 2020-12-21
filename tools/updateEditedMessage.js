const mysql = require("mysql");
const db = require("../config/db");
const conn = mysql.createConnection(db);
conn.connect();

const insertNewMessage = require ("./message_db_tools/insertNewMessage");

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
    console.log(`old Message: ${JSON.stringify(oldMessage)}`);
    console.log(`new Message: ${JSON.stringify(newMessage)}`);
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