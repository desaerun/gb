module.exports = {
    name: 'set-bot-status',
    description: "sets the bot status",
    args: [
        {
            param: 'status',
            type: 'String',
            description: 'The value to set as the bots status',
            default: 'eating chicken and grape drank',
            required: false,
        }
    ],
    execute(client, message, args) {
        let arg_string = args.join(" ");
        client.user.setActivity(arg_string, {type: 'PLAYING'})
            .then(console.log())
            .catch(console.error);
    }
}