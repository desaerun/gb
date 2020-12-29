module.exports = {
    name: 'stop',
    description: "stops playing the current audio",
    execute(client, message) {
        message.member.voice.channel.leave();
    }
}