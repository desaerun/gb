readline = require('readline');
fs = require('fs');
module.exports = {
    name: "print-log",
    description: "prints the logfile",
    execute: async function (client, message, args) {
        let groidbot_log = await readLog('/var/log/groidbot.log');
        message.channel.send(`Contents of bot log file: \`\`\`${groidbot_log}\`\`\``);
        message.channel.send(`Contents of pm2 status log file: \`\`\`${await readLog('/home/groidbot/.pm2/pm2.log')}\`\`\``);
        message.channel.send(`Contents of pm2 stdout log file: \`\`\`${await readLog('/home/groidbot/.pm2/logs/groidbot-out.log')}\`\`\``);
        message.channel.send(`Contents of pm2 error log file: \`\`\`${await readLog('/home/groidbot/.pm2/logs/groidbot-error.log')}\`\`\``);
    }
}
async function readLog(file,num_lines = 15) {
    let lineReader = readline.createInterface({
        input: fs.createReadStream(file),
    });

    let lineCounter = 0;
    let lines = [];

    lineReader.on('line',(line) => {
        lineCounter++;
        lines.push(line);
        if(lineCounter === num_lines) {
            lineReader.close();
        }
    });

    let result;

    await lineReader.on('close', () => {
        result = lines.join("\n");
    })

    return result;
}