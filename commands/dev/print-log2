const fs = require('fs');
module.exports = {
    name: "print-log2",
    description: "prints the logfile",
    execute: function (client, message, args) {
        message.channel.send(`Contents of bot log file: \`\`\`${readLog('/var/log/groidbot.log')}\`\`\``);
        message.channel.send(`Contents of pm2 status log file: \`\`\`${readLog('/home/groidbot/.pm2/pm2.log')}\`\`\``);
        message.channel.send(`Contents of pm2 stdout log file: \`\`\`${readLog('/home/groidbot/.pm2/logs/groidbot-out.log')}\`\`\``);
        message.channel.send(`Contents of pm2 error log file: \`\`\`${readLog('/home/groidbot/.pm2/logs/groidbot-error.log')}\`\`\``);
    }
}
function readLog(file,num_lines = 15) {
    fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
            return err;
        } else {
            return data;
        }
    })
}