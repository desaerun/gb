module.exports = {
    name: 'trout',
    description: "trout-slap command",
    args: [
        {
            param: 'name',
            type: 'string',
            description: 'Name of the person to be trout-slapped',
            default: 'ur mum',
            required: false,
        }
    ],
    execute(client, message, args) {
        args[0] = args.length > 0 ? args[0] : this.args[0].default;
        message.channel.send(`**${message.author.username}** slaps **${args.join(' ')}** with a large trout.`);
    }
}