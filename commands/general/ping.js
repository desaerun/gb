//imports
const Discord = require("discord.js");
const {sendMessage} = require("../../tools/sendMessage");

//module settings
const name = "ping";
const aliases = ["p"];
const description = "this is a ping command";

//main
async function execute(client, message) {
    let latency = Date.now() - message.createdTimestamp;

    let embedMessage = new Discord.MessageEmbed()
        .setThumbnail("https://cdn0.iconfinder.com/data/icons/sports-59/512/Table_tennis-256.png")
        .setTitle("Pong!")
        .addField("Latency", `${latency} ms`)
        .addField("API", `${client.ws.ping} ms`);

    await sendMessage(embedMessage, message.channel);
}

//module export
module.exports = {
    name: name,
    aliases: aliases,
    description: description,
    execute: execute,
}

//helper functions