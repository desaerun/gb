let moment = require("moment");
let mysqlQuery = require("../../config/mysql-query");

module.exports = {
    name: 'cache-message-history',
    description: "Retrieves message history for the current channel and stores it to the DB",
    execute: async function (client, message, args) {

        let guild = {
            id: message.guild.id,
            name: message.guild.name,
        }
        let channel = {
            id: message.channel.id,
            name: message.channel.name,
        }
        try {
            mysqlQuery(`REPLACE INTO guilds SET ? ON DUPLIATE KEY UPDATE ?`,guild,(error,result,fields) => {
                if (error) throw error;
                console.log("successfully inserted guild");
            });
            mysqlQuery(`REPLACE INTO channels (id,guild,name) VALUES (?,?,?) ON DUPLIATE KEY UPDATE ?`,[channel.id,guild.id,channel.name],(error,result,fields) => {
                if (error) throw error;
                console.log("successfully inserted channel");
            });
        } catch (e) {
            console.log(`error while inserting query: ${e}`);
        }
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

                //insert into DB for author
                let author = {
                    id: historical_message.author.id,
                    nickname: historical_message.author.nickname,
                }
                mysqlQuery(`REPLACE INTO users SET ?`,author,(error,results,fields) => {
                    if (error) {
                        console.log("mysql insert of message failed");
                        throw error;
                    }
                    console.log("inserted message successfully");
                });

                //insert into DB for message
                let post = {
                    id: historical_message.id,
                    author: historical_message.author.id,
                    guild: guild.id,
                    channel: channel.id,
                    content: historical_message.content,
                    timestamp: message_timestamp,
                }

                //debug
                console.log(`Adding message to db: ${post.id}`);
                console.log(`Message Timestamp: ${moment(post.timestamp).format("LLLL")}`);
                console.log(`Guild ID: ${guild.id}`);
                console.log(`Author ID: ${author.id}`);
                console.log(`Author Nick: ${author.nickname}`);

                await mysqlQuery(`REPLACE INTO messages SET ?`,post,(error,results,fields) => {
                    if (error) {
                        console.log("mysql insert of message failed");
                        throw error;
                    }
                    console.log("inserted message successfully");
                });
            }

            messages = await message.channel.messages.fetch({limit: 100, before: last});
            message.channel.send(`\`\`\`${messages[0]}\`\`\``);
        }

        messageCount += messages.size;

        message.channel.send(`There have been ${messageCount} messages sent in this channel.`);
    }
}