module.exports = {
    name: 'get-user-info',
    description: "get info on a user",
    execute(client, message, args) {
        let user = message.mentions.members.first();
        message.channel.send(user);
    }
}