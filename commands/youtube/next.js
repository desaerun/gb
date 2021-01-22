//imports
const {playNextSong} = require("./play.js");

//module settings
const name = "next";
const description = "Plays the next song in the queue.";

//main
async function execute(client, message) {
    await playNextSong(message.channel,message.member.voice.channel);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions