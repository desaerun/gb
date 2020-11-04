let moment = require("moment");

module.exports = {
    name: 'cache-message-history',
    description: "Retrieves message history for the current channel and stores it to the DB",
    execute: async function (client, message, args) {
        let messageCount = 0;
        console.log(`Retrieving list of `)
        let messages = await message.channel.messages.fetch({limit: 100});
        message.channel.send(`\`\`\`${messages[0]}\`\`\``);

        while (messages.size === 100) {
            messageCount += messages.size;
            let last = messages.last().id;

            for (let historical_message of messages.values()) {
                //todo: fix this datetime (it is like 4 years early?)
                let datetime = (historical_message.id >> 22) + 1420070400000;
                console.log(`Message ID: ${historical_message.id}`);
                console.log(`Message Timestamp: ${moment(datetime).format("LLLL")}`);
                console.log(`Message content: ${historical_message.content}`);
            }

            messages = await message.channel.messages.fetch({limit:100, before: last});
            message.channel.send(`\`\`\`${messages[0]}\`\`\``);
        }

        messageCount += messages.size;

        message.channel.send(`There have been ${messageCount} messages sent in this channel.`);
    }
}