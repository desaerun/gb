//imports
const {nowPlaying} = require("./play");

//module settings
const name = "now-playing";
const description = "Lists the currently playing song.";

//main
async function execute(client, message) {
    await nowPlaying(message.channel);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions