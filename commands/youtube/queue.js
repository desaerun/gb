//imports
const {listQueue} = require("./play");

//module settings
const name = "queue";
const description = "Lists the songs in the queue.";

//main
const execute = async function (client, message) {
    await listQueue(message.channel);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions