//imports
const Discord = require('discord.js');
const moment = require('moment');

//module settings
const name = "user-info";
const description = "Get info on a user";
const params = [
    {
        param: 'userID',
        type: 'Snowflake',
        description: 'A Snowflake representing a user ID',
        default: 'Message author',
        required: false,
    }
];

//main
function execute(client, message, args) {
    let user = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.member(message.author);
    const response = new Discord.MessageEmbed()
        // .setColor('#DAF7A6')
        .setColor('RANDOM')
        .setAuthor(`${user.user.tag}`, user.user.displayAvatarURL())
        .addFields({
                name: `User ping`,
                value: `<@${user.id}>`
            }
        )
        .addFields({
                name: `User ID`,
                value: `${user.id}`
            }
        )
        .addFields({
            name: `Joined server:`,
            value: moment(user.joinedAt).format('LLLL')
        })
        .addFields({
            name: `Joined Discord:`,
            value: moment(user.user.createdAt)
        })
        .addFields({
            name: `Online status:`,
            value: `${user.presence.status}`
        })
        .setFooter('Just another discord bot');

    message.channel.send(response);
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
}

//helper functions