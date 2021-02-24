//imports
const {sendMessage} = require("../../tools/sendMessage");

//module settings
const name = "test-embed-suppress";
const description = "tries sending a message that should have an embed, but suppresses it";

//main
async function execute(client, message) {
    await sendMessage("https://google.com", message.channel, true);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions