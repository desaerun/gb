//imports
const ytdl = require("ytdl-core-discord");
const ytsr = require("ytsr");
const {suppressUrls, sendMessage} = require("../../tools/utils");
const Discord = require("discord.js");

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
let currentSong = {};

async function execute(client, message, args) {
    if (!message.member.voice.channel) {
        await sendMessage(`You must be in a voice channel to use this command.`, message.channel);
        return false;
    }
    let q = args.join(" ");

    let video;
    try {
        const filters = await ytsr.getFilters(q);
        const filter = filters.get("Type").get("Video");
        let req = await ytsr(filter.url, {limit: 1});
        video = req.items[0];
    } catch (e) {
        throw e;
    }
    const song = {
        url: video.url,
        title: video.title,
        description: video.description,
        views: video.views,
        duration: video.duration,
        uploadedAt: video.uploadedAt,
    }
    await playSong(song, message.channel, message.member.voice.channel);
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
    nowPlaying: nowPlaying,
    playNextSong: playNextSong,
}

//helper functions
function addSongToQueue(song) {
    queue.push(song);
}

async function stopPlaying(textChannel) {
    if (!playing) {
        await sendMessage("There is no song currently playing.", textChannel);
        return;
    }
    sendMessage("Stopping current song.", textChannel);
    currentSong.voiceChannel.leave();
    queue.unshift(currentSong);
    currentSong = {};
    playing = false;
}

async function skipSong(textChannel) {
    if (!playing) {
        await sendMessage(`There is no song currently playing.`, textChannel);
        return;
    }
    await sendMessage(`Skipping **${suppressUrls(currentSong.song.title)}**`, textChannel);
    await playNextSong(textChannel, currentSong.voiceChannel);
    if (!playing && queue.length === 0) {
        await sendMessage(`End of song queue.`, textChannel);
    }
}

async function playSong(song, textChannel, voiceChannel) {
    if (queue.length > 0 || playing) {
        addSongToQueue(song);
        await sendMessage(`Added **${suppressUrls(song.title)}** to the queue in position #${queue.length}`, textChannel);
    } else {
        addSongToQueue(song);
        await playNextSong(textChannel, voiceChannel);
    }
}

async function playNextSong(textChannel, voiceChannel) {
    if (queue.length > 0) {
        const song = queue.shift();
        try {
            const connection = await voiceChannel.join();
            const dispatcher = connection.play(await ytdl(song.url), {type: "opus"});
            playing = true;
            currentSong = {
                started: +Date.now(),
                voiceChannel: voiceChannel,
                song: song,
            };
            await nowPlaying(textChannel, false);
            dispatcher.on("finish", () => {
                if (queue.length > 0) {
                    playNextSong(textChannel, voiceChannel);
                } else {
                    playing = false;
                    currentSong = {};
                    voiceChannel.leave();
                }
            });
        } catch (e) {
            throw e;
        }
    } else {
        playing = false;
        currentSong = {};
        voiceChannel.leave();
    }
}

async function nowPlaying(textChannel, showProgressBar = true) {
    if (playing) {
        const songLength = durationStringToSeconds(currentSong.song.duration);
        const elapsed = (+Date.now() - currentSong.started) / 1000;
        const nowPlayingEmbed = new Discord.MessageEmbed()
            .setTitle(":musical_note: Now Playing :musical_note:")
            .setDescription(`[**${currentSong.song.title}**](${currentSong.song.url})`)
            .addField("Description", currentSong.song.description);
        if (showProgressBar) {
            nowPlayingEmbed.addField("Progress", generateProgressBar(21, elapsed, songLength));
        }
        await sendMessage(nowPlayingEmbed, textChannel);
    }
}

