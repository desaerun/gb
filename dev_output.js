/**
 * dev-output.js
 *
 * generates and sends stack traces to specified channels
 */

const stackTrace = require("stack-trace");
const Discord = require("discord.js");
const {sendMessage} = require("./tools/sendMessage");

module.exports = {
    setClient: function (client) {
        this.client = client;
    },
    sendTrace: async function (error_message, output_channel_ids, desired_verbosity = 3) {
        let error_text = stackTrace.get().toString();
        console.log(error_text);

        switch (typeof (output_channel_ids)) {
            case "string": {
                let channel = this.client.channels.cache.get(output_channel_ids);
                await sendMessage(`Error Generated: \`\`\`${error_message}\`\`\``, channel);
                await sendMessage(`Stack Trace: \`\`\`${error_text}\`\`\``, channel);
                break;
            }
            case "object": {
                if (output_channel_ids.isArray()) {
                    for (let channel_id of output_channel_ids) {
                        let channel = this.client.channels.cache.get(channel_id);
                        await sendMessage(`Error Generated: \`\`\`${error_message}\`\`\``, channel);
                        await sendMessage(`Stack Trace: \`\`\`${error_text}\`\`\``, channel);
                    }
                }
                break;
            }
            default: {
                console.log("could not send stack trace to output channel. output_channel_ids is not a string or array.")
            }
        }
    },
    sendStatus: async function (message, channel_ids, color = "#0d23c8") {
        for (let i = 0; i < message.length; i += 1024) {
            let response = new Discord.MessageEmbed()
                .setAuthor(`${this.client.user.username}`, `${this.client.user.displayAvatarURL()}`)
                .setColor(color)
                .addFields({
                    name: "Bot Message:",
                    value: message
                })
            await sendMessage(response,this.client.channels.cache.get(channel_ids));
        }
    }
}