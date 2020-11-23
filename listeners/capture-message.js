const snowflakeToTimestamp = require("../config/snowflakeToTimestamp");

const mysql = require("mysql");
let mysqlQuery = require("../config/mysql-query");
let mysqlDB = mysqlQuery.db;
const conn = mysql.createConnection(mysqlDB);

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
        let author_values = {
            id: message.author.id,
            displayName: message.author.displayName,
        }
        let message_values = {
            id: message.id,
            author: author_values.id,
            guild: guild_values.id,
            channel: channel_values.id,
            content: message.content,
            timestamp: snowflakeToTimestamp(message.id),
        }
        conn.query("INSERT INTO guilds SET ? ON DUPLICATE UPDATE ?", [guild_values, guild_values], (error,result,fields) => {
            if (error) throw error;
            console.log("Successfully inserted Guild");
        })

        conn.query("INSERT INTO channels SET ? ON DUPLICATE UPDATE ?",[channel_values, channel_values], (error, result, fields) => {
            if (error) throw error;
            console.log("Successfully inserted Channel");
        })
        conn.query("INSERT INTO messages SET ? ON DUPLICATE UPDATE ?",[author_values, author_values], (error, result, fields) => {
            if (error) throw error;
            console.log("Successfully inserted author");
        })
        conn.query("INSERT INTO messages SET ? ON DUPLICATE UPDATE ?",[message_values, message_values], (error, result, fields) => {
            if (error) throw error;
            console.log("Successfully inserted message");
        })
        return false;
    }
}
