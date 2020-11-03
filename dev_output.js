/**
 * dev-output.js
 *
 * generates and sends stack traces to specified channels
 */

const stackTrace = require('stack-trace');
const Discord = require('discord.js');
module.exports = {
    setClient: function(client) {
        this.client = client;
    },
    sendTrace: function(error_message,output_channel_ids) {
        let error_text = stackTrace.get().toString();
        console.log(error_text);

        switch (typeof (output_channel_ids)) {
            case "string": {
                let channel = this.client.channels.cache.get(output_channel_ids);
                channel.send(`Error Generated: \`\`\`${error_message}\`\`\``);
                channel.send(`Stack Trace: \`\`\`${error_text}\`\`\``);
                break;
            }
            case "object": {
                if (output_channel_ids.isArray()) {
                    for (let channel_id of output_channel_ids) {
                        let channel = this.client.channels.cache.get(channel_id);
                        channel.send(`Error Generated: \`\`\`${error_message}\`\`\``);
                        channel.send(`Stack Trace: \`\`\`${error_text}\`\`\``);
                    }
                    break;
                }
            }
            default: {
                console.log('could not send stack trace to output channel. output_channels is not a string or array.')
            }
        }
    },
    sendStatus: function(message,channel_ids) {
        for (let i=0;i<message.length;i+=1024) {
            let response = new Discord.MessageEmbed()
                .setAuthor(`${this.client.user.username}`, `${this.client.user.displayAvatarURL()}`)
                .setColor('#0d23c8')
                .addFields({
                    name: 'Bot Message:',
                    value: message
                })
            this.client.channels.cache.get(channel_ids).send(response);
        }
    }
}