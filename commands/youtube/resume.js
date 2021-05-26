//imports
const {resumePlaying} = require("./play");
const {sendMessage} = require("../../tools/sendMessage")

//module settings
const name = "resume";
const description = "Resumes playing from the top of the queue.";
const allowedContexts = [
    "text",
    "dm",
];
const adminOnly = false;

//main
const execute = async function (message) {
    if (!message.member.voice.channel) {
        await sendMessage(`You must be in a voice channel to use this command.`, message.channel);
        return false;
    }
    await resumePlaying(message.channel, message.member.voice.channel);
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