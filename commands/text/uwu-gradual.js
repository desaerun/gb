//imports
const sendLongMessage = require("../../tools/sendLongMessage");
const uwu = require("./uwu");

//module settings
const name = "uwu-gradual";
const description = "Uwuifies text, but gradually.";
const params = [
    {
        param: "frequency",
        description: "Starting frequency to replace chars",
        type: "Float",
        default: .20,
    },
    {
        param: "text",
        description: "The text to uwu-ify gradually",
        type: "String",
        default: uwu.params[0].default,
    }
]

//main
async function execute(client, message, args) {
    if (args[0] > 1) {
        args[0] = args[0] / 100;
    } else if (isNaN(parseFloat(args[0]))) {
        args[0] = params[0].default;
    }
    const freq = args.shift();
    const text = args.join(" ");
    const uwuText = uwu.uwuify(args,freq);
    await sendLongMessage(uwuText,message.channel);
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
}

//helper functions