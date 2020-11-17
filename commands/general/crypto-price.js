const Client = require('coinbase').Client;

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

        let currency = args[0];
        let coinbaseClient = new Client({'apiKey': null,
                                              'apiSecret': null});

        coinbaseClient.getExchangeRates({'currency': currency}, (err, rates) => {
            if (err) {
                message.channel.send(err);
            } else {
                let response = JSON.parse(rates);
                message.channel.send(`1 ${currency} = \$${response.data.rates.USD}`);
            }
        });
    }
}