//imports

//module settings
const name = "remove-birk-as-primulary";
const description = "removes Birk as a primulary groid.  Only use in extreme circumstances.";

//main
function execute(client, message) {
    message.channel.send("Removing @Birk as a primulary groid.");
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions