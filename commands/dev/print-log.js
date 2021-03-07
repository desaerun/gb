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

//main
async function execute(client, message, args) {
    if (args[0]) {
        args[0] = Math.abs(parseInt(args[0], 10));
        if (isNaN(args[0])) {
            await sendMessage(`You must provide a valid ${params[0].type} input for ${params[0].param}.`, message.channel);
            return;
        }
    }
    const logFiles = [
        {
            name: "bot",
            file: "./log/gb.log",
        },
        {
            name: "pm2 status",
            file: "~/.pm2/pm2.log",
        },
        {
            name: "pm2 stdout",
            file: "~/.pm2/log/gb-out.log",
        },
        {
            name: "pm2 error",
            file: "~/.pm2/log/gb-error.log",
        },
    ];
    for (const logFile of logFiles) {
        try {
            const chunkSize = 1994;
            const logText = await readLog(logFile.file, args[0]);

            await sendMessage(`Contents of ${logFile.name} log file:`, message.channel);
            for (let i = 0; i < logText.length; i += chunkSize) {
                const currentChunk = logText.substr(i, chunkSize);
                await sendMessage(`\`\`\`${currentChunk}\`\`\``, message.channel);
            }
        } catch (e) {
            sendMessage(`Error occurred reading logfile \`${logFile.file}\`: ${e}`, message.channel);
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
 * @returns {String}
 */
async function readLog(file, numLines = 10) {
    let lines = [];
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
    } catch (e) {
        throw e;
    }
    return lines.join("\n");

    // return new Promise(function (resolve, reject) {
    //     let lineReader = readline.createInterface({
    //         input: fs.createReadStream(file),
    //     });
    //
    //     let lines = [];
    //
    //     lineReader
    //         .on("line", function (line) {
    //             let length = lines.push(line);
    //
    //             if (length === numLines) {
    //                 lineReader.close();
    //             }
    //         })
    //         .on("close", () => {
    //             resolve(lines.join("\n"));
    //         })
    // });
}