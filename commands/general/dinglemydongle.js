module.exports = {
    name: 'dinglemydongle',
    description: "dingles your dongle",
    execute(client, message, args) {
        message.channel.send(`**${client.user.username}** dingles **${message.author.username}**'s dongle.`);
    }
}