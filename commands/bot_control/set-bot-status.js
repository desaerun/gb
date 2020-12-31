//imports


//module settings
const name = "set-bot-status";
const description = "Sets the bot status";
const args = [
    {
        param: 'status',
        type: 'String',
        description: 'The value to set as the bots status',
        default: 'eating chicken and grape drank',
        required: false,
    }
];

//main
function execute(client, message, args) {
    let arg_string = args.join(" ");
    client.user.setActivity(arg_string, {type: 'PLAYING'})
        .then(console.log())
        .catch(console.error);
}

//module export
module.exports = {
    name: name,
    description: description,
    args: args,
    execute: execute,
};

//helper functions
