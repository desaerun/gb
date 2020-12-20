const snowflakeToTimestamp = require("./snowflakeToTimestamp");

//mysql
const mysql = require("mysql");
const db = require("../config/db");
const conn = mysql.createConnection(db);
conn.connect();


captureMessage = async function (client,message,includeBotMessages = false) {
    conn.query("SELECT * FROM messages WHERE id = ?", message.id, async (err, result, fields) => {
        if (err) throw err;
        if (result.length === 0) { // if message doesn't already exist in DB
            const author = await message.guild.members.cache.get(message.author.id);
            if (!author) {
                console.log(`Author was not able to be fetched for message ${message.id}`);
                console.log(message);
                return 4; // no author
            } else {
                //todo: save embedded messages11111111111111111
                // console.log(`Author: ${JSON.stringify(author)}`);
                if (!author.user.bot || includeBotMessages) {
                    let guild_values = {
                        id: message.guild.id,
                        name: message.guild.name,
                    }
                    let channel_values = {
                        id: message.channel.id,
                        guild: guild_values.id,
                        name: message.channel.name,
                    }
                    let author_values = {
                        id: message.author.id,
                        guild: guild_values.id,
                        displayName: author.displayName,
                        avatarURL: author.user.displayAvatarURL(),
                        isBot: author.user.bot,
                    }
                    let message_values = {
                        id: message.id,
                        author: author_values.id,
                        guild: guild_values.id,
                        channel: channel_values.id,
                        content: message.content,
                        timestamp: snowflakeToTimestamp(message.id),
                    }
                    /*
                    todo: make this log on high verbosity
                    console.log("Guild: " + JSON.stringify(message.guild) + "..." + JSON.stringify(guild_values));
                    console.log("Channel: " + JSON.stringify(message.channel) + "..." + JSON.stringify(channel_values));
                    console.log("Author: " + JSON.stringify(message.author) + "..." + JSON.stringify(author_values));
                    console.log("Cached Author:" + JSON.stringify(message.guild.members.cache.get(author_values.id)));
                    console.log("Message: " + JSON.stringify(message) + "..." + JSON.stringify(message_values));
                    console.log("Attachments: " + JSON.stringify(message.attachments));
                    */
                    conn.query("INSERT INTO guilds SET ? ON DUPLICATE KEY UPDATE ?", [guild_values, guild_values], (error) => {
                        if (error) throw error;
                        console.log(`Successfully inserted guild ${guild_values.id}`);
                    });

                    conn.query("INSERT INTO channels SET ? ON DUPLICATE KEY UPDATE ?", [channel_values, channel_values], (error) => {
                        if (error) throw error;
                        console.log(`Successfully inserted channel ${channel_values.id}`);
                    });
                    conn.query("INSERT INTO users SET ? ON DUPLICATE KEY UPDATE ?", [author_values, author_values], (error) => {
                        if (error) throw error;
                        console.log(`Successfully inserted author ${author_values.id}`);
                    });
                    conn.query("INSERT INTO messages SET ? ON DUPLICATE KEY UPDATE ?", [message_values, message_values], (error) => {
                        if (error) throw error;
                        console.log(`Successfully inserted message ${message_values.id}`);
                    });
                    let i = 1;
                    for (let attachment of message.attachments) {
                        const attachment_data = attachment[1];
                        let attachment_values = {
                            id: attachment_data.id,
                            message_id: message.id,
                            name: attachment_data.name,
                            url: attachment_data.url,
                            proxyURL: attachment_data.proxyURL,
                            size: attachment_data.size,
                            height: attachment_data.height,
                            width: attachment_data.width,
                            timestamp: snowflakeToTimestamp(attachment_data.id),
                        };
                        conn.query("INSERT INTO attachments SET ? ON DUPLICATE KEY UPDATE ?", [attachment_values, attachment_values], (error, result, fields) => {
                            if (error) throw error;
                            console.log(`Successfully inserted attachment ${attachment_values.id} (${i} of ${message.attachments.size})`);
                            i++;
                        });
                    }
                    return 1; // added
                } else {
                    console.log("Message was from a bot and includeBotMessages is false.");
                    return 3; // bot message
                }
            }
        } else {
            //todo: add case to add "edits" to show changes
            console.log(`Message ${message.id} already exists in DB, skipping...`);
            return 2; // skipped
        }
    });

}

module.exports = captureMessage;