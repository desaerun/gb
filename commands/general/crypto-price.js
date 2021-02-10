//imports
const axios = require("axios");
const fs = require("fs");
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
    let symbols = args.join(",").toUpperCase();
    console.log(`symbols: ${symbols}`);

    try {
        //get the list of coins
        const coinsList = await getCoinsList();

        const coinIds = [];

        //for each of the symbols, get the CoinGecko coin-id
        for (const symbol of symbols) {
            console.log(`symbol: ${symbol}`);
            const coinId = getCoinId(symbol, coinsList);
            //and push it onto the coinIds array
            coinIds.push(coinId);
        }
        const priceData = await getCoinPrices(coinIds);
        for (const price of priceData) {
            const priceFormatted = formatMoney(price);
            await message.channel.send(`1 ${crypto} = ${priceFormatted}`);
        }
    } catch (err) {
        await message.channel.send(`error fetching crypto price: ${err}`);
    }
}
async function getCoinPrices(coinIds,vsCurrency = "usd") {
    console.log(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${vsCurrency}`);
    try {
        const coinPriceRequest = await axios.get("https://api.coingecko.com/api/v3/simple/price",{
            params: {
                ids: coinIds,
                vs_currencies: vsCurrency,
            }
        });
        if (coinPriceRequest.status === 200) {
            const prices = [];
            for (const [coinId,coinData] of coinPriceRequest.data) {
                prices[coinId] = coinData[vsCurrency];
            }
            console.log(JSON.stringify(prices));
            return prices;
        } else {
            throw new Error(`HTTP status was not 200: ${coinPriceRequest.status}`);
        }
    } catch (e) {
        throw new Error(`There was an unexpected error retrieving price data: ${e}`);
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
function getCoinId(symbol, coinsList) {
    const crypto = symbol.toLowerCase();
    const coin = coinsList.find(c => (c.symbol === crypto || c.id === crypto));
    console.log(`symbol: ${symbol} | coin: ${coin}`);
    if (coin && coin.id) {
        return coin.id;
    } else {
        throw new Error("The coin could not be found.");
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
async function drawCandles(ticker,range) {
    let data = await getCoinOhlcData();

    let width = 400;
    let height = 400;

    const canvas = createCanvas(width,height);
    const context = canvas.getContext("2d");

    context.fillStyle = "#000";
    context.fillRect(0, 0, width, height);

}