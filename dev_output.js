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

        //Discord.MessageEmbed body cannot be longer than 1024 chars
        for (let i=0;i<error_text.length;i+1024) {
            let formatted_msg = new Discord.MessageEmbed()
                .setAuthor(`${this.client.user.username}`, `${this.client.user.displayAvatarURL()}`)
                .setColor('#a90d0d')
                .addFields({
                    name: 'Error Generated',
                    value: error_message
                })
                .addFields({
                    name: 'Stack Trace',
                    value: error_text
                });
            switch (typeof (output_channel_ids)) {
                case "string": {
                    let channel = this.client.channels.cache.get(output_channel_ids);
                    channel.send(formatted_msg.substr(i,i+1024));
                    break;
                }
                case "object": {
                    if (output_channel_ids.isArray()) {
                        for (let channel_id of output_channel_ids) {
                            let channel = this.client.channels.cache.get(channel_id);
                            channel.send(formatted_msg);
                        }
                        break;
                    }
                }
                default: {
                    console.log('could not send stack trace to output channel. output_channels is not a string or array.')
                }
            }
        }
    },
    sendStatus: function(message) {
        for (let i=0;i<message.length;i+1024) {
            let response = new Discord.MessageEmbed()
                .setAuthor(`${this.client.user.username}`, `${this.client.user.displayAvatarURL()}`)
                .setColor('#a90d0d')
                .addFields({
                    name: 'Bot Message:',
                    value: 'message'
                })
            this.client.channels.cache.get(channel_ids).send(response);
        }
    }
}