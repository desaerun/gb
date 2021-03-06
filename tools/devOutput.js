/**
 * dev-output.js
 *
 * generates and sends stack traces to specified channels
 */

const stackTrace = require("stack-trace");
const {sendMessage} = require("./sendMessage");

const sendTrace = async function sendTrace(client, errorMessage, outputChannelIds) {
    let channelIds = [];
    if (outputChannelIds.isArray()) {
        channelIds = outputChannelIds;
    } else {
        channelIds.push(outputChannelIds);
    }
    let errorText = stackTrace.get().toString();
    for (let channelId of channelIds) {
        let channel = this.client.channels.cache.get(channelId);
        await sendMessage(`Error Generated: \`\`\`${errorMessage}\`\`\``, channel);
        await sendMessage(`Stack Trace: \`\`\`${errorText}\`\`\``, channel);
    }
}

exports.sendTrace = sendTrace;