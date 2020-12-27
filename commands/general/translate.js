const translate = require('@vitalets/google-translate-api');

module.exports = {
    name: 'translate',
    description: 'translates your message from one language to another. Type "-translate" for instructions',
    execute(client, message, args) {

        if (args.length === 0) {
            message.channel.send('Type your message to be translated, including a `to:` language and an optional \`from:\` language.\n' +
                'Example: `-translate to:ja I love you, Groidbot!`');
            return;
        }

        let toLang;
        let fromLang;

        let i = args.length;
        while (i--) {
            if (args[i].includes('to:')) {
                toLang = args[i].replace('to:', '').trim();
                args.splice(i, 1);
            }
            if (args[i].includes('from:')) {
                fromLang = args[i].replace('from:', '').trim();
                args.splice(i, 1);
            }
        }

        if (!toLang) {
            message.channel.send('Be sure to include a `to:` language in your request!');
            return;
        }

        if (!translate.languages.isSupported(toLang)) {
            message.channel.send(`The language ${toLang} is not supported. Supported languages are based on ISO 639-1 https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes`);
            return;
        }

        if (fromLang && !translate.languages.isSupported(fromLang)) {
            message.channel.send(`The language ${fromLang} is not supported. Supported languages are based on ISO 639-1 https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes`);
            return;
        }

        let untranslated = args.join(' ');
        let opts;
        if (fromLang) {
            opts = {from: fromLang, to: toLang};
        } else {
            opts = {to: toLang};
        }

        translate(untranslated, opts).then(res => {
            message.channel.send(res.text);
        }).catch(err => {
            message.channel.send(`I encountered an error while attempting to translate your message: ${err}`)
        })
    }
}