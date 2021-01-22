//imports
const {stopPlaying} = require("./play");

//module settings
const name = "stop";
const description = "stops playing the current audio";

//main
function execute(client, message) {
    stopPlaying(message.channel);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions