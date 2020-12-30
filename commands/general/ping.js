module.exports = {
    name: 'ping',
    description: "this is a ping command",
    execute(client, message) {
        let latency = Date.now() - message.createdTimestamp;
        message.channel.send(`pong (${latency}ms/${client.ws.ping}ms)`);
    }
}