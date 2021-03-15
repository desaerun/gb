//imports
const {skipSong} = require("./play.js");

//module settings
const name = "next";
const aliases = ["skip"];
const description = "Plays the next song in the queue.";

//main
const execute = async function (client, message) {
    await skipSong(message.channel);
}

//module export
module.exports = {
    name: name,
    aliases: aliases,
    description: description,
    execute: execute,
}

//helper functions