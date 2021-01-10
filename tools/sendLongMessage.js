async function sendLongMessage(text,channel,chunkSize = 2000) {
    const words = text.split(" ");
    let chunkWords = [];
    for (let i=0;i<words.length;i++) {
        console.log(`${i}: ${words[i]} | words.length: ${words.length} | chunkWords.length: ${chunkWords.length}`);
        let chunkLength = chunkWords.join(" ").length;
        if (chunkLength + words[i].length >= chunkSize) {
            try {
                const msgChunk = chunkWords.join(" ");
                await channel.send(msgChunk);
                chunkWords = [];
            } catch (e) {
                throw e;
            }
            i--;
        } else {
            chunkWords.push(words[i]);
        }
    }
    if (chunkWords.length > 0) {
        try {
            const msgChunk = chunkWords.join(" ");
            await channel.send(msgChunk);
        } catch (e) {
            throw e;
        }
    }
}
module.exports = sendLongMessage;