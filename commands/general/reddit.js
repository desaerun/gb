//imports
const axios = require('axios');

//module settings
const name = 'reddit';
const description = 'Retrieves the top post of the day from the selected subreddit and shares it';
const args = [
    {
        param: 'subreddit',
        type: 'string',
        description: 'A string representing the subreddit name',
        default: [
            'YoutubeHaiku',
            'TodayILearned',
            'NextFuckingLevel',
            'Aww',
            'InterestingAsFuck',
            'Pics',
            'Gifs',
            'BlackPeopleTwitter',
            'me_irl'
        ],
        required: true,
    }
];
const helpText = 'This is sample help text';

//main
async function execute(client, message, args) {

    let subreddit = args[0];
    // Strip down to only content after '/' chars in case the user selected 'r/youtubehaiku', for example
    if (subreddit.includes('/')) {
        subreddit = subreddit.substring(subreddit.lastIndexOf('/') + 1);
    }

    const requestURL = `https://reddit.com/r/${subreddit}/top/.json?sort=top&t=day&is_self=true&limit=1`;

    try {
        const response = await axios.get(requestURL);
        if (response.status === 200) {

            if (!response.data.data.children) {
                message.channel.send(`I wasn't able to find a post from the subreddit /r/${subreddit}.`);
                return;
            }

            const desiredPostData = response.data.data.children[0].data;

            const fullMessage = buildMessageFromPostJSON(desiredPostData);
            message.channel.send(fullMessage);
        }
    } catch (err) {
        message.channel.send(`Error encountered while requesting data from Reddit: ${err}`);
    }
}

//module export
module.exports = {
    name: name,
    description: description,
    args: args,
    helpText: helpText,
    execute: execute,
}

//helper functions
function buildMessageFromPostJSON(json) {
    const title = json.title;
    const selfText = json.selftext;
    const media = json.url_overridden_by_dest;

    let fullMessage = '';

    if (title) {
        fullMessage += `**${title}**`;
    }

    if (selfText) {
        if (fullMessage.length > 0)
            fullMessage += '\n';
        fullMessage += `${selfText}`;
    }

    if (media) {
        if (fullMessage.length > 0)
            fullMessage += '\n';
        fullMessage += `${media}`;
    }

    return fullMessage;
}