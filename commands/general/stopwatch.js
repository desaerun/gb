const prettyMilliseconds = require('pretty-ms');

const stopwatchMap = new Map();

module.exports = {
    name: 'stopwatch',
    description: 'Use -stopwatch {name} to time something! Once to start, again to stop.',
    args: [
        {
            param: '[stopwatchName]',
            type: 'string',
            description: 'A name for the thing being timed',
            // no default, as we'll print a list of active stopwatches
        }
    ],
    execute(client, message, args) {

        if (args.length === 0) {

            if (stopwatchMap.size === 0) {
                message.channel.send(`There are no active stopwatches running.`);
            } else {
                let response = '';
                for (let name of stopwatchMap.keys()) {
                    let endTime = new Date() - stopwatchMap.get(name);
                    response += `Stopwatch for **${name}** has been running for ${prettyMilliseconds(endTime)}\n`;
                }
                message.channel.send(response);
            }

            return;
        }

        let name = args.join(' ');

        if (stopwatchMap.has(name)) {
            let endTime = new Date() - stopwatchMap.get(name);
            stopwatchMap.delete(name);

            message.channel.send(`**${name}** took ${prettyMilliseconds(endTime)}`);
        } else {
            stopwatchMap.set(name, new Date());
            message.channel.send(`Started a timer for **${name}**!`);
        }
    }
}