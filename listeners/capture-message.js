const snowflakeToTimestamp = require("../tools/snowflakeToTimestamp");

//mysql
const mysql = require("mysql");
const db = require("../config/db");
const conn = mysql.createConnection(db);
conn.connect();

module.exports = {
    name: 'capture-message',
    description: 'Captures any message and puts it in the DB',
    listen(client, message) {
        let guild_values = {
            id: message.guild.id,
            name: message.guild.name,
        }
        let channel_values = {
            id: message.channel.id,
            guild: guild_values.id,
            name: message.channel.name,
        }
        const author_displayName = message.guild.members.cache.get(author_values.id).displayName;
        let author_values = {
            id: message.author.id,
            guild: guild_values.id,
            displayName: author_displayName,
        }
        let message_values = {
            id: message.id,
            author: author_values.id,
            guild: guild_values.id,
            channel: channel_values.id,
            content: message.content,
            timestamp: snowflakeToTimestamp(message.id),
        }


        console.log("Guild: " + JSON.stringify(message.guild) + "..." + JSON.stringify(guild_values));
        console.log("Channel: " +JSON.stringify(message.channel) + "..." + JSON.stringify(channel_values));
        console.log("Author: " +JSON.stringify(message.author) + "..." + JSON.stringify(author_values));
        console.log("Cached Author:" + JSON.stringify(message.guild.members.cache.get(author_values.id)));
        console.log("Message: " +JSON.stringify(message) + "..." + JSON.stringify(message_values));
        conn.query("INSERT INTO guilds SET ? ON DUPLICATE KEY UPDATE ?", [guild_values, guild_values], (error,result,fields) => {
            if (error) throw error;
            console.log("Successfully inserted Guild");
        })

        conn.query("INSERT INTO channels SET ? ON DUPLICATE KEY UPDATE ?",[channel_values, channel_values], (error, result, fields) => {
            if (error) throw error;
            console.log("Successfully inserted Channel");
        })
        conn.query("INSERT INTO users SET ? ON DUPLICATE KEY UPDATE ?",[author_values, author_values], (error, result, fields) => {
            if (error) throw error;
            console.log("Successfully inserted author");
        })
        conn.query("INSERT INTO messages SET ? ON DUPLICATE KEY UPDATE ?",[message_values, message_values], (error, result, fields) => {
            if (error) throw error;
            console.log("Successfully inserted message");
        })
        console.log("Attachments: " + JSON.stringify(message.attachments));
        /*
        for (let attachment in message.attachments) {
            let attachment_values = {
                id: attachment.id,
                url: attachment.
            }
        }
        */
        return false;
    }
}
