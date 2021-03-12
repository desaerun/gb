//imports
const {sendMessage} = require("../../tools/sendMessage");
const {isAdmin} = require("../../tools/utils");


//module settings
const name = "set-bot-status";
const description = "Sets the bot status";
const params = [
    {
        param: "status",
        type: "String",
        description: "The value to set as the bots status",
        default: [
            "eating chicken and grape drank",
            "UwUing",
            "since 2020",
            "your mother",
        ],
    }
];

//main
const execute = async function (client, message, args) {
    if (!isAdmin(message.member)) {
        await sendMessage("You do not have the authority to perform that function.");
        return false;
    }
    let arg_string = args.join(" ");
    await client.user.setActivity(arg_string, {type: "PLAYING"});
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
};

//helper functions
