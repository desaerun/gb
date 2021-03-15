//imports
const {isAdmin} = require("../../tools/utils");
const {sendMessage} = require("../../tools/sendMessage");

//module settings
const name = "restart";
const description = "Restarts the bot.";
const params = [
    {
        param: "force",
        description: "forces the bot to restart rather than sending SIGTERM.",
        type: "String|Boolean",
        default: "",
        optional: true,
    }
];
const examples = [
    "-restart",
    "-restart force",
];

//main
const execute = async function (client, message, args) {
    if (!isAdmin(message.member)) {
        await sendMessage("You do not have the authority to perform that function.", message.channel);
        return false;
    }
    if (args[0] && (args[0].toLowerCase() === "force" || args[0] === "true")) {
        await sendMessage(`Killing bot process forcefully in 10 seconds.  Bot will restart.`, message.channel);
        setTimeout(() => {
            process.exit(2);
        }, 10000);
        return true;
    }
    await sendMessage(`Asking bot to restart nicely.`, message.channel);
    process.kill(process.pid, 'SIGTERM');
    return true;
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    examples: examples,
    execute: execute,
};

//helper functions
