//imports
const axios = require("axios");
const cheerio = require("cheerio");
const Discord = require("discord.js");
const fs = require("fs");
const {sendMessage} = require("../../tools/sendMessage");

//module settings
const name = "question";
const aliases = ["q"];
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

    let query = args.join(" ");
    let queryUriString = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    let $;
    try {
        $ = await getGoogleSearchPageAsCheerioObject(query);
    } catch (e) {
        throw e;
    }
    try {
        let answer = await getAnswer($, query);

        if (answer.text) {
            const answerEmbed = new Discord.MessageEmbed();
            if (answer.text && answer.context && answer.text !== answer.context) {
                answerEmbed.setTitle(answer.text);
                answerEmbed.setDescription(answer.context);
            } else if (answer.context && answer.context !== answer.text) {
                answerEmbed.setDescription(answer.context);
            } else if (!answer.context || answer.context === answer.text) {
                answerEmbed.setDescription(answer.text);
            }
            if (answer.sourceText) {
                answerEmbed.addField("\u2800", `[${answer.sourceText}](${answer.sourceUrl})`, true);
                answerEmbed.addField("\u2800", `\u2800`, true);
            }
            answerEmbed.addField("\u2800", `[More results on Google](${queryUriString})`, true);
            await sendMessage(answerEmbed, message.channel);
        } else {
            console.log("No answer was found, attempting to parse search results instead");
            // If an answer was not able to be parsed, return the first few search results
            let resultsEmbedsArr = getSearchResultsAsEmbeddedMessages($);
            console.log(`Successfully parsed search results.  Length: ${resultsEmbedsArr.length}`);
            let moreGoogleResultsText;
            if (resultsEmbedsArr && resultsEmbedsArr.length > 0) {
                await sendMessage(`Hmm, I couldn't figure that one out. Maybe these will help:`, message.channel);
                moreGoogleResultsText = "More Results on Google";
                for (let i = 0; i < resultsEmbedsArr.length; i++) {
                    console.log(`Sending embed #${i}`);
                    await sendMessage(resultsEmbedsArr[i], message.channel);
                }

            } else {
                console.log("Unable to parse the search results.");
                // write the html of the page to a file to try to figure out why it couldn't parse the search
                // results page
                fs.writeFileSync(`./logs/questionResults/googleSearchResultsPage-${+Date.now()}.html`, $.html());

                // If all else fails, kindly inform the user that an answer was not found.
                await sendMessage(`Unable to find an answer. Please go fuck yourself.`, message.channel);
                moreGoogleResultsText = "Try your search on Google";
            }
            const moreGoogleResultsEmbed = new Discord.MessageEmbed()
                .setTitle(moreGoogleResultsText)
                .setURL(queryUriString);
            await sendMessage(moreGoogleResultsEmbed, message.channel);
        }
    } catch (err) {
        await sendMessage(`Error encountered while attempting to answer your question: ${err}`, message.channel);
    }
}

//module export
module.exports = {
    name: name,
    aliases: aliases,
    description: description,
    params: params,
    execute: execute,
}

//helper functions

/**
 * Tries to get an answer, attempts maxRetries times before returning a blank object.
 * Returns a Promise that resolves to an object of the following structure:
 * {
 *     text: the main answer text
 *     context: further context
 *     sourceText: title of the source / article / document from which the answer was pulled
 *     sourceUrl: a link to the sourceText document
 *     sourcePane: A name describing the pane where the answer was found.
 * }
 * @param $ -- the Cheerio object representing the entire Google search results page.
 * @param query -- the question that was queried for
 * @param maxRetries -- how many times to attempt to retry if the answer is not found
 * @returns {Promise<{
 *     text: String,
 *     context: String,
 *     sourceText: String,
 *     sourceUrl: String,
 *     sourcePane: String
 * }>}
 */
async function getAnswer($, query, maxRetries = 3) {
    let answer;
    for (let i = 1; i <= maxRetries; i++) {
        answer = await getAnswerFromGoogleSearch($);
        if (JSON.stringify(answer) !== "{}" && answer.text) {
            break;
        }
        console.log(`Couldn't find an answer. Attempting to retry, attempt #${i}`);
        $ = await getGoogleSearchPageAsCheerioObject(query);
    }
    return answer;
}

/**
 * Queries the Google search results page and returns the entire page as a Promise that resolves to a
 * Cheerio (node jQuery) object.
 * @param query -- What to search for.
 * @returns {Promise<cheerio.Root|jQuery|HTMLElement>}
 */
