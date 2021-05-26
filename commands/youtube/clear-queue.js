//imports
const {clearQueue} = require("./play.js");

//module settings
const name = "clear-queue";
const description = "Clears the song queue.";
const allowedContexts = [
    "text",
    "dm",
];
const adminOnly = false;

//main
const execute = async function (message) {
    await clearQueue(message.channel);
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