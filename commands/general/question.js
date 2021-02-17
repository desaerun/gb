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

    let googleQueryURL = `https://www.google.com/search`;

    try {
        const response = await axios.get(googleQueryURL, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36",
            },
            params: {
                q: query,
            }
        });
        if (response.status === 200) {

            const $ = cheerio.load(response.data);
            // Remove "Videos" box from search results
            $("div.HD8Pae.luh4tb.cUezCb.xpd").remove();

            //  Remove the "featured video"
            // $("div.g.liYKde").remove();

            // remove the "people also ask" pane
            $("div.g.kno-kp.mnr-c.g-blk").remove();

            let answer = retrieveAnswerAndContext($);

            if (answer.text) {
                console.log("An answer was found!",answer);
                if (!answer.context || answer.context === answer) {
                    await message.channel.send(`${answer.text}`);
                } else {
                    await message.channel.send(`**${answer.text}**\n${answer.context}`);
                }
            } else {
                console.log("No answer was found, attempting to parse search results instead");
                // If neither the Featured Snippet nor the Knowledge Panel exist, return the first few search results
                let resultsEmbedsArr = getSearchResultsAsEmbeddedMessages($);
                if (resultsEmbedsArr) {
                    console.log(`Successfully parsed search results.  Length: ${resultsEmbedsArr.length}`);
                    await message.channel.send(`Hmm, I couldn't figure that one out. Maybe these will help:`);
                    for (let i = 0; i < 3 && i < resultsEmbedsArr.length; i++) {
                        console.log(`Sending embed #${i}`);
                        await message.channel.send(resultsEmbedsArr[i]);
                    }
                } else {
                    console.log("Unable to parse the search results.");
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
    // Attempt to parse answer from Featured Snippet first
    return retrieveAnswerFromFeaturedSnippet($) ||
        retrieveAnswerFromKnowledgePanel($);
}

/**
 * Attempts to retrieve Google Search results contained within the "Featured Snippet" above the
 * actual search results to provide in answer. Returns false if no answer is found in the Featured Snippet,
 * an object representing the answer otherwise.
 * @param $
 * @returns {{
 *     text: String,
 *     context: String|undefined,
 *     from: String|undefined,
 *     fromUrl: String|undefined,
 * }|boolean}
 */
function retrieveAnswerFromFeaturedSnippet($) {
    console.log("Attempting to find and parse the Featured Snippet");

    // Grabbing the first div with data-attrid containing a ":/" and aria-level "3"
    // should give us the Featured Snippet box if it exists
    let featuredSnippetPanel = $(`div.ifM9O`).first();

    if (featuredSnippetPanel) {
        console.log("Was able to find Featured Snippet pane");
        // Remove some of the subtext in featured snippet
        featuredSnippetPanel.find("div.yxAsKe.kZ91ed").remove();
        featuredSnippetPanel.find("span.kX21rb").remove();

        //1st type of Featured Snippet pane, verbose
        let answerText = featuredSnippetPanel.find("span.hgKElc").text();
        if (answerText) {
            console.log("An answer was found in the Featured Snippet.")
            const answerSourceLink = featuredSnippetPanel.find("div.yuRUbf");
            const answerSourceText = answerSourceLink.find("h3.LC20lb.DKV0Md > span").text();
            const answerSourceUrl = answerSourceLink.find("a").first().attr("href");
            return {
                text: answerText,
                from: answerSourceText,
                fromUrl: answerSourceUrl,
            };
        }

        //2nd type of Featured Snippet pane, less info
        answerText = featuredSnippetPanel.find("div.Z0LcW.XcVN5d").text();
        if (answerText) {
            return {
                text: answerText,
            }
        }
        console.log("..but no Answer was found in the Featured Snippet.");
        return false;
    }
    console.log("Unable to find the Featured Snippet pane.");
}

/**
 * Attempts to retrieve Google Search results contained within the "Knowledge Panel" on the right side
 * of the results page, if it exists. Returns false no response is found in the Knowledge Panel, an object
 * representing the answer otherwise.
 *
 * @param $
 * @returns {{
 *     text: String,
 *     context: String,
 *     from: String,
 * }|boolean}
 */
function retrieveAnswerFromKnowledgePanel($) {
    console.log("Attempting to find and parse Knowledge Panel...");
    let knowledgePanel = $(`div#wp-tabs-container`);

    if (knowledgePanel) {
        console.log("Was able to find Knowledge Panel");
        const answerText = knowledgePanel.find("div.Z0LcW.XcVN5d").text();
        if (answerText) {
            console.log("Found an answer in the Knowledge Panel.")
            const kpDescription = knowledgePanel.find("div.kno-rdesc > div > span");
            const answerContext = kpDescription.first().text();
            const answerSourceLink = kpDescription.eq(1).find("a");
            const answerSourceText = answerSourceLink.text();
            const answerSourceUrl = answerSourceLink.attr("href");
            return {
                text: answerText,
                context: answerContext,
                from: answerSourceText,
                fromUrl: answerSourceUrl,
            }
        } else {
            console.log("...but was unable to find an answer in the Knowledge Panel.");
            return false;
        }
    }
    console.log("Unable to find Knowledge Panel");
}

/**
 * Generates Embedded Discord Messages out of the first n search results
 *
 * @param $
 * @param maxSearchResults
 */
function getSearchResultsAsEmbeddedMessages($, maxSearchResults = 3) {

    let results = [];

    //loop through search results, skip the Featured Video
    $("div#rso > div.g").each(function (i) {
        if (i >= maxSearchResults) {
            return false;
        }
        let description;
        let title;
        let link;

        //if the search result is the Featured Video, it is handled a little differently
        if ($(this).hasClass("liYKde")) {
            let videoInfo = $(this).find("div.FGpTBd");
            link = videoInfo.find("h3.H1u2de > a").attr("href");
            description = videoInfo.find("h3.LC20lb.MMgsKf > span").text();
        } else {
            description = $(this).find("div.IsZvec > div > span").text();
            title = $(this).find("div > a > h3.LC20lb").text();
            link = $(this).find("div > a").attr("href");
        }
        console.log(`Parsed search result:`);
        console.log(`Description: ${description} | Title: ${title}  | link: ${link}`);

        //if the result is going to be blank, skip it and increase the maxSearchResults
        //(since we can't actually modify the index)
        if (!title && !description) {
            maxSearchResults++;
            return;
        }
        let embedMessage = new Discord.MessageEmbed()
            .setURL(link);
        if (title) {
            embedMessage.setTitle(`**${title}**`)
            .setDescription(description);
        } else if (description) {
            embedMessage.setTitle(description);
        }
        results.push(embedMessage);
    });

    if (results.length === 0) {
        console.log("search results length was 0, returning false");
        return false;
    }
    console.log(`retrieved valid search results, returning array of discord embeds, length: ${results.length}`);
    return results;
}