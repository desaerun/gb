//imports
const {sendMessage} = require("../tools/utils");

//module config
const name = "test";
const description = "test listener";

//main
async function listen(client, message) {
    if (message.content.match(/^[\s]*\btest\b[\s]*$/i)) {
        await sendMessage(`this is an test listener response`, message.channel);
        return true;
    }
    return false;
}

//module export
module.exports = {
    name: name,
    description: description,
    listen: listen,
}

//helper functions
