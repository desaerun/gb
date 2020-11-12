fs = require('fs');
module.exports = {
    name: "print-log",
    description: "prints the logfile",
    execute: function (client, message, args) {
        fs.readFile('/var/log/groidbot.log','utf8',(err,data) => {
            if (err) {
                return console.log(err)
            }
            message.channel.send(`Contents of bot log file: \`\`\`${data}\`\`\``);
        })
        fs.readFile('/home/groidbot/.pm2/logs/groidbot-out.log','utf8',(err,data) => {
            if (err) {
                return console.log(err)
            }
            message.channel.send(`Contents of pm2 stdout log file: \`\`\`${data}\`\`\``);
        })
        fs.readFile('/home/groidbot/.pm2/logs/groidbot-error.log','utf8',(err,data) => {
            if (err) {
                return console.log(err)
            }
            message.channel.send(`Contents of pm2 error log file: \`\`\`${data}\`\`\``);
        })
        fs.readFile('/home/groidbot/.pm2/logs/groidbot-error.log','utf8',(err,data) => {
            if (err) {
                return console.log(err)
            }
            message.channel.send(`Contents of pm2 status log file: \`\`\`${data}\`\`\``);
        })
    }
}