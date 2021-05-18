//imports
const {captureMessage} = require("../../tools/message-db-utils");
const {sendMessage} = require("../../tools/sendMessage");
const {isAdmin} = require("../../tools/utils");

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
];
const examples = [
    "this true",
    "838152668782395425 true",
    "674824072126922753 false",
]

//main
const execute = async function (client, message, args) {
    if (!isAdmin(message.member)) {
        await sendMessage("You do not have the authority to perform that function.", message.channel);
        return false;
    }
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

            let skipAuthors = [];
            let messageResult = 0;
            for (let historicalMessage of messages.values()) {
                //special handling to prevent trying to fetch GuildMember object for authors that are no longer joined
                // to the guild from the guild cache/API, which is an expensive operation
                if (skipAuthors.includes(historicalMessage.author.id)) {
                    counts.noAuthor++;
                    console.log("Fetching author failed previously this run, skipping...");
                    continue;
                }
                messageResult = await captureMessage(client, historicalMessage, includeBotMessages);
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
                        //add the author to the list of authors that are not joined to the guild, this author will be
                        //skipped over for further messages during this run.
                        skipAuthors.push(historicalMessage.author.id);
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
        await sendMessage(`There was an error fetching the messages: ${e.stack}`, message.channel);
    }
    await sendMessage(`There have been ${counts.total} messages sent in channel #${targetChannel.name}.`, message.channel);
    try {
        const messageCount = await prisma.message.count({
            where: {
                channelId: targetChannel.id,
            },
        })
        await sendMessage(`Updated DB successfully.  Rows: ${messageCount}`, message.channel);
        await sendMessage(`(Error: ${counts.error}|Success: ${counts.added}|Skipped: ${counts.skipped}|Bot: ${counts.bot}|No Author: ${counts.noAuthor})`, message.channel);
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
    examples: examples,
}

//helper functions
