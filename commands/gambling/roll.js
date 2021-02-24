//imports
const {sendMessage} = require("../../tools/sendMessage");
const {getRandomInt} = require("../../tools/utils");

//module settings

//module settings
const name = "roll";
const aliases = ["dice", "dieroll", "die-roll", "diceroll", "dice-roll"];
const description = "Rolls a die.";
const params = [
    {
        param: "lower",
        type: "Integer",
        description: "Lower bounds of the roll.",
        default: 1,
        optional: true,
    },
    {
        param: "upper",
        type: "Integer",
        description: "Upper bounds of the roll.",
        default: 6,
    }
];

//main
async function execute(client, message, args) {
    let regularDie = false;
    if (!args || args.length < 2) {
        if (args.length === 1) {
            args[1] = args[0];
        } else {
            args[1] = params[1].default;
        }
        args[0] = params[0].default;
        regularDie = true;
    }
    const lower = Math.abs(args[0]);
    const upper = Math.abs(args[1]);
    const roll = getRandomInt(lower, upper);

    let response;
    if (regularDie) {
        response = `**${message.guild.me.displayName}** rolls a **${args[1]}-sided** die:  **${roll}**`;
    } else {
        response = `**${message.guild.me.displayName}** rolls between **${args[0]}** and **${args[1]}**:  **${roll}**`;
    }
    try {
        await sendMessage(response, message.channel);
    } catch (e) {
        throw e;
    }
    return roll;
}

//module export
module.exports = {
    name: name,
    aliases: aliases,
    description: description,
    params: params,
    execute: execute,
}

//helper functions