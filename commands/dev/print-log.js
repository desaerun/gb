fs = require('fs');
module.exports = {
    name: "print-log",
    description: "prints the logfile",
    execute: function (client, message, args) {
        fs.readFile('/var/log/groidbot.log','utf8',(err,data) => {
            if (err) {
                return console.log(err)
            }
            message.channel.send(`Contents of log file: \`\`\`${data}\`\`\``);
        })
    }
}