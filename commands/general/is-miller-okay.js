//imports
const {sendMessage} = require("../../tools/sendMessage");

//module settings
const name = "is-miller-okay";
const description = "Reports on Miller's status";

//main
const execute = async function (client, message) {
    await sendMessage(`Yes`, message.channel);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions