const snowflakeToTimestamp = require("../../tools/snowflakeToTimestamp");

const mysql = require('mysql');
const db = require("../../config/db");
const conn = mysql.createConnection(db);
conn.connect();

captureMessage = require("../../tools/message_db_tools/captureMessage");

module.exports = {
    name: 'cache-message-history',
    description: "Retrieves message history for the current channel and stores it to the DB",
    args: [
        {
            param: '[channel]',
            type: 'Snowflake',
            description: 'A channel ID snowflake to capture',
            default: 'current channel',
        },
        {
            param: '[includeBotMessages]',
            type: 'Boolean',
            description: 'Whether or not to retrieve messages from Discord bots',
            default: 'false',
        },
    ],
    execute: async function (client, message, args) {


        let targetChannel = message.channel;
        let includeBotMessages = false;
        //if command is called with arg, check if it's a channel ID;
        if (args.length > 0) {
            if (args[0] === "self" || args[0] === "this" || args[0] === "") {
                targetChannel = message.channel;
            }
            else if (message.guild.channels.cache.get(args[0])) {
                targetChannel = message.guild.channels.cache.get(args[0]);
            } else {
                message.channel.send("The specified channel ID was not found.");
                return false;
            }
        }
        if (args.length === 2) {
            includeBotMessages = args[1];
        }
        message.channel.send(`Caching messages from ${message.guild.name}.#${targetChannel.name} to DB...`);
        console.log(`Retrieving list of messages...`);

        let messages = await targetChannel.messages.fetch({limit: 100});
        let counts = {
            error: 0,
            added: 0,
            bot: 0,
            noAuthor: 0,
            skipped: 0,
            total: 0,
        }
        while (messages.size > 0) {
            console.log(`*************Start of batch, messages.size=${messages.size}**************`);
            let last = messages.last().id;

            let messageResult = 0;
            for (let historical_message of messages.values()) {
                messageResult = await captureMessage(client,historical_message,includeBotMessages);
                switch (messageResult) {
                    case 1:
                        counts.added++;
                        break;
                    case 2:
                        counts.skipped++;
                        break;
                    case 3:
                        counts.bot++;
                        break;
                    case 4:
                        counts.noAuthor++;
                        break;
                    case 0:
                        counts.error++;
                        break;
                }
                counts.total++;
            }
            messages = await targetChannel.messages.fetch({limit: 100, before: last});
            console.log(`*************End of batch, messages.size=${messages.size}*************`);
            console.log(`(Error:  ${counts.error}|Success: ${counts.added}|Skipped: ${counts.skipped}|Bot: ${counts.bot}|No Author: ${counts.noAuthor})`);
        }

        message.channel.send(`There have been ${counts.total} messages sent in channel #${targetChannel.name}.`);
        conn.query(`SELECT COUNT(*) AS messageCount FROM messages WHERE channel = ?`,targetChannel.id,(error,result) => {
            if (error) throw error;
            console.log(`Result when re-selecting rows: ${JSON.stringify(result)}`);
            message.channel.send(`Updated DB successfully.  Rows: ${result[0].messageCount}`);
            message.channel.send(`(Error:  ${counts.error}|Success: ${counts.added}|Skipped: ${counts.skipped}|Bot: ${counts.bot}|No Author: ${counts.noAuthor})`);
        });
    }
}