//imports
const logMessage = require("../../tools/logMessage");

//module settings
const name = "is-birk-online";
const description = "Reports on Birk's status";

//main
async function execute(client, message) {
    let birk;
    try {
        const birkID = '97542223641464832';
        birk = await message.guild.members.fetch(birkID);
    } catch (err) {
        console.error(err);
    }
    let response;

    if (birk.presence) {
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
        try {
            await message.channel.send(response);
        } catch (e) {
            logMessage(e, 2);
        }
    }
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions
