module.exports = {
    name: 'test',
    description: 'test listener',
    listen(client, message) {
        if (message.content.match(/^\s*\btest\b\s*$/i)) {
            message.channel.send('this is an test listener response');
            return true;
        }
        return false;
    }
}
