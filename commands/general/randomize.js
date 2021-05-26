//imports
const {sendMessage} = require("../../tools/sendMessage");
const {getRandomArrayMember} = require("../../tools/utils");

//module settings
const name = "randomize";
const aliases = [
    "random",
    "randomize"
];
const description = "Selects a random item from given list.";
const params = [
    {
        param: "list",
        description: "A comma-separated list of things to choose from",
        type: "String",
        default: "Red,Blue,Green",
    }
];
const examples = [
    "Blue, Yellow, Green",
    "Left 4 Dead 2, ARAM, RDO",
];
const allowedContexts = [
    "text",
    "dm",
];
const adminOnly = false;

//main
const execute = async function (message, args) {
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
    examples: examples,
    params: params,
    execute: execute,
    allowedContexts: allowedContexts,
    adminOnly: adminOnly,
};

//helper functions