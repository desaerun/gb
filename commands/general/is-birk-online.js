module.exports = {
    name: 'is-birk-online',
    description: "Reports on Birk's status",
    execute: async function (client, message, args) {
        try {
            const birkID = '97542223641464832';
            let birk = await message.guild.members.fetch(birkID);

            let response;

            switch (birk.presence.status) {
                case 'dnd':
                    response = `AY YO ${birk.nickname} DON'T WANNA BE FUCKED WITH RIGHT N0W`;
                    break;
                case 'idle':
                    response = `This motherfucker ${birk.nickname} thinks he can just STEP AWAY?`;
                    break;
                case 'online':
                    response = `WTF? Why is ${birk.nickname} online?`;
                    break;
                case 'invisible':
                    response = `Hey don't worry, ${birk.nickname} is just invisible`;
                    break;
                case 'offline':
                    response = `Ah yes, a ${birk.nickname} in his natural habitat. Offline.`;
                    break;
                default:
                    response = `tbh i don't even know what's going on right now`;
            }

            message.channel.send(response);
        } catch (err) {
            console.error(err);
        }
    }
}
        
