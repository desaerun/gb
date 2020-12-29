const name = 'help';
const description = 'Prints a message telling users how to get a list of commands or help on a specific command.'

async function execute(client, message) {
    message.channel.send('Welcome, groid! To get started, type _-commands_ for a list of commands, or ' +
                              'type _-{commandName} help_ to get more information about a certain command.');
}

module.exports = {
    name: name,
    description: description,
    execute: execute
}