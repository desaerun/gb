const snowflakeToTimestamp = require("./snowflakeToTimestamp");

//mysql
const mysql = require("mysql");
const db = require("../config/db");
const conn = mysql.createConnection(db);
conn.connect();


captureMessage = function (message, includeBotMessages = false) {
    conn.query("SELECT * FROM messages WHERE id = ?", message.id, (error, result, fields) => {
        if (result.length === 0) { // if message doesn't already exist in DB
            const author = message.guild.members.cache.get(message.author.id);
            if (!author) {
                console.log(`Author was not able to be fetched for message ${message.id}`);
                console.log(message);
            } else {
                if (!author.bot || includeBotMessages) {
                    let guild_values = {
                        id: message.guild.id,
                        name: message.guild.name,
                    }
                    let channel_values = {
                        id: message.channel.id,
                        guild: guild_values.id,
                        name: message.channel.name,
                    }
                    const author_displayName = author ? author.displayName : null;
                    const author_avatarURL = author ? author.avatarURL : null;
                    console.log(author);
                    let author_values = {
                        id: message.author.id,
                        guild: guild_values.id,
                        displayName: author_displayName,
                        avatarURL: author_avatarURL,
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
                    conn.query("INSERT INTO guilds SET ? ON DUPLICATE KEY UPDATE ?", [guild_values, guild_values], (error, result, fields) => {
                        if (error) throw error;
                        console.log(`Successfully inserted guild ${guild_values.id}`);
                    })

                    conn.query("INSERT INTO channels SET ? ON DUPLICATE KEY UPDATE ?", [channel_values, channel_values], (error, result, fields) => {
                        if (error) throw error;
                        console.log(`Successfully inserted channel ${channel_values.id}`);
                    })
                    conn.query("INSERT INTO users SET ? ON DUPLICATE KEY UPDATE ?", [author_values, author_values], (error, result, fields) => {
                        if (error) throw error;
                        console.log(`Successfully inserted author ${author_values.id}`);
                    })
                    conn.query("INSERT INTO messages SET ? ON DUPLICATE KEY UPDATE ?", [message_values, message_values], (error, result, fields) => {
                        if (error) throw error;
                        console.log(`Successfully inserted message ${message_values.id}`);
                    })
                    let i = 1;
                    for (let attachment of message.attachments) {
                        // console.log(`    Attachment ${i}: ${JSON.stringify(attachment)}`);
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
                } else {
                    console.log("Message was from a bot and includeBotMessages is false.");
                }
            }
        } else {
            console.log(`Message ${message.id} already exists in DB, skipping...`);
        }
    });
    return false;
}

module.exports = captureMessage;