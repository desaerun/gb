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

/**
 * Prints a list of commands by recursing into the commands directory
 * and matching files with a .js extension
 *
 * @param subdir_name
 * @param level
 * @param response
 * @returns {String}
 */
/*
let response = 'List of Commands:'; //gross, a global var
function listCommands(subdir_name = "", level = 0) {
    const thisFile = path.basename(__filename);
    logMessage(`thisFile: ${thisFile}`,2);

    const full_current_dir = `./commands/${subdir_name}`;
    const command_files = fs.readdirSync(full_current_dir);
    logMessage(`Directory listing: ${command_files}`, 2);
    for (const file_name of command_files) {
        logMessage(`full current dir: ${full_current_dir}`, 2);
        logMessage(`current subdir: ${subdir_name}`, 2);
        if (file_name.endsWith('.js')) {
            logMessage(`loading file:  ./${subdir_name}/${file_name}`, 2);

            // special handling for printing the info of the HELP command:
            if (file_name === path.basename(__filename)) {
                response += `\n${indent(level)}${CONFIG.prefix}_${name}_: ${description}`;
                //don't keep going to actually load the file
                continue;
            }

            // otherwise, load the file to gain access to command.name etc.
            // const {name: commandName,description: commandDesc} = require(`./${subdir_name}/${file_name}`);
            const [commandName] = file_name.split(".");
            currentCommand = client.commands.get(commandName);
            logMessage(`command: ${currentCommand.name} | ${currentCommand.description}`,2);
            response += `\n${indent(level)}${CONFIG.prefix}_${currentCommand.name}_: ${currentCommand.description}`;
            logMessage(`current response: ${response}`,3);
        } else if (fs.statSync(`${full_current_dir}/${file_name}`).isDirectory()) {
            logMessage(`${indent(level)}Recursing into directory ${full_current_dir}${file_name}`, 2);
            //if we're looking at a directory, print the directory name,
            // recurse into that directory, and increase the indent level by 1
            response += (`\n${indent(level)}${file_name} commands:`).replace("_", " ");
            listCommands(`${subdir_name}${file_name}`, level + 1);
        }
    }
    console.log(`Full response: ${response}`);
    return response;
}
*/
function generateCommandList(clientCommands,subdirName = "",indentLevel= 0,response = "") {
    if (!response) {
        response = "List of commands:";
        response += `\n${indent(indentLevel)}${CONFIG.prefix}_${name}_: ${description}`;
    }
    const fullCurrentDir = `./commands${subdirName}`;
    logMessage(`fullCurrentDir: ${fullCurrentDir}`);
    const commandFiles = fs.readdirSync(fullCurrentDir);
    for (const commandFile of commandFiles) {
        const fullFilePath = `${fullCurrentDir}/${commandFile}`;
        logMessage(`fullFilePath: ${fullFilePath}`);
        if (fs.statSync(fullFilePath).isDirectory()) {
            const currentSubDir = `${subdirName}/${commandFile}`;
            logMessage(`Current Subdir: ${currentSubDir}`);
            const prettyDirName = commandFile.replace("_"," ");
            response += (`\n${indent(indentLevel)}${prettyDirName})`);
            response += generateCommandList(clientCommands,currentSubDir,indentLevel+1,response);
        } else if (commandFile !== path.basename(__filename) && commandFile.endsWith(".js")) {
            logMessage(`Loading file: ${fullFilePath}/${commandFile}`);
            const [currentCommand] = clientCommands.get(commandFile.split("."));
            response += `\n${indent(indentLevel)}${CONFIG.prefix}_${currentCommand.name}_: ${currentCommand.description}`;
        }
    }
    return response;
}


function indent(level) {
    let indent_string = '';
    for (let i = 0; i < level; i++) {
        indent_string += '    ';
    }
    return indent_string;
}