//imports
const {sendMessage} = require("../../tools/sendMessage");
const {getRandomArrayMember} = require("../../tools/utils");

//module settings
const name = "randomize";
const aliases = ["random", "wandom", "wandomize"];
const description = "Selects a random item from given list.";
const params = [
    {
        param: "list",
        type: "String",
        default: "Red,Blue,Green",
    }
]

//main
async function execute(client, message, args) {
    const text = args.join(" ");
    let choices = text.split(",");
    choices.map((a) => a.trim);
    await sendMessage(getRandomArrayMember(choices), message.channel);
}

//module export
module.exports = {
    name: name,
    aliases: aliases,
    description: description,
    execute: execute,
    params: params,
};

//helper functions