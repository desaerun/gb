//imports
const {clearQueue} = require("./play.js");

//module settings
const name = "clear-queue";
const description = "Clears the song queue.";

//main
const execute = async function (client, message) {
    await clearQueue(message.channel);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions