module.exports = {
    name: 'trout',
    description: "trout-slap command",
    args: [
        {
            param: '[name]',
            type: 'string',
            description: 'Name of the person to be trout-slapped',
            default: 'ur mum'
        }
    ],
    execute(client, message, args) {
        message.channel.send(`**${message.author.username}** slaps **${args.join(' ')}** with a large trout.`);
    }
}