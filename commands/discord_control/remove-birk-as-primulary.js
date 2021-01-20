//imports
const CONFIG = require("../../config/config");

//module settings
const name = "remove-birk-as-primulary";
const description = "removes Birk as a primulary groid.  Only use in extreme circumstances.";

//main
async function execute(client, message) {
    await message.channel.send(`Removing <@${CONFIG.MEMBERS.BIRK.ID}> as a primulary groid.`);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions