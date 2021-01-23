//imports

//module settings
const name = "is-miller-okay";
const description = "Reports on Miller's status";

//main
async function execute(client, message) {
    await message.channel.send(`Yes`);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions