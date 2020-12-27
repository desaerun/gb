const translate = require('google-translate-api');

module.exports = {
    name: 'translate',
    description: 'translates your message from one language to another. Type "-translate" for instructions',
    execute(client, message, args) {

        if (args.length === 0) {
            message.channel.send('Type your message to be translated, including a `to:` language and an optional \`from:\` language.\n' +
                'Example: `-translate to:ja I love you, Groidbot!`');
            return;
        }

        if (args.length === 1 && args[i] === 'languages') {
            message.channel.send(translate.languages.toString());
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
            message.channel.send(`The language ${toLang} is not supported. For a list of supported languages, type \`-translate languages\``);
            return;
        }

        if (fromLang && !translate.languages.isSupported(fromLang)) {
            message.channel.send(`The language ${fromLang} is not supported. For a list of supported languages, type \`-translate languages\``);
            return;
        }

        let untranslated = args.join(' ');
        let opts;
        if (fromLang) {
            opts = {from: fromLang, to: toLang};
        } else {
            opts = {to: toLang};
        }

        message.channel.send(`Attempting to translate the sentence ${untranslated} from ${fromLang} to ${toLang}`)

        translate(untranslated, opts).then(res => {
            message.channel.send(res.text);
        })
    }
}