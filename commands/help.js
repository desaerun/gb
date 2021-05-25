//imports
const Discord = require("discord.js");
const CONFIG = require("../config/config");
const {isAdmin, isSuperAdmin, logMessage} = require("../tools/utils");
const {sendMessage} = require("../tools/sendMessage");

//module settings
const name = "help";
const description = "Prints a message telling users how to get a list of commands or help on a specific command.";
const params = [
    {
        param: "commandName",
        type: "String",
        description: "A string representing the name of the command you need help with.",
        optional: true,
    }
];
const allowedContexts = [
    "text",
    "dm",
];
const adminOnly = false;

//main
const execute = async function (message, args) {
    if (args.length === 0) {
        try {
            if (message.channel.type === "text") {
                await sendMessage("I have DM'ed you a list of commands, please check your messages.", message.channel);
            }
            await sendMessage(generateCommandList(message.client.commands, message), message.author);
        } catch (e) {
            throw e;
        }
        return true;
    }
    const helpWithCommand = args[0].match(/^-?([\w-_]+)$/)[1];
    if (message.client.commands.has(helpWithCommand)) {
        const command = message.client.commands.get(helpWithCommand);
        if (command.adminOnly && !await isAdmin(message.author.id) ||
            command.superAdminOnly && !await isSuperAdmin(message.author.id)
        ) {
            await sendMessage("You do not have permission to view details on that command.", message.channel);
            return true;
        }
        const helpMessage = getHelpMessage(command);
        await sendMessage(helpMessage, message.channel);
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
    allowedContexts: allowedContexts,
    adminOnly: adminOnly,
}

//helper functions
/**
 * Generates the list of commands and the help text message.
 *
 * @param clientCommands - the Collection of client commands
 * @param message
 * @returns {string} -  the string with all of the commands, their descriptions, and the rest of the help text message.
 */
function generateCommandList(clientCommands, message) {
    let commandListLines = [];
    commandListLines.push("List of commands: ");

    const commandsGrouped = {};
    const alreadyProcessed = ["help"];
    for (const command of [...clientCommands.values()]) {
        if (alreadyProcessed.includes(command.name)) {
            continue;
        }

        alreadyProcessed.push(command.name);

        if (
            (command.adminOnly && message.channel.type === "dm") ||
            (command.adminOnly && !isAdmin(message.author.id))
        ) {
            continue;
        }

        if (!commandsGrouped[command.group]) {
            commandsGrouped[command.group] = [];
        }
        commandsGrouped[command.group].push({
            name: command.name,
            description: command.description
        });
    }
    for (const [groupName, commands] of Object.entries(commandsGrouped)) {
        const prettyGroupName = uppercaseFirstLetter(groupName.replace("_", " "));
        commandListLines.push(`**${prettyGroupName}** commands:`);
        for (const command of commands) {
            commandListLines.push(`    \`${CONFIG.PREFIX}${command.name}\`: ${command.description}`);
        }
    }
    //special case for the HELP file
    commandListLines.push(`\`${CONFIG.PREFIX}${name}\`: ${description}`);
    commandListLines.push("");
    commandListLines.push(`Type \`${CONFIG.PREFIX}${name} [command]\` for more detailed help information about specific commands.`);
    return commandListLines.join("\n");
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
    if (command.aliases) {
        let aliasList = [];
        for (const alias of command.aliases) {
            aliasList.push(`\`-${alias}\``);
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
            wrappedExamples.push(`\`${CONFIG.PREFIX}${command.name} ${example}\``);
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

/**
 * Uppercases the first letter of each word in a string.
 *
 * @param str - the string
 * @returns {string}  - the string with the first letter of each word capitalized.
 */
function uppercaseFirstLetter(str) {
    const words = str.split(" ");
    return words.map((word) => {
        return word[0].toUpperCase() + word.substring(1);
    }).join(" ");
}