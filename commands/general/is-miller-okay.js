//imports

//module settings
const name = "is-miller-okay";
const description = "Reports on Miller's status";

//main
function execute(client, message) {
    message.channel.send('Yes');
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions