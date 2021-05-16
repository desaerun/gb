//imports
const Discord = require("discord.js");
const moment = require("moment");
const {sendMessage} = require("../../tools/sendMessage");

//prisma
const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();

//module settings
const name = "message-history";
const description = "Retrieves history for the specified message ID.";
const params = [
    {
        name: "messageID",
        description: "The ID of the message",
        type: "Snowflake",
        //no default, a message ID must be given
    },
];

//main
const execute = async function (client, message, args) {
    if (args.length !== 1) {
        await sendMessage(`You must provide the message ID.`, message.channel);
        return false;
    }
    let messageId = args[0];
    let messageFromDb;

    try {
        messageFromDb = await prisma.message.findUnique({
            where: {
                id: messageId,
            },
            include: {
                author: true,
                attachments: true,
                editHistory: {
                    orderBy: {
                        editTimestamp: "desc",
                    },
                },
            }
        });
    } catch (e) {
        throw e;
    }
    if (!messageFromDb) {
        await sendMessage(`That message ID does not exist.`, message.channel);
        return false;
    }
    const dateFormat = "dddd, MMMM Do YYYY @ hh:mm:ss a";
    const embedMessage = new Discord.MessageEmbed()
        .setTitle(`Message History for ${messageId}`)
        .setAuthor(messageFromDb.author.displayName, messageFromDb.author.avatarUrl);
    if (!messageFromDb.deletedAt) {
        embedMessage
            .setURL(`https://discord.com/channels/${messageFromDb.guildId}/${messageFromDb.channelId}/${messageFromDb.id}`)
    }
    let originalContent = messageFromDb.content;
    if (messageFromDb.deletedAt) {
        console.log(messageFromDb.deletedAt);
        embedMessage.addField(":x: Deleted:", moment(messageFromDb.deletedAt).format(dateFormat));
    }
    if (messageFromDb.editHistory.length > 0) { // if the message has an edit history
        originalContent = messageFromDb.editHistory[messageFromDb.editHistory.length - 1].oldContent;
        const mostRecentEdit = messageFromDb.editHistory.shift();
        embedMessage.addField(
            `Current Content (edited on ${moment(mostRecentEdit.editTimestamp).format(dateFormat)}):`,
            mostRecentEdit.newContent
        );
        if ((messageFromDb.deletedAt && messageFromDb.editHistory.length <= 8) ||
            (!messageFromDb.deletedAt && messageFromDb.editHistory.length <= 9)) {
            for (const edit of messageFromDb.editHistory) {
                let formattedDatetime = moment(edit.editTimestamp).format(dateFormat);
                embedMessage.addField(`Edit on ${formattedDatetime}:`, edit.newContent);
            }
            embedMessage.addField(
                `Original Content\n(posted ${moment(messageFromDb.timestamp).format(dateFormat)}):`,
                originalContent
            );
            if (messageFromDb.attachments.length > 0) {
                embedMessage.setImage(messageFromDb.attachments[0].url);
            }
            try {
                await sendMessage(embedMessage, message.channel);
            } catch (e) {
                throw e;
            }
        } else {
            //in case there are more edits than can fit in the MessageEmbed (it only supports 10 fields total)
            let currentMessagePointer = 0;
            for (; (messageFromDb.deletedAt && currentMessagePointer < 7) ||
                   (!messageFromDb.deletedAt && currentMessagePointer < 8); currentMessagePointer++) {
                let formattedDatetime =
                    moment(+(messageFromDb.editHistory[currentMessagePointer].editTimestamp)).format(dateFormat);
                embedMessage.addField(
                    `Edit on ${formattedDatetime}:`,
                    messageFromDb.editHistory[currentMessagePointer].newContent
                );
            }
            try {
                await sendMessage(embedMessage, message.channel);
            } catch (e) {
                throw e;
            }
            //loop through more edits until end of edit history is reached
            let internalMessagePointer = 0;
            for (;
                currentMessagePointer < messageFromDb.editHistory.length - 1;
                currentMessagePointer += internalMessagePointer
            ) {
                const furtherEdits = new Discord.MessageEmbed()
                    .setURL(`https://discord.com/channels/${messageFromDb.guildId}/${messageFromDb.channel}/${messageFromDb.id}`);
                internalMessagePointer = 0;
                for (; internalMessagePointer < 9 &&
                       messageFromDb.editHistory.length - 1 - (currentMessagePointer + internalMessagePointer) >= 0;
                       internalMessagePointer++) {
                    let pointer = currentMessagePointer + internalMessagePointer;
                    let formattedDatetime = moment(messageFromDb.editHistory[pointer].editTimestamp).format(dateFormat);
                    furtherEdits.addField(`Edit on ${formattedDatetime}:`, messageFromDb.editHistory[pointer].newContent);
                }
                if (messageFromDb.editHistory.length - (currentMessagePointer + internalMessagePointer) === 0) {
                    furtherEdits.addField(
                        `Original Content\n(posted ${moment(messageFromDb.timestamp).format(dateFormat)}):`,
                        originalContent
                    );
                    if (messageFromDb.attachments.length > 0) {
                        furtherEdits.setImage(messageFromDb.attachments[0].url);
                    }
                }
                try {
                    await sendMessage(furtherEdits, message.channel);
                } catch (e) {
                    throw e;
                }
            }
        }
    } else {
        embedMessage.addField(
            `Original Content\n(posted ${moment(messageFromDb.timestamp).format(dateFormat)}):`,
            originalContent);
        if (messageFromDb.attachments.length > 0) {
            embedMessage.setImage(messageFromDb.attachments[0].url);
        }
        try {
            await sendMessage(embedMessage, message.channel);
        } catch (e) {
            throw e;
        }
    }

    return true;
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
}

//helper functions
