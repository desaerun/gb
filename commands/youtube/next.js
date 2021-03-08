//imports
const {skipSong} = require("./play.js");

//module settings
const name = "next";
const names = ["skip"];
const description = "Plays the next song in the queue.";

//main
const execute = async function (client, message) {
    await skipSong(message.channel);
}

//module export
module.exports = {
    name: name,
    names: names,
    description: description,
    execute: execute,
}

//helper functions