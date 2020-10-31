module.exports = {
    name: 'is-birk-online',
    description: "Reports on Birk's status",
    execute: function (client, message, args) {
        try {
            const birkID = '97388794692505600';
            let birk = async () => {
                return await message.guild.members.fetch(birkID);
            };

            birk().then((value) => message.channel.send(`Kajoonie is ${value.presence.status}.`));
        } catch (err) {
            console.error(err);
        }
    }
}
        
