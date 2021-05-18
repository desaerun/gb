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

//main
const execute = async function (client, message, args) {
    const subCommand = args[0].toLowerCase();
    const symbol = (args[1]) ? args[1] : null;

    switch (subCommand) {
        case 'list':
        case 'show':
        case 'get':
            const watchers = await getWatchers(symbol);
            if (watchers.size > 0) {
                const priceDataForAllCryptosWithWatchers =
                    await getCryptoInfoWithPriceData(Array.from(watchers.keys()));
                const outputLines = [];
                for (const [symbol, data] of watchers.entries()) {
                    const currentPrice = priceDataForAllCryptosWithWatchers[symbol].priceData.last;
                    const currentPriceParts = currentPrice.toString().split(".");
                    const currentPricePrecision = (currentPriceParts.length > 1) ? currentPriceParts[1].length : 2;
                    outputLines.push(`**Active watchers** for **${symbol.toUpperCase()} (${data[0].name})** (Currently `
                        + `**${formatMoney(currentPrice)}**):`);
                    for (let i = 0; i < data.length; i++) {
                        const watcher = data[i];
                        let directionNoun;
                        const directionSymbol = (watcher.direction === "up") ? ">" : "<";
                        let requested;
                        switch (watcher.requestedType) {
                            case "percentChange":
                                requested = percentFormat.format(watcher.requested / 100);
                                directionNoun = (watcher.direction === "up") ? "increase by" : "decrease by";
                                break;
                            case "change":
                                requested = formatMoney(watcher.requested, currentPricePrecision);
                                directionNoun = (watcher.direction === "up") ? "increase by" : "decrease by";
                                break;
                            case "fixed":
                                requested = formatMoney(watcher.requested, currentPricePrecision);
                                directionNoun = (watcher.direction === "up") ? "increase to" : "decrease to";
                                break;
                        }
                        let difference = watcher.targetPrice - currentPrice;

                        outputLines.push(`    **${watcher.index}.** Price ${directionNoun} **${requested}** from `
                            + `**${formatMoney(watcher.startingPrice, currentPricePrecision)}** (at `
                            + `**${directionSymbol}${formatMoney(watcher.targetPrice, currentPricePrecision)}** `
                            + `(**${formatMoney(difference, currentPricePrecision)}** away))  (created `
                            + `${prettyMilliseconds(+Date.now() - watcher.createdAt)} ago)`);
                    }
                }
                const output = outputLines.join("\n");
                await sendMessage(output, message.channel);
            } else if (symbol !== null) {
                await sendMessage("There are no active watchers for that crypto.", message.channel);
            } else {
                await sendMessage("There are no active watchers.", message.channel);
            }
            break;
        case 'add':
        case 'create':
        case 'new':
        case 'set':
            if (!args[2]) {
                await sendMessage("You must provide a change amount in USD or a percentage to watch for.",
                    message.channel);
                return;
            }
            try {
                const watcher = await addWatcher(symbol, args[2], message);
                const directionAdjective = (watcher.direction === "up") ? "above" : "below";
                await sendMessage(`Watcher created. I will alert you when the price of `
                    + `${watcher.symbol.toUpperCase()} (${watcher.name}) is `
                    + `${directionAdjective} **${formatMoney(watcher.targetPrice)}**.`, message.channel);
            } catch (e) {
                await sendMessage(`An error occurred: ${e}`, message.channel);
            }
            break;
        case 'remove':
        case 'delete':
        case 'del':
        case 'rm':
        case 'rem':
            if (!symbol && !args[2]) {
                await sendMessage("You must provide the ticker and ID number of the watcher to remove.",
                    message.channel);
                return;
            }
            try {
                await removeWatcher(symbol, (Number(args[2])));
                await sendMessage("Watcher removed.", message.channel);
            } catch (e) {
                await sendMessage(`An error occurred: ${e}`, message.channel);
            }
            break;
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
    execute: execute,
    params: params,
    examples: examples,
};

//helper functions
const percentFormat = new Intl.NumberFormat("en-US",
    {
        style: "percent",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });