const exitHook = require("async-exit-hook");
const CONFIG = require("../config/config");
const {sendMessage} = require("./sendMessage");

exports.init = function (client) {
    exitHook((callback) => {
        console.log("SIGINT or SIGKILL received.");
        sendMessageToDevChannel(client, `The bot has received a request to terminate and will restart.`)
            .then(callback);
    });
    exitHook.unhandledRejectionHandler((err, callback) => {
        sendMessageToDevChannel(client, `The bot has experienced an uncaught exception: ${err}`)
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
    const outputChannel = client.channels.cache.get(process.env.DEV_CHANNEL_ID);
    await sendMessage(message, outputChannel);
}