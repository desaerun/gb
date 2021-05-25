//imports
const {uwuify} = require("../../tools/uwuify");
const {sendMessage} = require("../../tools/sendMessage");

//module settings
const name = "uwu-mode";
const description = "Toggles uwu-mode";
const params = [
    {
        param: "setting",
        type: String | Boolean,
    },
];
const allowedContexts = [
    "text",
    "dm",
];
const adminOnly = true;

//main
async function execute(message, args) {
    const client = message.client;
    let newNick;
    if (!args[0]) {
        client.uwuMode = !client.uwuMode;
    } else {
        switch (args[0]) {
            case "true":
            case true:
            case "yes":
            case "on":
            case "enable": {
                client.uwuMode = true;
                break;
            }
            case "false":
            case false:
            case "no":
            case "off":
            case "disable": {
                client.uwuMode = false;
                break;
            }
            default: {
                client.uwuMode = !client.uwuMode;
            }
        }
    }
    let onOff;
    if (client.uwuMode) {
        onOff = "on!";
        newNick = uwuify(message.guild.me.displayName);
    } else {
        onOff = "off.";
        newNick = client.normalNickname;
    }
    await message.guild.me.setNickname(newNick);

    await sendMessage(`uwu-mode turned ${onOff}`, message.channel);
    return true;
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
    allowedContexts: allowedContexts,
    adminOnly: adminOnly,
}

//helper functions