/**
 * dev-output.js
 *
 * generates and sends stack traces to specified channels
 */

const stackTrace = require("stack-trace");
const {sendMessage} = require("./sendMessage");

const sendTrace = async function sendTrace(client, errorMessage, outputChannelIds) {
    let channelIds = [];
    if (outputChannelIds && Array.isArray(outputChannelIds)) {
        channelIds = outputChannelIds;
    } else {
        channelIds.push(outputChannelIds);
    }
    const errorText = stackTrace.get().toString();
    if (channelIds.length > 0) {
        for (const channelId of channelIds) {
            const channel = client.channels.cache.get(channelId);
            await sendMessage(`Error Generated: \`\`\`${errorMessage}\`\`\``, channel);
            await sendMessage(`Stack Trace: \`\`\`${errorText}\`\`\``, channel);
        }
    } else {
        console.log(errorMessage, errorText);
    }
}

exports.sendTrace = sendTrace;