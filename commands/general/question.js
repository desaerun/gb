//imports
const axios = require("axios");
const cheerio = require("cheerio");
const Discord = require("discord.js");

//module settings
const name = "question";
const description = "Attempts to answer your question";
const params = [
    {
        param: "question",
        type: "string",
        description: "A question that the bot will attempt to answer",
        default: "boobies",
    }
];

//main
async function execute(client, message, args) {

    let query = args.join("+");

    let googleQueryURL = `https://www.google.com/search?q=${query}`;

    try {
        const response = await axios.get(googleQueryURL, {headers: {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36"}});
        if (response.status === 200) {

            const $ = cheerio.load(response.data);
            // Remove "Videos" box from search results
            $("div.HD8Pae.luh4tb.cUezCb.xpd.O9g5cc.uUPGi").remove();

            let [answer,context] = retrieveAnswerAndContext($);

            if (answer) {
                if (!context || context === answer) {
                    await message.channel.send(`${answer}`);
                } else {
                    await message.channel.send(`**${answer}** ${context}`);
                }
            } else {
                // If neither the Featured Snippet nor the Knowledge Panel exist, return the first few search results
                let results = getSearchResultsAsEmbeddedMessages($);
                if (results) {
                    await message.channel.send(`Hmm, I couldn't figure that one out. Maybe these will help:`);

                    for (let i = 0; i < 3 && i < results.length; i++) {
                        await message.channel.send(results[i]);
                    }
                } else {
                    // If all else fails, kindly inform the user that an answer was not found.
                    await message.channel.send(`Unable to find an answer. Please go fuck yourself.`);
                }
            }
        } else {
            throw new Error(`Request returned status code ${response.status}`);
        }
    } catch (err) {
        await message.channel.send(`Error encountered while attempting to answer your question: ${err}`);
    }
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
}

//helper functions
function retrieveAnswerAndContext($) {
    let answer;
    let context;

    // Attempt to parse answer from Featured Snippet first
    [answer,context] = retrieveAnswerFromFeaturedSnippet($);
    if (answer) {
        return [answer,context];
    }
    // If the answer was not found in the Featured Snippet, try parsing the Knowledge Panel
    [answer,context] = retrieveAnswerFromKnowledgePanel($);
    if (answer) {
        return [answer,context];
    }
    return false;
}

/**
 * Attempts to retrieve Google Search results contained within the "Featured Snippet" above the
 * actual search results to provide in answer. Returns false if a response is not sent to Discord,
 * true otherwise.
 * @param $
 * @returns {String[]|boolean}
 */
function retrieveAnswerFromFeaturedSnippet($) {

    // Grabbing the first div with data-attrid containing a ":/" and aria-level "3"
    // should give us the Featured Snippet box if it exists
    let featuredSnippetPanel = $(`div[data-tts="answers"],div[data-attrid*=":/"][aria-level="3"],div.EfDVh.mod > div > div > div[aria-level="3"]`).first();

    if (featuredSnippetPanel) {
        console.log("Was able to find InnerDOM on Featured Snippet")
        // Remove some of the subtext in featured snippet
        featuredSnippetPanel.find("div.yxAsKe.kZ91ed").remove();
        featuredSnippetPanel.find("span.kX21rb").remove();

        let answer = featuredSnippetPanel.text();

        if (answer) {
            let context = $("span.hgKElc").text();
            return [answer,context];
        }
        console.log("..but no Answer was found in the Featured Snippet.");
    }
    console.log("Was not able to retrieve answer from Featured Snippet.");
    return false;
}

/**
 * Attempts to retrieve Google Search results contained within the "Knowledge Panel" on the right side
 * of the results page, if it exists. Returns false if a response is not sent to Discord, true otherwise.
 *
 * @param message
 * @param $
 */
function retrieveAnswerFromKnowledgePanel($) {
    let knowledgePanel = $(`div[id="wp-tabs-container"]`);

    if (knowledgePanel) {
        console.log("Was able to find Knowledge Panel");
        let answer = knowledgePanel.find("h2[data-attrid='title']").text();

        if (answer) {
            let context = innerDOM("div.kno-rdesc > div > span").first().text();
            return [answer,context];
        }
        console.log("...but was unable to find an answer here.");
    }
    console.log("Unable to find answer in Knowledge Panel");
    return false;
}

/**
 * Generates Embedded Discord Messages out of the first 3 search results and sends them to the
 * designated channel
 *
 * @param message
 * @param $
 */
async function getSearchResultsAsEmbeddedMessages($) {
    // Remove the "People also ask" section as these _aren't_ the thing we want an answer to
    $("div.g.kno-kp.mnr-c.g-blk").remove();

    let results = [];

    $("div.rc").each(function () {
        let description = $(this).find("div.IsZvec > div > span").text();
        let title = $(this).find("div > a > h3.LC20lb").text();
        let link = $(this).find("div > a").attr("href");

        let embedMessage = new Discord.MessageEmbed()
            .setTitle(`**${title}**`)
            .setURL(link)
            .setDescription(description);

        results.push(embedMessage);
    });

    if (results.length === 0) {
        return false;
    }
    return results;
}