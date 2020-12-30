const mysql = require("mysql2/promise");
const db = require("../../config/db");
const pool = mysql.createPool({
    ...db,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
});

module.exports = {
    name: 'clear-message-history',
    description: "Clears all message history from db",
    execute: async function (client, message) {
        try {
            await pool.query("DELETE FROM messages WHERE deleted IS NULL");
        } catch (e) {
            throw e;
        } finally {
            message.reply("Successfully deleted message history");
        }
    }
}