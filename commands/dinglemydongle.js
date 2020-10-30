module.exports = {
    name: 'dinglemydongle',
    description: "dingles your dongle",
    execute(message,args) {
        message.channel.send(`**${client.username}** dingles **${message.author.username}**'s dongle.`);
    }
}