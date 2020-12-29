module.exports = {
    name: 'dinglemydongle',
    description: "dingles your dongle",
    execute(client, message) {
        message.channel.send(`**${client.user.username}** dingles **${message.author.username}**'s dongle.`);
    }
}