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

function generateCommandList(clientCommands,dirPath = "./commands",response = "",indentLevel= 0) {
    //special case for the HELP file
    if (response === "") {
        response = "List of commands: ";
        response += `\n${indent(indentLevel)}${CONFIG.prefix}_${name}_: ${description}`;
    }
    logMessage(`dirPath: ${dirPath}`);
    const commandFiles = fs.readdirSync(dirPath);
    for (const item of commandFiles) {
        const fullItemName = `${dirPath}/${item}`;
        logMessage(`fullItemName: ${fullItemName}`);
        if (fs.statSync(fullItemName).isDirectory()) {
            logMessage(`${fullItemName} is a directory, recursing`);
            const prettyDirName = uppercaseFirstLetter(item.replace("_"," "));
            response = `\n${indent(indentLevel)}${prettyDirName} commands:` + generateCommandList(clientCommands,fullItemName,response,indentLevel+1);
        } else {
            if (item !== path.basename(__filename) && item.endsWith(".js")) {
                logMessage(`${fullItemName} is a file, adding...`);
                const commandName = item.split(".")[0];
                const currentCommand = clientCommands.get(commandName);
                response += `\n${indent(indentLevel)}${CONFIG.prefix}_${currentCommand.name}_: ${currentCommand.description}`;
            }
        }
    }
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
    let indent_string = '';
    for (let i = 0; i < level; i++) {
        indent_string += '    ';
    }
    return indent_string;
}