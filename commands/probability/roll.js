//imports
const {sendMessage} = require("../../tools/sendMessage");
const {getRandomInt} = require("../../tools/utils");

//module settings

//module settings
const name = "roll";
const aliases = [
    "dice",
    "dieroll",
    "die-roll",
    "diceroll",
    "dice-roll"
];
const description = "Rolls a die.";
const params = [
    {
        param: "upper",
        type: "Integer",
        description: "Upper bounds of the roll.",
        default: 6,
    },
    {
        param: "lower",
        type: "Integer",
        description: "Lower bounds of the roll.",
        default: 1,
        optional: true,
    },
];
const allowedContexts = [
    "text",
    "dm",
];
const adminOnly = false;

//main
const execute = async function (message, args) {
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
    const upper = Math.abs(args[0]);
    const lower = Math.abs(args[1]);
    const roll = getRandomInt(lower, upper);

    let response;
    if (regularDie) {
        response = `**${message.guild.me.displayName}** rolls a **${upper}-sided** die:  **${roll}**`;
    } else {
        response = `**${message.guild.me.displayName}** rolls between **${Math.min(upper, lower)}** and **${Math.max(lower, upper)}**:  **${roll}**`;
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
    allowedContexts: allowedContexts,
    adminOnly: adminOnly,
}

//helper functions