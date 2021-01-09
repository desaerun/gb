//imports
const readline = require('readline');
const fs = require('fs');

//module settings
const name = "print-log";
const description = "prints the logfile";
const params = [
    {
        param: 'numLines',
        description: 'The number of lines to print from each log.',
        default: 10,
        required: false,
    }
];

//main
async function execute(client, message) {
    message.channel.send(`Contents of bot log file: \`\`\`${await readLog('/var/log/groidbot.log')}\`\`\``);
    message.channel.send(`Contents of pm2 status log file: \`\`\`${await readLog('/home/groidbot/.pm2/pm2.log')}\`\`\``);
    message.channel.send(`Contents of pm2 stdout log file: \`\`\`${await readLog('/home/groidbot/.pm2/logs/groidbot-out.log')}\`\`\``);
    message.channel.send(`Contents of pm2 error log file: \`\`\`${await readLog('/home/groidbot/.pm2/logs/groidbot-error.log')}\`\`\``);
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
}

// Helper functions
/**
 * Reads lines from the logfile
 *
 * @param file
 * @param num_lines
 * @returns {Promise<unknown>}
 */
function readLog(file, num_lines = 10) {
    return new Promise(function (resolve, reject) {
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