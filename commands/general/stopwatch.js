//imports
const prettyMilliseconds = require("pretty-ms");
const {sendMessage} = require("../../tools/sendMessage");

//globals
const stopwatchMap = new Map();

//module settings
const name = "stopwatch";
const description = "Use -stopwatch {name} to time something! Once to start, again to stop.";
const params = [
    {
        param: "stopwatchName",
        type: "String",
        description: "A name for the thing being timed",
        optional: true,
        // no default, as we'll print a list of active stopwatches
    }
];
const helpText = "If this command is called with no arguments, a list of active stopwatches is printed.";

//main
const execute = async function (client, message, args) {

    if (args.length === 0) {

        if (stopwatchMap.size === 0) {
            await sendMessage(`There are no active stopwatches running.`, message.channel);
        } else {
            let response = "";
            for (let name of stopwatchMap.keys()) {
                let endTime = new Date() - stopwatchMap.get(name);
                response += `Stopwatch for **${name}** has been running for ${prettyMilliseconds(endTime)}\n`;
            }
            await sendMessage(response, message.channel);
        }

        return;
    }

    let name = args.join(" ");

    if (stopwatchMap.has(name)) {
        let endTime = new Date() - stopwatchMap.get(name);
        stopwatchMap.delete(name);

        await sendMessage(`**${name}** took ${prettyMilliseconds(endTime)}`, message.channel);
    } else {
        stopwatchMap.set(name, new Date());
        await sendMessage(`Started a timer for **${name}**!`, message.channel);
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