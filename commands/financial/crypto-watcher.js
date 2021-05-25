//imports
const prettyMilliseconds = require("pretty-ms");
const {getCryptoInfoWithPriceData} = require("../../tools/getCryptoPrice");
const {formatMoney} = require("../../tools/utils");
const {removeWatcher, addWatcher, getWatchers} = require("../../tools/cryptoWatcher");
const {sendMessage} = require("../../tools/sendMessage");

//module settings
const name = "crypto-watcher";
const aliases = ["cw", "watcher", "crypto-alert", "crypto-price-alert", "ca", "cpa"];
const description = "Handles starting/stopping watchers (price alerts) for crypto tickers.";
const params = [
    {
        param: "operation",
        type: "Enum{list,add,remove}",
        default: "list",
    },
    {
        param: "symbol",
        type: "String",
        default: "BTC",
        optional: true,
    },
    {
        param: "change",
        type: "String",
        default: "5%",
        optional: true,
    },
];
const examples = [
    "list",
    "list btc",
    "add btc 60000",
    "add btc 5%",
    "delete btc 3",
];
const allowedContexts = [
    "text",
];
const adminOnly = false;

//main
const execute = async function (message, args) {
    const subCommand = args[0].toLowerCase();
    const query = (args[1]) ? args[1] : null;

    switch (subCommand) {
        case 'list':
        case 'show':
        case 'get': {
            //get the active watchers
            const watchers = await getWatchers(query);
            //if there is at least one watcher,
            if (Object.keys(watchers).length > 0) {
                //get pricing data from coinbase/coingecko
                const currentCryptoData = await getCryptoInfoWithPriceData(Object.keys(watchers));
                const outputLines = [];
                //loop through each of the keys of the array.
                //"symbol" is the crypto ticker and "data" is the array of watcher objects
                for (const [symbol, data] of Object.entries(watchers)) {
                    const currentPrice = currentCryptoData[symbol].priceData.last;
                    const currentPriceParts = currentPrice.toString().split(".");
                    const currentPricePrecision = (currentPriceParts.length > 1) ?
                        currentPriceParts[1].length :
                        2;
                    outputLines.push(`**Active watchers** for **${symbol.toUpperCase()} (${data[0].name})** (Currently `
                        + `**${formatMoney(currentPrice)}**):`);
                    //loop through all of the watchers for this symbol
                    for (let i = 0; i < data.length; i++) {
                        const watcher = data[i];
                        let directionNoun;
                        const directionSymbol = (watcher.direction === "UP") ? ">" : "<";
                        let requested;
                        switch (watcher.watcherType) {
                            case "FIXED":
                                requested = formatMoney(Math.abs(watcher.requested), currentPricePrecision);
                                directionNoun = (watcher.direction === "UP") ? "increase to" : "decrease to";
                                break;
                            case "CHANGE":
                                requested = formatMoney(Math.abs(watcher.requested), currentPricePrecision);
                                directionNoun = (watcher.direction === "UP") ? "increase by" : "decrease by";
                                break;
                            case "PERCENT_CHANGE":
                                requested = percentFormat.format(watcher.requested / 100);
                                directionNoun = (watcher.direction === "UP") ? "increase of" : "decrease of";
                                break;

                        }
                        let difference = watcher.targetPrice - currentPrice;

                        outputLines.push(`    **${watcher.index}.** Price ${directionNoun} **${requested}** `
                            + `from **${formatMoney(watcher.startingPrice, currentPricePrecision)}** (at `
                            + `**${directionSymbol}${formatMoney(watcher.targetPrice, currentPricePrecision)}** `
                            + `[**${formatMoney(Math.abs(difference), currentPricePrecision)}** away])  (created `
                            + `${prettyMilliseconds(+Date.now() - watcher.createdAt, 
                                {secondsDecimalDigits: 0})} ago)`);
                    }
                }
                const output = outputLines.join("\n");
                await sendMessage(output, message.channel);
            } else if (query !== null) {
                await sendMessage("There are no active watchers for that crypto.", message.channel);
            } else {
                await sendMessage("There are no active watchers.", message.channel);
            }
            break;

        }
        case 'add':
        case 'create':
        case 'new':
        case 'set': {
            if (!args[2]) {
                await sendMessage("You must provide a change amount in USD or a percentage to watch for.",
                    message.channel);
                return;
            }
            try {
                const watcher = await addWatcher(query, args[2], message);
                const directionAdjective = (watcher.direction === "UP") ? "above" : "below";
                await sendMessage(`Watcher created. I will alert you when the price of `
                    + `${watcher.symbol.toUpperCase()} (${watcher.name}) is `
                    + `${directionAdjective} **${formatMoney(watcher.targetPrice)}**.`, message.channel);
            } catch (e) {
                await sendMessage(`${e}`, message.channel);
            }
            break;
        }
        case 'remove':
        case 'delete':
        case 'del':
        case 'rm':
        case 'rem': {
            if (!query || !args[2]) {
                await sendMessage("You must provide the ticker and ID number of the watcher to remove.",
                    message.channel);
                return;
            }
            try {
                const removedCount = await removeWatcher(query, args[2]);
                if (args[2] === "all") {
                    await sendMessage(`Removed all active watchers for ${query.toUpperCase()}. (${removedCount} `
                        + `watchers removed)`, message.channel);
                } else {
                    await sendMessage(`${removedCount} watcher for ${query.toUpperCase()} removed.`,
                        message.channel);
                }
            } catch (e) {
                await sendMessage(`${e}`, message.channel);
            }
            break;
        }
        case 'recent':
        case 'triggered':
        case 'last':
        case 'previous': {
            const sizePerSymbol = args[2] || 5;
            const triggeredWatchers = await getWatchers(query, true, sizePerSymbol);
            if (Object.keys(triggeredWatchers).length > 0) {
                for (const watchers of Object.values(triggeredWatchers)) {
                    const symbol = watchers[0].symbol;

                    const cryptoInfoForSymbol = await getCryptoInfoWithPriceData(symbol);

                    const currentPrice = cryptoInfoForSymbol[symbol].priceData.last;
                    const currentPriceParts = currentPrice.toString().split(".");
                    const currentPricePrecision = (currentPriceParts.length > 1) ?
                        currentPriceParts[1].length :
                        2;

                    const name = watchers[0].name;
                    let outputLines = [];
                    outputLines.push(`Last ${watchers.length} triggered watchers for **${name}** `
                        + `(${symbol.toUpperCase()}) (currently ${formatMoney(currentPrice)}):`);
                    for (let i = 0; i < watchers.length; i++) {
                        const watcher = watchers[i];
                        const directionSymbol = (watcher.direction === "UP") ? ">" : "<";
                        console.log(watcher.triggeredAt, watcher.triggeredAt.getTime());
                        const triggeredDuration = prettyMilliseconds(+Date.now() - watcher.triggeredAt.getTime(),
                            {secondsDecimalDigits: 0});
                        outputLines.push(`    ${i + 1}. ${symbol.toUpperCase()} ${directionSymbol} `
                            + `${formatMoney(watcher.targetPrice, currentPricePrecision)} (triggered `
                            + `${triggeredDuration} ago)`);
                    }
                    const output = outputLines.join("\n");
                    await sendMessage(output, message.channel);
                }
            } else if (query !== null) {
                await sendMessage("There are no recently triggered watchers for that crypto.", message.channel);
            } else {
                await sendMessage("There are no recently triggered watchers.", message.channel);
            }
            break;
        }
        default:
            await sendMessage(`This given sub-command \`${subCommand}\` is not valid.`, message.channel);
            break;
    }
}

//module export
module.exports = {
    name: name,
    aliases: aliases,
    description: description,
    params: params,
    examples: examples,
    execute: execute,
    allowedContexts: allowedContexts,
    adminOnly: adminOnly,
};

//helper functions
const percentFormat = new Intl.NumberFormat("en-US",
    {
        style: "percent",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });