//imports

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
async function execute(client, message, args) {
    if (args.length !== 1) {
        await message.channel.send(`You must provide the message ID.`)
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
        await message.channel.send(`Message ${messageID} in channel "${targetMessage.guild.name}".#${targetMessage.channel.name} deleted.`)
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