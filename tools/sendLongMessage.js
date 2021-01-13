async function sendLongMessage(text,channel,chunkSize = 2000) {
    const words = text.split(" ");
    let chunkWords = [];
    for (let i=0;i<words.length;i++) {
        const msgChunk = chunkWords.join(" ");
        if (msgChunk.length + words[i].length >= chunkSize) {
            try {
                await channel.send(msgChunk);
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
            await channel.send(msgChunk);
        } catch (e) {
            throw e;
        }
    }
}
module.exports = sendLongMessage;