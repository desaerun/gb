//imports
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
const name = "clear-message-history";
const description = "Clears all message history from db";

//main
const execute = async function (client, message) {
    try {
        await pool.query("DELETE FROM messages WHERE deleted IS NULL");
    } catch (e) {
        throw e;
    } finally {
        message.reply("Successfully deleted message history");
    }
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions
