//mysql
const mysql = require("mysql2/promise");
const db = require("../../config/db");
const pool = mysql.createPool({
    ...db,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
});

module.exports = async function deleteMessage(deletedMessage) {
    console.log(`Deleted message: ${JSON.stringify(deletedMessage)}`);
    const now = +new Date();
    try {
        await pool.query("UPDATE messages SET deleted = ? WHERE id = ?", [now, deletedMessage.id]);
        console.log(`Set deleted flag on message ${deletedMessage.id}.`);
    } catch (e) {
        throw e;
    }
}