module.exports = {
    name: 'is-birk-online',
    description: "Reports on Birk's status",
    async execute(client, message, args) {
        try {
            const birkID = '97388794692505600';
            const birk = await message.guild.members.fetch(birkID);
        
            await message.channel.send(`Kajoonie is ${birk.presence.status}.`);
        } catch(err) {
            console.error(err);
        }
    }
}
        
