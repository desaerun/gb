const CONFIG = require("../config/config");

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

/**
 * Splits a message into [chunkSize] parts.  Discord does not allow messages > 2000 characters, for example.
 * Does not break works.
 * @param text
 * @param channel -- the Discord.js Channel object to send to
 * @param suppressEmbeds -- whether or not auto-generated Embeds should be suppressed
 * @param chunkSize -- the maximum size of each message
 * @returns {Promise<void>}
 */
exports.sendLongMessage = async function sendLongMessage(text, channel, suppressEmbeds = false, chunkSize = 2000) {
    if (suppressEmbeds) {
        var urlRegex = '((?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?)';
        var url = new RegExp(urlRegex, "ig");
        text = text.replace(url, "<$1>");
    }
    const words = text.split(" ");
    let chunkWords = [];
    for (let i = 0; i < words.length; i++) {
        const msgChunk = chunkWords.join(" ");
        if (msgChunk.length + words[i].length >= chunkSize) {
            try {
                await channel.send(msgChunk);
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
            await channel.send(msgChunk);
        } catch (e) {
            throw e;
        }
    }
}