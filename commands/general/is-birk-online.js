module.exports = {
    name: 'is-birk-online',
    description: "Reports on Birk's status",
    execute: async function (client, message, args) {
        try {
            const birkID = '97542223641464832';
            let birk = await message.guild.members.fetch(birkID);

            message.channel.send(`${birk.nickname} is ${birk.presence.status}.`);
        } catch (err) {
            console.error(err);
        }
    }
}
        
