module.exports = {
    name: 'get-message-history',
    description: "Retrieves message history for the current channel",
    execute: async function (client, message, args) {
        let messageCount = 0;
        let messages = await message.channel.messages.fetch({limit: 100});

        while (messages.size === 100) {
            messageCount += messages.size;
            let last = messages.last().id;
            messages = await message.channel.messages.fetch({limit: 100, before: last});
            console.log(messages);
        }

        messageCount += messages.size;

        message.channel.send(`There have been ${messageCount} messages sent in this channel.`);
    }
}