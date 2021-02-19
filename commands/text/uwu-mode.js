//imports
const {sendMessage} = require("../../tools/utils");

//module settings
const name = "uwu-mode";
const description = "Toggles uwu-mode";
const params = [
    {
        param: "setting",
        type: String|Boolean,
    },
];

//main
async function execute(client,message,args) {
    if (!args[0]) {
        uwuMode = !uwuMode;
        return;
    }
    switch (args[0]) {
        case "true":
        case true:
        case "yes":
        case "on":
            uwuMode = true;
            await sendMessage("uwu-mode turned on!", message.channel);
            break;
        case "false":
        case false:
        case "no":
        case "off":
            uwuMode = false;
            await sendMessage("uwu-mode turned off.", message.channel);

    }
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions