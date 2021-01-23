//imports

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
async function execute(client, message, args) {
    args[0] = args.length > 0 ? args[0] : params[0].default;
    await message.channel.send(`**${message.author.username}** slaps **${args.join(" ")}** with a large trout.`);
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
}

//helper functions