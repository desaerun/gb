//imports
const Discord = require('discord.js');
const CONFIG = require('../config/config');
const fs = require('fs');
const path = require('path');
const logMessage = require("../tools/logMessage");

//module settings
const name = "help";
const description = "Prints a message telling users how to get a list of commands or help on a specific command.";
const args = [
    {
        param: 'commandName',
        type: 'string',
        description: 'A string representing the name of the command you need help with',
        required: false,
    }
];

//main
async function execute (client, message, args) {
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
    args: args,
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
    if (command.args) {
        for (const currentArg of command.args) {
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
    response += `\n${indent(indentLevel)}${CONFIG.prefix}_${name}_: ${description}`;

    function walk (dirPath,indentLevel = 0) {
        let commandsText = "";
        logMessage(`dirPath: ${dirPath}`);
        const commandFiles = fs.readdirSync(dirPath);
        for (const item of commandFiles) {
            const fullItemName = `${dirPath}/${item}`;
            logMessage(`fullItemName: ${fullItemName}`);
            if (fs.statSync(fullItemName).isDirectory()) {
                logMessage(`${fullItemName} is a directory, recursing`);
                const prettyDirName = uppercaseFirstLetter(item.replace("_", " "));
                commandsText += `\n${indent(indentLevel)}${prettyDirName} commands:`;
                commandsText += walk(fullItemName, indentLevel + 1);
            } else {
                if (item !== path.basename(__filename) && item.endsWith(".js")) {
                    logMessage(`${fullItemName} is a file, adding...`);
                    const commandName = item.match(/(.+)\.js/)[0];
                    const currentCommand = clientCommands.get(commandName);
                    commandsText += `\n${indent(indentLevel)}${CONFIG.prefix}_${currentCommand.name}_: ${currentCommand.description}`;
                } else {
                    logMessage(`file ${item} skipped:`);
                    logMessage(`path.basename(__filename): ${path.basename(__filename)}`);
                }
            }
        }
        return commandsText;
    }
    response += walk(dirPath);
    return response;
}
function uppercaseFirstLetter(str) {
    const words = str.split(" ");
    words.map((word) => {
        return word[0].toUpperCase() + word.substring(1);
    }).join(" ");
    return words;
}

function indent(level) {
    let indentString = '';
    for (let i = 0; i < level; i++) {
        indentString += '    ';
    }
    return indentString;
}