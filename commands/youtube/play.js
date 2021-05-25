//imports
const ytdl = require("ytdl-core-discord");
const ytsr = require("ytsr");
const {suppressUrls} = require("../../tools/utils");
const {sendMessage} = require("../../tools/sendMessage")
const Discord = require("discord.js");

//module settings
const name = "play";
const description = "play audio from a youtube file";
const params = [
    {
        param: "youtubeQuery",
        type: "String",
        description: "The query to be searched on youtube",
        default: "L4D2 jockey sounds",
    }
];
const allowedContexts = [
    "text",
    "dm",
];
const adminOnly = false;

//main
let queue = [];
let playing = false;
let currentSong = {};

const execute = async function (message, args) {
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
        await sendMessage(`Could not fetch video file: ${e}`, message.channel);
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
    allowedContexts: allowedContexts,
    adminOnly: adminOnly,
    listQueue: listQueue,
    stopPlaying: stopPlaying,
    skipSong: skipSong,
    clearQueue: clearQueue,
    nowPlaying: nowPlaying,
    playNextSong: playNextSong,
    resumePlaying: resumePlaying,
}

//helper functions
/**
 * Begins playing the song, or, if something is already playing, adds it to the queue.
 *
 * @param song - the object with song information, from ytsr
 * @param textChannel - the object representing the Discord text channel that messages should be sent to.
 * @param voiceChannel - the object representing the Discord voice channel the bot should join and play the song to.
 * @returns {Promise<void>}
 */
async function playSong(song, textChannel, voiceChannel) {
    if (queue.length > 0 && !playing) {
        addSongToTopOfQueue(song);
    } else {
        addSongToQueue(song);
        await sendMessage(`Added **${suppressUrls(song.title)}** to the queue in position #${queue.length}`,
            textChannel, null, true);
    }
    if (!playing) {
        await playNextSong(textChannel, voiceChannel);
    }
}

/**
 * Plays the next song in the queue, or leaves the channel if there are no songs remaining.
 *
 * @param textChannel - the object representing the Discord text channel that messages should be sent to.
 * @param voiceChannel - the object representing the Discord voice channel the bot should join and play the song to.
 * @returns {Promise<void>}
 */
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
            await sendMessage(`Failed to play song ${song.title}: ${e}`, textChannel, null,true);
            playing = false;
        }
    } else {
        playing = false;
        currentSong = {};
        voiceChannel.leave();
    }
}

/**
 * Stops playing the current song and puts it back at the top of the queue.
 *
 * @param textChannel - the object representing the Discord text channel that messages should be sent to.
 * @returns {Promise<void>}
 */
async function stopPlaying(textChannel) {
    if (!playing) {
        await sendMessage("There is no song currently playing.", textChannel);
        return;
    }
    await sendMessage("Stopping current song.  The song has been added back to the top of the queue. " +
        "Use `-resume` to resume playing.", textChannel);
    currentSong.voiceChannel.leave();
    addSongToTopOfQueue(currentSong.song);
    currentSong = {};
    playing = false;
}

/**
 * Resumes playing at the top of the queue without adding a new song.
 *
 * @param textChannel - the object representing the Discord text channel that messages should be sent to.
 * @param voiceChannel - the object representing the Discord voice channel the bot should join and play the song to.
 * @returns {Promise<void>}
 */
async function resumePlaying(textChannel, voiceChannel) {
    if (playing) {
        await sendMessage("A song is already playing!", textChannel);
        return;
    }
    if (queue.length === 0) {
        await sendMessage("There are no songs in the queue.", textChannel);
        return;
    }
    await playNextSong(textChannel, voiceChannel);
}

/**
 * Skips the current song and plays the next song in the queue, or leaves the channel if the queue is now empty.
 *
 * @param textChannel - the object representing the Discord text channel that messages should be sent to.
 * @returns {Promise<void>}
 */
async function skipSong(textChannel) {
    if (!playing) {
        await sendMessage(`There is no song currently playing.`, textChannel);
        return;
    }
    await sendMessage(`Skipping **${currentSong.song.title}**`, textChannel, null, true);
    await playNextSong(textChannel, currentSong.voiceChannel);
    if (!playing && queue.length === 0) {
        await sendMessage(`End of song queue.`, textChannel);
    }
}

/**
 * Lists the song that is currently playing
 *
 * @param textChannel - the object representing the Discord text channel that messages should be sent to.
 * @param showProgressBar - whether or not to show a progress bar
 * @returns {Promise<void>}
 */
async function nowPlaying(textChannel, showProgressBar = true) {
    if (playing) {
        const songLength = durationStringToSeconds(currentSong.song.duration);
        const elapsed = (+Date.now() - currentSong.started) / 1000;
        const nowPlayingEmbed = new Discord.MessageEmbed()
            .setTitle(":musical_note: Now Playing :musical_note:")
            .setDescription(`[**${currentSong.song.title}**](${currentSong.song.url})`);
        if (currentSong.song.description) {
            nowPlayingEmbed.addField("Description", currentSong.song.description);
        }
        if (showProgressBar) {
            nowPlayingEmbed.addField("Progress", generateProgressBar(21, elapsed, songLength));
        }
        await sendMessage(nowPlayingEmbed, textChannel);
    } else {
        await sendMessage("There is no song currently playing.", textChannel);
    }
}

/**
 * Lists the songs currently in the song queue.
 *
 * @param textChannel - the object representing the Discord text channel that messages should be sent to.
 * @returns {Promise<void>}
 */
async function listQueue(textChannel) {
    if (playing) {
        await nowPlaying(textChannel);
    }
    if (queue.length === 0) {
        await sendMessage("There are no songs currently in queue.", textChannel);
        return;
    }
    let totalDurationSeconds = 0;
    let queueMessageArr = [];
    queueMessageArr.push("Songs in queue:");
    for (let i = 0; i < queue.length; i++) {
        let song = queue[i];

        totalDurationSeconds += durationStringToSeconds(song.duration);
        queueMessageArr.push(`${i + 1}. **${suppressUrls(song.title)}** (${song.duration})`);
    }
    if (playing) {
        totalDurationSeconds += durationStringToSeconds(currentSong.song.duration);
    }
    const totalDurationString = secondsToDurationString(totalDurationSeconds, 3);
    queueMessageArr.push(`Total duration: ${totalDurationString}`);
    let queueMessage = queueMessageArr.join("\n");
    await sendMessage(queueMessage, textChannel, null, true);
}

/**
 * Adds a song to the queue array
 *
 * @param song - the object with song information, from ytsr
 */
function addSongToQueue(song) {
    queue.push(song);
}

/**
 * Adds a song to the top of the queue.
 *
 * @param song - the object with song information, from ytsr
 */
function addSongToTopOfQueue(song) {
    queue.unshift(song);
}

/**
 * Empties the song queue.
 *
 * @param textChannel - the object representing the Discord text channel that messages should be sent to.
 * @returns {Promise<void>}
 */
async function clearQueue(textChannel) {
    queue = [];
    if (!playing) {
        currentSong = {};
    }
    await sendMessage("Song queue cleared.", textChannel);
}

/**
 * computes the remaining time in seconds, given a duration and the amount of time elapsed
 *
 * @param duration
 * @param elapsed - the number of seconds that have elapsed
 * @returns {number}
 */
function timeRemaining(duration, elapsed) {
    return duration - elapsed;
}

/**
 * converts a duration string into a number of seconds
 *
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
 *
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
 * generates a cute text status bar
 *
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