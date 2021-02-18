const insertNewMessage = require("./insertNewMessage")

const snowflakeToTimestamp = require("../snowflakeToTimestamp");

//mysql
const mysql = require("mysql2/promise");
const db = require("../../config/db");
const pool = mysql.createPool({
    ...db,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
});

captureMessage = async function (client, message, includeBotMessages = false) {
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

module.exports = captureMessage;