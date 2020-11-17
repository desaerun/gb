const mysqlQuery = require('../../config/mysql-query');
module.exports = {
    name: 'clear-message-history',
    description: "Clears all message history from db",
    execute: async function (client, message, args) {
        mysqlQuery("TRUNCATE TABLE `messages`",);
    }
}