//imports

// mysql
const mysql = require("mysql2/promise");
const db = require("../../config/db");
const pool = mysql.createPool({
    ...db,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
});

//module settings
const name = "run-sql";
const description = "Runs SQL queries directly";
const params = [
    {
        param: "query",
        type: "String",
        description: "An SQL query",
        default: "SELECT * FROM messages LIMIT 10",
    }
];

//main
async function execute(client, message, args) {
    //todo: make this exclusive to devs
    let query = args.join(" ");
    let rows;
    try {
        [rows] = await pool.query(query);
    } catch (e) {
        await message.channel.send(`MySQL error: ${e}`);
        throw e;
    }
    for (let row of rows) {
        await message.channel.send(`\`\`\`${JSON.stringify(row)}\`\`\``);
    }
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
}

//helper functions