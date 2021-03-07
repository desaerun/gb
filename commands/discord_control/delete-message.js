//imports
const {sendMessage} = require("../../tools/sendMessage");

//module settings
const name = "delete-message";
const description = "Deletes a message"
const params = [
    {
        name: "messageID",
        description: "the ID of the message",
        type: "Snowflake",
        //no default, a message ID _must_ be given
    }
];

//main
const execute = async function (client, message, args) {
    if (args.length !== 1) {
        await sendMessage(`You must provide the message ID.`, message.channel);
        return false;
    }
    let messageID = args[0];
    let targetMessage;
    try {
        // targetMessage = await client.channels.cache.get(message.channel.id).messages.fetch(messageID);
        targetMessage = await message.channel.messages.fetch(messageID);
        await targetMessage.delete();
    } catch (e) {
        throw e;
    } finally {
        await sendMessage(`Message ${messageID} in channel "${targetMessage.guild.name}".#${targetMessage.channel.name} deleted.`, message.channel);
    }
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
}

//helper functions