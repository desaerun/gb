//imports
const roll = require("./commands/gambling/roll.js");

//module settings
const name = "coinflip";
const description = "Flips a coin.";

//main
async function execute(client, message, args) {
    await roll.execute(client,message,args,true);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions