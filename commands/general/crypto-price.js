//imports
const axios = require("axios");
const moment = require("moment");
const fs = require("fs");
const sendLongMessage = require("../../tools/sendLongMessage");
const {createCanvas} = require("canvas");

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
    if (args.length === 0) {
        await message.channel.send(`You must include a crypto ticker (BTC, ETH) with this request.`);
        return;
    }

    //join the args to one big long comma-separated string
    let symbols = args;
    let output = [];
    console.log(`symbols: ${symbols}`);

    try {
        //get the list of coins
        const coinsList = await getCoinsList();

        let coins = {};

        //for each of the symbols, get the CoinGecko coin-id
        for (const symbol of symbols) {
            const coin = getCoinInfo(symbol, coinsList);
            //and push it onto the coinIds array
            if (coin) {
                coins[coin.id] = coin;
            } else {
                await message.channel.send(`${symbol.toUpperCase()} is not a valid coin.`);
            }
        }
        const vsCurrency = "usd";
        coins = await getCoinPrices(coins,vsCurrency);
        for (let coinData of Object.values(coins)) {
            console.log(coinData);
            const symbol = coinData.symbol.toUpperCase();
            const priceFormatted = formatMoney(coinData[vsCurrency]);
            const percentChange = coinData[`${vsCurrency}_24h_change`];
            console.log(percentChange);
            const percentChangeFormatted = percentFormat.format(percentChange);
            console.log(percentChangeFormatted);
            const previousPrice = coinData.price / (1 + (percentChange / 100));

            const priceChange = coinData[vsCurrency] - previousPrice;
            const priceChangeFormatted = formatMoney(priceChange);

            output.push(`1 ${symbol} = **${priceFormatted}** (**${priceChangeFormatted}**[**${percentChangeFormatted}**] last 24hrs) (Last updated: ${moment(coinData.last_updated_at).format("HH:mm:ss")})`);
            //price change: coinData.usd_24h_change
            //24h volume: coinData.usd_24h_vol
            //update timestamp: coinData.last_updated_at
            //formula for calculating previous price change:
            //priceNow - (1 + (change% / 100))
        }
    } catch (err) {
        await message.channel.send(`error fetching crypto price: ${err}`);
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
async function getCoinPrices(coins,vsCurrency = "usd") {
    const coinIdsStr = Object.keys(coins).join(",");
    console.log(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIdsStr}&vs_currencies=${vsCurrency}`);
    try {
        const coinPriceRequest = await axios.get("https://api.coingecko.com/api/v3/simple/price",{
            params: {
                ids: coinIdsStr,
                vs_currencies: vsCurrency,
                include_market_cap: true,
                include_24h_vol: true,
                include_24hr_change: true,
                include_last_updated_at: true,
            }
        });
        if (coinPriceRequest.status === 200) {
            for (const [coinId,priceData] of Object.entries(coinPriceRequest.data)) {
                coins[coinId] = {
                    ...coins[coinId],
                    ...priceData
                }
            }
            return coins;
        } else {
                throw new Error(`HTTP status was not 200: ${coinPriceRequest.status}`);
        }
    } catch (e) {
        throw new Error(`There was an unexpected error retrieving price data: ${e}`);
    }
}
function getCoinInfo(symbol, coinsList) {
    const crypto = symbol.toLowerCase();
    const coin = coinsList.find(c => (c.symbol === crypto || c.id === crypto));
    console.log(`symbol: ${symbol} | coin: ${JSON.stringify(coin)}`);
    if (coin && coin.id) {
        return coin;
    } else {
        return false;
    }
}
async function getCoinsList() {
    const cryptoCoinsListFile = "./data/cryptoCoinsList.json";
    let coinsListData;
    let allowedAge = (24 * 60 * 60 * 1000); // new coin list cache is fresh if it's newer than 1 day

    //check if the coins list is already cached
    if (fs.existsSync(cryptoCoinsListFile)) {
        //if the coins list is already cached,
        //check its age
        const modified = fs.statSync(cryptoCoinsListFile).mtime.getTime();
        if (modified < +Date.now() - allowedAge) {
            //if it's older than the allowed age, fetch data from API and update the cache.
            try {
                coinsListData = await getAPICoinsList();
            } catch (e)  {
                throw new Error(e);
            }
        } else {
            //else just pull it from the cache
            coinsListData = JSON.parse(fs.readFileSync(cryptoCoinsListFile,"utf8"));
        }
    } else {
        //if not, fetch from API and write to cache
        try {
            coinsListData = await getAPICoinsList();
        } catch (e) {
            throw new Error(e);
        }
        fs.writeFileSync(cryptoCoinsListFile,JSON.stringify(coinsListData));
    }
    return coinsListData;
}
async function getAPICoinsList() {
    console.log("Fetching coins list from API.");
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
async function getCoinOhlcData(coinId,vsCurrency = "usd", days = 1) {
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
function formatMoney(n,minPlaces = 2, maxPlaces = 8) {
    const currencyFormat = new Intl.NumberFormat("en-US",
        {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: minPlaces,
            maximumFractionDigits: maxPlaces,
        });
    return currencyFormat.format(n);
}
const percentFormat = new Intl.NumberFormat("en-US",
    {
        style: "percent",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

async function drawCandles(ticker,range) {
    let data = await getCoinOhlcData();

    let width = 400;
    let height = 400;

    const canvas = createCanvas(width,height);
    const context = canvas.getContext("2d");

    context.fillStyle = "#000";
    context.fillRect(0, 0, width, height);

}

