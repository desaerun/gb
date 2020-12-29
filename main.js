require("dotenv").config();  // pull in ENV variables from .env file
const CONFIG = require('./config/config');
const Discord = require('discord.js');
const client = new Discord.Client({partials: ['MESSAGE']});
//const snowflakeToTimestamp = require("./tools/snowflakeToTimestamp");

const cron = require("node-cron");

const captureMessage = require("./tools/message_db_tools/captureMessage");
const updateEditedMessage = require("./tools/message_db_tools/updateEditedMessage");
const deleteMessage = require("./tools/message_db_tools/deleteMessage");
const status = require('./commands/bot_control/set-bot-status.js');

const dev_output = require('./dev_output');
dev_output.setClient(client);

const fs = require('fs');

client.commands = new Discord.Collection();
client.listenerSet = new Discord.Collection();

getCommands("./commands");
getListenerSet("./listeners");

client.once('ready', () => {
    console.log("bot online.");
    //let guilds = client.guilds;


    //todo: read in first line from github_update.txt and add it to the "online" message
    //todo: make the linux server print a line about recovering to the github_update.txt file when it recovers or is started manually
    /*
    let lineReader = require('readline').createInterface({input: require('fs').createReadStream('github_update.txt')});
    online_message += ``
    */

    if (CONFIG.verbosity >= 3) {
        console.log(`Bot online. Sending Online Status message to ${client.channels.cache.get(process.env.ONLINE_STATUS_CHANNEL_ID).name}(${process.env.ONLINE_STATUS_CHANNEL_ID}).`)
    }
    //todo: fix the bot timing out every 8 hours
    /*
    let online_message  = `Bot status: Online.  Type: ${process.env.BUILD_ENV}\n`;
    dev_output.sendStatus(online_message, process.env.ONLINE_STATUS_CHANNEL_ID,"#21a721");
     */

    //set initial bot status
    client.user.setActivity(status.args[0].default, {type: 'PLAYING'})
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
client.on('message', message => {
    captureMessage(client, message, true);

    const args = message.content.slice(CONFIG.prefix.length).split(/ +/);

    // Ignore my own messages
    if (message.author.bot) return;

    // Attempt to parse commands
    if (isCommand(message)) {
        runCommands(message, args);
        // Otherwise pass to listeners
    } else {
        parseWithListeners(message);
    }
});
client.on('messageUpdate', async (oldMessage, newMessage) => {
    console.log(`Message Edit triggered.`);
    await updateEditedMessage(oldMessage, newMessage);
});
client.on('messageDelete',async (deletedMessage) => {
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
            if (file.endsWith('.js')) {
                const command = require(`${current_dir}${file}`);
                client.commands.set(command.name, command);
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
            if (file.endsWith('.js')) {
                const listener = require(`${current_dir}${file}`);
                client.listenerSet.set(listener.name, listener);
            }
        }
    }
}

/**
 * Identifies 'command' messages which must begin with CONFIG.prefix
 * @param message
 * @returns {boolean}
 */
function isCommand(message) {
    return message.content.startsWith(CONFIG.prefix);
}

/**
 * Searches client.commands for the parsed command, and executes if the command is valid
 * @param message
 * @param args
 */
function runCommands(message, args) {
    const commandName = args.shift().toLowerCase();
    //const guild = client.guilds.fetch(message.guild.id);

    if (client.commands.has(commandName)) {
        try {
            let command = client.commands.get(commandName);
            // If there are fewer passed args than the required amount for the command, use defaults
            message.channel.send(`args before defaults: ${args}`);
            if (command.args && command.args.length > args.length) {
                args = [];
                for (let i = 0; i < command.args.length; i++) {
                    if (command.args[i].default) {
                        if (Array.isArray(command.args[i].default)) {
                            args[i] = getRand(command.args[i].default);
                        } else {
                            args[i] = command.args[i].default;
                        }
                    }
                }
            }
            message.channel.send(`args after defaults: ${args}`);
            command.execute(client, message, args);
        } catch (err) {
            dev_output.sendTrace(err, CONFIG.channel_dev_id);
        }
    } else {
        message.channel.send(`_${commandName}_ is not a valid command`);
    }
}

function getRand(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Attempts to execute from the set of listeners on any given message that is not a command
 * @param message
 */
function parseWithListeners(message) {
    try {
        for (const listener of client.listenerSet.values()) {
            if (listener.listen(client, message)) return;
        }
    } catch (err) {
        dev_output.sendTrace(err, CONFIG.channel_dev_id);
    }
}
client.on('shardError', error => {
    console.error("possible shard error was caught: ", error);
});

client.login(process.env.BOT_TOKEN);