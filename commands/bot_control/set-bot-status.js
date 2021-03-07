//imports


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
