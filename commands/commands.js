const fs = require('fs');
console.log("loading config file in commands.js");
const CONFIG = require('../config.js');

module.exports = {
    name: 'commands',
    description: 'Lists all the available commands.',
    execute(message,args) {
        let response = 'List of Commands:';
        const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            console.log(file);
            if (file === 'commands.js') {
                response += `\n    _${CONFIG.prefix}${this.name}_: ${this.description}`;
                continue;
            }
            const command = require(`./${file}`);
            response += `\n    _${CONFIG.prefix}${command.name}_: ${command.description}`;
        }
        message.channel.send(response);
    }
}

