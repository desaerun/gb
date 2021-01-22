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
let queue = [];
let playing = false;

async function execute(client, message, args) {
    if (!message.member.voice.channel) {
        await message.channel.send(`You must be in a voice channel to use this command.`);
        return false;
    }
    let q = args.join(" ");
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
        const song = {
            url: video.url,
            description: video.description,
            views: video.views,
            duration: video.duration,
            uploadedAt: video.uploadedAt,
        }
        console.log(video.url);
        await playSong(song,message.channel,message.member.voice.channel);
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
function addSongToQueue(song) {
    queue.push(song);
}
async function playSong(song,textChannel,voiceChannel) {
    if (queue.length > 0) {
        textChannel.send(`Added **${song.description}** to the queue in position #${queue.length}`);
        addSongToQueue(song);
    } else {
        addSongToQueue(song);
        await playNextSong(textChannel,voiceChannel);
    }
}
async function playNextSong(textChannel,voiceChannel) {
    console.log(queue);
    if (queue.length > 0) {
        const song = queue.shift();
        const connection = await voiceChannel.join();
        const stream = await ytdl(song.url);
        const dispatcher = connection.play(stream, {type: "opus"});
        await textChannel.send(`Playing **${song.description}**`);
        playing = true;

        dispatcher.on("finish",() => {
            if (queue.length > 0) {
                playNextSong(voiceChannel);
            } else {
                playing = false;
                voiceChannel.leave();
            }
        });
    } else {
        playing = false;
        voiceChannel.leave();
    }
}