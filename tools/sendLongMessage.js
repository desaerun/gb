async function sendLongMessage(text,channel,chunkSize = 2000) {
    for (let i=0;i<text.length;i+=chunkSize) {
        try {
            await channel.send(text.substr(i,chunkSize));
        } catch (e) {
            throw e;
        }
    }
}
module.exports = sendLongMessage;