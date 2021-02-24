//imports
const {getRandomInt} = require("../../tools/utils");
const {sendMessage} = require("../../tools/sendMessage");

//module settings
const name = "coinflip";
const description = "Flips a coin.";

//main
async function execute(client, message) {
    const roll = getRandomInt(0, 1);
    const side = (roll === 0) ? "Heads" : "Tails";
    await sendMessage(`**${message.guild.me.displayName}** flips a coin. It's **${side}**!`, message.channel);
    return true;
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions