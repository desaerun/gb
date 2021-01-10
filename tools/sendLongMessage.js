async function sendLongMessage(text,channel,chunkSize = 2000) {
    const words = text.split(" ");
    let chunkWords = [];
    let chunkLength = 0;
    for (let i=0;i<words.length;i++) {
        if (chunkLength + words[i].length >= chunkSize) {
            try {
                const msgChunk = chunkWords.join(" ");
                await channel.send(msgChunk);
            } catch (e) {
                throw e;
            }
            i--;
        } else {
            chunkWords.push(words[i]);
            chunkLength += words[i].length+1;
        }
    }
}
module.exports = sendLongMessage;