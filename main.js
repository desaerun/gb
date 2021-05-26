require("dotenv").config();  // pull in ENV variables from .env file
const CONFIG = require("./config/config");
const Discord = require("discord.js");
const fs = require("fs");
const os = require("os");
const moment = require("moment");

const {captureMessage, updateEditedMessage, deleteMessageFromDb} = require("./tools/message-db-utils");
const setBotStatus = require("./commands/bot_control/set-bot-status");
const {isAdmin, isSuperAdmin, logMessage, getRandomArrayMember, readSingleLine} = require("./tools/utils");
const {generateUwuCombinations} = require("./tools/uwuify");
const {sendMessage} = require("./tools/sendMessage");
const {startCryptoWatchers} = require("./tools/cryptoWatcher");
const cacheMessages = require("./commands/history/cache-messages");
const {mkdirRecursiveSync,touchFileSync} = require("./tools/utils");

//main
const client = new Discord.Client({partials: ["MESSAGE"]});

//exit handler
require("./tools/exitHandler").init(client);

client.commands = new Discord.Collection();
client.listenerSet = new Discord.Collection();

getCommands(client, "./commands");
getListenerSet(client, "./listeners");

client.once("ready", async () => {
    client.uwuMode = false;

    client.normalNickname = client.user.username;

    Promise.all([
        setNicknameAllGuilds(),     //set bot nickname in all guilds to its "normal" nickname
        sendOnlineStatusMessage(),  // send online status message
        setInitialBotStatus(),      // set bot status message
        startCryptoWatchers(client),      // start crypto-watcher cron
    ]).then(() => {
        logMessage("Bot start-up process completed successfully.", 3);
        catchUpOnMessages();        // catch up on all messages missed while the bot was offline
    }).catch((e) => {
        logMessage(`There was an error completing the start-up process: ${e}`, 1);
    });
});

//handling for when messages are sent
client.on("message", incomingMessageHandler);
//handling for when messages are modified1 ban
client.on("messageUpdate", messageUpdateHandler);
//handling for when messages are deleted
client.on("messageDelete", messageDeleteHandler);
//handling for connection errors
client.on("shardError", shardErrorHandler);

client.login(process.env.BOT_TOKEN).then(() => {
    logMessage("Bot successfully logged in.", 2);
});


// HELPER FUNCTIONS

/******************/
/* EVENT HANDLERS */

/******************/

/**
 * Handler for handling an incoming message event
 *
 * @param message - the incoming message
 * @returns {Promise<void>}
 */
async function incomingMessageHandler(message) {
    //capture messages to DB
    captureMessage(message, true).then(() => {
        logMessage("Captured message successfully.", 4);
    });

    // Ignore my own messages
    if (message.author.bot) return;

    // Attempt to parse commands
    if (isCommand(message)) {
        let args = message.content.slice(CONFIG.PREFIX.length);
        args = parseQuotedArgs(args);

        await runCommands(message, args);
        // Otherwise pass to listeners
    } else {
        await parseWithListeners(message);
    }
}

/**
 * Handler for handling a "message edited" event
 *
 * @param oldMessage - the message prior to editing
 * @param newMessage - the new message (post-edit)
 * @returns {Promise<void>}
 */
async function messageUpdateHandler(oldMessage, newMessage) {
    logMessage("Received edited message event, parsing.", 4)
    await updateEditedMessage(oldMessage, newMessage);
}

/**
 * Handler for handling a "message deleted" event
 *
 * @param deletedMessage - the message that was deleted
 * @returns {Promise<void>}
 */
async function messageDeleteHandler(deletedMessage) {
    logMessage("Received deleted message, parsing.", 4);
    await deleteMessageFromDb(deletedMessage);
}

/**
 * Steps to take when handling a Shard Error event (bot is kill)
 *
 * @param error - the error message/reason/code
 * @returns {Promise<void>}
 */
async function shardErrorHandler(error) {
    console.error("possible shard error was caught: ", error);
}

/**
 * Searches client.commands for the parsed command, and executes if the command is valid
 * @param message
 * @param args
 */
