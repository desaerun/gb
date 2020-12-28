const prettyMilliseconds = require('pretty-ms');

const stopwatchMap = new Map();

module.exports = {
    name: 'stopwatch',
    description: 'Use -stopwatch {name} to time something! Once to start, again to stop.',
    execute(client, message, args) {

        if (args.length < 1) {
            message.channel.send('What are you trying to time? Include a name for your stopwatch!');
            return;
        }

        let name = args.join(' ');

        if (stopwatchMap.has(name)) {
            let startTime = stopwatchMap.get(name);
            let endTime = new Date() - startTime;

            message.channel.send(`**${name}** took ${prettyMilliseconds(endTime)}`);
        } else {
            stopwatchMap.set(name, new Date());
            message.channel.send(`Started a timer for **${name}**!`);
        }
    }
}