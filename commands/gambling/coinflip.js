//imports
const {getRand} = require("../../tools/utils");

//module settings
const name = "coinflip";
const description = "Flips a coin.";

//main
async function execute(client, message) {
    const roll = getRand(0, 1);
    const side = (roll >= .5) ? "Heads" : "Tails";
    await message.channel.send(`**${client.user.username}** flips a coin. It's **${side}**!`);
    return true;
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions