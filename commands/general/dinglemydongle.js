//imports
const {sendMessage} = require("../../tools/sendMessage");

//module settings
const name = "dinglemydongle";
const description = "dingles your dongle";
const allowedContexts = [
    "text",
    "dm",
];
const adminOnly = false;

//main
const execute = async function (message) {
    await sendMessage(`**${message.client.user.username}** dingles **${message.author.username}**'s dongle.`, message.channel);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
    allowedContexts: allowedContexts,
    adminOnly: adminOnly,
}

//helper functions