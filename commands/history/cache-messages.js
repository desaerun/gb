//imports
const {logMessage} = require("../../tools/utils");
const {captureMessage} = require("../../tools/message-db-utils");
const {sendMessage} = require("../../tools/sendMessage");

//prisma
const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();

//module settings
const name = "cache-messages";
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
    {
        param: "catchup",
        type: "Boolean",
        description: "Toggles catch-up or full mode.",
        default: false,
        optional: true,
    }
];
const examples = [
    "this true",
    "838152668782395425 true",
    "674824072126922753 false",
];
const allowedContexts = [
    "text",
];
const adminOnly = true;

//main
const execute = async function (message, args, client) {
    let targetChannel;
    let includeBotMessages = false;
    let catchUp = false;
    //if command is called with arg, check if it's a channel ID;
    if (args.length > 0) {
        if (args[0] === "self" || args[0] === "this" || args[0] === params[0].default || args[0] === "") {
            targetChannel = message.channel;
        } else if (message && message.channels.cache.get(args[0])) {
            targetChannel = message.guild.channels.cache.get(args[0]);
        } else if (client.channels.fetch(args[0])) {
            targetChannel = await client.channels.fetch(args[0]);
        } else {
            await sendMessage(`The specified channel ID was not found.`, message.channel);
            return true;
        }
    }
    if (args.length > 1) {
        includeBotMessages = args[1];
    }
    if (args.length > 2) {
        catchUp = args[2];
    }
    if (message) {
        await sendMessage(`Caching messages from "${message.guild.name}".#${targetChannel.name} to DB...`, message.channel);
    }
    logMessage(`Retrieving list of messages...`, 3);
    let counts = {
        error: 0,
        added: 0,
        bot: 0,
        noAuthor: 0,
        exists: 0,
        total: 0,
    }
    try {
        //todo: this could probably be done in parallel with Promise.all, maybe
        let messages = await targetChannel.messages.fetch({limit: 100});
        while (messages.size > 0) {
            let currentRunCounts = {
                error: 0,
                added: 0,
                bot: 0,
                noAuthor: 0,
                exists: 0,
                total: 0,
            }
            logMessage(`*************Start of batch, messages.size=${messages.size}**************`, 3);
            let last = messages.last().id;

            let skipAuthors = [];
            let messageResult = 0;
            for (let historicalMessage of messages.values()) {
                //special handling to prevent trying to fetch GuildMember object for authors that are no longer joined
                // to the guild from the guild cache/API, which is an expensive operation
                if (skipAuthors.includes(historicalMessage.author.id)) {
                    counts.noAuthor++;
                    logMessage(`Fetching author ${historicalMessage.author.id} failed previously this run, skipping...`, 3);
                    continue;
                }
                messageResult = await captureMessage(historicalMessage, includeBotMessages);
                logMessage(`messageResult: ${messageResult}`, 3);
                switch (messageResult) {
                    case 1:
                        counts.added++;
                        currentRunCounts.added++;
                        break;
                    case 2:
                        counts.exists++;
                        currentRunCounts.exists++;
                        break;
                    case 3:
                        counts.bot++;
                        currentRunCounts.bot++;
                        break;
                    case 4:
                        counts.noAuthor++;
                        currentRunCounts.noAuthor++;
                        //add the author to the list of authors that are not joined to the guild, this author will be
                        //skipped over for further messages during this run.
                        skipAuthors.push(historicalMessage.author.id);
                        break;
                    case 0:
                        counts.error++;
                        currentRunCounts.error++;
                        break;
                }
            }
            //calculate total number of messages
            currentRunCounts.total = Object.values(currentRunCounts).reduce((a, c) => a + c);

            messages = await targetChannel.messages.fetch({limit: 100, before: last});
            logMessage(`*************End of batch, messages.size=${messages.size}*************`, 3);
            logMessage(`(Error:  ${currentRunCounts.error}|Success: ${currentRunCounts.added}|Skipped: ${currentRunCounts.exists}|Bot: ${currentRunCounts.bot}|No Author: ${currentRunCounts.noAuthor})`, 3);
            if (catchUp && currentRunCounts.added + currentRunCounts.error === 0) {
                logMessage("Command is in catch-up mode and received an entire block of existing messages--stopping capture.", 2);
                return;
            }
        }
    } catch (e) {
        if (message) {
            await sendMessage(`There was an error fetching the messages: ${e.stack}`, message.channel);
        }
        logMessage(`There was an error fetching the messages: ${e.stack}`);
    }

    //calculate total number of messages
    counts.total = Object.values(counts).reduce((a, c) => a + c);

    if (message) {
        await sendMessage(`There have been ${counts.total} messages sent in channel #${targetChannel.name}.`, message.channel);
    }
    logMessage(`There have been ${counts.total} messages sent in channel #${targetChannel.name}.`);
    //retrieve total number of messages from db
    try {
        const messageCount = await prisma.message.count({
            where: {
                channelId: targetChannel.id,
            },
        })
        if (message) {
            await sendMessage(`Updated DB successfully.  Rows: ${messageCount}`, message.channel);
            await sendMessage(`(Error: ${counts.error}|Success: ${counts.added}|Skipped: ${counts.exists}`
                + `|Bot: ${counts.bot}|No Author: ${counts.noAuthor})`, message.channel);
        }
        logMessage(`Updated DB successfully.  Rows: ${messageCount}`);
        logMessage(`(Error: ${counts.error}|Success: ${counts.added}|Skipped: ${counts.exists}`
            + `|Bot: ${counts.bot}|No Author: ${counts.noAuthor})`);
    } catch (e) {
        if (message) {
            await sendMessage(`Error occurred fetching message count: ${e}`, message.channel);
        }
        logMessage(`Error occurred fetching message count: ${e}`);
    }
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    examples: examples,
    execute: execute,
    allowedContexts: allowedContexts,
    adminOnly: adminOnly,
}

//helper functions
