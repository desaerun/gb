//imports

//module settings
const name = "dinglemydongle";
const description = "dingles your dongle";

//main
async function execute(client, message) {
    await message.channel.send(`**${client.user.username}** dingles **${message.author.username}**'s dongle.`);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions