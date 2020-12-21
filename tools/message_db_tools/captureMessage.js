const insertNewMessage = require("./insertNewMessage")

const snowflakeToTimestamp = require("../snowflakeToTimestamp");

//mysql
const mysql = require("mysql");
const db = require("../../config/db");
const conn = mysql.createConnection(db);
conn.connect();


captureMessage = async function (client,message,includeBotMessages = false) {
    let e_result = await conn.query("SELECT * FROM messages WHERE id = ?", message.id);
    console.log(`raw: ${e_result}`);
    console.log(`JSON: ${JSON.stringify(e_result)}`);
    if (e_result.length === 0) { // if message doesn't already exist in DB
        const author = message.guild.members.cache.get(message.author.id);
        if (!author) {
            console.log(`Author was not able to be fetched for message ${message.id}`);
            console.log(message);
            return 4; // no author
        } else {
            //todo: save embedded messages
            // console.log(`Author: ${JSON.stringify(author)}`);
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
    /*
    await conn.query("SELECT * FROM messages WHERE id = ?", message.id, (err, result) => {
        if (err) throw err;
        if (result.length === 0) { // if message doesn't already exist in DB
            const author = message.guild.members.cache.get(message.author.id);
            if (!author) {
                console.log(`Author was not able to be fetched for message ${message.id}`);
                console.log(message);
                return 4; // no author
            } else {
                //todo: save embedded messages
                // console.log(`Author: ${JSON.stringify(author)}`);
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
    });

     */
}

module.exports = captureMessage;