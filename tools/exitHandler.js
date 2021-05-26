const exitHook = require("async-exit-hook");
const {sendMessage} = require("./sendMessage");

/**
 * Hooks for SIGINT/SIGKILL/other exit handling to allow async processes to end before the bot dies.
 *
 * @param client - the discord.js bot client object
 * @returns {boolean}
 */
exports.init = function (client) {
    exitHook((callback) => {
        console.log("SIGINT or SIGKILL received.");
        sendMessageToDevChannel(client, `The bot has received a request to terminate and will attempt to restart.`)
            .then(callback);
    });
    exitHook.unhandledRejectionHandler((err, callback) => {
        sendMessageToDevChannel(client, `The bot has experienced an uncaught exception and will terminate. The bot will attempt to restart: ${err.stack}`)
            .then(callback);
    });
    return true;
}

/**
 * sends a message to the bot status channel as defined in process.env
 * @param client - the discord.js client object for the bot
 * @param message - the message to send
 * @returns {Promise<void>}
 */
async function sendMessageToDevChannel(client, message) {
    const outputChannel = await client.channels.fetch(process.env.DEV_CHANNEL_ID);
    await sendMessage(message, outputChannel);
}