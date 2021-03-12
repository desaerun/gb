//imports
const {sendMessage} = require("../../tools/sendMessage");

//module settings
const name = "check-presence";
const description = "check the presences cache of current server";

//main
const execute = async function (client, message) {
    let current_guild = message.guild;
    console.log(`current guild: ${current_guild}`);
    await sendMessage(`current_guild: \`\`${current_guild}\`\``, message.channel);
    console.log(message.guild.presences);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions