//imports
const {nowPlaying} = require("./play");

//module settings
const name = "now-playing";
const description = "Lists the currently playing song.";

//main
const execute = async function (client, message) {
    await nowPlaying(message.channel);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions