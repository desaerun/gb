const snowflakeToTimestamp = require("../../tools/snowflakeToTimestamp");

const mysql = require('mysql');
const db = require("../../config/db");
const conn = mysql.createConnection(db);
conn.connect();

captureMessage = require("../../tools/capture-message");

module.exports = {
    name: 'cache-message-history',
    description: "Retrieves message history for the current channel and stores it to the DB",
    execute: async function (client, message, args) {

        let messageCount = 0;
        console.log(`Retrieving list of messages...`);

        let messages = await message.channel.messages.fetch({limit: 100});

        while (messages.size > 0) {
            console.log(`*************Start of batch, messages.size=${messages.size}**************`);
            messageCount += messages.size;
            let last = messages.last().id;

            for (let historical_message of messages.values()) {
                captureMessage(historical_message);
            }
            messages = await message.channel.messages.fetch({limit: 100, before: last});
            console.log(`*************End of batch, messages.size=${messages.size}*************`);
        }
        messageCount += messages.size;

        message.reply(`There have been ${messageCount} messages sent in this channel.`);
        conn.query("SELECT COUNT(*) FROM `messages`",(err,result,fields) => {
            message.reply(`Updated mysql query successfully.  Rows: ${JSON.stringify(result)}`);
        });
    }
}