require("dotenv").config();  // pull in ENV variables from .env file
const CONFIG = require("./config/config");
const Discord = require("discord.js");
const client = new Discord.Client({partials: ["MESSAGE"]});
//const snowflakeToTimestamp = require("./tools/snowflakeToTimestamp");

const cron = require("node-cron");

const captureMessage = require("./tools/message_db_tools/captureMessage");
const updateEditedMessage = require("./tools/message_db_tools/updateEditedMessage");
const deleteMessage = require("./tools/message_db_tools/deleteMessage");
const status = require("./commands/bot_control/set-bot-status.js");

const dev_output = require("./dev_output");
dev_output.setClient(client);

const fs = require("fs");
const logMessage = require("./tools/logMessage");
const sendLongMessage = require("./tools/sendLongMessage");
const {getRandomArrayMember} = require("./tools/utils");

client.commands = new Discord.Collection();
client.listenerSet = new Discord.Collection();

getCommands("./commands");
logMessage(JSON.stringify(client.commands));
getListenerSet("./listeners");

client.once("ready", () => {
    console.log("bot online.");
    //let guilds = client.guilds;

    //todo: read in first line from github_update.txt and add it to the "online" message
    //todo: make the linux server print a line about recovering to the github_update.txt file when it recovers or is started manually
    /*
    let lineReader = require("readline").createInterface({input: require("fs").createReadStream("github_update.txt")});
    online_message += ``
    */

    if (CONFIG.VERBOSITY >= 3) {
        console.log(`Bot online. Sending Online Status message to ${client.channels.cache.get(process.env.ONLINE_STATUS_CHANNEL_ID).name}(${process.env.ONLINE_STATUS_CHANNEL_ID}).`)
    }
    //todo: fix the bot timing out every 8 hours
    /*
    let online_message  = `Bot status: Online.  Type: ${process.env.BUILD_ENV}\n`;
    dev_output.sendStatus(online_message, process.env.ONLINE_STATUS_CHANNEL_ID,"#21a721");
     */

    //set initial bot status
    client.user.setActivity(status.params[0].default, {type: "PLAYING"})
        .then(() => console.log())
        .catch((err) => {
            dev_output.sendTrace(`Bot failed to set status: ${err}`, process.env.ONLINE_STATUS_CHANNEL_ID)
        });
    cron.schedule("* * * * *", () => {
        //todo: make command to add/remove guild/channel combos to historical messages cron
        //client.commands.get("random-message").execute(client,"","1 year ago",CONFIG.channel_primularies_id);
    })
});

//handling for when messages are sent
client.on("message", async message => {
    await captureMessage(client, message, true);

    const args = message.content.slice(CONFIG.PREFIX.length).split(/ +/);

    // Ignore my own messages
    if (message.author.bot) return;

    // Attempt to parse commands
    if (isCommand(message)) {
        await runCommands(message, args);
        // Otherwise pass to listeners
    } else {
        await parseWithListeners(message);
    }
});
client.on("messageUpdate", async (oldMessage, newMessage) => {
    console.log(`Message Edit triggered.`);
    await updateEditedMessage(oldMessage, newMessage);
});
client.on("messageDelete", async (deletedMessage) => {
    console.log(`Message Deletion triggered: ${JSON.stringify(deletedMessage)}`);
    await deleteMessage(deletedMessage);
});

/**
 * Gets all command .js files from /commands
 * @param dir
 * @param level
 */
function getCommands(dir, level = 0) {
    const current_dir = `${dir}/`;
    const commandFiles = fs.readdirSync(current_dir);

    for (const file of commandFiles) {
        if (fs.statSync(`${current_dir}${file}`).isDirectory()) {
            getCommands(`${current_dir}${file}`, level + 1);
        } else {
            if (file.endsWith(".js")) {
                const command = require(`${current_dir}${file}`);
                if (command.name) {
                    client.commands.set(command.name, command);
                }
                if (command.names) {
                    for (let commandName of command.names) {
                        client.commands.set(commandName, command);
                    }
                }
            }
        }
    }
}

/**
 * Gets all listener .js files from /listeners
 * @param dir
 * @param level
 */
function getListenerSet(dir, level = 0) {
    const current_dir = `${dir}/`;
    const listenerFiles = fs.readdirSync(current_dir);

    for (const file of listenerFiles) {
        if (fs.statSync(`${current_dir}${file}`).isDirectory()) {
            getListenerSet(`${current_dir}${file}`, level + 1);
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
    return message.content.match(check) !== null;
}

/**
 * Searches client.commands for the parsed command, and executes if the command is valid
 * @param message
 * @param args
 */
async function runCommands(message, args) {
    const commandName = args.shift().toLowerCase();

    if (client.commands.has(commandName)) {
        try {
            let command = client.commands.get(commandName);
            args = setArgsToDefault(command, args);

            let argTypeErrors = [];
            [args,argTypeErrors] = verifyArgTypes(command,args);
            if (argTypeErrors.length > 0) {
                const errors = argTypeErrors.join("\n");
                await sendLongMessage(errors,message.channel);
                return false;
            }
            command.execute(client, message, args);

        } catch (err) {
            dev_output.sendTrace(err, CONFIG.CHANNEL_DEV_ID);
        }
    } else {
        await message.channel.send(`_${commandName}_ is not a valid command. Type \`${CONFIG.PREFIX}help\` to get a list of commands.`);
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
            if (!(args[i]) && command.params[i].default) {
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

//todo: logic to verify arg types can be coerced from string to their required type
function verifyArgTypes(command,args) {
    let argTypeErrors = [];
    if (command.params) {
        for (let i = 0; i < command.params.length; i++) {
            if (command.params[i].type) {
                const allowedTypes = command.params[i].type.split("|");
                let coercibleTypes = {
                    int: false,
                    string: false,
                    float: false,
                    snowflake: false,
                };
                for (const currentAllowedType of allowedTypes) {
                    switch (currentAllowedType.toLowerCase()) {
                        case "integer":
                        case "int":
                            if (!isNaN(parseInt(args[i], 10))) {
                                args[i] = parseInt(args[i], 10);
                                coercibleTypes.int = true;
                            }
                            break;
                        case "float":
                            if (!isNaN(parseFloat(args[i]))) {
                                args[i] = parseFloat(args[i]);
                                coercibleTypes.float = true;
                            }
                            break;
                        case "snowflake":
                            const re = /^\d{16}$/
                            coercibleTypes.snowflake = args[i].test(re);
                            break;
                        case "string":
                        case "str":
                        default:
                            coercibleTypes.string = true;
                            break;
                    }
                }
                console.log(coercibleTypes);
                const isValidType = Object.values(coercibleTypes).some(element => element === true);
                if (!isValidType) {
                    argTypeErrors[i] = `Argument **${command.params[i].param}** could not be coerced to a ${command.params[i].type} value.`;
                }
            }
        }
    }
    return [args,argTypeErrors];
}

/**
 * Attempts to execute from the set of listeners on any given message that is not a command
 * @param message
 */
async function parseWithListeners(message) {
    try {
        for (const listener of client.listenerSet.values()) {
            if (await listener.listen(client, message)) return;
        }
    } catch (err) {
        dev_output.sendTrace(err, CONFIG.CHANNEL_DEV_ID);
    }
}

client.on("shardError", error => {
    console.error("possible shard error was caught: ", error);
});

client.login(process.env.BOT_TOKEN);