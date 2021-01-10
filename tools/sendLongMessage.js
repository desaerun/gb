async function sendLongMessage(text,channel,chunkSize = 2000) {
    const words = text.split(" ");
    let chunkWords = [];
    for (let i=0;i<words.length;i++) {
        console.log(`${i}: ${words[i]} | words.length: ${words.length} | chunkWords.length: ${chunkWords.length}`);
        let chunkLength = chunkWords.join(" ").length;
        if (chunkLength + words[i].length >= chunkSize || (i === words.length-1 && chunkWords.length > 0)) {
            try {
                const msgChunk = chunkWords.join(" ");
                await channel.send(msgChunk);
                chunkWords = [];
            } catch (e) {
                throw e;
            }
            chunkWords.push(words[i]);
            i--;
        } else {
            chunkWords.push(words[i]);
        }
    }
}
module.exports = sendLongMessage;