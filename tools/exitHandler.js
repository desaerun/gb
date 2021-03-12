const exitHook = require("async-exit-hook");
const {sendMessage} = require("./sendMessage");

exports.init = function (client) {
    exitHook((callback) => {
        sendMessageToBotStatusChannel(`The bot has received a request to terminate and will restart.`)
            .then(() => {
                console.log("SIGINT or SIGKILL received.");
            });
    });
    exitHook.unhandledRejectionHandler((err, callback) => {
        sendMessageToBotStatusChannel(client, `The bot has experienced an uncaught exception: ${err}`)
            .then();
    });
    return true;
}

/**
 * sends a message to the bot status channel as defined in process.env
 * @param client - the discord.js client object for the bot
 * @param message - the message to send
 * @returns {Promise<void>}
 */
async function sendMessageToBotStatusChannel(client, message) {
    const outputChannel = client.channels.cache.get(process.env.ONLINE_STATUS_CHANNEL_ID);
    await sendMessage(message,outputChannel);
}