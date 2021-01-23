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
    const text = args.join();
    let choices = text.split(",");
    choices.map((a) => a.trim);
    await message.channel.send(getRandomArrayMember(choices));
}

//module export
module.exports = {
    name: name,
    names: names,
    description: description,
    execute: execute,
    params: params,
}

//helper functions