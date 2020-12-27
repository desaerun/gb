const uwuifier = require('uwuify');
const uwuify = new uwuifier();

module.exports = {
    name: 'uwu',
    description: 'uwu-ifies your message',
    execute(client, message, args) {
        message.channel.send(uwuify.uwuify(args));
    }
}