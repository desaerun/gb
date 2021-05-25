//imports
const {nowPlaying} = require("./play");

//module settings
const name = "now-playing";
const description = "Lists the currently playing song.";
const allowedContexts = [
    "text",
    "dm",
];
const adminOnly = false;

//main
const execute = async function (message) {
    await nowPlaying(message.channel);
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