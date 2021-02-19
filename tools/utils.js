const CONFIG = require("../config/config");
const Discord = require("discord.js");

/**
 * Gets a random member from an array.
 * @param arr - the array
 * @returns {*} - a random member from the array
 */
exports.getRandomArrayMember = function getRandomArrayMember(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Picks a random number between min and max (inclusive)
 * @param min
 * @param max
 * @returns {number}
 */
exports.getRand = function getRand(min, max) {
    return Math.floor(min + (Math.random() * (max - min + 1)));
}

/**
 * Suppresses URLs posted in discord messages from auto-generating Embeds by wrapping them in <>.
 * Returns the input string but with any URLs wrapped in <>.
 * @param text
 * @returns {*}
 */
exports.suppressUrls = function suppressUrls(text) {
    const urlRegex = '((?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?)';
    const url = new RegExp(urlRegex, "ig");
    return text.replace(url, "<$1>");
}

/**
 * Extracts the timestamp from a Discord snowflake. Returns number of milliseconds since unix epoch.
 * @param snowflake
 * @returns {number}
 */
exports.snowflakeToTimestamp = function snowflakeToTimestamp(snowflake) {
    const discord_epoch = 1420070400000;
    const timestamp_64 = BigInt.asUintN(64, snowflake);
    let message_timestamp_bits = Number(timestamp_64 >> 22n);
    return message_timestamp_bits + discord_epoch;
}

/**
 * Prints a message to console.log, assuming the verbosity is set high enough in CONFIG
 * Higher minVerbosity = a higher verbosity must be set for the message to be displayed
 *
 * @param message
 * @param minVerbosity
 */
exports.logMessage = function (message, minVerbosity = 3) {
    if (CONFIG.VERBOSITY >= minVerbosity) {
        //convert objects to JSON.stringify
        if (typeof (message) === "object" && message !== null) {
            console.log(JSON.stringify(message));
            return;
        }
        console.log(message);
    }
}
const {uwuify} = require("./uwuify");
let uwuMode = true;

/**
 * Uwuifies the text only if Uwu-mode is on, otherwise returns the text unchanged.
 * @param text
 * @returns {string|*}
 */
function uwuifyIfUwuMode(text) {
    if (uwuMode) {
        return uwuify(text);
    }
    return text;
}

exports.uwuifyIfUwuMode = uwuifyIfUwuMode;

/**
 * Splits a message into [chunkSize] parts.  Discord does not allow messages > 2000 characters, for example.
 * Does not break works.
 * @param input
 * @param target -- the Discord.js Channel/User object to send to
 * @param suppressEmbeds -- whether or not auto-generated Embeds should be suppressed
 * @param chunkSize -- the maximum size of each message
 * @returns {Promise<void>}
 */
exports.sendMessage = async function sendMessage(input, target, suppressEmbeds = false, chunkSize = 2000) {
    if (input instanceof Discord.MessageEmbed) {
        if (input.content) {
            input.content = uwuifyIfUwuMode(input.content);
        }
        if (input.title) {
            input.title = uwuifyIfUwuMode(input.title);
        }
        if (input.description) {
            input.description = uwuifyIfUwuMode(input.description);
        }
        if (input.footer && input.footer.text) {
            input.footer.text = uwuifyIfUwuMode(input.footer.text);
        }
        if (input.author && input.author.name) {
            input.author.name = uwuifyIfUwuMode(input.author.name);
        }
        for (const field of input.fields) {
            field.name = uwuifyIfUwuMode(field.name);
            field.value = uwuifyIfUwuMode(field.value);
        }
        try {
            await target.send(input);
        } catch (e) {
            await target.send(`Failed to send embedded message: ${e}`);
        }
        return;
    }
    if (suppressEmbeds) {
        const urlRegex = '((?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?)';
        const url = new RegExp(urlRegex, "ig");
        input = input.replace(url, "<$1>");
    }
    input = uwuifyIfUwuMode(input);
    const words = input.split(" ");
    let chunkWords = [];
    for (let i = 0; i < words.length; i++) {
        const msgChunk = chunkWords.join(" ");
        if (msgChunk.length + words[i].length >= chunkSize) {
            try {
                await target.send(msgChunk);
            } catch (e) {
                throw e;
            }
            chunkWords = [];
            i--;
        } else {
            chunkWords.push(words[i]);
        }
    }
    if (chunkWords.length > 0) {
        const msgChunk = chunkWords.join(" ");
        try {
            await target.send(msgChunk);
        } catch (e) {
            throw e;
        }
    }
}