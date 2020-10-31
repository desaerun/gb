const CONFIG = require('./config/config');
const Discord = require('discord.js');
const client = new Discord.Client();
const {token} = require('./config/token');

const fs = require('fs');

client.commands = new Discord.Collection();

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

client.once('ready',() => {
    console.log("bot online.");
});

client.on('message',message => {
    if (!message.content.startsWith(CONFIG.prefix) || message.author.bot) return;

    const args = message.content.slice(CONFIG.prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    if (client.commands.has(command)) {
        try {
            client.commands.get(command).execute(client, message, args);
        } catch (err) {
            console.log(err);
            message.channel.send("There was an error executing that command.");
        }
    } else {
        message.channel.send(`_${command}_ is not a valid command`);
    }
});

client.login(token);