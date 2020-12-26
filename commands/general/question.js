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

                const cheerioDOM = cheerio.load(response.data);
                // Remove 'Videos' box from search results
                cheerioDOM('div.HD8Pae.luh4tb.cUezCb.xpd.O9g5cc.uUPGi').remove();

                let innerDOM = cheerio.load(cheerioDOM("div[aria-level='3']").first().html());

                // Remove some of the subtext in featured results
                innerDOM('div.yxAsKe.kZ91ed').remove();
                innerDOM('span.kX21rb').remove();

                let answer = innerDOM.text();

                if (answer) {
                    let context = cheerioDOM('span.hgKElc').text();

                    if (!context || answer === context) {
                        message.channel.send(answer);
                    } else {
                        message.channel.send(`**${answer}**\n${context}`);
                    }

                } else {
                    let complementaryResults = cheerioDOM("div[id='wp-tabs-container']").html();
                    
                    const innerDOM = cheerio.load(complementaryResults);

                    answer = innerDOM("h2[data-attrid='title']").text();

                    if (answer) {
                        let context = innerDOM('div.kno-rdesc > div > span').first().text();
                        if (!context || answer === context) {
                            message.channel.send(answer);
                        } else {
                            message.channel.send(`**${answer}**\n${context}`);
                        }

                    } else {
                        message.channel.send('Unable to find an answer. Please go fuck yourself.');
                    }
                }

            } else {
                throw new Error(`Request returned status code ${response.status}`);
            }
        } catch (err) {
            message.channel.send(`Error encountered while attempting to answer your question: ${err}`);
        }
    }
}