const Discord = require('discord.js');

module.exports = {
    name: 'ping',
    description: "this is a ping command",
    execute(client, message) {
        let latency = Date.now() - message.createdTimestamp;

        let embedMessage = new Discord.MessageEmbed()
            .setThumbnail('https://cdn0.iconfinder.com/data/icons/sports-59/512/Table_tennis-256.png')
            .setTitle('Pong!')
            .addField({
                name: 'Latency',
                value: `${latency} ms`
            })
            .addField({
                name: 'API',
                value: `${client.ws.ping} ms`
            });

        message.channel.send(embedMessage);
    }
}