async function getGoogleSearchPageAsCheerioObject(query) {
    let $;
    try {
        const googleQueryUrl = "https://www.google.com/search";
        const response = await axios.get(googleQueryUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36",
            },
            params: {
                q: query,
            }
        });
        if (response.status === 200) {
            $ = cheerio.load(response.data);
        } else {
            throw new Error(`Response from server was not HTTP 200: ${response.status}`);
        }
    } catch (e) {
        throw e;
    }
    return $;
}

// selectors is a skeleton describing the expected search results from google and how to find the target DOM member.
// The order is important, as soon as a match is found it will break the loop and stop looking for an answer in
// any of the other panes, even if one exists.
const selectors = {
    remove: [
        {
            name: "Videos Box",
            selector: "div.HD8Pae.luh4tb.cUezCb.xpd",
        },
        {
            name: "People also ask",
            selector: "div.g.kno-kp.mnr-c.g-blk",
        }
    ],
    panels: [
        {
            name: "Weather Info",
            selector: "div#wob_wc",
            paneTypes: [
                {
                    name: "Weather Channel pane",
                    answerText: {
                        selector: "span#wob_tm.wob_t.TVtOme",
                        append: " degrees F"
                    },
                    answerContext: {
                        selector: "span#wob_dc.vk_gy.vk_sh",
                    },
                },
            ],
        },
        {
            name: "Currency Panel",
            selector: "div.VgAgW",
            paneTypes: [
                {
                    name: "Currency Pane",
                    selector: "div#knowledge-currency__updatable-data-column",
                    answerText: {
                        prepend: "$",
                        selector: "div.dDoNo.ikb4Bb.vk_bk.gsrt.gzfeS",
                    },
                    answerContext: {
                        prepend: "as of ",
                        selector: "div.hqAUc > span",
                    }
                },
            ],
        },
        {
            name: "Featured Snippet",
            selector: "div.ifM9O:eq(0)",
            remove: [
                {
                    name: "featuredSnippet_subtext1",
                    selector: "div.yxAsKe.kZ91ed",
                },
                {
                    name: "featuredSnippet_subtext2",
                    selector: "span.kX21rb",
                },
            ],
            paneTypes: [
                {
                    name: "top main Featured Snippet",
                    answerText: {
                        selector: "span.hgKElc",
                    },
                    answerSourceText: {
                        selector: "h3.LC20lb.DKV0Md > span",
                    },
                    answerSourceUrl: {
                        selector: "div.yuRUbf > a:eq(0)",
                    },
                },
                {
                    name: "top main Information Pane",
                    answerText: {
                        selector: "div.Z0LcW.XcVN5d",
                    },
                },
            ],
        },
        {
            name: "Knowledge Panel",
            selector: "div#wp-tabs-container",
            paneTypes: [
                {
                    name: "right side condensed knowledge Panel",
                    answerText: {
                        selector: "h2.qrShPb.kno-ecr-pt.PZPZlf.mfMhoc",
                    },
                    answerContext: {
                        selector: "div.kno-rdesc > div > span:eq(0)",
                    },
                    answerSourceText: {
                        selector: "a.ruhjFe.NJLBac.fl",
                    },
                    answerSourceUrl: {
                        selector: "a.ruhjFe.NJLBac.fl",
                    },
                },
                {
                    name: "top main Knowledge Panel",
                    selector: "div.kno-rdesc > div",
                    answerText: {
                        selector: "span:eq(0)",
                    },
                    answerSourceText: {
                        selector: "span:eq(1) > a",
                    },
                    answerSourceUrl: {
                        selector: "span:eq(1) > a",
                    },
                },
            ],
        },
        {
            name: "TimeDate Panel",
            selector: "div.vk_c.vk_gy.vk_sh.card-section.sL6Rbf",
            paneTypes: [
                {
                    name: "main time pane",
                    answerText: {
                        selector: "div.gsrt.vk_bk.dDoNo.FzvWSb.XcVN5d",
                    },
                    answerContext: {
                        selector: "div.vk_gy.vk_sh,span.vk_gy.vk_sh",
                    },
                },
            ],
        },
        {
            name: "Duration Panel",
            selector: "div.HwtpBd.gsrt.PZPZlf",
            paneTypes: [
                {
                    name: "main duration pane",
                    answerText: {
                        selector: "div.Z0LcW.XcVN5d",
                    },
                    answerContext: {
                        selector: "div.yxAsKe.kZ91ed",
                    },
                },
            ],
        },
    ],
};

