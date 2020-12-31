const CONFIG = require("../config/config");

/**
 * Prints a message to console.log, assuming the verbosity is set high enough in CONFIG
 * Higher minVerbosity = a higher verbosity must be set for the message to be displayed
 *
 * @param message
 * @param minVerbosity
 */
const logMessage = function (message,minVerbosity = 3) {
    if (minVerbosity >= CONFIG.verbosity) {
        console.log(message);
    }
}

module.exports = logMessage;