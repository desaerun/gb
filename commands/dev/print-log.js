const readline = require('readline');
const fs = require('fs');

module.exports = {
    name: "print-log",
    description: "prints the logfile",
    execute: async function (client, message) {
        message.channel.send(`Contents of bot log file: \`\`\`${await readLog('/var/log/groidbot.log')}\`\`\``);
        message.channel.send(`Contents of pm2 status log file: \`\`\`${await readLog('/home/groidbot/.pm2/pm2.log')}\`\`\``);
        message.channel.send(`Contents of pm2 stdout log file: \`\`\`${await readLog('/home/groidbot/.pm2/logs/groidbot-out.log')}\`\`\``);
        message.channel.send(`Contents of pm2 error log file: \`\`\`${await readLog('/home/groidbot/.pm2/logs/groidbot-error.log')}\`\`\``);
    }
}
function readLog(file, num_lines = 10) {
    return new Promise(function(resolve, reject) {
        let lineReader = readline.createInterface({
            input: fs.createReadStream(file),
        });

        let lines = [];

        lineReader
            .on('line', function (line) {
                let length = lines.push(line);

                if (length === num_lines) {
                    lineReader.close();
                }
            })
            .on('close', () => {
                resolve(lines.join("\n"));
            })
    });
}