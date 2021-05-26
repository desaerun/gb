const cron = require("node-cron");
const moment = require("moment");
const {logMessage} = require("./utils");
const {formatMoney} = require("./utils");
const {sendMessage} = require("./sendMessage");
const {getBasicCryptoInfo} = require("./getCryptoPrice");
const {getCryptoInfoWithPriceData} = require("./getCryptoPrice");

//prisma
const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();

let client;

//how long to wait between watcher re-indexing, in milliseconds
// 15  * 60 * 1000 = 15 minutes
const WATCHER_REINDEX_WAIT = 15 * 60 * 1000;

const cooldowns = {
    watcherReindex: +Date.now(),
};

/**
 * entry point for the watcher cron cycle. this function will be executed every "tick" of the cron at the interval given
 * in the startCryptoWatchers() function.
 *
 * @returns {Promise<void>}
 */
async function watcherCycle() {
    await checkPrices();

    const now = +Date.now();

    if (cooldowns.watcherReindex < now - WATCHER_REINDEX_WAIT) {
        reindexWatchers().then(() => {
            logMessage("Successfully re-indexed watchers.", 4);
        });
    }
}

/**
 * checks crypto prices and compares them against the target prices defined in the watchers.
 * Sends an alert to the user who created the watcher when the price has crossed the threshold.
 *
 * @returns {Promise<void>}
 */
async function checkPrices() {
    logMessage("Checking crypto prices...", 4);
    const activeWatchers = await prisma.cryptoWatcher.findMany({
        where: {
            triggeredAt: null,
        },
    });
    if (activeWatchers.length === 0) {
        return;
    }
    const activeSymbols = [...new Set(activeWatchers.map(w => w.symbol))];
    const cryptosInfoWithPriceData = await getCryptoInfoWithPriceData(activeSymbols);
    for (const watcher of activeWatchers) {
        const currentPrice = cryptosInfoWithPriceData[watcher.symbol].priceData.last;
        if (
            (watcher.direction === "UP" && currentPrice >= watcher.targetPrice) ||
            (watcher.direction === "DOWN" && currentPrice <= watcher.targetPrice)
        ) {
            await sendAlert(watcher, currentPrice);
            logMessage(`${watcher.symbol.toUpperCase()} ${watcher.direction}-direction watcher `
                + `${watcher.index} triggered. watcher price: ${watcher.targetPrice}|`
                + `current price:${currentPrice}`, 3);
            setWatcherTriggered(watcher.id);
        }
    }
}


/**
 * Sends an alert message to the channel the watcher was created in that the price has crossed the target threshold.
 * Will include any @mentions that the user gave as arguments when creating the watcher.
 *
 * @param watcher
 * @param currentPrice
 * @returns {Promise<void>}
 */
const sendAlert = async function (watcher, currentPrice) {
    const directionSymbol = (watcher.direction === "UP") ? ">" : "<";
    let mentions = "";
    if (watcher.mentionIds) {
        mentions = watcher.mentionIds.split(",").map(u => ` <@${u}>`).join("");
    }
    const outputMessage = `Alert <@${watcher.authorId}>${mentions}! `
        + `Your watcher for **${watcher.name}** (${watcher.symbol.toUpperCase()}) ${directionSymbol} `
        + `${formatMoney(watcher.targetPrice)} has triggered. (Current price of **${watcher.symbol.toUpperCase()}**: `
        + `${formatMoney(currentPrice)})`;
    const alertChannel = await client.channels.fetch(watcher.alertChannelId);
    await sendMessage(outputMessage, alertChannel);
}

/**
 * fetches the list of watchers, either for all symbols or for the symbol defined by the symbol param.
 *
 * @param query - a query for the symbol / crypto to list, or null for all
 * @param triggered - if true, only retrieve watchers that have triggered
 * @param triggeredWatchersPerSymbol - if getting triggered watchers, how many to retrieve per symbol
 * @return {Promise<{}>} Returns a Promise that resolves to an object whose keys are the symbols and their values
 * are arrays of objects representing the Watchers for that symbol.
 * If there are no active watchers, this returns an empty object.
 */
