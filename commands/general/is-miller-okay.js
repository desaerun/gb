//imports
const {sendMessage} = require("../../tools/sendMessage");

//module settings
const name = "is-miller-okay";
const description = "Reports on Miller's status";
const allowedContexts = [
    "text",
    "dm",
];
const adminOnly = false;

//main
const execute = async function (message) {
    await sendMessage(`Yes`, message.channel);
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