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
        type: "String",
        description: "A string representing the name of the command you need help with",
        optional: true,
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

            let paramText = [];
            paramText.push(currentArg.description);
            paramText.push("");

            // discord fields can only be 1024 chars long at most
            const paramTextRemainingLength = 1024 - paramText.join("\n").length;
            if (currentArg.default) {
                if (Array.isArray(currentArg.default)) {
                    const defaultsListLength = currentArg.default.join("\n\n").length;
                    let modifiedDefaults = [];
                    if (defaultsListLength > paramTextRemainingLength) {
                        const defaultsSizeEach = paramTextRemainingLength / currentArg.default.length;
                        for (const currentDefault of currentArg.default) {
                            //using JSON.stringify wraps Strings in quotes but leaves numbers alone
                            if (currentDefault.length > defaultsSizeEach - 5) {
                                modifiedDefaults.push(
                                    JSON.stringify(currentDefault.substr(0, defaultsSizeEach - 5) + "...")
                                );
                            } else {
                                modifiedDefaults.push(JSON.stringify(currentDefault));
                            }
                        }
                    } else {
                        modifiedDefaults = currentArg.default;
                    }
                    paramText.push(`**Default randomized from the following**:`);
                    paramText.push(modifiedDefaults.join("\n\n"));
                } else {
                    paramText.push(`**Default**: ${currentArg.default}`);
                }
            } else {
                if (currentArg.optional) {
                    paramText.push(`**OPTIONAL**`);
                } else {
                    paramText.push(`No default value.`);
                }
            }
            fields.push({
                name: `\`${currentArg.param}\` ${currentArg.type}`,
                value: paramText.join("\n"),
            });
        }
    }
    if (command.helpText) {
        fields.push({
            name: "Information",
            value: command.helpText,
        });
    }
    if (command.examples) {
        let wrappedExamples = [];
        //wrap the examples in backticks for Discord code formatting
        for (const example of command.examples) {
            wrappedExamples.push(`\`${example}\``);
        }
        fields.push({
            name: "Examples:",
            value: wrappedExamples.join("\n"),
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
    response.push(`\`${CONFIG.PREFIX}${name}\`: ${description}`);
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