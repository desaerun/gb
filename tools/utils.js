const CONFIG = require("../config/config");
const fs = require("fs");

/**
 * Gets a random member from an array.
 * @param arr - the array
 * @returns {*} - a random member from the array
 */
exports.getRandomArrayMember = function (arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Picks a random number between min and max (inclusive)
 * @param min
 * @param max
 * @returns {number}
 */
exports.getRandomInt = function (min, max) {
    return Math.floor(min + (Math.random() * (max - min + 1)));
}

/**
 * Suppresses URLs posted in discord messages from auto-generating Embeds by wrapping them in <>.
 * Returns the input string but with any URLs wrapped in <>.
 * @param text
 * @returns {*}
 */
exports.suppressUrls = function (text) {
    const urlRegex = '((?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?)';
    const url = new RegExp(urlRegex, "ig");
    return text.replace(url, "<$1>");
}

/**
 * Extracts the timestamp from a Discord snowflake. Returns number of milliseconds since unix epoch.
 * @param snowflake
 * @returns {number}
 */
exports.snowflakeToTimestamp = function (snowflake) {
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

exports.isUrl = function (text) {
    const urlRegex = '((?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?)';
    const rE = new RegExp(urlRegex, "i");
    return rE.test(text);
}

/**
 * generates the n-fold Cartesian product of a set of arrays.
 * @param arrays -- the arrays to merge
 * @returns {String[]} --
 */
exports.cartesianProduct = function (...arrays) {
    return arrays.reduce((acc, val) => {
        return acc.map(el => {
            return val.map(element => {
                return el.concat([element]);
            });
        }).reduce((acc, val) => acc.concat(val), []);
    }, [[]]);
}

/**
 * Synchronously "touch"es a file (linux command).  This will create the file if it does not exists,
 * if it does exist it will simply update the Modified time on the file.
 * @param file -- the path of the file
 */
exports.touchFileSync = function (file) {
    const now = new Date();
    try {
        fs.utimesSync(file, now, now);
    } catch (e) {
        fs.closeSync(fs.openSync(file, "w"))
    }
}

/**
 * Asynchronously "touch"es a file (linux command).  This will create the file if it does not exists,
 * if it does exist it will simply update the Modified time on the file.
 * @param file
 */
exports.touchFile = function (file) {
    const now = new Date();
    fs.utimes(file,now,now, err => {
        if (err) {
            fs.open(file, 'w',(err, fd) => {
                if (err) throw err;
                fs.close(fd, err => {
                    if (err) throw err;
                });
            });
        }
    });
}