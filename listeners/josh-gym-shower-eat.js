module.exports = {
    name: 'josh-gym-shower-eat',
    description: 'Responds to Josh talking about the gym, showering, or eating.',
    execute(client, message) {
        const joshID = '97388794692505600';

        if (message.author.id !== joshID) return false;

        if (message.content.includes('gym')) {
            message.channel.send('Oh look Josh talking about the gym again');
            return true;
        } else if (message.content.includes('shower')) {
            message.channel.send('Well hurry up Josh, I don\'t have all day');
            return true;
        } else if (message.content.includes('eat') || message.content.includes('food')) {
            message.channel.send('Josh, you\'re going to get fat.');
            return true;
        }

        return false;
    }
}