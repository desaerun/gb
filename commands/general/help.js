const name = 'help';
const description = 'Prints a message telling users how to get a list of commands or help on a specific command.'

async function execute(client, message) {
    message.channel.send('Welcome, groid! To get started, type `-commands` for a list of commands, or ' +
                              'type `-{commandName} help` to get more information about a certain command.');
}

module.exports = {
    name: name,
    description: description,
    execute: execute
}