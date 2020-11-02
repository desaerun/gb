module.exports = {
    name: 'josh-gym-shower-eat',
    description: 'Responds to Josh talking about the gym, showering, or eating.',
    listen(client, message) {
        const joshID = '95693092430020608';

        if (message.author.id !== joshID) return false;

        let messageContent = message.content.split(' ');
        let response;

        if (messageContent.includes('gym')) {
            response ='Oh look Josh talking about the gym again';
        } else if (messageContent.includes('shower')) {
            response ='Well hurry up Josh, I don\'t have all day';
        } else if (messageContent.includes('eat') || messageContent.includes('food')) {
            response = 'Josh, you\'re going to get fat.';
        }

        if (response) {
            message.channel.send(response);
            return true;
        }

        return false;
    }
}