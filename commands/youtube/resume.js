//imports
const {playNextSong} = require("./play");
const {sendMessage} = require("../../tools/sendMessage")

//module settings
const name = "resume";
const description = "Resumes playing from the top of the queue.";

//main
const execute = async function (client, message, args) {
    if (!message.member.voice.channel) {
        await sendMessage(`You must be in a voice channel to use this command.`, message.channel);
        return false;
    }
    await playNextSong(message.channel, message.member.voice.channel);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions