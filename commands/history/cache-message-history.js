let moment = require("moment");
let mysql = require('mysql');
let mysqlQuery = require("../../config/mysql-query");
let mysqlDB = mysqlQuery.db;
let conn = mysql.createConnection(mysqlDB);
conn.connect();

module.exports = {
    name: 'cache-message-history',
    description: "Retrieves message history for the current channel and stores it to the DB",
    execute: async function (client, message, args) {

        let guild = message.guild;
        let channel = message.channel;
        let guild_values = {
            id: message.guild.id,
            name: message.guild.name,
        }
        let channel_values = {
            id: channel.id,
            guild: guild_values.id,
            name: channel.name,
        }
        conn.query(`INSERT INTO guilds SET ? ON DUPLICATE KEY UPDATE ?`, [guild_values, guild_values], (error, result, fields) => {
            if (error) throw error;
            console.log("successfully inserted guild");
        });
        conn.query(`INSERT INTO channels SET ? ON DUPLICATE KEY UPDATE ?`, [channel_values, channel_values], (error, result, fields) => {
            if (error) throw error;
            console.log("successfully inserted channel");
        });
        let messageCount = 0;
        console.log(`Retrieving list of messages...`);

        let messages = await channel.messages.fetch({limit: 100});

        while (messages.size > 0) {
            messageCount += messages.size;
            let last = messages.last().id;

            for (let historical_message of messages.values()) {
                //todo: fix this datetime (it is like 4 years early?)
                const discord_epoch = 1420070400000
                const timestamp_64 = BigInt.asUintN(64,historical_message.id);
                let message_timestamp_bits = Number(timestamp_64 >> 22n);
                let message_timestamp = message_timestamp_bits + discord_epoch;

                //insert into DB for author
                let author = client.guilds.cache.get(guild_values.id).member(historical_message.author.id);
                let author_displayName = author ? author.displayName : "NULL";
                let author_values = {
                    id: historical_message.author.id,
                    displayName: author_displayName,
                }
                conn.query(`INSERT INTO users SET ? ON DUPLICATE KEY UPDATE ?`, [author_values, author_values], (error, results, fields) => {
                    if (error) {
                        console.log("mysql insert of user failed");
                        throw error;
                    }
                    console.log(`inserted user ${author_values.displayName}(${author_values.id}) successfully`);
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


                conn.query(`INSERT INTO messages SET ? ON DUPLICATE KEY UPDATE ?`, [post, post], (error, results, fields) => {
                    if (error) {
                        console.log("mysql insert of message failed");
                        throw error;
                    }
                    console.log(`Adding message to db: ${post.id}`);
                    console.log(`Message Timestamp: ${moment.utc(post.timestamp).format("MMMM Do YYYY, h:mm:ss a")}`);
                    console.log(`Guild ID: ${guild_values.id}`);
                    console.log(`Author ID: ${author_values.id}`);
                    console.log(`Author Display Name: ${author_values.displayName}`);
                    console.log(`inserted message ${post.id} successfully`);
                });
            }
            messages = await channel.messages.fetch({limit: 100, before: last});
        }

        messageCount += messages.size;

        message.reply(`There have been ${messageCount} messages sent in this channel.`);
        conn.query("SELECT COUNT(*) FROM `messages`",(err,result,fields) => {
            message.reply(`Updated mysql query successfully.  Rows: ${JSON.stringify(result)}`);
        });
    }
}