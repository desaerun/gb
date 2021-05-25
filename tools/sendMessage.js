const Discord = require("discord.js");
const {uwuifyIfUwuMode} = require("./uwuify");

/**
 * Splits a message into [chunkSize] parts.  Discord does not allow messages > 2000 characters, for example.
 * Does not break words.
 *
 * @param input
 * @param target -- the Discord.js Channel/User object to send to
 * @param attachment -- a Discord.js MessageAttachment object to attach
 * @param suppressEmbeds -- whether or not auto-generated Embeds should be suppressed
 * @param forceNormalText -- forces disabling uwu-mode
 * @param chunkSize -- the maximum size of each message
 * @returns{Promise<"discord.js".Message>}
 */
exports.sendMessage = async function (input, target, attachment, suppressEmbeds = false, forceNormalText = false, chunkSize = 2000) {
    if (input instanceof Discord.MessageEmbed) {
        if (forceNormalText) {
            for (const field of input.fields) {
                if (field.value && field.value.length > 1024) {
                    field.value = field.value.substr(0, 510) + "..." + field.value.substr(-510);
                }
            }
        } else {
            if (input.content) {
                input.content = uwuifyIfUwuMode(input.content, target.client.uwuMode);
            }
            if (input.title) {
                input.title = uwuifyIfUwuMode(input.title, target.client.uwuMode);
            }
            if (input.description) {
                input.description = uwuifyIfUwuMode(input.description, target.client.uwuMode);
            }
            if (input.footer && input.footer.text) {
                input.footer.text = uwuifyIfUwuMode(input.footer.text, target.client.uwuMode);
            }
            if (input.author && input.author.name) {
                input.author.name = uwuifyIfUwuMode(input.author.name, target.client.uwuMode);
            }
            for (const field of input.fields) {
                field.name = uwuifyIfUwuMode(field.name, target.client.uwuMode);
                field.value = uwuifyIfUwuMode(field.value, target.client.uwuMode);

                //if the value field is longer than allowed, take the first and last half of the characters and insert
                // "..." between them.
                if (field.value && field.value.length > 1024) {
                    field.value = field.value.substr(0, 510) + "..." + field.value.substr(-510);
                }
            }
        }
        let output;
        try {
            output = await target.send(input);
        } catch (e) {
            output = await target.send(`Failed to send embedded message: ${e.stack}`);
        }
        return output;
    }
    if (!forceNormalText) {
        input = uwuifyIfUwuMode(input, target.client.uwuMode);
    }
    const words = input.split(" ");
    let chunkWords = [];
    let lastMessage;
    for (let i = 0; i < words.length; i++) {
        const msgChunk = chunkWords.join(" ");
        //if the current chunk plus the current word would go over the chunk size,
        //or if we're on the last word of the message, send the message
        if (msgChunk.length + words[i].length >= chunkSize ||
            i === words.length - 1) {
            if (i === words.length - 1 && attachment) {
                lastMessage = await target.send(msgChunk, attachment);
            } else {
                lastMessage = await target.send(msgChunk);
            }
            if (suppressEmbeds) {
                await lastMessage.suppressEmbeds(true);
            }
            chunkWords = [];
            i--;
        } else {
            chunkWords.push(words[i]);
        }
    }
    return lastMessage;
}