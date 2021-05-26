const fs = require("fs");
const axios = require("axios");
const {mkdirRecursiveSync} = require("./utils");
const {logMessage} = require("./utils");

/**
 * gets the coin + pricing info for a given set of symbols.
 *
 * Because Coingecko can have delayed data,
 * will attempt to find the coin on Coinbase first, then fall back on Coingecko
 * @param symbols an array of symbols to get info for
 * @returns {Promise<{}>} a promise that resolves to an object containing the coin and pricing info: {
 *     "symbol": { -- this key will be named the same as "symbol"
 *         id: the coingecko coin ID
 *         symbol: the ticker / symbol
 *         name: the name of the coin
 *         priceInfo: {
 *             last: the last price the coin was traded at
 *             open: the price of the coin at open (usually 24hrs ago)
 *             volume: the 24hr trading volume
 *             updated: unix timestamp in milliseconds, the age of the pricing data
 *             source: where the pricing  data was retrieved  (coinbase or coingecko);
 *         }
 *         error: an error message (key only exists if there was an error)
 *     }
 * }
 */
exports.getCryptoInfoWithPriceData = async function (symbols) {
    if (!Array.isArray(symbols)) {
        symbols = [symbols];
    }
    const coinData = await getBasicCryptoInfo(symbols);
    let validSymbols = Object.keys(coinData);

    //get coins from coinbase first, when possible.
    let remainingCoins = {};
    for (const symbol of validSymbols) {
        const coinbasePriceData = await getCoinbasePriceData(symbol);
        if (coinbasePriceData) {
            coinData[symbol].priceData = {
                ...coinbasePriceData,
            };
        } else {
            remainingCoins[symbol] = coinData[symbol];
        }
    }

    //next, try coinGecko
    const coinGeckoPriceData = await getCoinGeckoPriceData(remainingCoins);
    if (coinGeckoPriceData) {
        for (const [symbol, coinGeckoCoinPriceData] of Object.entries(coinGeckoPriceData)) {
            coinData[symbol].priceData = {
                ...coinGeckoCoinPriceData,
            }
        }
    }

    return coinData;
}
/**
 * Gets basic coin info from CoinGecko (coinGecko ID, symbol, name), matches based off any one of these
 * @param symbols
 * @returns {Promise<null|{}>} a promise that resolves to null if _no_ data was found, or an object:
 * {
 *     symbol <Object>: {
 *          id <string>:        the coinGecko ID
 *          symbol <string>:    the symbol/ticker representing this coin
 *          name <string>:      the plain-english name of the coin
 *     },
 *     symbol <Object>: {
 *         error <string>:  an error happened while retrieving the coin info (usually that the coin does not exist)
 *     }
 *     ...
 * }
 */
const getBasicCryptoInfo = async function (symbols) {
    symbols = symbols.map(s => s.toLowerCase());

    //get coin list and set data for each coin
    const coinsList = await getCoinGeckoCoinsList();

    const coinData = {};
    for (let i = 0; i < symbols.length; i++) {
        const querySymbol = symbols[i];
        const validCoin = coinsList.find(c => {
            return querySymbol === c.id ||
                querySymbol === c.symbol ||
                querySymbol === c.name.toLowerCase();
        });

        if (validCoin) {
            coinData[validCoin.symbol] = validCoin;
        } else {
            coinData[querySymbol] = {
                symbol: querySymbol,
                error: `No symbol was able to be matched for **${querySymbol.toUpperCase()}**.`,
            }
        }
    }

    if (Object.keys(coinData).length === 0) {
        return null;
    }
    return coinData;
}
exports.getBasicCryptoInfo = getBasicCryptoInfo;

/**
 * gets pricing info about the given symbol from Coinbase API
 *
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
                return null;
            }
            return {
                last: coinbaseData.last,
                open: coinbaseData.open,
                volume: coinbaseData.volume,
                updated: +Date.now(),
                source: "Coinbase",
            };
        } else if (coinbaseRequest.status === 404) {
            logMessage(`Got 404 error for coinbase for ${symbol}`, 3);
            return false;
        } else {
            return null;
        }
    } catch (e) {
        return null;
    }
}

/**
 * gets price data about given coin symbols from coinGecko, in the given currency
 *
 * @param coinData an object with the basic coin data, {
 *     id: the coinGecko coin ID
 *     symbol: the symbol representing the coin
 *     name: the name of the coin
 * }
 * @param vsCurrency the requested currency type to return (usd,aud,etc.)
 * @returns {Promise<{}>} a promise that resolves to an object containing the pricing data
 */
async function getCoinGeckoPriceData(coinData, vsCurrency = "usd") {
    let coins = {};

    //get a string to use as part of the query,
    //this would look something like "bitcoin,dogecoin,ethereum" etc.
    //refer to coingecko API documentation.
    const coinIds = Object.values(coinData).map(c => c.id).join(",");
    try {
        const coinGeckoRequest = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
            params: {
                ids: coinIds,
                vs_currencies: vsCurrency,
                include_market_cap: true,
                include_24hr_vol: true,
                include_24hr_change: true,
                include_last_updated_at: true,
            }
        });
        if (coinGeckoRequest.status === 200) {
            for (const [coinId, priceData] of Object.entries(coinGeckoRequest.data)) {
                const coin = Object.values(coinData).find(c => c.id === coinId);

                //coinGecko only gives "last" and "percent change"...
                //calculate the Opening price:
                const open = priceData[vsCurrency] / ((100 + priceData[`${vsCurrency}_24h_change`]) / 100);
                coins[coin.symbol] = {
                    last: priceData[vsCurrency],
                    open: open,
                    volume: priceData[`${vsCurrency}_24h_vol`],
                    updated: priceData.last_updated_at * 1000,
                    source: "CoinGecko",
                };
            }
            return coins;
        } else {
            logMessage(`There was an unexpected error retrieving CoinGecko price data.`, 2);
        }
    } catch (e) {
        return null;
    }
}

/**
 * retrieves the list of coins, either from the API or cached.
 *
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
        if (modified < allowedAge) {
            //if it's older than the allowed age, fetch data from API and update the cache.
            try {
                coinsListData = await getCoinGeckoAPICoinsList();
                mkdirRecursiveSync("./data/");
                fs.writeFileSync(cryptoCoinsListFile, JSON.stringify(coinsListData));
                return coinsListData;
            } catch (e) {
                throw new Error(e);
            }
        } else {
            //else just pull it from the cache
            return JSON.parse(fs.readFileSync(cryptoCoinsListFile, "utf8"));
        }
    } else {
        //if not, fetch from API and write to cache
        try {
            coinsListData = await getCoinGeckoAPICoinsList();
        } catch (e) {
            throw new Error(e);
        }
        mkdirRecursiveSync("./data/");
        fs.writeFileSync(cryptoCoinsListFile, JSON.stringify(coinsListData));
        return coinsListData;
    }
}

/**
 * Fetch the basic coin info from the coingecko API
 *
 * @returns {Promise<any>} a promise that resolves to the full list of coins from the coingecko API
 */
async function getCoinGeckoAPICoinsList() {
    logMessage("Coins list file doesn't exist or is out of date, fetching from CoinGecko API.", 3);
    try {
        const coinsListRequest = await axios.get("https://api.coingecko.com/api/v3/coins/list");
        if (coinsListRequest.status === 200) {
            return coinsListRequest.data;
        } else {
            logMessage(`HTTP status for coinGecko coins list was not 200: ${coinsListRequest.status}`);
        }
    } catch (e) {
        throw new Error(`There was an unexpected error retrieving API coin list: ${e}`);
    }
}
