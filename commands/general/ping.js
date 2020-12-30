module.exports = {
    name: 'ping',
    description: "this is a ping command",
    execute(client, message) {
        message.channel.send('pong');
    }
}