//imports
const sendLongMessage = require("../../tools/sendLongMessage");
const {uwuify: uwuifyGradual} = require("./uwu");

//module settings
const name = "uwu-gradual";
const description = "Uwuifies text, but gradually.";
const params = [
    {
        param: "frequency",
        description: "Starting frequency to parse chars",
        type: "Float",
        default: .20,
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
    const uwuText = uwuifyGradual(args,freq);
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