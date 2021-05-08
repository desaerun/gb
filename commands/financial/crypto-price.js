//imports
const prettyMilliseconds = require("pretty-ms");
const {formatMoney} = require("../../tools/utils");
const {getCryptoInfoWithPriceData} = require("../../tools/getCryptoPrice");
const {sendMessage} = require("../../tools/sendMessage");

//module settings
const name = "crypto-price";
const aliases = ["crypto", "cp", "price-crypto", "cprice"];
const description = "Retrieves crypto prices from Coinbase API (in USD)";
const params = [
    {
        param: "cryptoTicker...",
        type: "String",
        description: "a crypto ticker (BTC, ETH) or name (Bitcoin, Ethereum)",
        default: "BTC",
    }
];
const helpText = "Names that are more than one word can be searched by enclosing in quotes, e.g. " +
    "`-crypto-price \"Basic Attention Token\"`.";
const examples = [
    "-crypto-price btc",
    "-crypto-price btc eth doge",
]

//main
const execute = async function (client, message, args) {
    //todo: draw candlestick chart
    //todo: make output prettier (discord embed? inline fields? include market cap/volume?)
    if (args.length === 0) {
        await message.channel.send(`You must include a crypto ticker (BTC, ETH) with this request.`);
        return;
    }
    let cryptosInfoWithPriceData = await getCryptoInfoWithPriceData(args);

    let output = [];

    //if at least some coin price was able to be retrieved
    if (!Object.values(cryptosInfoWithPriceData).every(c => c.error)) {
        const errors = [];
        for (const cryptoInfoWithPriceData of Object.values(cryptosInfoWithPriceData)) {
            if (!cryptoInfoWithPriceData.error) {
                const priceDiff = cryptoInfoWithPriceData.priceData.last - cryptoInfoWithPriceData.priceData.open;
                const percDiff = priceDiff / cryptoInfoWithPriceData.priceData.open;

                const curPriceFormatted = formatMoney(cryptoInfoWithPriceData.priceData.last);

                const downSymbol = ":small_red_triangle_down:";
                const upSymbol = ":evergreen_tree:";

                //get the decimal precision that was used for the "current price"
                const precisionFromCurPrice = curPriceFormatted.split(".")[1].length;

                const priceDiffFormatted = (priceDiff < 0) ?
                    downSymbol + formatMoney(priceDiff, precisionFromCurPrice) :
                    upSymbol + formatMoney(priceDiff, precisionFromCurPrice);
                const percDiffFormatted = (priceDiff < 0) ?
                    downSymbol + percentFormat.format(percDiff) :
                    upSymbol + percentFormat.format(percDiff);

                const coinName = (
                    cryptoInfoWithPriceData.name &&
                    cryptoInfoWithPriceData.name !== cryptoInfoWithPriceData.symbol) ?
                    `**${cryptoInfoWithPriceData.symbol.toUpperCase()}** (${cryptoInfoWithPriceData.name})` :
                    cryptoInfoWithPriceData.symbol.toUpperCase();

                const dataAge = Date.now() - (cryptoInfoWithPriceData.priceData.updated);
                let formattedDataAge;
                if (dataAge < (1000 * 30)) {
                    formattedDataAge = "Live";
                } else {
                    formattedDataAge = prettyMilliseconds(dataAge, {secondsDecimalDigits: 0}) + " ago";
                }

                output.push(`1 ${coinName} = **${curPriceFormatted}** `
                    + `(**${priceDiffFormatted}**[**${percDiffFormatted}**] last 24hrs) `
                    + `(${cryptoInfoWithPriceData.priceData.source}) (${formattedDataAge})`);
            } else {
                errors.push(cryptoInfoWithPriceData.error);
            }
        }
        if (errors.length > 0) {
            output.push(errors.join("\n"));
        }
        if (output.length > 0) {
            await sendMessage(output.join("\n"), message.channel);
        }
    } else {
        await sendMessage("There was no price info available for any provided symbols.", message.channel);
    }
}

//module export
module.exports = {
    name: name,
    aliases: aliases,
    description: description,
    params: params,
    helpText: helpText,
    examples: examples,
    execute: execute,
}

//helper functions

const percentFormat = new Intl.NumberFormat("en-US",
    {
        style: "percent",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });