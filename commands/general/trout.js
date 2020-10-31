module.exports = {
    name: 'trout',
    description: "trout-slap command",
    execute(client, message, args) {
        message.channel.send(`**${message.author.username}** slaps **${args.join(' ')}** with a large trout.`);
    }
}