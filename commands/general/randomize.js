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
    const text = args.join("");
    console.log(text);
    let choices = text.split(",");
    console.log(choices);
    choices.map((a) => a.trim);
    console.log(choices);
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