//imports
const {sendMessage} = require("../../tools/utils");

//module settings
const name = "dinglemydongle";
const description = "dingles your dongle";

//main
async function execute(client, message) {
    await sendMessage(`**${client.user.username}** dingles **${message.author.username}**'s dongle.`, message.channel);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions