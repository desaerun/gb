module.exports = {
    name: 'is-birk-online',
    description: "Reports on Birk's status",
    execute: async function (client, message, args) {
        try {
            const birkID = '97388794692505600';
            let birk = await message.guild.members.fetch(birkID);

            message.channel.send(`${birk.name} is ${birk.presence.status}.`);
        } catch (err) {
            console.error(err);
        }
    }
}
        
