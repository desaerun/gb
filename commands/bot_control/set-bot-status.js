module.exports = {
    name: 'set-bot-status',
    description: "sets the bot status",
    execute(client, message, args) {
        let arg_string = args.join(" ");
        client.user.setActivity(arg_string,{type: 'PLAYING'})
            .then(console.log())
            .catch(console.error);
    }
}