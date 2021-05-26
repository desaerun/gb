//imports
const {skipSong} = require("./play.js");

//module settings
const name = "next";
const aliases = ["skip"];
const description = "Plays the next song in the queue.";
const allowedContexts = [
    "text",
    "dm",
];
const adminOnly = false;

//main
const execute = async function (message) {
    await skipSong(message.channel);
}

//module export
module.exports = {
    name: name,
    aliases: aliases,
    description: description,
    execute: execute,
    allowedContexts: allowedContexts,
    adminOnly: adminOnly,
}

//helper functions