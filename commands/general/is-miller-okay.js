module.exports = {
    name: 'is-miller-okay',
    description: "Reports on Miller's status",
    execute: function (client, message) {
        message.channel.send('Yes');
    }
}