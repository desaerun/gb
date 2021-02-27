const Discord = require("discord.js");
const {uwuifyIfUwuMode} = require("./uwuify");

/**
 * Splits a message into [chunkSize] parts.  Discord does not allow messages > 2000 characters, for example.
 * Does not break words.
 * @param input
 * @param target -- the Discord.js Channel/User object to send to
 * @param suppressEmbeds -- whether or not auto-generated Embeds should be suppressed
 * @param forceNormalText -- forces disabling uwu-mode
 * @param chunkSize -- the maximum size of each message
 * @returns {Promise<void>}
 */
exports.sendMessage = async function sendMessage(input, target, suppressEmbeds = false, forceNormalText = false, chunkSize = 2000) {
    if (input instanceof Discord.MessageEmbed) {
        if (forceNormalText) {
            for (const field of input.fields) {
                if (field.value && field.value.length > 1024) {
                    field.value = field.value.substr(0, 510) + "..." + field.value.substr(-510);
                }
            }
        } else {
            if (input.content) {
                input.content = uwuifyIfUwuMode(input.content);
            }
            if (input.title) {
                input.title = uwuifyIfUwuMode(input.title);
            }
            if (input.description) {
                input.description = uwuifyIfUwuMode(input.description);
            }
            if (input.footer && input.footer.text) {
                input.footer.text = uwuifyIfUwuMode(input.footer.text);
            }
            if (input.author && input.author.name) {
                input.author.name = uwuifyIfUwuMode(input.author.name);
            }
            for (const field of input.fields) {
                field.name = uwuifyIfUwuMode(field.name);
                field.value = uwuifyIfUwuMode(field.value);

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
            output = await target.send(`Failed to send embedded message: ${e}`);
        }
        return output;
    }
    if (suppressEmbeds) {
        const urlRegex = '((?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?)';
        const url = new RegExp(urlRegex, "ig");
        input = input.replace(url, "<$1>");
    }
    if (!forceNormalText) {
        input = uwuifyIfUwuMode(input);
    }
    const words = input.split(" ");
    let chunkWords = [];
    for (let i = 0; i < words.length; i++) {
        const msgChunk = chunkWords.join(" ");
        if (msgChunk.length + words[i].length >= chunkSize) {
            try {
                await target.send(msgChunk);
            } catch (e) {
                throw e;
            }
            chunkWords = [];
            i--;
        } else {
            chunkWords.push(words[i]);
        }
    }
    if (chunkWords.length > 0) {
        const msgChunk = chunkWords.join(" ");
        try {
            await target.send(msgChunk);
        } catch (e) {
            throw e;
        }
    }
}