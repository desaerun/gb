module.exports = {
    name: 'get-message-history',
    description: "Retrieves message history for the current channel",
    execute: async function (client, message, args) {
        let messages = await message.channel.messages.fetch({ limit: 1000 });
        message.channel.send(`There have been ${messages.size} messages sent in this channel.`);
    }
}