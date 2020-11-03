module.exports = {
    name: 'test',
    description: 'test listener',
    listen(client, message) {
        if (message.content.match(/\btest\b/g)) {
            message.channel.send('this is an test listener response');
            return true;
        }
        return false;
    }
}
