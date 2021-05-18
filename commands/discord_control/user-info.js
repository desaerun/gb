//imports
const Discord = require("discord.js");
const moment = require("moment");
const {sendMessage} = require("../../tools/sendMessage");

//module settings
const name = "user-info";
const description = "Get info on a user";
const params = [
    {
        param: "userID",
        type: "Snowflake|Mention",
        description: "A Snowflake representing a user ID",
        default: "Message author",
    }
];

//main
const execute = async function (client, message, args) {
    let user;
    if (args[0] === params[0].default) {
        user = message.author;
    } else {
        user = message.mentions.users.first() || await message.client.users.fetch(args[0]);
    }
    const response = new Discord.MessageEmbed()
        // .setColor("#DAF7A6")
        .setColor("RANDOM")
        .setAuthor(`${user.username}#${user.discriminator}`, user.displayAvatarURL())
        .addFields({
                name: `User ping`,
                value: `<@${user.id}>`
            },
            {
                name: `User ID`,
                value: `${user.id}`
            },
            {
                name: `Joined Discord:`,
                value: moment(user.createdAt)
            },
            {
                name: `Online status:`,
                value: `${user.presence.status}`
            })
        .setFooter("Just another discord bot");

    await sendMessage(response, message.channel);
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
}

//helper functions