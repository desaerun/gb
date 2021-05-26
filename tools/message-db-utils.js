const moment = require("moment");
const axios = require("axios");
const fs = require("fs");
const {snowflakeToTimestamp, logMessage, mkdirRecursiveSync} = require("./utils");

//prisma
const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Upserts a new message in the Database.  Also upserts the Channel, Guild, and Author tables with
 * information from the message.
 *
 * @param message -- a Discord.Message object representing the message.
 * @param lastEditTimestamp -- the timestamp the message was last edited.
 * @returns {Boolean} -- Returns true if successful.
 */
upsertMessage = async function (message, lastEditTimestamp = null) {
    if (message.channel.type === "text") {
        const author = await message.guild.members.fetch(message.author.id);
        let guildValues = {
            id: message.guild.id,
            name: message.guild.name,
        }
        let channelValues = {
            id: message.channel.id,
            guild: {
                connectOrCreate: {
                    where: {
                        id: guildValues.id,
                    },
                    create: guildValues,
                },
            },
            name: message.channel.name,
        }
        let isBot;
        if (author && author.user) {
            isBot = author.user.bot;
        } else {
            isBot = author.bot;
        }
        let authorValues = {
            id: message.author.id,
            displayName: author.displayName,
            avatarUrl: author.user.displayAvatarURL(),
            isBot: isBot,
        }
        let messageContent = message.content;
        for (const embed of message.embeds) {
            messageContent += convertEmbedToText(embed)
        }
        let messageValues = {
            id: message.id,
            author: {
                connectOrCreate: {
                    where: {
                        id: authorValues.id,
                    },
                    create: authorValues,
                }
            },
            guild: {
                connectOrCreate: {
                    where: {
                        id: guildValues.id,
                    },
                    create: guildValues,
                },
            },
            channel: {
                connectOrCreate: {
                    where: {
                        id: channelValues.id,
                    },
                    create: channelValues,
                },
            },
            content: messageContent,
            timestamp: new Date(message.createdTimestamp),
        }
        if (lastEditTimestamp) {
            messageValues.lastEditTimestamp = new Date(lastEditTimestamp);
        }
        try {
            //insert message
            await prisma.message.upsert({
                where: {
                    id: message.id,
                },
                update: {
                    lastEditTimestamp: messageValues.lastEditTimestamp,
                },
                create: messageValues,
            });
            logMessage(`Successfully upserted message ${messageValues.id}`, 3);

            //create author<->guild relationship
            await prisma.author.upsert({
                where: {
                    id: author.id,
                },
                update: {
                    guilds: {
                        connectOrCreate: {
                            where: {
                                id: guildValues.id,
                            },
                            create: guildValues,
                        }
                    }
                },
                create: {
                    ...authorValues,
                    guilds: {
                        connectOrCreate: {
                            where: {
                                id: guildValues.id,
                            },
                            create: guildValues,
                        }
                    }
                }
            })
            logMessage(`Successfully created author<->guild relationship between ${guildValues.id} and ${author.id}`, 4);
        } catch (e) {
            logMessage(`Failed to upsert the message: ${e}`, 2);
        }
        let i = 1;
        //realistically, messages can only have one attachment, but it is provided by discord API as an array
        for (let attachment of message.attachments) {
            const attachmentData = attachment[1];

            downloadAttachment(attachmentData);

            try {
                const insertAttachment = await prisma.messageAttachment.create({
                    data: {
                        id: attachmentData.id,
                        message: {
                            connect: {
                                id: message.id,
                            },
                        },
                        name: attachmentData.name,
                        url: attachmentData.url,
                        proxyUrl: attachmentData.proxyURL,
                        size: attachmentData.size,
                        height: attachmentData.height,
                        width: attachmentData.width,
                        timestamp: new Date(snowflakeToTimestamp(attachmentData.id)),
                    }
                });
                logMessage(`Successfully upserted attachment ${insertAttachment.id} (${i} of ${message.attachments.size})`, 3);
            } catch (e) {
                logMessage(`The message attachment was not able to be upserted: ${e}`, 2);
            }
            i++;
        }
        return true; // upsert successful
    } else if (message.channel.type === "dm") {
        try {
            const author = message.author;

            //upsert a bot DM entry
            await prisma.botDm.upsert({
                where: {
                    id: message.id,
                },
                update: {},
                create: {
                    id: message.id,
                    conversationId: message.channel.id,
                    author: {
                        connectOrCreate: {
                            where: {
                                id: author.id,
                            },
                            create: {
                                id: author.id,
                                displayName: author.displayName,
                                avatarUrl: author.displayAvatarURL(),
                                isBot: author.bot || (author.user && author.user.bot),
                            }
                        }
                    },
                    content: message.content,
                    timestamp: new Date(message.createdTimestamp),
                }
            });
            logMessage(`Successfully upserted DM message ${message.id}`, 3);
        } catch (e) {
            await logMessage(`The message was not able to be upserted: ${e.stack}`, 2);
        }
        //realistically, messages can only have one attachment, but it is provided by discord API as an array
        try {
            for (let attachment of message.attachments) {
                const attachmentData = attachment[1];

                //download image locally
                downloadAttachment(attachmentData);
                //insert attachment entry
                await prisma.dmAttachment.create({
                    data: {
                        id: attachmentData.id,
                        messageId: {
                            connect: {
                                where: {
                                    id: message.id,
                                }
                            },
                        },
                        name: attachmentData.name,
                        url: attachmentData.url,
                        proxyURL: attachmentData.proxyURL,
                        size: attachmentData.size,
                        height: attachmentData.height,
                        width: attachmentData.width,
                        timestamp: new Date(snowflakeToTimestamp(attachmentData.id)),
                    }
                });
            }
        } catch (e) {
            await logMessage(`The attachment was not able to be upserted: ${e.stack}`, 2);
        }

        return true; // upsert successful
    }
}
exports.upsertMessage = upsertMessage;

