//imports
const {stopPlaying} = require("./play");

//module settings
const name = "stop";
const description = "stops playing the current audio";

//main
const execute = async function (client, message) {
    await stopPlaying(message.channel);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions