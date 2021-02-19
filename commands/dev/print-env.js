//imports
const {sendMessage} = require("../../tools/utils");


//module settings
const name = "print-env";
const description = "prints environment variables"

//main
async function execute(client, message) {
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
}

//helper functions