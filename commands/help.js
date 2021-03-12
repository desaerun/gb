//imports
const Discord = require("discord.js");
const CONFIG = require("../config/config");
const fs = require("fs");
const path = require("path");
const {logMessage} = require("../tools/utils");
const {sendMessage} = require("../tools/sendMessage");

//module settings
const name = "help";
const description = "Prints a message telling users how to get a list of commands or help on a specific command.";
const params = [
    {
        param: "commandName",
        type: "string",
        description: "A string representing the name of the command you need help with",
    }
];

//main
const execute = async function (client, message, args) {
    if (args.length === 0) {
        try {
            await sendMessage(generateCommandList(client.commands), message.channel);
        } catch (e) {
            throw e;
        }
        return;
    }
    const helpWithCommand = args[0].match(/^-?([\w-_]+)$/)[1];
    if (client.commands.has(helpWithCommand)) {
        const embedMessage = getHelpMessage(client.commands.get(helpWithCommand));
        await sendMessage(embedMessage, message.channel);
    } else {
        await sendMessage(`The command \`${helpWithCommand}\` does not exist.  Type \`${CONFIG.PREFIX}${name}\` for a commands list.`, message.channel);
    }
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
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
    if (command.aliases) {
        let aliasList = [];
        for (const alias of command.aliases) {
            aliasList.push(`\`${alias}\``);
        }
        fields.push({
            name: "Aliases:",
            value: aliasList.join(" "),
        });
    }
    fields.push({
        name: "Description",
        value: command.description
    });
    let fullCommand = `${CONFIG.PREFIX}${command.name}`;
    if (command.params) {
        for (const currentArg of command.params) {
            logMessage(currentArg, 3);
            let optionalMod = (currentArg.optional) ? "?" : "";
            fullCommand += ` [${optionalMod}${currentArg.param}]`;

            let value = [];
            value.push(`**Type**: ${currentArg.type}`);
            value.push(`**Description**: ${currentArg.description}`);
            value.push("");
            if (currentArg.default) {
                if (Array.isArray(currentArg.default)) {
                    const defaultsList = currentArg.default.join("\n");
                    let modifiedDefaults = [];
                    if (defaultsList.length > 900) {
                        const defaultsSizeEach = 900 / currentArg.default.length;
                        for (const currentDefault of currentArg.default) {
                            if (currentDefault.length > defaultsSizeEach - 3) {
                                modifiedDefaults.push(currentDefault.substr(0, defaultsSizeEach - 3) + "...");
                            } else {
                                modifiedDefaults.push(currentDefault);
                            }
                        }
                    } else {
                        modifiedDefaults = currentArg.default;
                    }
                    value.push(`**Default randomized from the following**:`);
                    value.push(modifiedDefaults.join("\n\n"));
                } else {
                    value.push(`**Default**: ${currentArg.default}`);
                }
            } else {
                if (currentArg.optional) {
                    value.push(`**OPTIONAL**`);
                } else {
                    value.push(`No default value.`);
                }
            }
            fields.push({
                name: `\`${currentArg.param}\``,
                value: value.join("\n"),
            });
        }
    }
    if (command.helpText) {
        fields.push({
            name: "Information",
            value: command.helpText
        });
    }
    if (command.examples) {
        fields.push({
            name: "Examples:",
            value: command.examples.join("\n"),
        });
    }

    // return new Discord.MessageEmbed()
    //     .setTitle(`**${command.name}**`)
    //     .setDescription(`\`${fullCommand}\``)
    //     .addFields(fields);
    return new Discord.MessageEmbed({
        title: `**${command.name}**`,
        description: `\`${fullCommand}\``,
        fields: fields,
    });
}

function generateCommandList(clientCommands) {
    let dirPath = "./commands";

    let response = [];

    response.push("List of commands: ");

    //special case for the HELP file
    response.push(`${CONFIG.PREFIX}_${name}_: ${description}`);
    response.push(getCommandsText(dirPath, clientCommands));
    response.push("");
    response.push(`Type \`${CONFIG.PREFIX}${name} [command]\` for more detailed help information about specific commands.`);
    return response.join("\n");
}

function getCommandsText(dirPath, clientCommands, indentLevel = 0) {
    let commandsTextArr = [];
    const commandFiles = fs.readdirSync(dirPath);
    for (const item of commandFiles) {
        const fullItemName = `${dirPath}/${item}`;
        if (fs.statSync(fullItemName).isDirectory()) {
            const prettyDirName = uppercaseFirstLetter(item.replace("_", " "));
            commandsTextArr.push(`${indent(indentLevel)}**${prettyDirName}** commands:`);
            commandsTextArr.push(getCommandsText(fullItemName, clientCommands, indentLevel + 1));
        } else {
            if (item !== path.basename(__filename) && item.endsWith(".js")) {
                const commandName = item.match(/(.+)\.js/)[1];
                if (clientCommands.get(commandName)) {
                    let currentCommand = clientCommands.get(commandName);
                    commandsTextArr.push(`${indent(indentLevel)}\`${CONFIG.PREFIX}${currentCommand.name}\`: ${currentCommand.description}`);
                } else {
                    console.log(`${commandName} does not exist in client.commands`);
                }
            }
        }
    }
    return commandsTextArr.join("\n");
}

function uppercaseFirstLetter(str) {
    const words = str.split(" ");
    return words.map((word) => {
        return word[0].toUpperCase() + word.substring(1);
    }).join(" ");
}

function indent(level) {
    let indentString = "";
    for (let i = 0; i < level; i++) {
        indentString += "    ";
    }
    return indentString;
}