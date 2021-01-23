//imports
const prettyMilliseconds = require("pretty-ms");

//globals
const stopwatchMap = new Map();

//module settings
const name = "stopwatch";
const description = "Use -stopwatch {name} to time something! Once to start, again to stop.";
const params = [
    {
        param: "stopwatchName",
        type: "string",
        description: "A name for the thing being timed",
        // no default, as we'll print a list of active stopwatches
    }
];
const helpText = "If this command is called with no arguments, a list of active stopwatches is printed.";

//main
async function execute(client, message, args) {

    if (args.length === 0) {

        if (stopwatchMap.size === 0) {
            await message.channel.send(`There are no active stopwatches running.`);
        } else {
            let response = "";
            for (let name of stopwatchMap.keys()) {
                let endTime = new Date() - stopwatchMap.get(name);
                response += `Stopwatch for **${name}** has been running for ${prettyMilliseconds(endTime)}\n`;
            }
            await message.channel.send(response);
        }

        return;
    }

    let name = args.join(" ");

    if (stopwatchMap.has(name)) {
        let endTime = new Date() - stopwatchMap.get(name);
        stopwatchMap.delete(name);

        await message.channel.send(`**${name}** took ${prettyMilliseconds(endTime)}`);
    } else {
        stopwatchMap.set(name, new Date());
        await message.channel.send(`Started a timer for **${name}**!`);
    }
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    helpText: helpText,
    execute: execute,
}

//helper functions