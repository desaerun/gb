const mysql = require("mysql2/promise");
const db = require("../../config/db");
const pool = mysql.createPool({
    ...db,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
});

module.exports = {
    name: 'run-sql',
    description: 'Runs SQL queries directly',
    execute: async function (client, message, args) {
        //todo: make this exclusive to devs
        let query = args.join(" ");
        let rows, fields;
        try {
            [rows, fields] = await pool.query(query);
        } catch (e) {
            message.channel.send(`MySQL error: ${e}`);
            throw e;
        }
        for (let row of rows) {
            message.channel.send(`\`\`\`${row}\`\`\``);
        }
    }
}