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

                if (retrieveAnswerFromFeaturedSnippet(message, cheerioDOM)) {
                    return;
                }

                if (retrieveAnswerFromKnowledgePanel(message, cheerioDOM)) {
                    return;
                }

                message.channel.send('Unable to find an answer. Please go fuck yourself.');

            } else {
                throw new Error(`Request returned status code ${response.status}`);
            }
        } catch (err) {
            message.channel.send(`Error encountered while attempting to answer your question: ${err}`);
        }
    }
}

/**
 * Attempts to retrieve Google Search results contained within the "Featured Snippet" above the
 * actual search results to provide in answer. Returns false if a response is not sent to Discord,
 * true otherwise.
 *
 * @param message
 * @param cheerioDOM
 * @returns {boolean}
 */
function retrieveAnswerFromFeaturedSnippet(message, cheerioDOM) {

    // Grabbing the first aria-level 3 div should give us the Featured Snippet box if it exists
    let innerDOMString = cheerioDOM('div[data-attrid^="kc:/"]').first().html();

    if (innerDOMString) {
        const innerDOM = cheerio.load(innerDOMString);

        // Remove some of the subtext in featured snippet
        innerDOM('div.yxAsKe.kZ91ed').remove();
        innerDOM('span.kX21rb').remove();

        let answer = innerDOM.text();

        if (answer) {
            let context = cheerioDOM('span.hgKElc').text();

            if (!context || answer === context) {
                message.channel.send(answer);
                return true;
            } else {
                message.channel.send(`**${answer}**\n${context}`);
                return true;
            }
        }
    }

    return false;
}

/**
 * Attempts to retrieve Google Search results contained within the "Knowledge Panel" on the right side
 * of the results page, if it exists. Returns false if a response is not sent to Discord, true otherwise.
 *
 * @param message
 * @param cheerioDOM
 */
function retrieveAnswerFromKnowledgePanel(message, cheerioDOM) {
    let knowledgePanel = cheerioDOM("div[id='wp-tabs-container']").html();

    if (knowledgePanel) {
        const innerDOM = cheerio.load(knowledgePanel);

        let answer = innerDOM("h2[data-attrid='title']").text();

        if (answer) {
            let context = innerDOM('div.kno-rdesc > div > span').first().text();
            if (!context || answer === context) {
                message.channel.send(answer);
                return true;
            } else {
                message.channel.send(`**${answer}**\n${context}`);
                return true;
            }
        }
    }

    return false;
}