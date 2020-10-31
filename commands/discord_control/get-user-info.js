const moment = require('moment');

module.exports = {
    name: 'get-user-info',
    description: "get info on a user",
    execute(client, message, args) {
        let user = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.member(message.author);
        const response = Discord.MessageEmbed()
            .setColor('#DAF7A6')
            .setAuthor(`${user.user.tag}`,user.user.displayAvatarURL())
            .addFields({
                name: `User ping`,
                value: `<@${user.id}>`}
            )
            .addFields({
                name: `Joined server:`,
                value: moment(user.joinedAt).format('LLLL')
            })
            .addFields({
                name: `Joined Discord:`,
                value: moment(user.user.createdAt)
            })
            .setFooter('Just another discord bot');

        message.channel.send(response);
    }
}