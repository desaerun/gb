//imports
const {getRandomArrayMember} = require("../../tools/utils");
//module settings
const name = "randomize";
const names = ["random","wandom","wandomize"];
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
    const trimmed = args.map((a) => a.trim());
    const text = trimmed.join("");
    const items = text.split(",");
    await message.channel.send(getRandomArrayMember(items));
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
    params: params,
}

//helper functions