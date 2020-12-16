const snowflakeToTimestamp = require("../../tools/snowflakeToTimestamp");

const mysql = require('mysql');
const db = require("../../config/db");
const conn = mysql.createConnection(db);
conn.connect();

captureMessage = require("../../tools/captureMessage");

module.exports = {
    name: 'cache-message-history',
    description: "Retrieves message history for the current channel and stores it to the DB",
    execute: async function (client, message, args) {

        let targetChannel = message.channel;
        //if command is called with arg, check if it's a channel ID;
        if (args.length === 1) {
            if (message.channels.cache.get(args[0])) {
                targetChannel = message.guild.channels.get(args[0]);
            } else {
                message.channel.send("The specified channel ID was not found.");
                return false;
            }
        }
        console.log(`Retrieving list of messages...`);

        let messages = await targetChannel.messages.fetch({limit: 100});
        let messageCount = 0;
        while (messages.size > 0) {
            console.log(`*************Start of batch, messages.size=${messages.size}**************`);
            messageCount += messages.size;
            let last = messages.last().id;

            for (let historical_message of messages.values()) {
                captureMessage(client,historical_message);
            }
            messages = await targetChannel.messages.fetch({limit: 100, before: last});
            console.log(`*************End of batch, messages.size=${messages.size}*************`);
        }
        messageCount += messages.size;

        message.channel.send(`There have been ${messageCount} messages sent in channel ${targetChannel.name}.`);
        conn.query(`SELECT COUNT(*) FROM messages WHERE channel_id = ${targetChannel.id}`,(err,result,fields) => {
            message.channel.send(`Updated mysql query successfully.  Rows: ${JSON.stringify(result)}`);
        });
    }
}