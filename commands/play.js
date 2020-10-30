const ytdl = require('ytdl-core');
module.exports = {
    name: 'play',
    description: "play audio from a youtube file",
    async execute(message,args) {
        const channel = message.member.voice.channel;
        const connection = await channel.join()
        .then(connection => {
            const stream = ytdl(args[0],{filter: 'audioonly'});
            const dispatcher = connection.play(stream);
        });
    }
}