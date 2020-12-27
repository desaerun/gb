const axios = require('axios');
const cheerio = require('cheerio');
const Discord = require('discord.js');

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

                // Attempt to parse answer from Featured Snippet first
                if (retrieveAnswerFromFeaturedSnippet(message, cheerioDOM)) {
                    return;
                }

                // If there is no Featured Snippet, parse the Knowledge Panel
                if (retrieveAnswerFromKnowledgePanel(message, cheerioDOM)) {
                    return;
                }

                // If neither the Featured Snippet nor the Knowledge Panel exist, return the first few search results
                if (sendSearchResultsAsEmbeddedMessage(message, cheerioDOM)) {
                    return;
                }

                // If all else fails, kindly inform the user that an answer was not found.
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

    // Grabbing the first div with data-attrid containing a ":/" and aria-level "3"
    // should give us the Featured Snippet box if it exists
    let innerDOMString = cheerioDOM('div[data-tts="answers"],div[data-attrid*=":/"][aria-level="3"],div.EfDVh.mod > div > div > div[aria-level="3"]').first().html();

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

/**
 * Generates Embedded Discord Messages out of the first 3 search results and sends them to the
 * designated channel
 *
 * @param message
 * @param cheerioDOM
 */
function sendSearchResultsAsEmbeddedMessage(message, cheerioDOM) {
    message.channel.send('Attempting to get data from search results');

    // Remove the "People also ask" section as these _aren't_ the thing we want an answer to
    cheerioDOM('div.g.kno-kp.mnr-c.g-blk').remove();

    let results = [];

    cheerioDOM('div.rc').each(function () {
        let link = cheerioDOM('div > a').attr('href');
        message.channel.send(`Found link ${link}`);
        let title = cheerioDOM('div > a > h3.LC20lb > span').text();
        message.channel.send(`Link title ${title}`);
        let description = cheerioDOM('div.IsZvec > div > span:not([class!=""])').text();
        message.channel.send(`Link description ${description}`);

        let embedMessage = new Discord.MessageEmbed()
            .setTitle(`[**${title}**](${link})`)
            .setDescription(description);

        results.push(embedMessage);
    });

    message.channel.send(`Attempting to send embedded messages ${results}`);

    for (const result of results) {
        message.channel.send(result);
    }
}