//imports
const {getRandomArrayMember} = require("../../tools/utils.js");
const {setDeletedBy} = require("../../tools/message-db-utils");
const uwu = require("./uwu");

//module settings
const name = "uwu-gradual";
const description = "Uwuifies text, but gradually.";
const params = [
    {
        param: "frequency",
        description: "Starting frequency (in %) to replace chars",
        type: "Float",
        default: .08,
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
    if (!args[0] || (args[0] && isNaN(parseFloat(args[0])))) {
        args.unshift(params[0].default);
    } else if (args[0] >= 1) {
        args[0] = args[0] / 100;
    }
    if (!args[1]) {
        args[1] = getRandomArrayMember(params[1].default);
    }
    const freq = parseFloat(args.shift()); //shift the frequency amount off the beginning of the array
    const text = args.join(" ");
    const uwuText = uwu.uwuify(text, freq);
    await message.channel.send(uwuText);
    await setDeletedBy(message, "uwu");
    message.delete();
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
}

//helper functions