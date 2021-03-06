//imports
const {sendMessage} = require("../../tools/sendMessage");
const {getTickerData} = require("./stock-price");

//module settings
const name = "gme-price";
const description = "Retrieves GME price from Finnhub API (in USD)";
const allowedContexts = [
    "text",
    "dm",
];
const adminOnly = false;

//main
const execute = async function (message) {
    try {
        const tickerData = await getTickerData("GME");

        let priceDiff = tickerData.c - tickerData.pc;
        let percDiff = priceDiff / tickerData.pc;

        let curPriceFormatted = currencyFormat.format(tickerData.c);
        let priceDiffFormatted = (priceDiff < 0 ? "" : "+") + currencyFormat.format(priceDiff);
        let percDiffFormatted = (priceDiff < 0 ? "" : "+") + percentFormat.format(percDiff);
        await sendMessage(`GME:rocket::full_moon: = **${curPriceFormatted}** (**${priceDiffFormatted}**[**${percDiffFormatted}**] today)`, message.channel);
    } catch (err) {
        await sendMessage(`error fetching stock price: ${err}`, message.channel);
    }
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
    allowedContexts: allowedContexts,
    adminOnly: adminOnly,
}

//helper functions
const currencyFormat = new Intl.NumberFormat("en-US",
    {
        style: "currency",
        currency: "USD"
    });

const percentFormat = new Intl.NumberFormat("en-US",
    {
        style: "percent",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })