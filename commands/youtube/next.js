//imports
const {skipSong} = require("./play.js");

//module settings
const name = "next";
const description = "Plays the next song in the queue.";

//main
async function execute(client, message) {
    await skipSong(message.channel);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions