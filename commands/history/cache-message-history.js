let moment = require("moment");
let mysqlQuery = require("../../config/mysql-query");

module.exports = {
    name: 'cache-message-history',
    description: "Retrieves message history for the current channel and stores it to the DB",
    execute: async function (client, message, args) {
        let guild_id = message.guild.id;
        let guild_name = message.guild.name;
        let channel_id = message.channel.id;
        let channel_name = message.channel.name;
        mysqlQuery(`INSERT INTO guilds (id,name) VALUES ("${guild_id}","${guild_name}")`);
        mysqlQuery(`INSERT INTO channels (id,name) VALUES ("${channel_id}","${channel_name}")`);
        let messageCount = 0;
        console.log(`Retrieving list of messages...`);

        let messages = await message.channel.messages.fetch({limit: 100});
        message.channel.send(`\`\`\`${messages[0]}\`\`\``);

        while (messages.size === 100) {
            messageCount += messages.size;
            let last = messages.last().id;

            for (let historical_message of messages.values()) {
                //todo: fix this datetime (it is like 4 years early?)
                let message_timestamp = (historical_message.id >> 22) + 1420070400000;

                let message_id = historical_message.id;
                let guild_id = historical_message.guild.id;
                let author_id = historical_message.author.id;
                let author_nickname = historical_message.author.nickname;
                let message_content = historical_message.content;

                console.log(`Adding message to db: ${message_id}`);
                console.log(`Message Timestamp: ${moment(message_timestamp).format("LLLL")}`);
                console.log(`Guild ID: ${author_id}`);
                console.log(`Author ID: ${author_id}`);
                console.log(`Author Nick: ${author_nickname}`);
                console.log(`Message content: ${message_content}`);

                mysqlQuery(`INSERT INTO messages (id,author,guild,channel,content,timestamp) VALUES ("${message_id}","${author_id}","${guild_id}","${channel_id}","${message_content}","${message_timestamp}")`);
                mysqlQuery(`INSERT INTO "users" (id,current_nickname) VALUES ("${author_id}","${author_nickname}")`);
            }

            messages = await message.channel.messages.fetch({limit: 100, before: last});
            message.channel.send(`\`\`\`${messages[0]}\`\`\``);
        }

        messageCount += messages.size;

        message.channel.send(`There have been ${messageCount} messages sent in this channel.`);
    }
}