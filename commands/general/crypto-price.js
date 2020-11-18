const request = require('request');

const currencyFormat = new Intl.NumberFormat('en-US',
    {style: 'currency',
            currency: 'USD' });

const percentFormat = new Intl.NumberFormat('en-US',
    {style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2})

module.exports = {
    name: 'crypto-price',
    description: "Retrieves crypto prices from Coinbase API (in USD)",
    execute(client, message, args) {
        if (args.length < 1) {
            message.channel.send('You must include a crypto ticker (BTC, ETH) with this request.');
            return;
        }

        if (args.length > 1) {
            message.channel.send(`You cannot make multiple requests at once. (Requested ${args})`);
            return;
        }

        let crypto = args[0].toUpperCase();

       request(`https://api.pro.coinbase.com/products/${crypto}-USD/stats`, function (err, response, body) {
          if (!err && response.statusCode == 200) {
              let coinbaseData = JSON.parse(body);

              let priceDiff = coinbaseData.last - coinbaseData.open;
              let percDiff = priceDiff / coinbaseData.open;

              let curPriceFormatted = currencyFormat.format(coinbaseData.last);
              let priceDiffFormatted = (priceDiff < 0 ? '' : '+') + currencyFormat.format(priceDiff);
              let percDiffFormatted = (priceDiff < 0 ? '' : '+') + percentFormat.format(percDiff);

              message.channel.send(`1 ${crypto} = ${curPriceFormatted} ( ${priceDiffFormatted} / ${percDiffFormatted} )`);
          } else {
              message.channel.send(err);
          }
       });
    }
}