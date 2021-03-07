//imports
const CONFIG = require("../../config/config");
const {sendMessage} = require("../../tools/sendMessage");

//module settings
const name = "remove-birk-as-primulary";
const description = "removes Birk as a primulary.  Only use in extreme circumstances.";

//main
const execute = async function (client, message) {
    await sendMessage(`Removing <@${CONFIG.MEMBERS.BIRK.ID}> as a primulary.`, message.channel);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions