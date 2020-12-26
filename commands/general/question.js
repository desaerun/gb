const axios = require('axios');
const cheerio = require('cheerio');

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

                const cheerio_dom = cheerio.load(response.data);

                const answer = cheerio_dom('div.Z0LcW.XcVN5d').text();

                if (answer) {
                    message.channel.send(answer);
                } else {
                    message.channel.send('Unable to find an answer. Please go fuck yourself.');
                }

            } else {
                throw new Error(`Request returned status code ${response.status}`);
            }
        } catch (err) {
            message.channel.send(`Error encountered while attempting to answer your question: ${err}`);
        }
    }
}