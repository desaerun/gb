const mysql = require('mysql');
const CONFIG = require('./config');
const dev_output = require('../dev_output');

//pull db info from .env file
const db = {
    host: process.env.DB_HOSTNAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_DB_NAME,
}

let sqlConnection = async function sqlConnection(sql, values, next) {
    console.log(`SQL: ${sql}`);
    console.log(`Values: ${values}`);
    if (arguments.length === 2) {
        next = values;
        values = null;
    }
    let connection = mysql.createConnection(db);
    connection.connect(function (err) {
        if (err !== null) {
            console.log("[MYSQL] Error connecting to mysql:" + err + '\n');
            dev_output.sendTrace(`[MYSQL] Error connecting to mysql: ${err}`, CONFIG.channel_dev_id);
        }
    });

    await connection.query(sql, values, function (err) {
        connection.end(); // close the connection
        if (err) {
            dev_output.sendTrace(err, CONFIG.channel_dev_id);
        }
        // Execute the callback
        next.apply(this, arguments);
    });
}

module.exports = sqlConnection;