const ytdl = require('ytdl-core');
const youtube_token = "AIzaSyCKD4-72sqWYJjCqbDM1_5lwngSJkO-KcU";
const superagent = require('superagent');

module.exports = {
    name: 'play',
    description: "play audio from a youtube file",
    execute(client, message, args) {
        if (!message.member.voice.channel) {
            message.channel.send("You must be in a voice channel to use this command.");
            return false;
        }
        let q = args.join(" ");
        let params = {
            key: youtube_token,
            part: 'snippet',
            type: 'video',
            maxResults: 1,
            q: q,
        };
        superagent.get("https://www.googleapis.com/youtube/v3/search")
            .query(params)
            .end((err,res) => {
                if (err) { return console.log(err) }
                const video = res.body.items[0];

                const video_id = video.id.videoId;
                const video_name = video.snippet.title;
                const video_description = video.snippet.description;
                const video_thumbnail = video.snippet.thumbnails.medium.url;
                message.channel.send(`Playing **${video_description}**`);
                message.member.voice.channel.join()
                    .then(connection => {
                        const stream = ytdl(`https://youtube.com/watch?v=${video_id}`,{filter: 'audioonly'});
                        const dispatcher = connection.play(stream);

                        dispatcher.on('finish',() => message.member.voice.channel.leave());
                    });
            });

    }
}