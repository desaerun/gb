//imports
const Discord = require("discord.js");
const locutus = require("locutus");
const moment = require("moment");
const {logMessage} = require("../../tools/utils");
const {sendMessage} = require("../../tools/sendMessage");

//prisma
const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();

//module settings
const name = "random-message";
const aliases = [
    "history",
];
const description = "Chooses a random message from the DB from the day that is specified as an argument.";
const params = [
    {
        param: "relativeDate",
        type: "String",
        description: "A string representing from when the historical message should be retrieved",
        default: "now",
    },
];
const examples = [
    "today",
    "a week ago",
    "January 1st 2021",
];
const allowedContexts = [
    "text",
    "dm",
];
const adminOnly = false;

//main
const execute = async function (message, args, forceGuildID = null, forceChannelID = null) {
    let channel = null;
    if ((forceGuildID || forceChannelID) && (forceGuildID ^ forceChannelID)) {
        logMessage("forceGuildID or forceChannelID was defined, but not both.", 2);
        return false;
    } else if (forceGuildID && forceChannelID) {
        channel = await message.client.channels.fetch(forceChannelID);
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
    let locutusTs = locutus.php.datetime.strtotime(arg_str) * 1000;

    //create a date object out of the timestamp extracted
    let dateObj = new Date(locutusTs);
    //set the time to the most recent Midnight
    dateObj.setHours(0, 0, 0, 0);
    // convert back to a timestamp
    let timestamp = dateObj.getTime();
    //get 11:59:59.999 at the end of that day
    let end_timestamp = timestamp + (24 * 60 * 60 * 1000) - 1;

    logMessage(`Selecting messages between (${timestamp})${moment(timestamp).format("MMMM Do YYYY HH:mm:ss a")}`
        + ` and (${end_timestamp})${moment(end_timestamp).format("MMMM Do YYYY HH:mm:ss a")}`, 3);
    logMessage(`${timestamp} :: ${end_timestamp}`, 3);

    let allMessages;
    try {
        //select messages from the DB that are between the two timestamps retrieved previously'
        allMessages = await prisma.message.findMany({
            where: {
                channelId: channel.id,
                timestamp: {
                    gte: new Date(timestamp),
                    lte: new Date(end_timestamp),
                }
            },
            include: {
                attachments: true,
                author: true,
            }
        });
    } catch (err) {
        throw err;
    }

    //select a random message from the DB
    let selectedMessages = [];
    const humanMessageResults = allMessages.filter(m => !m.author.isBot);
    let noHumanMessages = (humanMessageResults.length === 0);
    if (noHumanMessages) {
        await sendMessage(`There were no messages on ${moment(timestamp).format("dddd MMMM Do YYYY")}`, channel);
        return false;
    } else {
        if (allMessages.length < 3) {
            logMessage(`<3 messages sent this day`, 4);
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

        for (const messageRow of selectedMessages) {
            let humanTimedate = moment(messageRow.timestamp).format("dddd, MMMM Do YYYY @ hh:mm:ss a");
            let embedMessage = new Discord.MessageEmbed()
                .setAuthor(messageRow.author.displayName, messageRow.author.avatarUrl);
            if (messageRow.content) {
                embedMessage.addField("\u200b", messageRow.content)
            }
            embedMessage.addField("\u200b", "\u200b");
            embedMessage.addField(humanTimedate, `[**Jump to Message**](https://discord.com/channels/${messageRow.guildId}/${messageRow.channelId}/${messageRow.id})`);
            if (messageRow.attachments.length > 0) {
                embedMessage.setImage(messageRow.attachments[0].attachmentUrl);
            }
            try {
                await sendMessage(embedMessage, channel);
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
    aliases: aliases,
    description: description,
    params: params,
    examples: examples,
    execute: execute,
    allowedContexts: allowedContexts,
    adminOnly: adminOnly,
}

//helper functions
