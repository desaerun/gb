//imports
const readline = require("readline");
const fs = require("fs");
const {sendMessage} = require("../../tools/sendMessage");

//module settings
const name = "print-log";
const description = "prints the logfile";
const params = [
    {
        param: "numLines",
        type: "Integer",
        description: "The number of lines to print from each log.",
        default: 10,
    }
];
const allowedContexts = [
    "text",
    "dm",
];
const adminOnly = true;

//main
const execute = async function (message, args) {
    const logFiles = [
        {
            name: "bot",
            file: "./log/gb.log",
        },
        {
            name: "pm2 status",
            file: "/home/gb/.pm2/pm2.log",
        },
        {
            name: "pm2 stdout",
            file: "/home/gb/.pm2/logs/gb-out.log",
        },
        {
            name: "pm2 error",
            file: "/home/gb/.pm2/logs/gb-error.log",
        },
    ];
    for (const logFile of logFiles) {
        try {
            const chunkSize = 1994;
            const logText = await readLog(logFile.file, args[0]);

            await sendMessage(`Contents of ${logFile.name} log file:`, message.channel);
            if (logText.length === 0) {
                await sendMessage(`\`\`\`Empty file\`\`\``, message.channel);
            } else {
                for (let i = 0; i < logText.length; i += chunkSize) {
                    const currentChunk = logText.substr(i, chunkSize);
                    await sendMessage(`\`\`\`${currentChunk}\`\`\``, message.channel);
                }
            }
        } catch (e) {
            await sendMessage(`Error occurred reading logfile \`${logFile.file}\`: ${e}`, message.channel);
        }
    }
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
    allowedContexts: allowedContexts,
    adminOnly: adminOnly,
}

// Helper functions
/**
 * Reads lines from the logfile
 *
 * @param file
 * @param numLines
 * @returns {String}
 */
async function readLog(file, numLines = 10) {
    let lines = [];

    //"touch" the file (create it if it does not exist, if it does exist update the Modified time)
    //touchFileSync(file);

    try {
        const fileStream = fs.createReadStream(file);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        let i = 0;
        for await (const line of rl) {
            if (++i === numLines) {
                break;
            }
            lines.push(line);
        }
        return lines.join("\n");
    } catch (e) {
        throw e;
    }
}