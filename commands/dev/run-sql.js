const mysqlQuery = require("../../tools/mysqlQuery");

module.exports = {
    name: 'run-sql',
    description: 'Runs SQL queries directly',
    execute: function (client, message, args) {
        //todo: make this exclusive to devs
        let query = args.join(" ");
        mysqlQuery(query, (err, rows) => {
            for (let row of rows) {
                message.channel.send(`\`\`\`${row}\`\`\``);
            }
        });
    }
}