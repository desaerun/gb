//imports

//module settings
const name = "dinglemydongle";
const description = "dingles your dongle";

//main
function execute(client, message) {
    message.channel.send(`**${client.user.username}** dingles **${message.author.username}**'s dongle.`);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions