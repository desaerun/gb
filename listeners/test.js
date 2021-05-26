//imports
const {sendMessage} = require("../tools/sendMessage");

//module config
const name = "test";
const description = "test listener";

//main
async function listen(message) {
    const rEStr = /^[\s]*\btest\b[\s]*$/i;
    const rE = new RegExp(rEStr);
    if (rE.test(message.content)) {
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
