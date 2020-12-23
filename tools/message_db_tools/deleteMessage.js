//mysql
const mysql = require("mysql2/promise");
const db = require("../../config/db");
const pool = mysql.createPool({
    ...db,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
});

module.exports = async function deleteMessage (deletedMessage) {
    console.log(`Deleted message: ${JSON.stringify(deletedMessage)}`);
    await pool.query("START TRANSACTION");
    try {
        await pool.query("INSERT INTO deletedMessages SELECT * FROM messages WHERE id = ?",deletedMessage.id);
        await pool.query("DELETE FROM messages WHERE id = ?",deletedMessage.id);
        await pool.query("COMMIT;");
        console.log(`Moved message ${deletedMessage.id} to deletedMessages table.`);
    } catch (e) {
        await pool.query("ROLLBACK");
        throw e;
    }
}