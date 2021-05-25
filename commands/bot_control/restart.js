//imports
const {sendMessage} = require("../../tools/sendMessage");

//module settings
const name = "restart";
const description = "Restarts the bot.";
const params = [
    {
        param: "force",
        description: "forces the bot to restart gracefully rather than sending SIGTERM.",
        type: "String|Boolean",
        optional: true,
    }
];
const examples = [
    "",
    "force",
];

const allowedContexts = [
    "text",
    "dm",
];
const adminOnly = true;

//main
const execute = async function (message, args) {
    if (args[0] && (args[0].toLowerCase() === "force" || args[0] === "true")) {
        await sendMessage(`Killing bot process forcefully in 10 seconds.  Bot will attempt to restart.`, message.channel);
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
    allowedContexts: allowedContexts,
    adminOnly: adminOnly,
};

//helper functions
