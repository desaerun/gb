//imports
const axios = require("axios");
const {sendMessage} = require("../../tools/utils");

//module settings
const name = "crypto-price";
const description = "Retrieves crypto prices from Coinbase API (in USD)";
const params = [
    {
        param: "cryptoTicker",
        type: "string",
        description: "a crypto ticker (BTC, ETH)",
        default: "BTC",
    }
];

//main
async function execute(client, message, args) {
    if (args.length < 1) {
        await sendMessage(`You must include a crypto ticker (BTC, ETH) with this request.`, message.channel);
        return;
    }

    if (args.length > 1) {
        await sendMessage(`You cannot make multiple requests at once. (Requested ${args})`, message.channel);
        return;
    }

    let crypto = args[0].toUpperCase();

    try {
        const response = await axios.get(`https://api.pro.coinbase.com/products/${crypto}-USD/stats`);
        if (response.status === 200) {
            let coinbaseData = response.data;

            let priceDiff = coinbaseData.last - coinbaseData.open;
            let percDiff = priceDiff / coinbaseData.open;

            let curPriceFormatted = currencyFormat.format(coinbaseData.last);
            let priceDiffFormatted = (priceDiff < 0 ? "" : "+") + currencyFormat.format(priceDiff);
            let percDiffFormatted = (priceDiff < 0 ? "" : "+") + percentFormat.format(percDiff);

            await sendMessage(`1 ${crypto} = **${curPriceFormatted}** (**${priceDiffFormatted}**[**${percDiffFormatted}**] last 24hrs)`, message.channel);
        } else {
            throw new Error(`Request returned status code ${response.status}`);
        }
    } catch (err) {
        await sendMessage(`error fetching crypto price: ${err}`, message.channel);
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
