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
    sendTrace: function(message,type,output_channel_ids) {
        let formatted_msg = new Discord.MessageEmbed()
            .setAuthor(`${this.client.user.username}`, `${this.client.user.displayAvatarURL()}`);
        if(type === 'err' || type === 'error') {
            let error_text = stackTrace.get().toString();
            console.log(error_text);
            formatted_msg
                .setColor('#a90d0d')
                .addFields({
                    name: 'Error Generated',
                    value: message
                })
                .addFields({
                    name: 'Stack Trace',
                    value: error_text
                });
        } else {
            formatted_msg
                .setColor('#006400')
                .addFields({
                    name: 'Message',
                    value: message
                })
        }
        switch (typeof(output_channel_ids)) {
            case "string":{
                let channel = this.client.channels.fetch(output_channel_ids);
                channel.send(formatted_msg);
                break;
            }
            case "object":{
                if (output_channel_ids.isArray()) {
                    for (let channel_id of output_channel_ids) {
                        let channel = this.client.channels.fetch(channel_id);
                        channel.send(formatted_msg);
                    }
                    break;
                }
            }
            default:{
                console.log('could not send stack trace to output channel. output_channels is not a string or array.')
            }
        }
    }
}