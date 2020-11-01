const CONFIG = require('./config/config');
const Discord = require('discord.js');
const client = new Discord.Client();
const {token} = require('./config/token');

const fs = require('fs');

client.commands = new Discord.Collection();
client.listenerSet = new Discord.Collection();

/**
 * Gets all command .js files from /commands
 * @param dir
 * @param level
 */
function getCommands(dir, level=0) {
    const current_dir = `${dir}/`;
    const commandFiles = fs.readdirSync(current_dir);

    for (const file of commandFiles) {
        if(fs.statSync(`${current_dir}${file}`).isDirectory()) {
            getCommands(`${current_dir}${file}`,level+1);
        } else {
            if (file.endsWith('.js')) {
                const command = require(`${current_dir}${file}`);
                client.commands.set(command.name,command);
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
function getListenerSet(dir, level=0) {
    const current_dir = `${dir}/`;
    const listenerFiles = fs.readdirSync(current_dir);

    for (const file of listenerFiles) {
        if (fs.statSync(`${current_dir}${file}`).isDirectory()) {
            getListenerSet(`${current_dir}${file}`, level+1);
        } else {
            if (file.endsWith('.js')) {
                const listener = require(`${current_dir}${file}`);
                client.listenerSet.set(listener.name, listener);
            }
        }
    }
}
getListenerSet("./listeners");

client.once('ready',() => {
    console.log("bot online.");
    let guilds = client.guilds;
    let guild_rageaholics = guilds.fetch('270271948527894541');
    let user_desaerun = client.users.cache.get('187048556643876864');
    let channel_code_shit = client.channels.cache.get('674824072126922753');

    let online_status_message = new Discord.MessageEmbed()
        .setColor('RANDOM')
        .setAuthor(`${client.user.username}`,`${client.user.displayAvatarURL()}`)
        .addFields({
            name: 'Bot status',
            value: 'Online'
        });

    console.log("Sending Online Status message to bot owner and #code-shit")
    user_desaerun.send(online_status_message);
    channel_code_shit.send(online_status_message);


    //set initial bot status
    client.user.setActivity('with fire',{type: 'PLAYING'})
        .then(console.log())
        .catch(console.error);

    /*
    const mysql = require('mysql');

    var connection = mysql.createConnection({
        host     : process.env.RDS_HOSTNAME,
        user     : process.env.RDS_USERNAME,
        password : process.env.RDS_PASSWORD,
        port     : process.env.RDS_PORT,
        database : process.env.RDS_DB_NAME
    });

    connection.connect(function(err) {
        if (err) {
            console.error('Database connection failed: ' + err.stack);
            return;
        }

        console.log('Connected to database.');
        console.log(connection.query("SELECT DATABASE()"));
    });
     */
});

client.on('message',message => {
    // Ignore my own messages
    if (message.author.bot) return;

    // Attempt to parse commands
    if (isCommand(message)) {
        runCommands(message);
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
function runCommands(message) {
    const args = message.content.slice(CONFIG.prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();
    const guild = client.guilds.fetch(message.guild.id);

    if (client.commands.has(command)) {
        try {
            client.commands.get(command).execute(client, message, args);
        } catch (err) {
            console.log(err);
            message.channel.send("There was an error executing that command:");
            const response = new Discord.MessageEmbed()
                .setColor('#DAF7A6')
                .addFields({
                    name: `Error`,
                    value: err
                })
            message.channel.send(response);
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
            console.log(`listener.name: ${listener.name}`);
            console.log(`listener.description: ${listener.description}`);
            if (listener.listen(client, message)) return;
        }
    } catch (err) {
        console.log(err);
    }
}

client.login(token);