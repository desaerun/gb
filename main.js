require("dotenv").config();  // pull in ENV variables from .env file
const CONFIG = require('./config/config');
const Discord = require('discord.js');
const client = new Discord.Client();

const captureMessage = require("./tools/captureMessage");

const mysqlQuery = require('./tools/mysqlQuery');

const dev_output = require('./dev_output');
dev_output.setClient(client);

const fs = require('fs');

client.commands = new Discord.Collection();
client.listenerSet = new Discord.Collection();

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

getCommands("./commands");

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

getListenerSet("./listeners");

client.once('ready', () => {
    console.log("bot online.");
    let guilds = client.guilds;

    let online_message  = `Bot status: Online.  Type: ${process.env.BUILD_ENV}\n`;

    //todo: read in first line from github_update.txt and add it to the "online" message
    //todo: make the linux server print a line about recovering to the github_update.txt file when it recovers or is started manually
    /*
    let lineReader = require('readline').createInterface({input: require('fs').createReadStream('github_update.txt')});
    online_message += ``
    */

    dev_output.sendStatus(online_message, process.env.ONLINE_STATUS_CHANNEL_ID,"#21a721");
    if (CONFIG.verbosity >= 3) {
        console.log(`Sending Online Status message to ${client.channels.cache.get(process.env.ONLINE_STATUS_CHANNEL_ID).name}(${process.env.ONLINE_STATUS_CHANNEL_ID}).`)
    }

    //set initial bot status
    client.user.setActivity('with fire', {type: 'PLAYING'})
        .then(() => console.log())
        .catch((err) => {
            dev_output.sendTrace(`Bot failed to set status: ${err}`, process.env.ONLINE_STATUS_CHANNEL_ID)
        });
});

client.on('message', message => {
    captureMessage(client,message);

    const args = message.content.slice(CONFIG.prefix.length).split(/ +/);

    // Ignore my own messages
    if (message.author.bot) return;

    // Attempt to parse commands
    if (isCommand(message)) {
        runCommands(message,args);
        // Otherwise pass to listeners
    } else {
        parseWithListeners(message);
    }
});

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
 */
function runCommands(message,args) {
    const command = args.shift().toLowerCase();
    const guild = client.guilds.fetch(message.guild.id);

    if (client.commands.has(command)) {
        try {
            client.commands.get(command).execute(client, message, args);
        } catch (err) {
            dev_output.sendTrace(err, CONFIG.channel_dev_id);
        }
    } else {
        message.channel.send(`_${command}_ is not a valid command`);
    }
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

client.login(process.env.BOT_TOKEN);