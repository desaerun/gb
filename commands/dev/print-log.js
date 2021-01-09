//imports
const readline = require('readline');
const fs = require('fs');

//module settings
const name = "print-log";
const description = "prints the logfile";
const params = [
    {
        param: 'numLines',
        type: 'Integer',
        description: 'The number of lines to print from each log.',
        default: 10,
        required: false,
    }
];

//main
async function execute(client, message, args) {
    if (args[0]) {
        args[0] = Math.abs(parseInt(args[0], 10));
        if (isNaN(args[0])) {
            try {
                await message.channel.send(`You must provide a valid ${params[0].type} input for ${params[0].param}.`);
            } catch (e) {
                throw e;
            }
            return;
        }
    }
    const logFiles = [
        {
            name: "bot",
            file: "/var/log/groidbot.log",
        },
        {
            name: "pm2 status",
            file: "/home/groidbot/.pm2/pm2.log",
        },
        {
            name: "pm2 stdout",
            file: "/home/groidbot/.pm2/logs/groidbot-out.log",
        },
        {
            name: "pm2 error",
            file: "/home/groidbot/.pm2/logs/groidbot-error.log",
        },
    ];
    for (const logFile of logFiles) {
        const chunkSize = 2000;
        const logText = await readLog(logFile.file);

        try {
            await message.channel.send(`Contents of ${logFile.name} log file:`);
        } catch (e) {
            throw e;
        }
        for (let i = 0; i<logText.length;i+=chunkSize) {
            const currentChunk = logText.substr(i,chunkSize);
            try {
                await message.channel.send(`\`\`\`${currentChunk}\`\`\``);
            } catch (e) {
                throw e;
            }
        }
    }
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
 * @param numLines
 * @returns {Promise<unknown>}
 */
function readLog(file, numLines = 10) {
    return new Promise(function (resolve, reject) {
        let lineReader = readline.createInterface({
            input: fs.createReadStream(file),
        });

        let lines = [];

        lineReader
            .on('line', function (line) {
                let length = lines.push(line);

                if (length === numLines) {
                    lineReader.close();
                }
            })
            .on('close', () => {
                resolve(lines.join("\n"));
            })
    });
}