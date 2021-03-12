require("dotenv").config();  // pull in ENV variables from .env file
const CONFIG = require("./config/config");
const Discord = require("discord.js");
const fs = require("fs");
const os = require("os");
const moment = require("moment");
const cron = require("node-cron");

const {captureMessage, updateEditedMessage, deleteMessageFromDb} = require("./tools/message-db-utils");
const setBotStatus = require("./commands/bot_control/set-bot-status");
const {sendTrace} = require("./tools/devOutput");
const {logMessage, getRandomArrayMember} = require("./tools/utils");
const {generateUwuCombinations} = require("./tools/uwuify");
const {sendMessage} = require("./tools/sendMessage");


//main
global.uwuMode = false;
global.normalNickname = "asdf";

const client = new Discord.Client({partials: ["MESSAGE"]});

//exit handler
require("./tools/exitHandler").init(client);

client.commands = new Discord.Collection();
client.listenerSet = new Discord.Collection();

getCommands(client, "./commands");
getListenerSet(client, "./listeners");

client.once("ready", async () => {
    //set bot nickname in all guilds to its "normal" nickname
    normalNickname = client.user.username;
    await setNicknameAllGuilds(client, normalNickname);

    //send online message
    await sendOnlineMessage(client);

    //set initial bot status
    await setInitialActivity(client);

    //schedule crons
    // cron.schedule("* * * * *", () => {
    //     //todo: make command to add/remove guild/channel combos to historical messages cron
    //     //client.commands.get("random-message").execute(client,"","1 year ago",CONFIG.channel_primularies_id);
    // });
});

//handling for when messages are sent
client.on("message", incomingMessageHandler);
//handling for when messages are modified
client.on("messageUpdate", messageUpdateHandler);
//handling for when messages are deleted
client.on("messageDelete", messageDeleteHandler);
//handling for connection errors
client.on("shardError", shardErrorHandler);

client.login(process.env.BOT_TOKEN);


// HELPER FUNCTIONS

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
 * Searches client.commands for the parsed command, and executes if the command is valid
 * @param client
 * @param message
 * @param args
 */
async function runCommands(client, message, args) {
    let commandName = args.shift().toLowerCase();

    //support for uwu-ified command names
    if (uwuMode) {
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

            let argTypeErrors;
            [args, argTypeErrors] = coerceArgsToTypes(command, args);
            if (argTypeErrors.length > 0) {
                const errors = argTypeErrors.join("\n");
                await sendMessage(errors, message.channel);
                return false;
            }
            command.execute(client, message, args);

        } catch (err) {
            await sendTrace(client, err, CONFIG.CHANNEL_DEV_ID);
        }
    } else {
        await sendMessage(`\`${commandName}\` is not a valid command. Type \`${CONFIG.PREFIX}help\` to get a list of commands.`, message.channel);
    }
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

function coerceArgsToTypes(command, args) {
    let argTypeErrors = [];
    if (command.params) {
        for (let i = 0; i < command.params.length; i++) {
            if (command.params[i].type) {
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
 * @param client
 * @param message
 */
async function parseWithListeners(client, message) {
    try {
        for (const listener of client.listenerSet.values()) {
            if (await listener.listen(client, message)) return;
        }
    } catch (err) {
        await sendTrace(client, err, CONFIG.CHANNEL_DEV_ID);
    }
}


async function incomingMessageHandler(message) {
    //capture messages to DB
    if (message.channel.type === "text") {
        await captureMessage(client, message, true);
    } else if (message.channel.type === "dm") {
        if (message.author.bot) return;
        await sendMessage("Sorry, I do not currently support bot commands via Direct Message.", message.channel);
        return true;
    }

    // Ignore my own messages
    if (message.author.bot) return;

    let args = message.content.slice(CONFIG.PREFIX.length);
    args = parseQuotedArgs(args);

    // Attempt to parse commands
    if (isCommand(message)) {
        await runCommands(client, message, args);
        // Otherwise pass to listeners
    } else {
        await parseWithListeners(client, message);
    }
}

async function messageUpdateHandler(oldMessage, newMessage) {
    await updateEditedMessage(oldMessage, newMessage);
}

async function messageDeleteHandler(deletedMessage) {
    await deleteMessageFromDb(deletedMessage);
}

async function shardErrorHandler(error) {
    console.error("possible shard error was caught: ", error);
}

function parseQuotedArgs(args) {
    //handling for quoted args
    //this regex matches the inside of single or double quotes, or single words.
    const re = /(?=["'])(?:"([^"\\]*(?:\\[\s\S][^"\\]*)*)"|'([^'\\]*(?:\\[\s\S][^'\\]*)*)')|\b([^\s]+)\b/;
    const argRe = new RegExp(re, "ig");

    const matchesArr = [...args.matchAll(argRe)];
    args = matchesArr.flatMap(a => a.slice(1, 4).filter(a => a !== undefined));
    return args;
}

async function setNicknameAllGuilds(client, nickname) {
    let guildIds = client.guilds.cache.map(guild => guild.id);
    for (const guildId of guildIds) {
        await client.guilds.cache.get(guildId).me.setNickname(nickname);
    }
}

async function sendOnlineMessage(client) {
    const onlineStatusChannel = client.channels.cache.get(process.env.ONLINE_STATUS_CHANNEL_ID);
    //todo: read in first line from github_update.txt and add it to the "online" message
    //todo: make the linux server print a line about recovering to the github_update.txt file when it recovers or is started manually
    /*
    let lineReader = require("readline").createInterface({input: require("fs").createReadStream("github_update.txt")});
    online_message += ``
    */
    const nowTimeDate = moment().format("ddd, MMM DD YYYY h:mm:ss a [GMT]Z");
    logMessage(`${nowTimeDate} - Bot online. Sending Online Status message to ${onlineStatusChannel.name}(${onlineStatusChannel.id}).`, 3);
    let response = new Discord.MessageEmbed()
        .setAuthor(`${client.user.username}`, `${client.user.displayAvatarURL()}`)
        .setColor("#0dc858")
        .addFields({
            name: "Bot Message:",
            value: `${nowTimeDate}
                    Bot status: Online.
                    Hostname: ${os.hostname()}`,
        });
    await sendMessage(response, onlineStatusChannel);
}

async function setInitialActivity(client) {
    await client.user.setActivity(getRandomArrayMember(setBotStatus.params[0].default), {type: getRandomArrayMember(["STREAMING", "PLAYING"])});
}
