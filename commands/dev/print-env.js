//imports
const {sendMessage} = require("../../tools/sendMessage");


//module settings
const name = "print-env";
const description = "prints environment variables"
const allowedContexts = [
    "text",
    "dm",
];
const adminOnly = true;

//main
const execute = async function (message) {
    await sendMessage(`
            \`\`\`DISCORD_KEY=${process.env.BOT_TOKEN}\`\`\`
            \`\`\`YOUTUBE_KEY=${process.env.YOUTUBE_TOKEN}\`\`\`
        `, message.channel);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
    allowedContexts: allowedContexts,
    adminOnly: adminOnly,
}

//helper functions