//imports

//module settings
const name = "ping";
const description = "this is a ping command";

//main
function execute(client, message) {
    message.channel.send('pong');
}

//module export
module.exports = {
    name: name,
    description: description,
    args: args,
    execute: execute,
}

//helper functions