async function runCommands(message, args) {
    let commandName = args.shift().toLowerCase();

    //support for uwu-ified command names
    if (client.uwuMode) {
        const possibleUwuCommandNames = generateUwuCombinations(commandName);
        for (const possibleUwuCommandName of possibleUwuCommandNames) {
            if (client.commands.has(possibleUwuCommandName)) {
                commandName = possibleUwuCommandName;
            }
        }
    }

    if (client.commands.has(commandName)) {
        try {

            let command = client.commands.get(commandName);
            args = setArgsToDefault(command, args);

            //check for valid context (text channel, direct message)
            if ((!command.allowedContexts && message.channel.type !== "text") ||
                command.allowedContexts && !command.allowedContexts.includes(message.channel.type)) {

                await sendMessage("Sorry, I do not currently support this command in this context. Try sending "
                    + "the command via another method (direct message or in a channel).",
                    message.channel);
                return false;
            }

            //check for permissions
            if ((command.adminOnly && !isAdmin(message.author.id)) ||
                (command.superAdminOnly && !isSuperAdmin(message.author.id))) {
                await sendMessage("You do not have the authority to perform that function.", message.channel);
                return false;
            }

            //attempt to coerce args to their specified types
            let argTypeErrors;
            [args, argTypeErrors] = coerceArgsToTypes(command, args);
            if (argTypeErrors.length > 0) {
                const errors = argTypeErrors.join("\n");
                await sendMessage(errors, message.channel);
                return false;
            }

            //execute the command
            command.execute(message, args);
            return true;
        } catch (e) {
            await sendMessage(`There was an error running the command: ${e}`, message.channel);
        }
    } else {
        await sendMessage(
            `\`${commandName}\` is not a valid command. Type \`${CONFIG.PREFIX}help\` to get a list of commands.`,
            message.channel
        );
    }
}

/**
 * Gets all command .js files from /commands
 * @param client
 * @param dir
 * @param level
 */
function getCommands(client, dir, level = 0) {
    const current_dir = `${dir}/`;
    const commandFiles = fs.readdirSync(current_dir);

    for (const file of commandFiles) {
        if (fs.statSync(`${current_dir}${file}`).isDirectory()) {
            getCommands(client, `${current_dir}${file}`, level + 1);
        } else {
            if (file.endsWith(".js")) {
                const command = require(`${current_dir}${file}`);
                command.filePath = `${current_dir}${file}`;
                command.group = current_dir.split("/").splice(-2,1);

                if (command.aliases && !command.name) {
                    command.name = command.aliases.shift();
                }
                if (command.name) {
                    client.commands.set(command.name, command);
                }
                if (command.aliases) {
                    for (let commandName of command.aliases) {
                        client.commands.set(commandName, command);
                    }
                }
            }
        }
    }
}

/**
 * Gets all listener .js files from /listeners
 * @param client
 * @param dir
 * @param level
 */
function getListenerSet(client, dir, level = 0) {
    const current_dir = `${dir}/`;
    const listenerFiles = fs.readdirSync(current_dir);

    for (const file of listenerFiles) {
        if (fs.statSync(`${current_dir}${file}`).isDirectory()) {
            getListenerSet(client, `${current_dir}${file}`, level + 1);
        } else {
            if (file.endsWith(".js")) {
                const listener = require(`${current_dir}${file}`);
                client.listenerSet.set(listener.name, listener);
            }
        }
    }
}

/**
 * Identifies "command" messages which must begin with CONFIG.prefix
 * @param message
 * @returns {boolean}
 */
function isCommand(message) {
    const check = new RegExp(`^${CONFIG.PREFIX}([^-+]+)`);
    return check.test(message.content);
}

/**
 * Returns an args array for the current command based on its default arg values
 *
 * @param command
 * @param args
 * @returns {[]}
 */
function setArgsToDefault(command, args) {
    if (command.params) {
        for (let i = 0; i < command.params.length; i++) {
            if (!(args[i]) && command.params[i].default && !command.params[i].optional) {
                if (Array.isArray(command.params[i].default)) {
                    args[i] = getRandomArrayMember(command.params[i].default);
                } else {
                    args[i] = command.params[i].default;
                }
            }
        }
    }
    return args;
}

/**
 * Attempts to coerce user input into the type expected by the command that will be executed.
 *
 * @param command - the command that we are going to attempt to execute
 * @param args - the arguments given by the user
 * @returns {(*|*[])[]} - returns an array with the first member being the coerced types and the second member being
 * an array of the errors that occurred, indexed to the argument the error occurred on.
 */
function coerceArgsToTypes(command, args) {
    let argTypeErrors = [];
    if (command.params) {
        for (let i = 0; i < command.params.length; i++) {
            if (command.params[i].type && args[i]) {
                const allowedTypes = command.params[i].type.split("|");
                let coercibleTypes = {
                    int: false,
                    string: false,
                    float: false,
                    boolean: false,
                    snowflake: false,
                };
                for (const currentAllowedType of allowedTypes) {
                    switch (currentAllowedType.toLowerCase()) {
                        case "integer":
                        case "int":
                            const intN = Number(args[i]);
                            if (!isNaN(parseInt(intN, 10))) {
                                args[i] = parseInt(intN, 10);
                                coercibleTypes.int = true;
                            }
                            break;
                        case "float":
                            const floatN = Number(args[i]);
                            if (!isNaN(floatN)) {
                                args[i] = parseFloat(floatN);
                                coercibleTypes.float = true;
                            }
                            break;
                        case "boolean":
                        case "bool":
                            if (args[i].toLowerCase() === "true" || args[i].toLowerCase() === "false") {
                                coercibleTypes.boolean = true;
                                switch (args[i]) {
                                    case "true":
                                        args[i] = true;
                                        break;
                                    case "false":
                                        args[i] = false;
                                        break;
                                }
                            }
                            break;
                        case "snowflake":
                            const re = /^\d{16,21}$/
                            const snowFlake = new RegExp(re);
                            coercibleTypes.snowflake = snowFlake.test(args[i]);
                            break;
                        case "string":
                        case "str":
                        default:
                            coercibleTypes.string = true;
                            break;
                    }
                }
                const isValidType = Object.values(coercibleTypes).some(element => element === true);
                if (!isValidType) {
                    argTypeErrors[i] = `Argument **${command.params[i].param}** could not be coerced to a ${command.params[i].type} value.`;
                }
            }
        }
    }
    return [args, argTypeErrors];
}


/**
 * Attempts to execute from the set of listeners on any given message that is not a command
 *
 * @param message
 */
async function parseWithListeners(message) {
    try {
        for (const listener of client.listenerSet.values()) {
            if (await listener.listen(message)) return;
        }
    } catch (e) {
        await sendMessage(`There was an error parsing listeners: ${e}`, message.channel);
    }
}

/**
 * parses arguments given inside of quotes.  Since user messages are normally split along spaces to get the args,
 * this allows users to enclose args in quotes and use the space character as part of the argument.
 *
 * @param args - the string containing the user arg input
 * @returns {string[]} -an array containing the args split on spaces but not including those in quotations
 */
function parseQuotedArgs(args) {
    //handling for quoted args
    //this regex matches the inside of single or double quotes, or single words.
    const re = /(?=["'])(?:"([^"\\]*(?:\\[\s\S][^"\\]*)*)"|'([^'\\]*(?:\\[\s\S][^'\\]*)*)')|([^\s]+)/;
    const argRe = new RegExp(re, "ig");

    const matchesArr = [...args.matchAll(argRe)];
    args = matchesArr.flatMap(a => a.slice(1, 4).filter(a => a !== undefined));
    return args;
}

catchUpOnMessages = async function() {
    const onlineStatusChannel = await client.channels.fetch(process.env.ONLINE_STATUS_CHANNEL_ID);
    const embed = new Discord.MessageEmbed()
        .setColor("#ff0000")
        .setTitle("Catching up on messages, please wait...");
    const catchupStatusMessage = await sendMessage(embed,
        onlineStatusChannel);
    messageCatchup(client).then(() =>
        catchupStatusMessage.delete()
    );
}

/**
 * catches up on all the messages that were missed while the bot was offline
 * @param client - the discord.js client object
 * @returns {Promise<void>}
 */
async function messageCatchup(client) {
    const channels = client.channels.cache.array();
    for (const channel of channels) {
        if (channel.type === "text") {
            await cacheMessages.execute(null, [channel.id, true, true], client);
        }
    }
}

/**
 * Attempts to set the bot's nickname in all the guilds it is joined to.
 *
 * @returns {Promise<void>}
 */
async function setNicknameAllGuilds() {
    let guildIds = client.guilds.cache.map(guild => guild.id);
    for (const guildId of guildIds) {
        await client.guilds.cache.get(guildId).me.setNickname(client.normalNickname);
    }
}

/**
 * Sends the "bot online" message to the channel defined in .env file
 * @returns {Promise<void>}
 */
async function sendOnlineStatusMessage() {
    const onlineStatusChannel = await client.channels.fetch(process.env.ONLINE_STATUS_CHANNEL_ID);

    mkdirRecursiveSync("./log/");
    touchFileSync("./log/gb.log");
    const lineFromFile = await readSingleLine("./log/gb.log");
    const nowTimeDate = moment().format("ddd, MMM DD YYYY h:mm:ss a [GMT]Z");
    logMessage(`${nowTimeDate} - Bot online. Sending Online Status message to ${onlineStatusChannel.name}(${onlineStatusChannel.id}).`, 3);
    let response = new Discord.MessageEmbed()
        .setAuthor(`${client.user.username}`, `${client.user.displayAvatarURL()}`)
        .setColor("#0dc858")
        .addField("\u200b",
            `${nowTimeDate}\n`
            + `Bot status: Online.\n`
            + `${lineFromFile}\n`
            + `Hostname: ${os.hostname()}`,
        );
    await sendMessage(response, onlineStatusChannel);
}

/**
 * sets the bots status to one of the defaults defined in set-bot-status.js
 * @returns {Promise<void>}
 */
async function setInitialBotStatus() {
    await client.user.setActivity(getRandomArrayMember(setBotStatus.params[0].default), {type: getRandomArrayMember(["STREAMING", "PLAYING"])});
}
