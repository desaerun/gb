const mysqlQuery = require('../../config/mysql-query');
module.exports = {
    name: 'clear-message-history',
    description: "Clears all message history from db",
    execute: async function (client, message, args) {
        await mysqlQuery.sqlConnection("TRUNCATE TABLE `messages`");
    }
}