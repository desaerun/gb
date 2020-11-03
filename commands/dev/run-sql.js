const {db} = require("../../config/connect-to-db");

module.exports = {
    name: 'run-sql',
    description: 'Runs SQL queries directly',
    execute: function(client,message,args) {
        //todo: make this exclusive to devs
        let query = args.join(" ");
        let output = db.query(query);
        message.channel.send(`\`\`\`${output}\`\`\``);
    }
}
