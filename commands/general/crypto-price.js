//imports
const axios = require("axios");
const moment = require("moment");
const fs = require("fs");
const sendLongMessage = require("../../tools/sendLongMessage");

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
    //todo: get coinbase data first, only fall back on coingecko if ticker is not available,

    //todo: draw candlestick chart
    //todo: make output prettier (discord embed? inline fields? include market cap/volume?)
    if (args.length === 0) {
        await message.channel.send(`You must include a crypto ticker (BTC, ETH) with this request.`);
        return;
    }

    let symbols = args;
    let output = [];
    let coinbaseCoins = {};
    let coinbaseSuccessCoins = [];
    for (const symbol of symbols) {
        coinbaseCoins[symbol] = getCoinbasePriceData(symbol);
        if (coinbaseCoins[symbol]) {
            coinbaseSuccessCoins.push(symbol);
        }
    }
    const remainingSymbols = symbols.filter(s => !coinbaseSuccessCoins.includes(s)).join(",");
    const coinGeckoCoins = getCoinGeckoPriceData(remainingSymbols,"usd");
    const finalCoinsList = {
        ...coinbaseCoins,
        ...coinGeckoCoins,
    }
    for (const [coin,coinInfo] of Object.entries(finalCoinsList)) {
        const priceDiff = coinInfo.last - coinInfo.open;
        const percDiff = priceDiff / coinInfo.open;
        let curPriceFormatted = currencyFormat.format(coinInfo.last);
        let priceDiffFormatted = (priceDiff < 0) ? "" : "+" + currencyFormat.format(priceDiff);
        let percDiffFormatted = (priceDiff < 0) ? "" : "+" + percentFormat.format(percDiff);
        output.push(`1 ${coin.toUpperCase()} = **${curPriceFormatted}** (**${priceDiffFormatted}**[**${percDiffFormatted}**] last 24hrs) (${coinInfo.source})`)
    }
    if (output.length > 0) {
        await sendLongMessage(output.join("\n"),message.channel);
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
async function getCoinbasePriceData(symbol) {
    try {
        const coinbaseRequest = await axios.get(`https://api.pro.coinbase.com/products/${symbol}-USD/stats`);
        if (coinbaseRequest.status === 200) {
            const coinbaseData = coinbaseRequest.data;
            if (coinbaseData.message && coinbaseData.message === "NotFound") {
                return false;
            }
            let coins = {};
            coins[symbol] = {
                last: coinbaseData.last,
                open: coinbaseData.open,
                volume: coinbaseData.volume,
                updated: +Date.now(),
                source: "Coinbase",
            };
            return coins;
        }
    } catch (e) {
        throw new Error("There was an unexpected error retrieving the price from Coinbase.");
    }
}
async function getCoinGeckoPriceData(symbols,vsCurrency = "usd") {
    const coinIds = getCoinGeckoCoinInfo(symbols);
    let coins = {};
    try {
        const coinPriceRequest = await axios.get("https://api.coingecko.com/api/v3/simple/price",{
            params: {
                ids: coinIds,
                vs_currencies: vsCurrency,
                include_market_cap: true,
                include_24h_vol: true,
                include_24hr_change: true,
                include_last_updated_at: true,
            }
        });
        if (coinPriceRequest.status === 200) {
            for (const [coinId, priceData] of Object.entries(coinPriceRequest.data)) {
                //coinGecko only gives "last" and "percent change"...
                //calculate the Opening price:
                const open = priceData[vsCurrency] / ((100 + priceData[`${vsCurrency}_24h_change`]) / 100);
                coins[coinId] = {
                    last: priceData[vsCurrency],
                    open: open,
                    volume: priceData[`${vsCurrency}_24h_vol`],
                    updated: priceData[last_updated_at],
                    source: "CoinGecko",
                };
            }
            return coins;
        } else {
            throw new Error(`HTTP status was not 200: ${coinPriceRequest.status}`);
        }
    } catch (e) {
        throw new Error(`There was an unexpected error retrieving CoinGecko price data: ${e}`);
    }
}
async function getCoinGeckoCoinInfo(symbols) {
    const coinsList = await getCoinGeckCoinsList();
    symbols = symbols.toLowerCase().split(",");
    const coins = coinsList.filter(c => symbols.includes(c.id));
    if (coins && coins.some(c => c.id)) {
        return coins;
    } else {
        return false;
    }
}
async function getCoinGeckCoinsList() {
    const cryptoCoinsListFile = "./data/cryptoCoinsList.json";
    let coinsListData;
    let allowedAgeDiff = (24 * 60 * 60 * 1000); // new coin list cache is fresh if it's newer than 1 day
    let allowedAge = +Date.now() - allowedAgeDiff;

    //check if the coins list is already cached
    if (fs.existsSync(cryptoCoinsListFile)) {
        //if the coins list is already cached,
        //check its age
        const modified = fs.statSync(cryptoCoinsListFile).mtime.getTime();
        console.log(`coins list file modified: ${modified}, max allowed age: ${allowedAge}`);
        if (modified < allowedAge) {
            //if it's older than the allowed age, fetch data from API and update the cache.
            try {
                coinsListData = await getCoinGeckoAPICoinsList();
                fs.writeFileSync(cryptoCoinsListFile,JSON.stringify(coinsListData));
                return coinsListData;
            } catch (e)  {
                throw new Error(e);
            }
        } else {
            //else just pull it from the cache
            console.log("Using cached coins list.");
            return JSON.parse(fs.readFileSync(cryptoCoinsListFile,"utf8"));
        }
    } else {
        //if not, fetch from API and write to cache
        try {
            coinsListData = await getCoinGeckoAPICoinsList();
        } catch (e) {
            throw new Error(e);
        }
        fs.writeFileSync(cryptoCoinsListFile,JSON.stringify(coinsListData));
        return coinsListData;
    }
}
async function getCoinGeckoAPICoinsList() {
    console.log("Fetching fresh coins list from API.");
    try {
        const coinsListRequest = await axios.get("https://api.coingecko.com/api/v3/coins/list");
        if (coinsListRequest.status === 200) {
            return coinsListRequest.data;
        } else {
            throw new Error(`HTTP status was not 200: ${coinsListRequest.status}`);
        }
    } catch (e) {
        throw new Error(`There was an unexpected error retrieving API coin list: ${e}`);
    }
}
async function getCoinGeckoOhlcData(coinId,vsCurrency = "usd", days = 1) {
    try {
        const coinOhlcRequest = await axios.get(`https://api.coingeck.com/api/v3/coins/${coinId}/ohlc`,{
            params: {
                vs_currency: vsCurrency,
                days: days,
            }
        });
        if (coinOhlcRequest.status === 200) {
            return coinOhlcRequest.data;
        } else {
            throw new Error(`HTTP status not 200: ${coinOhlcRequest.status}`);
        }
    } catch (e) {
        throw new Error(`There was an unexpected error retrieving OHLC data from API: ${e}`);
    }
}
const currencyFormat = new Intl.NumberFormat("en-US",
    {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: minPlaces,
        maximumFractionDigits: maxPlaces,
    });
const percentFormat = new Intl.NumberFormat("en-US",
    {
        style: "percent",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });