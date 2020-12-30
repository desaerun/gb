const Discord = require('discord.js');
const CONFIG = require('../config/config');

const fs = require('fs');

module.exports = {
    name: 'help',
    description: 'Prints a message telling users how to get a list of commands or help on a specific command.',
    args: [
        {
            param: 'commandName',
            type: 'string',
            description: 'A string representing the name of the command you need help with',
            required: false,
        }
    ],
    async execute(client, message, args) {
        if (args.length === 0) {
            let response = 'List of Commands:';

            function indent(level) {
                let indent_string = '';
                for (var i = 0; i < level; i++) {
                    indent_string += '    ';
                }
                return indent_string;
            }

            function listCommands(subdir_name = "", level = 0) {
                const full_current_dir = `./commands/${subdir_name}`;
                const command_files = fs.readdirSync(full_current_dir);
                if (CONFIG.verbosity >= 2) {
                    console.log(`Directory listing: ${command_files}`);
                }

                for (const file_name of command_files) {
                    if (CONFIG.verbosity >= 2) {
                        console.log(`full current dir: ${full_current_dir}`);
                        console.log(`current subdir: ${subdir_name}`);
                    }
                    if (file_name.endsWith('.js')) {
                        if (CONFIG.verbosity >= 2) {
                            console.log(`loading file:  ./${subdir_name}/${file_name}`);
                        }
                        if (file_name === 'help.js') {
                            response += `\n${indent(level)}${CONFIG.prefix}_${this.name}_: ${this.description}`;
                            continue;
                        }
                        const command = require(`./${subdir_name}/${file_name}`);
                        response += `\n${indent(level)}${CONFIG.prefix}_${command.name}_: ${command.description}`
                    } else if (fs.statSync(`${full_current_dir}/${file_name}`).isDirectory()) {
                        if (CONFIG.verbosity >= 2) {
                            console.log(`${indent(level)}Recursing into directory ${full_current_dir}${file_name}`);
                        }
                        response += (`\n${indent(level)}${file_name} commands:`).replace("_", " ");
                        listCommands(`${subdir_name}${file_name}`, level + 1);
                    }
                }
                return response;
            }

            message.channel.send(listCommands());
        }

        const helpWithCommand = args[0];

        if (client.commands.has(helpWithCommand)) {
            const embedMessage = getHelpMessage(client.commands.get(helpWithCommand));
            await message.channel.send(embedMessage);
        }
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
    fields.push({
        name: 'Description',
        value: command.description
    });
    let fullCommand = `${CONFIG.prefix}${command.name}`;
    if (command.args) {
        for (const currentArg of command.args) {
            console.log(currentArg);
            fullCommand += ` `;
            let optionalMod = !currentArg.required ? "?" : "";
            fullCommand += `[${optionalMod}${currentArg.param}]`;

            let value = `Type: ${currentArg.type}\n` +
                `Desc: ${currentArg.description}\n`;

            if (currentArg.default) {
                if (Array.isArray(currentArg.default)) {
                    value += `Default randomized from the following:\n${currentArg.default.join('\n')}`;
                } else {
                    value += `Default: ${currentArg.default}`;
                }
            } else {
                if (currentArg.required) {
                    value += `**REQUIRED**`;
                } else {
                    value += `No default value`;
                }
            }

            fields.push({
                name: `${currentArg.param}`,
                value: value
            });
        }
    }
    if (command.helpText) {
        fields.push({
            name: 'Information',
            value: command.helpText
        });
    }

    return new Discord.MessageEmbed()
        .setTitle(`**${command.name}**`)
        .setDescription(`\`${fullCommand}\``)
        .addFields(fields);
}