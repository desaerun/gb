//imports
const {sendMessage} = require("../../tools/sendMessage");

//module settings
const name = "trout";
const description = "trout-slap command";
const params = [
    {
        param: "name",
        type: "string",
        description: "Name of the person to be trout-slapped",
        default: "ur mum",
    }
];

//main
const execute = async function (client, message, args) {
    args[0] = args.length > 0 ? args[0] : params[0].default;
    await sendMessage(`**${message.author.username}** slaps **${args.join(" ")}** with a large trout.`, message.channel);
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
}

//helper functions