/**
 * This function is called every time a message is posted, or when running the cache message history command.
 * Scrapes information about the message and adds it to the DB.
 *
 * @param message -- The message to be parsed
 * @param includeBotMessages -- Whether or not Bot messages should be added to the DB or skipped over.
 * @returns {Promise<number>} -- A status code:
 * 1: Successfully added,
 * 2: Skipped,
 * 3: Bot Message that was skipped over
 * 4: Author is no longer a part of the Discord Guild that is being parsed.  This would cause an error with
 * several functions, so these messages are skipped over.
 */
captureMessage = async function (message, includeBotMessages = false) {
    try {
        let existingMessage = await prisma.message.findUnique({
            where: {
                id: message.id,
            },
        });
        if (!existingMessage) { // if message doesn't already exist in DB
            let author;
            if (message.channel.type === "text") {
                try {
                    author = await message.guild.members.fetch(message.author.id);
                } catch (e) {
                    logMessage(`Author is no longer joined to guild ${message.guild.id}`, 3);
                }
            } else if (message.channel.type === "dm") {
                author = await message.client.users.fetch(message.author.id);
            }
            if (!author) {
                logMessage(`Author ${message.author.id} was not able to be fetched for message ${message.id}`, 3);
                return 4; // no author
            } else {
                if (!author.bot || (author.user && !author.user.bot) || includeBotMessages) {
                    upsertMessage(message);
                    return 1; // added
                } else {
                    logMessage("Message was from a bot and includeBotMessages is false.", 3);
                    return 3; // bot message
                }
            }
        } else {
            logMessage(`Message ${message.id} already exists in DB, skipping...`, 3);
            return 2; // exists
        }
    } catch (err) {
        logMessage(err, 2);
    }
}
exports.captureMessage = captureMessage;

/**
 * Updates the DB with information about when a message was deleted.
 *
 * @param deletedMessage
 * @returns {Promise<void>}
 */
deleteMessageFromDb = async function (deletedMessage) {
    try {
        await prisma.message.update({
            where: {
                id: deletedMessage.id,
            },
            data: {
                deletedAt: new Date(),
            }
        });
        logMessage(`Set deletedAt flag for ${deletedMessage.id}`);
    } catch (e) {
        logMessage(`The deletedAt flag was not able to be set for ${deletedMessage.id}: ${e.stack}`);
    }
}
exports.deleteMessageFromDb = deleteMessageFromDb;

/**
 * sets the deletedBy field in the DB for the message ID given.
 *
 * @param message -- A Discord.Message representing the message
 * @param deletedBy -- A "reason" or "source" of the deletion.
 * @returns {Promise<void>}
 */
setDeletedBy = async function (message, deletedBy) {
    try {
        await prisma.message.update({
            where: {
                id: message.id,
            },
            data: {
                deletedBy: deletedBy,
            },
        });
        logMessage(`The deletedBy field on ${message.id} was updated to ${deletedBy}.`);
    } catch (e) {
        logMessage(`The message delete reason was not able to be set to ${deletedBy}: ${e.stack}`);
    }
}
exports.setDeletedBy = setDeletedBy;

/**
 * Retrieves the message if it is a partial before passing it along to the addMessageEdit function,
 * where it will be stored in the DB.
 *
 * @param oldMessage
 * @param newMessage
 * @returns {Promise<void>}
 */
updateEditedMessage = async function (oldMessage, newMessage) {
    upsertMessage(newMessage, +Date.now());
    if (oldMessage.partial) {
        try {
            const fetchedMessage = await oldMessage.fetch();
            await addMessageEdit(fetchedMessage, newMessage);
        } catch (e) {
            logMessage(`The message edit history was not able to be added: ${e.stack}`);
        }
    } else {
        await addMessageEdit(oldMessage, newMessage);
    }
}
exports.updateEditedMessage = updateEditedMessage;

/**
 * Adds a message edit entry to the DB
 *
 * @param oldMessage -- A Discord.Message object representing the message prior to editing
 * @param newMessage -- A Discord.Message object representing the message after editing
 * @returns {Promise<void>}
 */
addMessageEdit = async function (oldMessage, newMessage) {
    logMessage(`Adding messageEdit history for ${newMessage.id}`, 4);
    let oldMessageContent = oldMessage.content;
    let newMessageContent = newMessage.content;
    for (const embed of oldMessage.embeds) {
        oldMessageContent += convertEmbedToText(embed);
    }
    for (const embed of newMessage.embeds) {
        newMessageContent += convertEmbedToText(embed);
    }
    try {
        //insert editHistory entry
        await prisma.messageEditHistory.create({
            data: {
                message: {
                    connect: {
                        id: oldMessage.id,
                    },
                },
                newContent: newMessageContent,
                oldContent: oldMessageContent,
                editTimestamp: new Date(newMessage.editedTimestamp),
            }
        });
    } catch (e) {
        logMessage(`The message edit history was not able to be created: ${e.stack}`);
    }
}

/**
 * Converts a Discord embedded message into a big chunk of text, for storing in DB purposes or including
 * the text into another embed.
 *
 * @param embed -- the Discord.MessageEmbed object
 * @returns {string} -- a string representing the embed object
 */
convertEmbedToText = function convertEmbedToText(embed) {
    let textEmbedLines = [];
    textEmbedLines.push(``);
    textEmbedLines.push("\\*\\*\\*\\*\\*\\*\\**Embedded Content*\\*\\*\\*\\*\\*\\*\\*");
    if (embed.title) {
        if (embed.url) {
            textEmbedLines.push(`[**${embed.title}**](${embed.url})`);
        }
        textEmbedLines.push(`${embed.title}`);
    }
    if (embed.description) {
        textEmbedLines.push(`${embed.description}`);
    }
    for (const field of embed.fields) {
        textEmbedLines.push(`**${field.name}**`);
        textEmbedLines.push(`    ${field.value}`);
    }
    if (embed.author && embed.author.name) {
        textEmbedLines.push(`${embed.author.name}`);
    }
    if (embed.timestamp) {
        const formattedTimestamp = moment(embed.timestamp).format("MMM Do YYYY h:mm:ssa [GMT]Z");
        textEmbedLines.push(`at ${formattedTimestamp}`);
    }
    textEmbedLines.push(`\\*\\*\\*\\*\\*\\*End Embedded Content\\*\\*\\*\\*\\*\\*`);

    return textEmbedLines.join("\n");
}
exports.convertEmbedToText = convertEmbedToText;

const downloadAttachment = async (attachmentData) => {
    //make sure the folder for attachments exists
    const attachmentsFolder = "./data/attachments/";
    mkdirRecursiveSync(attachmentsFolder);

    //get the file extension
    const urlParts = attachmentData.url.split(".");
    let extension = "";
    if (urlParts.length > 1) {
        extension = "." + urlParts[urlParts.length - 1];
    }

    const fullFilePath = attachmentsFolder + attachmentData.id + extension;
    try {
        axios({
            url: attachmentData.url,
            responseType: 'stream'
        }).then(response =>
            new Promise((resolve, reject) => {
                response.data.pipe(fs.createWriteStream(fullFilePath))
                    .on("finish", () => resolve())
                    .on("error", () => reject(e));
            })
        );
    } catch (e) {
        throw Error(`There was an error downloading the attachment ${attachmentData.url}(${attachmentData.id}): ${e}`);
    }
}