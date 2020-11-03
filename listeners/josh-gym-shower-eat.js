const CONFIG = require('../config/config');
module.exports = {
    name: 'josh-gym-shower-eat',
    description: 'Responds to Josh talking about the gym, showering, or eating.',
    wordResponseMap: this.buildWordResponseMap(),
    listen(client, message) {

        if (message.author.id !== CONFIG.user_josh_id && message.author.id !== CONFIG.user_desaerun_id) return false;

        for (let key in this.wordResponseMap.keys()) {
            if (message.content.match(key)) {
                let response = this.wordResponseMap.get(key);
                message.channel.send(response);
                return true;
            }
        }
        /*
        // let messageContent = message.content.split(' ');
        const messageContent = message.content;
        let response;

        if (messageContent.match('/\bgym\b/g')) {
            response = `Oh look Josh talking about the gym again`;
        } else if (messageContent.match('/\bshower\b/g')) {
            response = `Well hurry up Josh, I don't have all day`;
        } else if (messageContent.match('/\beat\b/g') || messageContent.match('/\bfood\b/g')) {
            response = `Josh, you're going to get fat.`;
        } else if (messageContent.match('/\bbail\b/g')) {
            response = `But Josh we neeeeeeeed you`;
        }

        if (response) {
            message.channel.send(response);
            return true;
        }
        */

        return false;
    },

    buildWordResponseMap() {
        let map = new Map();

        map.set(/\bgym\b/i, "Oh look Josh talking about the gym again.");
        map.set(/\bshower\b/i, "Well hurry up Josh, I don't have all day.");
        map.set(/\b(eat|food)\b/i, "Josh, you're going to get fat.");
        map.set(/\bbail\b/i, "But Josh we neeeeeeeed you");
        map.set(/\bchipotle\b/i, "I bet you could swallow one of those burritos whole.");
        map.set(/\bno\b/i, "Yes.");

        return map;
    }
}