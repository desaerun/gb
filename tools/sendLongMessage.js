async function sendLongMessage(text,channel,chunkSize = 2000) {
    const words = text.split(" ");
    let extraWord = "";
    let chunkWords = [];
    let msgLength = 0;
    for (const word of words) {
        if (msgLength + word.length >= chunkSize) {
            extraWord = word;
            try {
                await channel.send(text.substr(i,chunkSize));
            } catch (e) {
                throw e;
            }
            continue;
        }
        if (extraWord !== "") {
            chunkWords.push(extraWord);
            msgLength += extraWord.length;
            extraWord = "";
        }
        chunkWords.push(word);
        msgLength+=word.length;
    }

}
module.exports = sendLongMessage;