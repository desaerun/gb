//imports

//module settings
const name = "stop";
const description = "stops playing the current audio";

//main
function execute(client, message) {
    message.member.voice.channel.leave();
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions