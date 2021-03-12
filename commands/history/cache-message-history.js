//imports
const {captureMessage} = require("../../tools/message-db-utils");
const {sendMessage} = require("../../tools/sendMessage");

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
const name = "cache-message-history";
const description = "Retrieves message history for the current channel and stores it to the DB";
const params = [
    {
        param: "channel",
        type: `Snowflake|"this"|"self"`,
        description: "A channel ID snowflake to capture",
        default: "this",
    },
    {
        param: "includeBotMessages",
        type: "Boolean",
        description: "Whether or not to retrieve messages from Discord bots",
        default: "false",
    },
];

//main
const execute = async function (client, message, args) {
    let targetChannel = message.channel;
    let includeBotMessages = false;
    //if command is called with arg, check if it's a channel ID;
    if (args.length > 0) {
        if (args[0] === "self" || args[0] === "this" || args[0] === params[0].default || args[0] === "") {
            targetChannel = message.channel;
        } else if (message.guild.channels.cache.get(args[0])) {
            targetChannel = message.guild.channels.cache.get(args[0]);
        } else {
            await sendMessage(`The specified channel ID was not found.`, message.channel);
            return false;
        }
    }
    if (args.length === 2) {
        includeBotMessages = args[1];
    }
    await sendMessage(`Caching messages from "${message.guild.name}".#${targetChannel.name} to DB...`, message.channel);
    console.log(`Retrieving list of messages...`);
    let counts = {
        error: 0,
        added: 0,
        bot: 0,
        noAuthor: 0,
        skipped: 0,
        total: 0,
    }
    try {
        let messages = await targetChannel.messages.fetch({limit: 100});
        while (messages.size > 0) {
            console.log(`*************Start of batch, messages.size=${messages.size}**************`);
            let last = messages.last().id;

            let messageResult = 0;
            for (let historical_message of messages.values()) {
                messageResult = await captureMessage(client, historical_message, includeBotMessages);
                console.log(`messageResult: ${messageResult}`);
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
    } catch (e) {
        await sendMessage(`There was an error fetching the messages: ${e}`, message.channel);
    }
    await sendMessage(`There have been ${counts.total} messages sent in channel #${targetChannel.name}.`, message.channel);
    try {
        let [result] = await pool.execute("SELECT COUNT(*) AS `messageCount` FROM `messages` WHERE `channel` = ?", [targetChannel.id]);
        console.log(result[0]);
        await sendMessage(`Updated DB successfully.  Rows: ${result[0].messageCount}`, message.channel);
        await sendMessage(`(Error:  ${counts.error}|Success: ${counts.added}|Skipped: ${counts.skipped}|Bot: ${counts.bot}|No Author: ${counts.noAuthor})`, message.channel);
    } catch (e) {
        await sendMessage(`Error occurred fetching message count: ${e}`, message.channel);
    }
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
}

//helper functions
