//imports
const {sendMessage} = require("../../tools/sendMessage");
const {isAdmin} = require("../../tools/utils");

//module settings
const name = "throw-exception";
const description = "Throws a test exception";

//main
const execute = async function (client, message) {
    if (!isAdmin(message.member)) {
        await sendMessage("You do not have the authority to perform that function.");
        return false;
    }
    throw new Error("This is a test error");
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions