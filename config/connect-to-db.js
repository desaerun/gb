const mysql = require('mysql');
const CONFIG = require('./config');
const dev_output = require('../dev_output');

module.exports = {
    db: async () => {
        const connection = mysql.createConnection({
            host: process.env.RDS_HOSTNAME,
            user: process.env.RDS_USERNAME,
            password: process.env.RDS_PASSWORD,
            port: process.env.RDS_PORT,
            database: process.env.RDS_DB_NAME
        });
        connection.connect(async (err) => {
            if (err) {
                dev_output.sendTrace(err,CONFIG.channel_dev_id)
                return false;
            }
            //log -- verbosity level 2
            if(CONFIG.verbosity >= 2) {
                console.log('Connected to database.');
            }
            let db_con = await connection;
            return db_con;
        });
    }
}