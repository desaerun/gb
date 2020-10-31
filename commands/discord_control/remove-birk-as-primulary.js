module.exports = {
    name: 'remove-birk-as-primulary',
    description: "removes Birk as a primulary groid.  Only use in extreme circumstances.",
    execute(client, message, args) {
        message.channel.send("Removing @Birk as a primulary groid.");
    }
}