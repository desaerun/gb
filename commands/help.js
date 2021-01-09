//imports
const Discord = require('discord.js');
const CONFIG = require('../config/config');
const fs = require('fs');
const path = require('path');
const logMessage = require("../tools/logMessage");

//module settings
const name = "help";
const description = "Prints a message telling users how to get a list of commands or help on a specific command.";
const params = [
    {
        param: 'commandName',
        type: 'string',
        description: 'A string representing the name of the command you need help with',
        required: false,
    }
];

//main
async function execute(client, message, args) {
    if (args.length === 0) {
        message.channel.send(generateCommandList(client.commands));
        return;
    }

    const helpWithCommand = args[0];
    if (client.commands.has(helpWithCommand)) {
        const embedMessage = getHelpMessage(client.commands.get(helpWithCommand));
        await message.channel.send(embedMessage);
    } else {
        await message.channel.send(`The command \`${helpWithCommand}\` does not exist.  Type \`${CONFIG.prefix}${name}\` for a commands list.`);
    }
}

//module export
module.exports = {
    name: name,
    description: description,
    args: params,
    execute: execute,
}

//helper functions
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
    if (command.params) {
        for (const currentArg of command.params) {
            logMessage(currentArg, 3);
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

function generateCommandList(clientCommands) {
    let dirPath = "./commands";


    let response = "List of commands: ";
    //special case for the HELP file
    response += `\n${CONFIG.prefix}_${name}_: ${description}`;

    function getCommandsText(dirPath, clientCommands, indentLevel = 0) {
        let commandsText = "";
        const commandFiles = fs.readdirSync(dirPath);
        for (const item of commandFiles) {
            const fullItemName = `${dirPath}/${item}`;
            if (fs.statSync(fullItemName).isDirectory()) {
                logMessage(`${fullItemName} is a directory, recursing`);
                const prettyDirName = uppercaseFirstLetter(item.replace("_", " "));
                commandsText += `\n${indent(indentLevel)}${prettyDirName} commands:`;
                commandsText += getCommandsText(fullItemName, clientCommands, indentLevel + 1);
            } else {
                if (item !== path.basename(__filename) && item.endsWith(".js")) {
                    logMessage(`${fullItemName} is a file, adding...`);
                    const commandName = item.match(/(.+)\.js/)[1];
                    const currentCommand = clientCommands.get(commandName);
                    commandsText += `\n${indent(indentLevel)}${CONFIG.prefix}_${currentCommand.name}_: ${currentCommand.description}`;
                }
            }
        }
        return commandsText;
    }

    response += getCommandsText(dirPath, clientCommands);
    return response;
}

function uppercaseFirstLetter(str) {
    const words = str.split(" ");
    return words.map((word) => {
        return word[0].toUpperCase() + word.substring(1);
    }).join(" ");
}

function indent(level) {
    let indentString = '';
    for (let i = 0; i < level; i++) {
        indentString += '    ';
    }
    return indentString;
}