const getWatchers = async function (query = null, triggered = false, triggeredWatchersPerSymbol = 5) {
    let result = {};
    //if a symbol is given, only list watchers for that symbol,
    //otherwise list all watchers for all symbols
    let cryptoWatcherPrismaQuery = {
        orderBy: [
            {
                symbol: "asc",
            },
            {
                index: "asc",
            },
        ],
    };
    let whereClause = {
        triggeredAt: null,
    };
    if (triggered) {
        cryptoWatcherPrismaQuery.take = triggeredWatchersPerSymbol;
        cryptoWatcherPrismaQuery.orderBy = {
            triggeredAt: "desc",
        }
        whereClause = {
            NOT: {
                triggeredAt: null,
            }
        }
    }
    cryptoWatcherPrismaQuery.where = whereClause;
    if (query === null) {
        const activeWatchers = await prisma.cryptoWatcher.findMany(cryptoWatcherPrismaQuery);
        for (const activeWatcher of activeWatchers) {
            if (!result[activeWatcher.symbol]) {
                result[activeWatcher.symbol] = [activeWatcher];
            } else {
                result[activeWatcher.symbol].push(activeWatcher);
            }
        }
    } else {
        const cryptoInfo = await getBasicCryptoInfo([query]);
        if (Object.keys(cryptoInfo).length === 0) {
            throw Error("The query was not able to be matched.")
        }
        const symbolBasicData = Object.values(cryptoInfo)[0];
        whereClause.symbol = symbolBasicData.symbol;
        const activeWatchersForSymbol = await prisma.cryptoWatcher.findMany(cryptoWatcherPrismaQuery);
        for (const activeWatcher of activeWatchersForSymbol) {
            if (!result[activeWatcher.symbol]) {
                result[activeWatcher.symbol] = [activeWatcher];
            } else {
                result[activeWatcher.symbol].push(activeWatcher);
            }
        }
    }
    return result;
}
exports.getWatchers = getWatchers;

/**
 * Adds a watcher to the watchers map if it can be found on coinbase or coingecko, or throws an error if not
 *
 * @param symbol - the symbol / query of the crypto
 * @param requestedPriceValue - the target price, listed as /[+-]?\d+\.\d+%?/
 * @param message - the discord.js message object from the message where the watcher was requested
 * @returns {Promise<{symbol: string, createdAt: number, name, mentionIds: *[], alertAuthor, startingPrice: number, alertChannel}>}
 */
const addWatcher = async function (symbol, requestedPriceValue, message) {
    requestedPriceValue = requestedPriceValue.replace(/[^0-9-+%.]/g, "");
    const cryptosInfoWithPriceData = await getCryptoInfoWithPriceData(symbol);

    if (Object.keys(cryptosInfoWithPriceData).length === 0) {
        throw new Error("The symbol was not able to be found.");
    }

    const thisCrypto = Object.values(cryptosInfoWithPriceData)[0];
    const currentPrice = Number(thisCrypto.priceData.last);

    const mentionIds = [...message.content.matchAll(/<@!?(&?\d+)>/g)].map(m => m[1]).join(",");
    const watcher = {
        symbol: thisCrypto.symbol.toLowerCase(),
        name: thisCrypto.name,
        startingPrice: currentPrice,
    };


    //check if a percent was supplied
    const percentMatcherRe = new RegExp(/([+-]?\d+(?:\.\d+)?)%/);
    const percentMatcher = requestedPriceValue.match(percentMatcherRe);

    if (!percentMatcher) {
        if (requestedPriceValue[0] !== "+" && requestedPriceValue[0] !== "-") {
            requestedPriceValue = Number(requestedPriceValue);
            watcher.targetPrice = requestedPriceValue;
            watcher.requested = requestedPriceValue;
            watcher.watcherType = "FIXED";
        } else {
            requestedPriceValue = Number(requestedPriceValue);
            watcher.targetPrice = currentPrice + requestedPriceValue;
            watcher.requested = requestedPriceValue;
            watcher.watcherType = "CHANGE";
        }
    } else {
        const percentPart = Number(percentMatcher[1]);
        watcher.targetPrice = currentPrice * (1 + (percentPart / 100));
        watcher.requested = percentPart;
        watcher.watcherType = "PERCENT_CHANGE";
    }
    if (watcher.targetPrice <= 0) {
        throw Error("Cannot add watcher, that price would be negative.");
    }
    watcher.direction = (currentPrice < watcher.targetPrice) ? "UP" : "DOWN";

    let nextIndex;
    const highestIndexWatcher = await prisma.cryptoWatcher.findFirst({
        where: {
            symbol: thisCrypto.symbol.toLowerCase(),
            triggeredAt: null,
        },
        orderBy: {
            index: "desc",
        },
        select: {
            index: true,
        }
    });
    if (!highestIndexWatcher) {
        nextIndex = 1;
    } else {
        nextIndex = highestIndexWatcher.index + 1;
    }
    const createData = {
        data: {
            ...watcher,
            index: nextIndex,
            alertChannel: {
                connect: {
                    id: message.channel.id,
                }
            },
            createdBy: {
                connect: {
                    id: message.author.id,
                }
            },
            mentionIds: mentionIds,
        },
    };
    console.log(JSON.stringify(createData));
    return prisma.cryptoWatcher.create(createData);
}
exports.addWatcher = addWatcher;

/**
 * Removes a watcher from the watchers map where the map.key is not precisely known.  This function will attempt to
 * match the query symbol to a crypto via coingecko's coin list.  If one is matched it will remove the watcher at the
 * given key and index.
 *
 * @param query
 * @param idx
 * @returns {Promise<*>}
 */
const removeWatcher = async function (query, idx) {
    const cryptoInfo = await getBasicCryptoInfo([query]);
    if (Object.keys(cryptoInfo).length === 0) {
        throw Error("The query was not able to be matched.")
    }

    //reset cooldown on watcher reindexing
    cooldowns.watcherReindex = +Date.now();

    const key = Object.values(cryptoInfo)[0].symbol;

    const existingWatcher = await prisma.cryptoWatcher.findFirst({
        where: {
            symbol: key,
            triggeredAt: null,
        },
    });
    if (!existingWatcher) {
        throw Error("There are no active watchers for that crypto.");
    }

    // delete all watchers
    if (idx === "all") {
        const deleted = await prisma.cryptoWatcher.deleteMany({
            where: {
                symbol: key,
                triggeredAt: null,
            }
        });
        return deleted.count;
    }

    //delete a specific watcher of symbol `symbol` and index `idx`
    const deleted = await prisma.cryptoWatcher.deleteMany({
        where: {
            triggeredAt: null,
            symbol: key,
            index: Number(idx),
        }
    });
    if (deleted.count === 0) {
        throw Error("There was no watcher to delete.");
    }
    return deleted.count;
}
exports.removeWatcher = removeWatcher;

/**
 * Sets the triggeredAt field to the current time and the index to NULL for the watcher with the given ID
 *
 * @returns Boolean
 * @param id - the ID of the watcher
 */
const setWatcherTriggered = async function (id) {
    return await prisma.cryptoWatcher.update({
        where: {
            id: id,
        },
        data: {
            triggeredAt: new Date(),
            index: null,
        }
    });
}

/**
 * Re-indexes the array of watchers for every key, setting the index sequentially from 1.
 * @return {Promise<void>}
 */
async function reindexWatchers() {
    logMessage(`[${moment(new Date())}] Reindexing watchers`);
    const activeWatchers = await prisma.cryptoWatcher.findMany({
        where: {
            triggeredAt: null,
        },
        orderBy: [
            {
                symbol: "asc",
            },
            {
                index: "asc",
            }
        ],
    });
    const updatedWatchers = [];
    for (let i = 0, j = 1, previousSymbol = ""; i < activeWatchers.length; i++, j++) {
        const watcher = activeWatchers[i];
        if (watcher.symbol !== previousSymbol) {
            j = 1;
        }
        let updated = await prisma.cryptoWatcher.update({
            where: {
                id: watcher.id,
            },
            data: {
                index: j,
            },
        });
        updatedWatchers.push(updated);
        previousSymbol = watcher.symbol;
    }

    //reset cooldown on watcher reindexing
    cooldowns.watcherReindex = +Date.now();

    return updatedWatchers;
}

/**
 * creates a crontab for handling the watchers loop
 */
const startCryptoWatchers = async function (clientIn) {
    client = clientIn;
    await watcherCycle();
    cron.schedule("*/30 * * * * *", async () => {
        await watcherCycle();
    }, {});
}
exports.startCryptoWatchers = startCryptoWatchers;