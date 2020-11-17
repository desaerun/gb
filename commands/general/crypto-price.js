const request = require('request');

module.exports = {
    name: 'crypto-price',
    description: "Retrieves crypto prices from Coinbase API (in USD)",
    execute(client, message, args) {
        if (!args) {
            message.channel.send('You must include a crypto ticker (BTC, ETH) with this request.');
            return;
        }

        if (args.length > 1) {
            message.channel.send(`You cannot make multiple requests at once. (Requested ${args})`);
            return;
        }

        let crypto = args[0];

       request(`https://api.coinbase.com/v2/exchange-rates?currency=${crypto}`, function (err, response, body) {
          if (!err && response.statusCode == 200) {
              let coinbaseData = JSON.parse(body);
              message.channel.send(`1 ${crypto} = \$${coinbaseData.data.rates.USD}`);
          } else {
              message.channel.send(err);
          }
       });
    }
}