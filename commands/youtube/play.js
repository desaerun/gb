const ytdl = require('ytdl-core');
const superagent = require('superagent');

module.exports = {
    name: 'play',
    description: "play audio from a youtube file",
    args: [
        {
            param: 'youtubeQuery',
            type: 'string',
            description: 'The query to be searched on youtube',
            default: 'L4D2 jockey sounds',
            required: false,
        }
    ],
    execute(client, message, args) {
        if (!message.member.voice.channel) {
            message.channel.send("You must be in a voice channel to use this command.");
            return false;
        }
        let q = args.length > 0 ? args.join(" ") : this.args[0].default;
        let params = {
            key: process.env.YOUTUBE_TOKEN,
            part: 'snippet',
            type: 'video',
            maxResults: 1,
            q: q,
        };
        superagent.get("https://www.googleapis.com/youtube/v3/search")
            .query(params)
            .end((err, res) => {
                if (err) {
                    return console.log(err)
                }
                const video = res.body.items[0];

                //todo: print the name of the video and (maybe) attach thumbnail
                const video_id = video.id.videoId;
                const video_description = video.snippet.description;
                message.channel.send(`Playing **${video_description}**`);
                message.member.voice.channel.join()
                    .then(connection => {
                        const stream = ytdl(`https://youtube.com/watch?v=${video_id}`, {filter: 'audioonly'});
                        const dispatcher = connection.play(stream);

                        dispatcher.on('finish', () => message.member.voice.channel.leave());
                    });
            });

    }
}