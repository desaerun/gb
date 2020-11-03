const CONFIG = require('../config/config');

function buildWordResponseMap() {
    console.log("Creating map");

    let map = new Map();

    console.log("Constructed empty map");

    map.set(/\bgym\b/i, "Oh look Josh talking about the gym again.");
    map.set(/\bshower\b/i, "Well hurry up Josh, I don't have all day.");
    map.set(/\b(eat|food)\b/i, "Josh, you're going to get fat.");
    map.set(/\bbail\b/i, "But Josh we neeeeeeeed you");
    map.set(/\bchipotle\b/i, "I bet you could swallow one of those burritos whole.");
    map.set(/\bno\b/i, "Yes.");

    console.log("Returning map " + map);

    return map;
}

module.exports = {
    name: 'josh-gym-shower-eat',
    description: 'Responds to Josh talking about the gym, showering, or eating.',
    wordResponseMap: buildWordResponseMap(),
    listen(client, message) {

        console.log("Word response map: " + this.wordResponseMap);

        if (message.author.id !== CONFIG.user_josh_id && message.author.id !== CONFIG.user_charles_id) return false;

        for (let key in this.wordResponseMap.keys()) {
            console.log("Testing key: " + key);
            if (message.content.test(key)) {
                console.log("Test for key: " + key + " successful, sending response msg");
                let response = this.wordResponseMap.get(key);
                message.channel.send(response);
                return true;
            }
        }

        return false;
    }
}