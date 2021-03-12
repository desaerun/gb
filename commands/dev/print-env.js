//imports
const {isAdmin} = require("../../tools/utils");
const {sendMessage} = require("../../tools/sendMessage");


//module settings
const name = "print-env";
const description = "prints environment variables"

//main
const execute = async function (client, message) {
    if (!isAdmin(message.member)) {
        await sendMessage("You do not have the authority to perform that function.", message.channel);
        return false;
    }
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