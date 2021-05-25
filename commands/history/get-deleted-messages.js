//imports
const Discord = require("discord.js");
const moment = require("moment");
const {sendMessage} = require("../../tools/sendMessage");

//prisma
const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();

//module settings
const name = "get-deleted-messages";
const aliases = [
    "deleted",
    "deleted-messages",
];
const description = "Retrieves the recently deleted messages by the mentioned user";
const params = [
    {
        param: "user",
        type: "Snowflake|Mention",
        description: "A user ID or @mention",
        default: "current user",
    },
    {
        param: "numMessages",
        type: "Integer",
        description: "The number of messages to retrieve",
        default: 3,
    },
];
const examples = [
    `@desaerun`,
    `187048556643876864`,
];
const allowedContexts = [
    "text",
];
const adminOnly = false;

//main
const execute = async function (message, args) {
    let userId = args[0];
    if (message.mentions.users.first()) {
        userId = message.mentions.users.first().id;
    } else if (userId === params[0].default) {
        userId = message.author.id;
    }
    const numMessages = args[1] ? args[1] : params[1].default;
    let deletedMessages;
    try {
        deletedMessages = await prisma.message.findMany({
            where: {
                authorId: userId,
                channelId: message.channel.id,
                NOT: {
                    OR: {
                        deletedAt: null,
                        deletedBy: "uwu"
                    }
                },
            },
            orderBy: {
                timestamp: "desc"
            },
            include: {
                author: true,
                attachments: true,
            }
        });
    } catch (e) {
        throw e;
    }
    const totalDeletedMessages = deletedMessages.length;
    if (totalDeletedMessages > 0) {
        const author = deletedMessages[0].author;
        const deletedMessagesSlice = deletedMessages.slice(0, numMessages);

        await sendMessage(`${author.displayName}'s most recent ${Math.min(numMessages, totalDeletedMessages)} `
            + `(of ${totalDeletedMessages}) deleted messages:`,
            message.channel
        );
        for (const deletedMessage of deletedMessagesSlice) {
            let deletedMessageEmbed = new Discord.MessageEmbed()
                .setAuthor(author.displayName, author.avatarUrl)
                .setFooter(`Message ID: ${deletedMessage.id}`);
            if (deletedMessage.content) {
                deletedMessageEmbed.addField("\u200b", deletedMessage.content)
            }
            deletedMessageEmbed.addField("\u200b", "\u200b"); //spacer
            deletedMessageEmbed.addField("Message History:",
                `Use \`-message-history ${deletedMessage.id}\` to retrieve the message history.`
            );
            deletedMessageEmbed.addField("Posted:",
                moment(deletedMessage.timestamp).format("dddd, MMMM Do YYYY @ hh:mm:ss a"),
                true);
            deletedMessageEmbed.addField("Deleted:",
                moment(deletedMessage.deletedAt).format("dddd, MMMM Do YYYY @ hh:mm:ss a"),
                true);
            if (deletedMessage.attachments.length > 0) {
                deletedMessageEmbed.setImage(deletedMessage.attachments[0].url);
            }
            try {
                await sendMessage(deletedMessageEmbed, message.channel);
            } catch (e) {
                console.error("There was an error sending the embed message:", e);
                return false;
            }
        }
    } else {
        await sendMessage("That user does not have any deleted messages in this channel.", message.channel);
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