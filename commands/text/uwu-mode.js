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

//main
async function execute(client, message, args) {
    let newNick;
    if (!args[0]) {
        uwuMode = !uwuMode;
    } else {
        switch (args[0]) {
            case "true":
            case true:
            case "yes":
            case "on":
            case "enable": {
                uwuMode = true;
                newNick = uwuify(message.guild.me.displayName);
                console.log(`new nick: ${newNick}`);
                break;
            }
            case "false":
            case false:
            case "no":
            case "off":
            case "disable": {
                uwuMode = false;
                newNick = normalNickname;
                console.log(`switching back to normal nick: ${normalNickname}`);
                break;
            }
            default: {
                uwuMode = !uwuMode;
            }
        }
    }
    const onOff = (uwuMode) ? "on!" : "off.";
    await message.guild.me.setNickname(newNick);
    await sendMessage(`uwu-mode turned ${onOff}`, message.channel);
    return uwuMode;
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
}

//helper functions