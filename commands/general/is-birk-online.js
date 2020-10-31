module.exports = {
    name: 'is-birk-online',
    description: "Reports on Birk's status",
    execute: async function (client, message, args) {
        try {
            const birkID = '97542223641464832';
            let birk = await message.guild.members.fetch(birkID);

            let message;

            switch (birk.presence.status) {
                case 'dnd':
                    message = `AY YO ${birk.nickname} DON'T WANNA BE FUCKED WITH RIGHT NOW`;
                    break;
                case 'idle':
                    message = `This motherfucker ${birk.nickname} thinks he can just STEP AWAY?`;
                    break;
                case 'online':
                    message = `WTF? Why is ${birk.nickname} online?`;
                    break;
                case 'offline':
                    message = `Ah yes, a ${birk.nickname} in his natural habitat. Offline.`;
                    break;
                default:
                    message = `tbh i don't even know what's going on right now`;
            }

            message.channel.send(message);
        } catch (err) {
            console.error(err);
        }
    }
}
        
