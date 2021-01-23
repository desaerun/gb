//imports

//module settings
const name = "test-embed-suppress";
const description = "tries sending a message that should have an embed, but suppresses it";

//main
async function execute(client, message) {
    const sentMessage = (await message.channel.send("http://google.com")).suppressEmbeds(true);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions