//imports
const ytdl = require("ytdl-core-discord");
const ytsr = require("ytsr");

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
    let queryParams = {
        key: process.env.YOUTUBE_TOKEN,
        part: "snippet",
        type: "video",
        maxResults: 1,
        q: q,
    };
    try {
        const filters = await ytsr.getFilters(q);
        const filter = filters.get("Type").get("Video");
        let req = await ytsr(filter.url,{limit: 1});

        const video = req.items[0];
        const videoId = video.id.videoId;
        const videoDescription = video.snippet.description;
        const videoUrl = `https://youtube.com/watch?v=${videoId}`;
        console.log(videoUrl);
        await message.channel.send(`Playing **${videoDescription}**`);
        await playSong(message.member.voice.channel);
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
async function playSong(voiceChannel,url) {
    const connection = await voiceChannel.join();
    const stream = await ytdl(url);
    const dispatcher = connection.play(stream, {type: "opus"});

    dispatcher.on("finish",() => {
        voiceChannel.leave();
    })
}