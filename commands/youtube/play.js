//imports
const ytdl = require("ytdl-core-discord");
const ytsr = require("ytsr");
const sendLongMessage = require("../../tools/sendLongMessage");

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
let playing = {};

async function execute(client, message, args) {
    if (!message.member.voice.channel) {
        await message.channel.send(`You must be in a voice channel to use this command.`);
        return false;
    }
    let q = args.join(" ");

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
    listQueue: listQueue,
    stopPlaying: stopPlaying,
    skipSong: skipSong,
    clearQueue: clearQueue,
}

//helper functions
function addSongToQueue(song) {
    queue.push(song);
}
async function stopPlaying(textChannel) {
    if (!isPlaying()) {
        await textChannel.send("There is no song currently playing.");
        return;
    }
    textChannel.send("Stopping current song.")
    playing.voiceChannel.leave();
    playing = {};
}
async function skipSong(textChannel) {
    if (!isPlaying()) {
        await textChannel.send(`There is no song currently playing.`);
        return;
    }
    await textChannel.send(`Skipping ${playing.song.description}`);
    await playNextSong(textChannel,playing.voiceChannel);
}

async function playSong(song,textChannel,voiceChannel) {
    console.log(`playing: ${playing} | queue: ${queue}`);
    if (queue.length > 0 || isPlaying()) {
        addSongToQueue(song);
        await textChannel.send(`Added **${song.description}** to the queue in position #${queue.length+1}`);
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
        playing = {
            started: +Date.now(),
            voiceChannel: voiceChannel,
            song: song,
        };

        dispatcher.on("finish",() => {
            if (queue.length > 0) {
                playNextSong(textChannel,voiceChannel);
            } else {
                playing = {};
                voiceChannel.leave();
            }
        });
    } else {
        playing = {};
        voiceChannel.leave();
    }
}
async function listQueue(textChannel) {
    if (playing) {
        // let playingMessage +=
        await textChannel.send("Currently playing: ");
    }
    if (queue.length === 0) {
        await textChannel.send("There are no songs currently in queue.");
        return;
    }
    let totalDurationSeconds = 0;
    let queueMessage = "Songs in queue:";
    for (let i = 0; i < queue.length; i++) {
        let song = queue[i];

        let durationHours = 0, durationMinutes = 0, durationSeconds = 0;
        let durationParts = song.duration.split(":");
        console.log(`durationParts: ${durationParts}`);
        if (durationParts.length === 3) {
            [durationHours, durationMinutes, durationSeconds] = song.duration.split(":");
        } else if (durationParts.length === 2) {
            [durationMinutes, durationSeconds] = song.duration.split(":");
        } else {
            [durationSeconds] = song.duration.split(":");
        }
        console.log(`durationHours: ${durationHours}`);
        console.log(`durationMinutes: ${durationMinutes}`);
        console.log(`durationSeconds: ${durationSeconds}`);
        console.log(`------------------`);
        durationSeconds += (durationMinutes * 60);
        durationSeconds += (durationHours * 60 * 60);
        console.log(`durationSeconds: ${durationSeconds}`);

        totalDurationSeconds += durationSeconds;
        queueMessage += `\n${i+1}. ${song.description} (${song.duration})`;
    }
    let totalDurationHours = Math.floor(totalDurationSeconds / 3600);
    let totalDurationMinutes = Math.floor(totalDurationSeconds % 3600 / 60);
    let totalDurationSecondsRemaining = Math.floor(totalDurationSeconds % 3600 % 60);

    if (totalDurationSecondsRemaining <= 9) {
        totalDurationSecondsRemaining = "0" + totalDurationSecondsRemaining;
    }
    if (totalDurationMinutes <= 9) {
        totalDurationMinutes = "0" + totalDurationMinutes
    }
    let totalDurationDisplay = `${totalDurationHours}:${totalDurationMinutes}:${totalDurationSecondsRemaining}`;
    queueMessage += `\nTotal duration: ${totalDurationDisplay}`;
    await sendLongMessage(queueMessage,textChannel);
}
async function clearQueue(textChannel) {
    queue = [];
    await textChannel.send("Queue cleared.");
}
function isPlaying () {
    return !playing.equals({});
}