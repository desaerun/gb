module.exports = {
    name: 'delete-message',
    description: "deletes a message",
    args: [
        {
            name: 'messageID',
            description: 'the ID of the message',
            type: 'Snowflake',
            default: '[REQUIRED]',
        }
    ],
    async execute(client, message, args) {
        if (args.length !== 1) {
            message.channel.send("You must provide the message ID.")
            return false;
        }
        let messageID = args[0];
        let targetMessage;
        try {
            targetMessage = await client.channels.cache.get(message.channel.id).messages.fetch(messageID);
            targetMessage.delete();
        } catch (e) {
            throw e;
        } finally {
            message.channel.send(`Message ${messageID} in channel ${targetMessage.channel.name} deleted.`)
        }
    }
}