async function listQueue(textChannel) {
    await nowPlaying(textChannel);
    if (queue.length === 0) {
        await sendMessage("There are no songs currently in queue.", textChannel);
        return;
    }
    let totalDurationSeconds = 0;
    let queueMessage = "Songs in queue:";
    for (let i = 0; i < queue.length; i++) {
        let song = queue[i];

        totalDurationSeconds += durationStringToSeconds(song.duration);
        queueMessage += `\n${i + 1}. **${suppressUrls(song.title)}** (${song.duration})`;
    }
    if (playing) {
        totalDurationSeconds += durationStringToSeconds(currentSong.song.duration);
    }
    const totalDurationString = secondsToDurationString(totalDurationSeconds, 3);
    queueMessage += `\nTotal duration: ${totalDurationString}`;
    await sendMessage(queueMessage, textChannel, true);
}

async function clearQueue(textChannel) {
    queue = [];
    await sendMessage("Song queue cleared.", textChannel);
}

/**
 * computes the remaining time in seconds, given a duration and the amount of time elapsed
 * @param duration
 * @param elapsed - the number of seconds that have elapsed
 * @returns {number}
 */
function timeRemaining(duration, elapsed) {
    return duration - elapsed;
}

/**
 * converts a duration string into a number of seconds
 * @param durationString - a duration string, eg. "1:23:45" or "12:34"
 * @returns {number}
 */
function durationStringToSeconds(durationString) {
    let durationHours = 0;
    let durationMinutes = 0;
    let durationSeconds;
    const durationParts = durationString.split(":");
    if (durationParts.length === 3) {
        [durationHours, durationMinutes, durationSeconds] = durationParts;
    } else if (durationParts.length === 2) {
        [durationMinutes, durationSeconds] = durationParts;
    } else {
        [durationSeconds] = durationParts;
    }
    durationSeconds = +durationSeconds;
    durationSeconds += (+durationMinutes * 60);
    durationSeconds += (+durationHours * 60 * 60);

    return +durationSeconds;
}

/**
 * Generates a string representing the number of hours / minutes / seconds in format hh:ii:ss, given a number of seconds
 * A second parameter can be passed to specify the level of precision (whether or not a 0 should be printed on 0 hours)
 * Note: hours will always be printed if hours are > 0
 * @param seconds - the number of seconds
 * @param precision - 2 or 3, 3 will print hours as well even if there is 0 hours
 * @returns {string}
 */
function secondsToDurationString(seconds, precision = 2) {
    let h = Math.floor(seconds / 3600);
    let i = Math.floor(seconds % 3600 / 60);
    let s = Math.floor(seconds % 3600 % 60);

    if (s <= 9) {
        s = "0" + s;
    }
    if ((i <= 9 && h > 0) || precision >= 3) {
        i = "0" + i
    }
    if (precision >= 3 || h > 0) {
        return `${h}:${i}:${s}`;
    } else {
        return `${i}:${s}`;
    }
}

/**
 * generates a text status bar
 * @param width
 * @param progress
 * @param total
 */
function generateProgressBar(width, progress, total) {
    const percent = progress / total;
    const barPosition = Math.round(width * percent);
    const currentProgressText = secondsToDurationString(progress);
    let currentProgressTextPosition = barPosition - (currentProgressText.length / 2);
    currentProgressTextPosition = Math.round(currentProgressTextPosition <= 0 ? 0 : currentProgressTextPosition);
    let remainingDurationText = `[-${secondsToDurationString(timeRemaining(total, progress))}]`;
    const remainingDurationPosition = Math.round(barPosition + ((width - barPosition) / 2) - (remainingDurationText.length / 2));
    let progressBarText = "";
    for (let i = 1; i <= width - 1; i++) {
        if (i === currentProgressTextPosition) {
            progressBarText += currentProgressText;
            i += currentProgressText.length;
        } else if (i === remainingDurationPosition) {
            progressBarText += remainingDurationText;
            i += remainingDurationText.length;
        } else {
            progressBarText += " ";
        }
    }
    progressBarText += "   " + secondsToDurationString(total);

    let bar = "╠";
    for (let i = 0; i <= width; i++) {
        if (i === barPosition) {
            bar += "►";
        }
        bar += "═"
    }
    bar += "╣";
    bar += ` ${Math.round(percent * 10000) / 100}%`;

    return `\`\`\`${progressBarText}\n${bar}\`\`\``;
}