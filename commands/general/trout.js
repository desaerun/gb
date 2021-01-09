//imports

//module settings
const name = "trout";
const description = "trout-slap command";
const params = [
    {
        param: 'name',
        type: 'string',
        description: 'Name of the person to be trout-slapped',
        default: 'ur mum',
        required: false,
    }
];

//main
function execute(client, message, args) {
    args[0] = args.length > 0 ? args[0] : params[0].default;
    message.channel.send(`**${message.author.username}** slaps **${args.join(' ')}** with a large trout.`);
}

//module export
module.exports = {
    name: name,
    description: description,
    args: params,
    execute: execute,
}

//helper functions