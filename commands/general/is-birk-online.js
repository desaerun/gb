module.exports = {
    name: 'is-birk-online',
    description: "Reports on Birk's status",
    async execute(client, message, args) {
        try {
            const birkID = '97542223641464832';
            const birk = await client.users.fetch(birkID, true, true);
        
            await message.channel.send(`Birk is ${birk.presence.status}.`);
        } catch(err) {
            console.error(err);
        }
    }
}
        
