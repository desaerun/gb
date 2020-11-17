module.exports = {
    name: 'is-miller-okay',
    description: "Reports on Miller's status",
    execute: function (client, message, args) {
        message.channel.send('Yes');
    }
}