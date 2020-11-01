module.exports = {
    name: 'test',
    description: 'test listener',
    execute(client, message) {
        if (message.content.includes('test')) {
            message.channel.send('this is an test listener response');
            return true;
        }

        return false;
    }
}