//imports
const roll = require("./roll");

//module settings
const name = "coinflip";
const description = "Flips a coin.";

//main
async function execute(client, message, args) {
    await roll.execute(client,message,[1,2],true);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions