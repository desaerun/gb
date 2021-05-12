const cron = require("node-cron");
const {formatMoney} = require("./utils");
const {sendMessage} = require("./sendMessage");
const {getBasicCryptoInfo} = require("./getCryptoPrice");
const {getCryptoInfoWithPriceData} = require("./getCryptoPrice");

const watchers = new Map();
const triggeredWatchers = new Map();

const WATCHER_REINDEX_WAIT = 12 * 60 * 60 * 1000; //

const cooldowns = {
    watcherReindex: +Date.now(),
};

async function watcherCycle() {
    await checkPrices();

    const now = +Date.now();

    if (cooldowns.watcherReindex < now - WATCHER_REINDEX_WAIT) {
        reindexWatchers();
    }
}

async function checkPrices() {
    if (watchers.size === 0) {
        return;
    }
    const cryptosInfoWithPriceData = await getCryptoInfoWithPriceData(Array.from(watchers.keys()));
    for (const [key, watchersArr] of watchers.entries()) {
        const currentPrice = cryptosInfoWithPriceData[key].priceData.last;
        for (let i = 0; i < watchersArr.length; i++) {
            const watcher = watchersArr[i];
            if (
                (watcher.direction === "up" && currentPrice >= watcher.targetPrice) ||
                (watcher.direction === "down" && currentPrice <= watcher.targetPrice)
            ) {
                //do alert for price over
                await sendAlert(watcher, currentPrice);
                console.log(`${cryptosInfoWithPriceData[key].symbol.toUpperCase()} ${watcher.direction}-direction `
                    + `watcher ${i} triggered. watcher price: ${watcher.targetPrice}|current price:${currentPrice}`);
                removeWatcherKnownKey(key, watcher.index);
                i--;
            }
        }
    }
}

const sendAlert = async function (watcher, currentPrice) {
    const directionSymbol = (watcher.direction === "up") ? ">" : "<";

    const userMentions = watcher.alertUserIds.map(u => {
        return ` <@${u}>`;
    }).join("");
    const outputMessage = `Alert <@${watcher.alertAuthor}>${userMentions}! `
        + `Your watcher for **${watcher.symbol.toUpperCase()}** (${watcher.name}) ${directionSymbol} `
        + `${formatMoney(watcher.targetPrice)} has triggered. (Current price of **${watcher.symbol.toUpperCase()}**: `
        + `${formatMoney(currentPrice)})`;
    await sendMessage(outputMessage, watcher.alertChannel);
}

const getWatchers = async function (symbol = null) {
    //if a symbol is given, only list watchers for that symbol,
    //otherwise list all watchers for all symbols
    if (symbol) {
        const cryptoInfo = await getBasicCryptoInfo([symbol]);
        if (Object.keys(cryptoInfo).length === 0) {
            throw Error("The symbol was not able to be matched.")
        }

        //reset cooldown on watch reindexing
        cooldowns.watcherReindex = +Date.now();

        const symbolBasicData = Object.values(cryptoInfo)[0];
        if (watchers.has(symbolBasicData.symbol)) {
            const requestedWatchersMap = new Map();
            requestedWatchersMap.set(symbolBasicData.symbol, watchers.get(symbolBasicData.symbol));
            return requestedWatchersMap;
        } else {
            return new Map();
        }
    } else {
        return watchers;
    }
}
exports.getWatchers = getWatchers;

const addWatcher = async function (symbol, requestedPriceValue, message) {
    requestedPriceValue = requestedPriceValue.replace(/[^0-9-+%.]/g,"");
    const cryptosInfoWithPriceData = await getCryptoInfoWithPriceData([symbol]);

    if (Object.keys(cryptosInfoWithPriceData).length === 0) {
        throw new Error("The symbol was not able to be found.");
    }

    const thisCrypto = Object.values(cryptosInfoWithPriceData)[0];
    const currentPrice = Number(thisCrypto.priceData.last);

    const mentionedUserIds = [...message.content.matchAll(/<@!?(&?\d+)>/g)].map(m => m[1]);

    const watcher = {
        symbol: thisCrypto.symbol.toUpperCase(),
        name: thisCrypto.name,
        startingPrice: currentPrice,
        alertChannel: message.channel,
        alertAuthor: message.author.id,
        alertUserIds: mentionedUserIds,
        createdAt: +Date.now(),
    };

    //check if a percent was supplied
    const percentMatcherRe = new RegExp(/([+-]?\d+(?:\.\d+)?)%/);
    const percentMatcher = requestedPriceValue.match(percentMatcherRe);

    if (percentMatcher) {
        const percentPart = Number(percentMatcher[1]);
        watcher.targetPrice = currentPrice * (1 + (percentPart / 100));
        watcher.requested = percentPart;
        watcher.requestedType = "percentChange";
    } else {
        if (requestedPriceValue[0] === "+" || requestedPriceValue[0] === "-") {
            requestedPriceValue = Number(requestedPriceValue);
            watcher.targetPrice = currentPrice + requestedPriceValue;
            watcher.requested = requestedPriceValue;
            watcher.requestedType = "change";
        } else {
            requestedPriceValue = Number(requestedPriceValue);
            watcher.targetPrice = requestedPriceValue;
            watcher.requested = requestedPriceValue;
            watcher.requestedType = "fixed";
        }
    }
    if (watcher.targetPrice <= 0) {
        throw Error("Cannot add watcher, that price would be negative.");
    }
    watcher.direction = (currentPrice < watcher.targetPrice) ? "up" : "down";

    if (!watchers.has(thisCrypto.symbol)) {
        watcher.index = 1;
        watchers.set(thisCrypto.symbol, [watcher]);
    } else {
        const currentWatchersForThisSymbol = watchers.get(thisCrypto.symbol);

        //get current highest index and set next index to one higher
        watcher.index = currentWatchersForThisSymbol[currentWatchersForThisSymbol.length - 1].index + 1;
        currentWatchersForThisSymbol.push(watcher);
        watchers.set(thisCrypto.symbol, currentWatchersForThisSymbol);
    }
    return watcher;
}
exports.addWatcher = addWatcher;

const removeWatcher = async function (symbol, idx) {
    const cryptoInfo = await getBasicCryptoInfo([symbol]);
    if (Object.keys(cryptoInfo).length === 0) {
        throw Error("The symbol was not able to be matched.")
    }

    //reset cooldown on watch reindexing
    cooldowns.watcherReindex = +Date.now();

    const key = Object.values(cryptoInfo)[0].symbol;
    return removeWatcherKnownKey(key, idx);
}
exports.removeWatcher = removeWatcher;

const removeWatcherKnownKey = function (key, idx) {
    if (watchers.has(key)) {
        const watchersForSymbol = watchers.get(key);
        const actualIndex = watchersForSymbol.findIndex(w => w.index === Number(idx));
        if (actualIndex >= 0) {
            const splicedWatcher = watchersForSymbol.splice(actualIndex, 1);
            if (watchersForSymbol.length === 0) {
                watchers.delete(key);
                console.log(`There are no more watchers for key ${key}, removing key.`);
            } else {
                watchers.set(key, watchersForSymbol);
            }

            if (triggeredWatchers.has(key)) {
                const triggeredWatchersForKey = triggeredWatchers.get(key);
                if (triggeredWatchersForKey.length > 0) {
                    triggeredWatchersForKey.push(...splicedWatcher);
                    triggeredWatchers.set(key, triggeredWatchersForKey);
                } else {
                    triggeredWatchers.set(key, splicedWatcher)
                }
            } else {
                triggeredWatchers.set(key, splicedWatcher);
            }

            return splicedWatcher;
        } else {
            throw Error("Index does not exist.");
        }
    } else {
        throw Error("There are no watchers for that key.");
    }
}

function reindexWatchers() {
    for (const watcherData of watchers.values()) {
        for (let i = 0; i < watcherData.length; i++) {
            watcherData[i].index = i + 1;
        }
    }
    cooldowns.watcherReindex = +Date.now();
}

const startWatching = function () {
    cron.schedule("*/30 * * * * *", async () => {
        await watcherCycle();
    }, {});
}
exports.startWatching = startWatching;