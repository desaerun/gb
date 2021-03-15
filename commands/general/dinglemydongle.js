//imports
const {sendMessage} = require("../../tools/sendMessage");

//module settings
const name = "dinglemydongle";
const description = "dingles your dongle";

//main
const execute = async function (client, message) {
    await sendMessage(`**${client.user.username}** dingles **${message.author.username}**'s dongle.`, message.channel);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions