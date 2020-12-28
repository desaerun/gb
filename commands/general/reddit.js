const axios = require('axios');

module.exports = {
    name: 'reddit',
    description: 'Retrieves the top post of the day from the selected subreddit and shares it',
    args: [
        {
            param: '[subreddit]',
            type: 'String',
            description: 'A string representing the subreddit name',
            default: `A random option from ${this.defaultSubreddits}`,
        },
    ],
    defaultSubreddits: [
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
    async execute(client, message, args) {

        let subreddit;

        if (args.length > 0) {
            subreddit = args[0];
            // Strip down to only content after '/' chars in case the user selected 'r/youtubehaiku', for example
            if (subreddit.includes('/')) {
                subreddit = subreddit.substring(subreddit.lastIndexOf('/')+1);
            }
        } else {
            // If no subreddit arg is passed in, select a random one from defaultSubreddits
            let rand = Math.floor(Math.random() * this.defaultSubreddits.length);
            subreddit = this.defaultSubreddits[rand];
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

                const title = desiredPostData.title;
                const selfText = desiredPostData.selftext;
                const media = desiredPostData.url_overridden_by_dest;

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

                message.channel.send(fullMessage);
            }
        } catch (err) {
            message.channel.send(`Error encountered while requesting data from Reddit: ${err}`);
        }
    }
}