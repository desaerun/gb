module.exports = {
    name: 'get-message-history',
    description: "Retrieves message history for the current channel",
    execute: async function (client, message, args) {
        let messageCount = 0;

        let retrieveMessage = async () => {
            return await message.channel.messages.fetch({limit: 100});
        };

        let messages = retrieveMessage();

        while (messages.size === 100) {
            messageCount += messages.size;
            messages = retrieveMessage();
        }

        messageCount += messages.size;

        message.channel.send(`There have been ${messageCount} messages sent in this channel.`);
    }
}