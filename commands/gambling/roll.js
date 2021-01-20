//imports

//module settings
const {getRand} = require("../../tools/utils");
const name = "roll";
const description = "Rolls a die.";
const params = [
    {
        param: "lower",
        type: "Integer",
        description: "Lower bounds of the roll.",
        default: 1,
        required: false,
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
    const roll = getRand(lower,upper);

    let response = "";
    if (regularDie) {
        response = `**${client.user.username}** rolls a **${args[1]}-sided** die:  **${roll}**`;
    } else {
        response = `**${client.user.username}** rolls between **${args[0]}** and **${args[1]}**:  **${roll}**`;
    }
    try {
        await message.channel.send(response);
    } catch (e) {
        throw e;
    }
    return roll;
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
}

//helper functions