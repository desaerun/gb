module.exports = {
    name: 'get-message-history',
    description: "Retrieves message history for the current channel",
    execute: async function (client, message, args) {
        let messages = await message.channel.messages.fetchPinned();
        message.channel.send(`There are ${messages.size} pinned messages in this channel.`);
    }
}