const mysql = require('mysql');
const CONFIG = require('./config');
const dev_output = require('../dev_output');

let sqlConnection = function sqlConnection(sql, values, next) {
    if (arguments.length === 2) {
        next = values;
        values = null;
    }
    let connection = mysql.createConnection(CONFIG.db);
    connection.connect(function(err) {
        if (err !== null) {
            console.log("[MYSQL] Error connecting to mysql:" + err+'\n');
            dev_output.sendTrace(`[MYSQL] Error connecting to mysql: ${err}`,CONFIG.channel_dev_id);
        }
    });

    connection.query(sql, values, function(err) {
        connection.end(); // close the connection
        if (err) {
            dev_output.sendTrace(err,CONFIG.channel_dev_id);
        }
        // Execute the callback
        next.apply(this, arguments);
    });
}

module.exports = sqlConnection;