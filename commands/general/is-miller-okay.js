//imports
const {sendMessage} = require("../../tools/sendMessage");

//module settings
const name = "is-miller-okay";
const description = "Reports on Miller's status";

//main
async function execute(client, message) {
    await sendMessage(`Yes`, message.channel);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions