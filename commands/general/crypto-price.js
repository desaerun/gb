//imports
const axios = require("axios");
const moment = require("moment");
const fs = require("fs");
const {sendMessage} = require("../../tools/sendMessage");

//module settings
const name = "crypto-price";
const description = "Retrieves crypto prices from Coinbase API (in USD)";
const params = [
    {
        param: "cryptoTicker",
        type: "String",
        description: "a crypto ticker (BTC, ETH)",
        default: "BTC",
    }
];

//main
const execute = async function (client, message, args) {
    //todo: get coinbase data first, only fall back on coingecko if ticker is not available,

    //todo: draw candlestick chart
    //todo: make output prettier (discord embed? inline fields? include market cap/volume?)
    if (args.length === 0) {
        await message.channel.send(`You must include a crypto ticker (BTC, ETH) with this request.`);
        return;
    }

    let symbols = args;

    //get coins from coinbase first, when possible.
    let coinbaseCoins = {};
    for (const symbol of symbols) {
        const coinbasePriceData = await getCoinbasePriceData(symbol);
        if (coinbasePriceData) {
            coinbaseCoins[symbol] = coinbasePriceData;
        }
    }
    console.log(`Coins from Coinbase: ${JSON.stringify(coinbaseCoins)}`);
    const remainingSymbols = symbols.filter(s => !Object.keys(coinbaseCoins).includes(s)).join(",");
    console.log(`Remaining symbols: ${remainingSymbols}`);

    // i f there are any coins remaining, attempt to get from CoinGecko.
    let coinGeckoCoins = {};
    if (remainingSymbols) {
        coinGeckoCoins = await getCoinGeckoPriceData(remainingSymbols, "usd");
    }
    console.log(`CoinGecko coins: ${JSON.stringify(coinGeckoCoins)}`);
    const finalCoinsList = {
        ...coinbaseCoins,
        ...coinGeckoCoins,
    }
    console.log(`Final coins list: ${JSON.stringify(finalCoinsList)}`);
    if (Object.keys(finalCoinsList).length > 0) {
        let output = [];
        for (const [coin, coinInfo] of Object.entries(finalCoinsList)) {
            const priceDiff = coinInfo.last - coinInfo.open;
            const percDiff = priceDiff / coinInfo.open;

            const curPriceFormatted = formatMoney(coinInfo.last);

            const downSymbol = ":small_red_triangle_down:";
            const upSymbol = ":evergreen_tree:";

            const priceDiffFormatted = (priceDiff < 0) ? downSymbol + formatMoney(priceDiff) : upSymbol + formatMoney(priceDiff);
            const percDiffFormatted = (priceDiff < 0) ? ":small_red_triangle_down:" + percentFormat.format(percDiff) : ":evergreen_tree:" + percentFormat.format(percDiff);

            output.push(`1 ${coin.toUpperCase()} = **${curPriceFormatted}** (**${priceDiffFormatted}**[**${percDiffFormatted}**] last 24hrs) (${coinInfo.source})`)
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
    description: description,
    params: params,
    execute: execute,
}

//helper functions
/**
 * gets pricing info about the given symbol from Coinbase API
 * @param symbol the symbol to retrieve pricing data for
 * @returns {Promise<{volume: *, last: any, id, source: string, updated: number, open}|boolean>} a promise that
 * resolves to an object containing the pricing data
 */
async function getCoinbasePriceData(symbol) {
    try {
        const coinbaseRequest = await axios.get(`https://api.pro.coinbase.com/products/${symbol}-USD/stats`);
        if (coinbaseRequest.status === 200) {
            const coinbaseData = coinbaseRequest.data;
            if (coinbaseData.message && coinbaseData.message === "NotFound") {
                return false;
            }
            return {
                id: symbol,
                last: coinbaseData.last,
                open: coinbaseData.open,
                volume: coinbaseData.volume,
                updated: +Date.now(),
                source: "Coinbase",
            };
        } else if (coinbaseRequest.status === 404) {
            console.log(`Got 404 error for coinbase for ${symbol}`);
            return false;
        } else {
            throw new Error(`HTTP status was not 200: ${coinbaseRequest.status}`);
        }
    } catch (e) {
        console.log(`There was an unexpected error retrieving the price of ${symbol} from Coinbase: ${e}`);
    }
}

/**
 * gets price data about given coin symbols from coinGecko, in the given currency
 * @param symbols an array of symbols to fetch price data for
 * @param vsCurrency the requested currency type to return (usd,aud,etc.)
 * @returns {Promise<{}>} a promise that resolves to an object containing the pricing data
 */
async function getCoinGeckoPriceData(symbols,vsCurrency = "usd") {
    let coins = {};
    const coinIds = await getCoinGeckoCoinInfo(symbols);
    if (!coinIds) {
        console.log("Failed to get coinGecko coins list.")
        return {};
    }
    const coinIdsToFetch = coinIds.map(c => c.id).join(",");
    try {
        const coinGeckoRequest = await axios.get("https://api.coingecko.com/api/v3/simple/price",{
            params: {
                ids: coinIdsToFetch,
                vs_currencies: vsCurrency,
                include_market_cap: true,
                include_24h_vol: true,
                include_24hr_change: true,
                include_last_updated_at: true,
            }
        });
        if (coinGeckoRequest.status === 200) {
            for (const [coinId, priceData] of Object.entries(coinGeckoRequest.data)) {
                //coinGecko only gives "last" and "percent change"...
                //calculate the Opening price:
                const open = priceData[vsCurrency] / ((100 + priceData[`${vsCurrency}_24h_change`]) / 100);
                coins[coinId] = {
                    id: coinId,
                    last: priceData[vsCurrency],
                    open: open,
                    volume: priceData[`${vsCurrency}_24h_vol`],
                    updated: priceData.last_updated_at,
                    source: "CoinGecko",
                };
            }
            console.log(`Returning from Coingecko: ${JSON.stringify(coins)}`);
            return coins;
        } else {
            throw new Error(`HTTP status was not 200: ${coinGeckoRequest.status}`);
        }
    } catch (e) {
        console.log(`There was an unexpected error retrieving CoinGecko price data: ${e}`);
    }
}

/**
 * gets basic info related to the coins passed in (symbol, name, etc)
 * @param symbols an array of symbols to look up
 * @returns {Promise<boolean|*>} a promise that resolves to either the info about the coins, or false
 * if none of the symbols were able to be found in the list of coins
 */
async function getCoinGeckoCoinInfo(symbols) {
    const coinsList = await getCoinGeckoCoinsList();
    symbols = symbols.toLowerCase().split(",");

    //filter the coins list to only the entries we are trying to retrieve
    const coins = coinsList.filter(c => symbols.includes(c.symbol) || symbols.includes(c.name.toLowerCase()));

    //if any coins were able to be matched, return the list. otherwise, return false.
    if (coins && coins.some(c => c.id)) {
        return coins;
    } else {
        return false;
    }
}

/**
 * retrieves the list of coins, either from the API or cached.
 * @returns {Promise<any>} a promise that resolves to the full list of basic coin data
 */
async function getCoinGeckoCoinsList() {
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

/**
 * Fetch the basic coin info from the coingecko API
 * @returns {Promise<any>} a promise that resolves to the full list of coins from the coingecko API
 */
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

/**
 * formats a number as currency, precision is based on the price
 * @param n the number to format
 * @returns {string}
 */
function formatMoney(n) {
    let maxPlaces = 2;
    if (n < 100) {
        maxPlaces = 6;
    } if (n < 1) {
        maxPlaces = 10;
    }

    const currencyFormat = new Intl.NumberFormat("en-US",
        {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
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