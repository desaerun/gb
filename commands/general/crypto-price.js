const axios = require('axios');

const currencyFormat = new Intl.NumberFormat('en-US',
    {
        style: 'currency',
        currency: 'USD'
    });

const percentFormat = new Intl.NumberFormat('en-US',
    {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })

module.exports = {
    name: 'crypto-price',
    description: "Retrieves crypto prices from Coinbase API (in USD)",
    async execute(client, message, args) {
        if (args.length < 1) {
            message.channel.send('You must include a crypto ticker (BTC, ETH) with this request.');
            return;
        }

        if (args.length > 1) {
            message.channel.send(`You cannot make multiple requests at once. (Requested ${args})`);
            return;
        }

        let crypto = args[0].toUpperCase();

        try {
            const response = await axios.get(`https://api.pro.coinbase.com/products/${crypto}-USD/stats`);
            if (response.status === 200) {
                console.log (response.data);
                let coinbaseData = response.data;

                let priceDiff = coinbaseData.last - coinbaseData.open;
                let percDiff = priceDiff / coinbaseData.open;

                let curPriceFormatted = currencyFormat.format(coinbaseData.last);
                let priceDiffFormatted = (priceDiff < 0 ? '' : '+') + currencyFormat.format(priceDiff);
                let percDiffFormatted = (priceDiff < 0 ? '' : '+') + percentFormat.format(percDiff);

                message.channel.send(`1 ${crypto} = ${curPriceFormatted} ( ${priceDiffFormatted} / ${percDiffFormatted} )`);
            } else {
                throw new Error('HTTP status not 200');
            }
        } catch (err) {
            console.log(`error fetching crypto price: ${err}`);
            message.channel.send(`error fetching crypto price: ${err}`);
        }
    }
}