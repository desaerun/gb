//imports

//module settings
const name = "check-presence";
const description = "check the presences cache of current server";

//main
function execute(client, message) {
    let current_guild = message.guild;
    console.log(`current guild: ${current_guild}`);
    message.channel.send(`current_guild: \`\`${current_guild}\`\``);
    console.log(message.guild.presences);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions