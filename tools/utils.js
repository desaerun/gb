const CONFIG = require("../config/config");
const fs = require("fs");
const readline = require("readline");
const axios = require("axios");

//prisma
const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();

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
 * @returns {string}
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
            try {
                console.log(JSON.stringify(message));
            } catch (e) {
                console.log(message);
            }
            return;
        }
        console.log(message);
    }
}


/**
 * determines if a given string is a URL.
 *
 * @param text - the string to check
 * @returns {boolean} - true if the string is a URL, false otherwise.
 */
exports.isUrl = function (text) {
    const urlRegex = '((?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?)';
    const rE = new RegExp(urlRegex, "i");
    return rE.test(text);
}

/**
 * generates the n-fold Cartesian product of a set of arrays.
 *
 * @param arrays -- the arrays to merge
 * @returns {String[]} -- an array containing the cartesian products
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
 * Checks whether or not the user is an administrator, according to the database.
 *
 * @param userId - the ID of the user
 * @returns {Promise<boolean>} - Promise that resolves to true if user is Admin, false otherwise
 */
exports.isAdmin = async function (userId) {
    const userFromDb = await prisma.author.findUnique({
        where: {
            id: userId,
        }
    });
    if (!userFromDb) return false;
    return !!userFromDb.isAdmin;
}

/**
 * Checks whether or not the user is a super administrator, according to the database.
 *
 * @param userId - the ID of the user
 * @returns {Promise<boolean>} - Promise that resolves to true if user is SuperAdmin, false otherwise
 */
exports.isSuperAdmin = async function (userId) {
    const userFromDb = await prisma.author.findUnique({
        where: {
            id: userId,
        }
    });
    if (!userFromDb) return false;
    return !!userFromDb.isSuperAdmin;
}

/**
 * Synchronously "touch"es a file (linux command).  This will create the file if it does not exists,
 * if it does exist it will simply update the Modified time on the file. It will also create the directory the
 * file is supposed to exist in, if it does not exist.
 *
 * @param file -- the path to the file
 */
exports.touchFileSync = function (file) {
    const filePathParts = file.split("/");
    filePathParts.pop();
    const filePath = filePathParts.join("");
    mkdirRecursiveSync(filePath);

    const now = new Date();
    try {
        fs.utimesSync(file, now, now);
    } catch (e) {
        fs.closeSync(fs.openSync(file, "w"))
    }
}

/**
 * Asynchronously "touch"es a file (linux command).  This will create the file if it does not exists,
 * if it does exist it will simply update the Modified time on the file. It will also create the directory the
 * file is supposed to exist in, if it does not exist.
 *
 * @param file - the path to the file
 */
exports.touchFile = async function (file) {
    const filePathParts = file.split("/");
    filePathParts.pop();
    const filePath = filePathParts.join("");
    await mkdirRecursive(filePath);

    const now = new Date();
    fs.utimes(file, now, now, err => {
        if (err) {
            fs.open(file, 'w', (err, fd) => {
                if (err) throw err;
                fs.close(fd, err => {
                    if (err) throw err;
                });
            });
        }
    });
}

/**
 * makes the given directory synchronously, if it does not exist.
 * @param path - the directory to create
 */
mkdirRecursiveSync = function (path) {
    fs.mkdirSync(path, {recursive: true});
}
exports.mkdirRecursiveSync = mkdirRecursiveSync;

/**
 * makes the given directory asynchronously, if it does not exist.
 * @param path - the directory to create
 */
mkdirRecursive = async function (path) {
    await fs.promises.mkdir(path, {recursive: true});
}
exports.mkdirRecursive = mkdirRecursive;

/**
 * Reads the top line of a file and returns it.
 *
 * @param filename
 * @returns Promise<string>
 */
exports.readSingleLine = function (filename) {
    return new Promise((resolve, reject) => {
        let input;
        if (!fs.existsSync(filename)) {
            resolve("");
        }
        input = fs.createReadStream(filename);

        let lineReader = readline.createInterface({input});
        lineReader.on("line", (line) => {
            lineReader.close();
            resolve(line);
        });
        lineReader.on("error", reject);

        input.on("end", () => {
            resolve("");
        })
    });
}

/**
 * formats a number as currency, precision is based on the price
 *
 * @param n the number to format
 * @param maxPlaces maximum number of decimal places
 * @param currency - the currency code to format as (default USD)
 * @returns {string}
 */
exports.formatMoney = function (n, maxPlaces, currency = "USD") {
    let minPlaces = 2;
    if (!maxPlaces) {
        maxPlaces = 2;
        if (n < 100) {
            maxPlaces = 6;
        }
        if (n < 1) {
            maxPlaces = 10;
        }
    } else {
        minPlaces = maxPlaces;
    }

    const currencyFormat = new Intl.NumberFormat("en-US",
        {
            style: "currency",
            currency: currency,
            minimumFractionDigits: minPlaces,
            maximumFractionDigits: maxPlaces,
        });
    return currencyFormat.format(n);
}

exports.downloadFile = async (url, targetPath) => {
    //make sure the folder exists
    if (!targetPath.endsWith("/")) {
        targetPath += "/";
    }
    mkdirRecursiveSync(targetPath);

    //get the file extension
    const fileName = url.split("/").pop();
    let baseName = fileName;
    let extension = null;

    let fileNameParts = fileName.split(".");
    if (fileNameParts.length > 1) {
        extension = fileNameParts.pop();
        baseName = fileNameParts.join(".");
    }

    const fullFilePath = `${targetPath}${baseName}.${extension}`;
    try {
        axios({
            url: url,
            responseType: 'stream'
        }).then(response =>
            new Promise((resolve, reject) => {
                //todo: convert svg to png
                response.data.pipe(fs.createWriteStream(fullFilePath))
                    .on("finish", () => resolve())
                    .on("error", (e) => reject(e));
            })
        );
    } catch (e) {
        throw Error(`There was an error downloading the file at url ${url} to ${targetPath}: ${e.stack}`);
    }
    return fullFilePath;
}