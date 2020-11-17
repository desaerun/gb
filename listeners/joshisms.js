const CONFIG = require('../config/config');

function buildWordResponseMap() {
    let map = new Map();

    map.set(/\bgym\b/i, "Oh look Josh talking about the gym again.");
    map.set(/\bshower\b/i, "Well hurry up Josh, I don't have all day.");
    map.set(/\b(eat|food)\b/i, "Josh, you're going to get fat.");
    map.set(/\bbail\b/i, "But Josh we neeeeeeeed you");
    map.set(/\bchipotle\b/i, "I bet you could swallow one of those burritos whole.");
    map.set(/^\s*\bno\b\s*$/i, "Yes.");
    map.set(/\bs2000\b/i, "Look at Josh talking about his car again.");

    return map;
}

module.exports = {
    name: 'joshisms',
    description: 'Responds to Josh talking about the things he talks about frequently.',
    listen(client, message) {

        if (message.author.id !== CONFIG.user_josh_id) return false;

        let wordResponseMap = buildWordResponseMap();

        for (let key of wordResponseMap.keys()) {
            if (key.test(message.content)) {
                let response = wordResponseMap.get(key);
                message.channel.send(response);
                return true;
            }
        }

        return false;
    }
}