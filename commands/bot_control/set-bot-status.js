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
            "eating chicken and drinking grape drank",
            "UwUing",
            "since 2020",
            "your mother",
        ],
    }
];
const allowedContexts = [
    "text",
    "dm",
];
const adminOnly = true;


//main
const execute = async function (message, args) {
    let arg_string = args.join(" ");
    message.client.user.setActivity(arg_string, {type: "PLAYING"}).then(() => {});
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
    allowedContexts: allowedContexts,
    adminOnly: adminOnly,
};

//helper functions
