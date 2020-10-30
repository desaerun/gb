const Discord = require('discord.js');
const client = new Discord.Client();

const fs = require('fs');
const CONFIG = require('./config');
let prefix = CONFIG.prefix;

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    client.commands.set(command.name,command);
}

client.once('ready',() => {
    console.log("bot online.");
});

client.on('message',message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    if (client.commands.has(command)) {
        try {
            client.commands.get(command).execute(message, args);
        } catch (err) {
            console.log(err);
            message.channel.send("There was an error executing that command.");
        }
    } else {
        message.channel.send(`_${command}_ is not a valid command`);
    }
});

client.login('NzcxNzQ5MTQxNDkwNTY1MTMw.X5wpZQ.nzDZDEO8SmpXKgYT_qilCEeTBlQ');