//imports

//module settings
const name = "roll";
const description = "Rolls a die.";
const params = [
    {
        param: 'lower',
        type: 'Integer',
        description: 'Lower bounds of the roll.',
        default: '1',
        required: false,
    },
    {
        param: 'upper',
        type: 'Integer',
        description: 'Upper bounds of the roll.',
        default: '6',
        required: false,
    }
];

//main
async function execute(client, message, args, coinFlip = false) {
    let regularDie = false;
    if (args.length > 1) {
        args[1] = args[0];
        args[0] = params[0].default;
        regularDie = true;
    }
    const lower = args[0];
    const upper = args[1];
    const rand = Math.random();
    const range = (upper+1)-lower;
    const result = rand*range+lower;
    const roll = Math.floor(rand*(range)+lower);
    console.log(`rand: ${rand} | range: ${range} | result: ${result} | floored: ${roll}`);

    let response = "";
    if (regularDie) {
        response = `**${client.user.username}** rolls a **${args[1]}-sided** die:  **${roll}**`;
    } else {
        response = `**${client.user.username}** rolls between **${args[0]}** and **${args[1]}**:  **${roll}**`;
    }
    if (coinFlip) {
        const side = (roll) ? "Heads" : "Tails";
        response = `**${client.user.username}** flips a coin. It's **${side}**!`;
    }
    try {
        await message.channel.send(response);
    } catch (e) {
        throw e;
    }
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
}

//helper functions