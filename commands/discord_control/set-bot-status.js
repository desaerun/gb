module.exports = {
    name: 'set-bot-status',
    description: "sets the bot status",
    execute(client, message, args) {
        client.user.setActivity('with discord.js',{type: 'PLAYING'})
            .then(console.log())
            .catch(console.error);
    }
}