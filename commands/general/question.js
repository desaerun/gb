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
            const response = await axios.get(googleQueryURL);
            if (response.status === 200) {
                //testing
                message.channel.send(`response length: ${response.data.length}`);

                let answerHTMLTag = 'data-tts-text="';
                let startIndex = response.data.indexOf(answerHTMLTag) + answerHTMLTag.length + 1;

                //testing
                message.channel.send(`startIndex: ${startIndex}`)

                if (startIndex === -1) {
                    message.channel.send('Unable to find an answer. Please go fuck yourself.');
                    return;
                }

                let endIndex = response.data.indexOf('"', startIndex);

                //testing
                message.channel.send(`endIndex: ${endIndex}`)

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