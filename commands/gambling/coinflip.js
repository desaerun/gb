//imports
const {sendMessage} = require("../../tools/sendMessage");
const {getRand} = require("../../tools/utils");

//module settings
const name = "coinflip";
const description = "Flips a coin.";

//main
async function execute(client, message) {
    const roll = getRand(0, 2);
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