const axios = require('axios');

module.exports = {
    name: 'question',
    description: 'Attempts to answer your question',
    async execute(client, message, args) {
        if (args.length < 1) {
            message.channel.send('You gotta include a question, dummy.');
            return;
        }

        let query = args.join('+');

        let googleQueryURL = `https://www.google.com/search?q=${query}`;

        try {
            const response = await axios.get(googleQueryURL, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36' } } );
            if (response.status === 200) {

                let answerHTMLTag = 'data-tts-text="';
                let startIndex = response.data.indexOf(answerHTMLTag);

                if (startIndex === -1) {
                    message.channel.send('Unable to find an answer. Please go fuck yourself.');
                    return;
                }

                startIndex += answerHTMLTag.length;

                let endIndex = response.data.indexOf('"', startIndex);

                let answer = response.data.substring(startIndex, endIndex);

                message.channel.send(answer);
            } else {
                throw new Error(`Request returned status code ${response.status}`);
            }
        } catch (err) {
            message.channel.send(`Error encountered while attempting to answer your question: ${err}`);
        }
    }
}