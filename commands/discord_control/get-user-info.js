module.exports = {
    name: 'get-user-info',
    description: "get info on a user",
    execute(client, message, args) {
        let user = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.member(message.author);
        message.channel.send(user);
    }
}