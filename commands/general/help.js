const Discord = require('discord.js');
const CONFIG = require('../../config/config');

const name = 'help';
const description = 'Prints a message telling users how to get a list of commands or help on a specific command.'
const args = [
    {
        param: 'commandName',
        type: 'string',
        description: 'A string representing the name of the command you need help with',
        default: false,
    }
];

async function execute(client, message, args) {

    if (args.length === 0) {
        message.channel.send('Welcome, groid! To get started, type `-commands` for a list of commands, or ' +
                                  'type `-help {commandName}` to get more information about a certain command.');
    }

    const helpWithCommand = args[0];

    if (client.commands.has(helpWithCommand)) {
        const embedMessage = getHelpMessage(client.commands.get(helpWithCommand));
        await message.channel.send(embedMessage);
    }
}

/**
 * Constructs a MessageEmbed object from member fields of the command,
 * including any custom helpText in order to relay helpful information about the
 * command to the relevant text channel.
 *
 * @param command
 * @returns {module:"discord.js".MessageEmbed}
 */
function getHelpMessage(command) {
    let fields = [];
    fields[0] = {
        name: 'Description',
        value: command.description
    };
    let fullCommand = `${CONFIG.prefix}${command.name}`;
    for (const currentArg of command.args) {

        fullCommand += ` `;
        let optionalMod = !currentArg.default ? "?" : "";
        fullCommand += `${optionalMod}[${currentArg.param}]`;

        let value = `Name: ${currentArg.param}\n` +
            `Type: ${currentArg.type}\n` +
            `Desc: ${currentArg.description}\n`;

        if (currentArg.default) {
            if (Array.isArray(currentArg.default)) {
                value += `Default randomized from the following:\n${currentArg.default.join('\n')}`;
            } else {
                value += `Default: ${currentArg.default}`;
            }
        } else {
            value += `**REQUIRED**`;
        }

        fields.push({
            name: `${currentArg.name}`,
            value: value
        });
    }
    if (command.helpText) {
        fields.push({
            name: 'Information',
            value: command.helpText
        });
    }
/*
    if (command.args) {
        for (let i = 1; i < command.args.length + 1; i++) {
            let arg = command.args[i - 1];

            let value = `Name: ${arg.param}\n` +
                `Type: ${arg.type}\n` +
                `Desc: ${arg.description}\n`;

            if (arg.default) {
                if (Array.isArray(arg.default)) {
                    value += `Default randomized from the following:\n${arg.default.join('\n')}`;
                } else {
                    value += `Default: ${arg.default}`;
                }
            } else {
                value += `Default: none`;
            }

            fields[i] = {
                name: `Arg #${i}`,
                value: value
            };
        }
    }
    if (command.helpText) {
        fields.push({
            name: 'Information',
            value: command.helpText
        });
    }
*/


    return new Discord.MessageEmbed()
        .setTitle(`**${command.name}**`)
        .setDescription(`\`${fullCommand}\``)
        .addFields(fields);
}

module.exports = {
    name: name,
    description: description,
    args: args,
    execute: execute
}