module.exports = {
    name: 'trout',
    description: "trout-slap command",
    execute(message,args) {
        message.channel.send(`**${message.author.username}** slaps **${args[0]}** with a large trout.`);
    }
}