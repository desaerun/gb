const CONFIG = require('../config/config');
module.exports = {
    name: 'josh-gym-shower-eat',
    description: 'Responds to Josh talking about the gym, showering, or eating.',
    listen(client, message) {
        const joshID = '95693092430020608';
        const desID = '187048556643876864';

        if (message.author.id !== joshID && message.author.id !== desID) return false;

        // let messageContent = message.content.split(' ');
        const messageContent = message.content;
        let response;

        if (messageContent.test('\bgym\n')) {
            response = `Oh look Josh talking about the gym again`;
        } else if (messageContent.test('\bshower\b')) {
            response = `Well hurry up Josh, I don't have all day`;
        } else if (messageContent.test('\beat\b') || messageContent.test('\bfood\b')) {
            response = `Josh, you're going to get fat.`;
        } else if (messageContent.test('\bbail\b')) {
            response = `But Josh we neeeeeeeed you`;
        }

        if (response) {
            message.channel.send(response);
            return true;
        }

        return false;
    }
}