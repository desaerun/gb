//imports
const ytdl = require("ytdl-core");
const axios = require("axios");

//module settings
const name = "play";
const description = "play audio from a youtube file";
const params = [
    {
        param: "youtubeQuery",
        type: "string",
        description: "The query to be searched on youtube",
        default: "L4D2 jockey sounds",
    }
];

//main
async function execute(client, message, args) {
    if (!message.member.voice.channel) {
        await message.channel.send(`You must be in a voice channel to use this command.`);
        return false;
    }
    let q = args.length > 0 ? args.join(" ") : params[0].default;
    let params = {
        key: process.env.YOUTUBE_TOKEN,
        part: "snippet",
        type: "video",
        maxResults: 1,
        q: q,
    };
    try {
        const req = await axios.get("https://www.googleapis.com/youtube/v3/search",{params: params});
        if (req.status !== 200) {
            throw "non-http200 status";
        }
        const video = req.data.items[0];
        console.log(JSON.stringify(video));
        const videoId = video.id.videoId;
        const videoDescription = video.snippet.description;
        await message.channel.send(`Playing **${videoDescription}**`);
        message.member.voice.channel.join()
            .then(connection => {
                const stream = ytdl(`https://youtube.com/watch?v=${videoId}`, {filter: "audioonly"});
                const dispatcher = connection.play(stream);

                dispatcher.on("finish", () => message.member.voice.channel.leave());
            });
    } catch (e) {
        throw e;
    }

}
//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
}

//helper functions
