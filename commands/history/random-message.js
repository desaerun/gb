//imports
const Discord = require("discord.js");
const locutus = require("locutus");
const moment = require("moment");

//mysql
const mysql = require("mysql2/promise");
const db = require("../../config/db");
const pool = mysql.createPool({
    ...db,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
});

//module settings
const name = "random-message";
const description = "Chooses a random message from the DB from the day that is specified as an argument.";
const params = [
    {
        param: 'relativeDate',
        type: 'String',
        description: 'A string representing from when the historical message should be retrieved',
        default: 'now',
        required: false,
    },
];

//main
async function execute(client, message, args, forceGuildID = null, forceChannelID = null) {
    let channel = null;
    if ((forceGuildID || forceChannelID) && (forceGuildID ^ forceChannelID)) {
        console.log("forceGuildID or forceChannelID was defined, but not both.");
        return false;
    } else if (forceGuildID && forceChannelID) {
        channel = client.guilds.cache.get(forceGuildID).channels.cache.get(forceChannelID);
    } else {
        channel = message.channel;
    }
    //if no argument is given, default day string to "now";
    let arg_str = "now";
    if (args.length > 0) {
        arg_str = args.join(" ");
    }

    //convert string to timestamp using php-esque "strtotime"
    //https://www.php.net/manual/en/function.strtotime.php
    let timestamp = locutus.php.datetime.strtotime(arg_str) * 1000;

    // adjust the timestamp to UTC
    let utcOffset = moment(timestamp).utcOffset();
    let offsetMs = -utcOffset * 60 * 1000;
    console.log(`utcOffset: ${utcOffset}|offsetMs: ${offsetMs}`);

    //calculate midnight on both ends of the day provided
    timestamp -= timestamp % (24 * 60 * 60 * 1000); //subtract minutes since midnight
    timestamp += offsetMs; // add the UTC offset

    let end_timestamp = timestamp + (24 * 60 * 60 * 1000) - 1; //get 11:59:59.999 at the end of that day
    console.log(`Selecting messages between (${timestamp})${moment(timestamp).format('MMMM Do YYYY HH:mm:ss a')} and (${end_timestamp})${moment(end_timestamp).format('MMMM Do YYYY HH:mm:ss a')}`);
    console.log(`${timestamp} :: ${end_timestamp}`);

    //select messages from the DB that are between the two timestamps retrieved previously
    const message_sql = "SELECT" +
        "    m.id," +
        "    m.content," +
        "    m.guild," +
        "    m.channel," +
        "    m.author," +
        "    m.timestamp," +
        "    a.url AS attachmentURL," +
        "    author.displayName AS author_displayName," +
        "    author.avatarURL AS author_avatarURL," +
        "    author.isBot AS author_isBot" +
        " FROM" +
        "    messages m" +
        " LEFT JOIN attachments a ON" +
        "    m.id = a.messageId" +
        " LEFT JOIN authors author ON" +
        "    m.author=author.id" +
        " WHERE" +
        "    m.channel = ? AND m.timestamp BETWEEN ? AND ? AND m.deleted IS NULL" +
        " ORDER BY" +
        "    m.timestamp" +
        " DESC";
    let allMessages = [];
    try {
        const result = await pool.query(message_sql, [channel.id, timestamp, end_timestamp]);
        allMessages = result[0];
    } catch (err) {
        throw err;
    }

    //select a random message from the DB
    let selectedMessages = [];
    const humanMessageResults = allMessages.filter(element => !element.author_isBot);
    let noHumanMessages = (humanMessageResults.length === 0);
    if (noHumanMessages) {
        channel.send(`There were no messages on ${moment(timestamp).format('dddd MMMM Do YYYY')}`);
        return false;
    } else {
        if (allMessages.length < 3) {
            console.log(`<3 messages sent this day`);
            selectedMessages = allMessages;
        } else {
            //try to select a non-bot message
            const randomHumanMessage = humanMessageResults[Math.floor(Math.random() * humanMessageResults.length)];
            let randomHumanMessageIndex = allMessages.findIndex(message => message.id === randomHumanMessage.id);

            //if the first or last message of the day, choose the 2nd from first or last instead so we get context on both sides
            if (randomHumanMessageIndex === 0) {
                randomHumanMessageIndex++;
            } else if (randomHumanMessageIndex === allMessages.length) {
                randomHumanMessageIndex--;
            }

            //add the selected messages to the array
            let first = randomHumanMessageIndex - 1;
            let last = randomHumanMessageIndex + 2;
            selectedMessages = allMessages.slice(first, last).reverse();
        }
        console.log(`Selected messages: ${JSON.stringify(selectedMessages)}`);

        for (const messageRow of selectedMessages) {
            console.log(`Current message: ${JSON.stringify(messageRow)}`);
            let humanTimedate = moment(messageRow.timestamp).format("dddd, MMMM Do YYYY @ hh:mm:ss a");
            let embedMessage = new Discord.MessageEmbed()
                .setAuthor(messageRow.author_displayName, messageRow.author_avatarURL)
                .setThumbnail(messageRow.author_avatarURL)
                .setTitle(humanTimedate)
                .setDescription(`[**Jump to Message**](https://discord.com/channels/${messageRow.guild}/${messageRow.channel}/${messageRow.id})`);
            if (messageRow.content) {
                embedMessage.addField('\u200b', messageRow.content)
            }
            if (messageRow.attachmentURL) {
                embedMessage.setImage(messageRow.attachmentURL);
            }
            try {
                await channel.send(embedMessage);
            } catch (err) {
                console.error("There was an error sending the embed message:", err);
                return false;
            }
        }
        return true;
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