/**
 * Scrapes Google Search results to find the answer to the query given.  The document structure (where to look for
 * the panes, and ultimately, the answers, is given in the large "selectors" object above. Returns a Promise
 * that resolves to an object of the following structure:
 * {
 *     text: the main answer text
 *     context: further context
 *     sourceText: title of the source / article / document from which the answer was pulled
 *     sourceUrl: a link to the sourceText document
 *     sourcePane: A name describing the pane where the answer was found.
 * }
 *
 * @param $ -- the jQuery (cheerio) context of the entire page
 * @returns {Promise<{
 *     text: String,
 *     context: String,
 *     sourceText: String,
 *     sourceUrl: String,
 *     sourcePane: String,
 * }>}
 */
async function getAnswerFromGoogleSearch($) {
    try {
        let answer = {};

        //globally remove DOM objects from the entire context
        for (const removalSelector of selectors.remove) {
            $(removalSelector.selector).remove();
        }

        //loop through each type of google search result Panel, as defined in the selectors object
        for (const panelProto of selectors.panels) {
            const panel = $(panelProto.selector);

            if (panel.text().trim() !== "") {
                // if there was _something_ in the resulting Panel

                //if there are any sub-panes / DOM objects that need to be removed to make DOM selection easier
                // (as defined in the selectors object), loop through and remove them all
                if (panelProto.remove && panelProto.remove.length > 0) {
                    for (const removalSelector of panelProto.remove) {
                        panel.find(removalSelector.selector).remove();
                    }
                }

                // for each of the various "varieties" of pane (big, centered Knowledge Panel vs. small, condensed,
                // "side" knowledge panel, for example), loop through them
                for (const paneProto of panelProto.paneTypes) {

                    // if no "sub-selector" is defined for this type of pane, just use the entire pane
                    const pane = (paneProto.selector) ? panel.find(paneProto.selector) : panel;
                    if (pane.text().trim() !== "") {
                        //if _something_ was found inside this pane, try to extract it to the answer object properties.
                        if (paneProto.answerText) {
                            answer.text = extractTextFromPaneViaProtoSelector(pane, paneProto.answerText);
                        }
                        if (paneProto.answerContext) {
                            answer.context = extractTextFromPaneViaProtoSelector(pane, paneProto.answerContext);
                        }
                        if (paneProto.answerSourceText) {
                            answer.sourceText = extractTextFromPaneViaProtoSelector(pane, paneProto.answerSourceText);
                        }
                        if (paneProto.answerSourceUrl) {
                            answer.sourceUrl = pane.find(paneProto.answerSourceUrl.selector).attr("href");
                        }

                        // apply this property to track which pane ended up passing the answer back
                        answer.sourcePane = paneProto.name;

                        // if there is text in the answer.text value (meaning we found some sort of answer),
                        // break the loop.  This is why the order of the panels/panes in the selectors object
                        // is important.
                        if (answer.text) break;
                    }
                }
            }
            // don't loop through any more panels if an answer has already been found.
            // This is again why the order of the panels/panes in the selectors object is important.
            if (answer.text) break;
        }
        return answer;
    } catch (e) {
        throw e;
    }
}

/**
 * Extracts answer text from Google Search Results panes based on the pane prototypes, and then prepends
 * or appends text as needed.  Returns a trimmed string with the answer, or an empty string if it was not able to find
 * the answer.
 *
 * @param pane -- the jquery object representing the pane that will be searched
 * @param protoText -- the object representing the prototype of the pane, containing the definitions of the jQuery
 *                     selectors needed to extract the answer text.
 * @returns {string}  -- a trimmed string containing the answer text, if found.
 */
function extractTextFromPaneViaProtoSelector(pane, protoText) {
    let answerText = "";
    if (protoText.prepend) {
        answerText = protoText.prepend;
    }
    answerText += pane.find(protoText.selector).text().trim();
    if (protoText.append) {
        answerText += protoText.append;
    }
    answerText = answerText.trim();
    return answerText;
}

/**
 * Generates Embedded Discord Messages out of the first n search results
 *
 * @param $
 * @param maxSearchResults
 */
function getSearchResultsAsEmbeddedMessages($, maxSearchResults = 3) {
    try {
        let results = [];

        //loop through search results
        $("div#rso").find("div.g").each(function (i) {
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
            //todo: this should literally never happen; something is preventing parsing of search results,
            // especially when there is a featured video or big non-parsed knowledge pane or info box at the top
            // of the search results.
            // this results in the "fuck you" message.
            console.log("search results length was 0, returning false");
            return false;
        }
        console.log(`retrieved valid search results, returning array of discord embeds, length: ${results.length}`);
        return results;
    } catch (e) {
        throw new Error("Error retrieving search results.");
    }
}