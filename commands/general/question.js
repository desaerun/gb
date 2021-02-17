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

    let query = args.join(" ");
    let queryUriString = encodeURIComponent(query);
    let answer;
    let $;

    try {
        const googleQueryUrl = "https://www.google.com/search";
        const maxRetries = 3;

        for (let i = 0; i < maxRetries; i++) {
            const response = await axios.get(googleQueryUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36",
                },
                params: {
                    q: queryUriString,
                }
            });
            if (response.status === 200) {
                $ = cheerio.load(response.data);
                answer = await getAnswerFromGoogleSearch($);

                if (JSON.stringify(answer) !== "{}" && answer.text) {
                    break;
                }
            } else {
                throw new Error(`Response from server was not HTTP 200: ${response.status}`);
            }
        }
        if (answer.text) {
            const answerEmbed = new Discord.MessageEmbed();
            answerEmbed.setTitle(answer.text);
            if (answer.context && answer.context !== answer.text) {
                answerEmbed.setDescription(answer.context);
            }
            if (answer.sourceText) {
                answerEmbed.addField("\u2800",`[${answer.sourceText}](${answer.sourceUrl})`,true);
            }
            answerEmbed.addField("\u2800",`[More results on Google](https://www.google.com/search?q=${queryUriString})`,true);
            console.log("An answer was found!", answer);
            await message.channel.send(answerEmbed);
        } else {
            console.log("No answer was found, attempting to parse search results instead");
            // If neither the Featured Snippet nor the Knowledge Panel exist, return the first few search results
            let resultsEmbedsArr = getSearchResultsAsEmbeddedMessages($);
            console.log(`Successfully parsed search results.  Length: ${resultsEmbedsArr.length}`);
            if (resultsEmbedsArr && resultsEmbedsArr.length > 0) {
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

// selectors is a skeleton describing the expected search results from google and how to find the target DOM member.
// The order is important, as soon as a match is found it will break the loop and stop looking for an answer.
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
 * the panes, and ultimately, the answers, is given in the large "selectors" object above.  Will attempt to retry
 * maxRetries amount of times if the result is blank as sometimes Google is finicky.  Returns a promise that resolves
 * to an object of the following structure: {
 *     text: the main answer text
 *     context: further context
 *     sourceText: text describing the source / article / document from which the answer was pulled
 *     sourceUrl: a link to the sourceText document
 * }
 *
 * @param $ -- the jQuery context of the entire page
 * @returns {Promise<{
 *     text: String,
 *     context: String,
 *     sourceText: String,
 *     sourceUrl: String,
 * }>}
 */

async function getAnswerFromGoogleSearch($) {
    try {
        for (const removalSelector of selectors.remove) {
            $(removalSelector.selector).remove();
        }
        let answer = {};
        for (const panelProto of selectors.panels) {
            const panel = $(panelProto.selector);
            if (panel.text().trim() !== "") {
                if (panelProto.remove && panelProto.remove.length > 0) {
                    for (const removalSelector of panelProto.remove) {
                        panel.find(removalSelector.selector).remove();
                    }
                }
                for (const paneProto of panelProto.paneTypes) {
                    const pane = (paneProto.selector) ? panel.find(paneProto.selector) : panel;
                    if (pane.text().trim() !== "") {
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
                        if (answer.text) break;
                    }
                }
            }
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
async function getSearchResultsAsEmbeddedMessages($, maxSearchResults = 3) {
    try {
        let results = [];

        //loop through search results
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
    } catch (e) {
        throw new Error("Error retrieving search results.");
    }
}