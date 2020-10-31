const fs = require('fs');
const CONFIG = require('../config/config.js');

module.exports = {
    name: 'commands',
    description: 'Lists all the available commands.',
    execute(client, message, args) {
        let response = 'List of Commands:';
        function indent(level) {
            let indent_string = '';
            for (var i=0;i<level;i++) {
                indent_string += '    ';
            }
            return indent_string;
        }
        function listCommands(subdir_name = "", level=0) {
            const full_current_dir = `./commands/${subdir_name}`;
            const command_files = fs.readdirSync(full_current_dir);
            console.log(`Directory listing: ${command_files}`);

            for (const file_name of command_files) {
                console.log(`full current dir: ${full_current_dir}`);
                console.log(`current subdir: ${subdir_name}`);
                if (file_name.endsWith('.js')) {
                    console.log(`loading file:  ./${subdir_name}/${file_name}`);
                    if (file_name === 'commands.js') {
                        response += (`\n${indent(level)}${CONFIG.prefix}_commands_: Lists all the available commands.`).replace("_","\_");
                        continue;
                    }
                    const command = require(`./${subdir_name}/${file_name}`);
                    response += `\n    _${CONFIG.prefix}${command.name}_: ${command.description}`;
                } else if(fs.statSync(`${full_current_dir}/${file_name}`).isDirectory()) {
                    console.log(`${indent(level)}Recursing into directory ${full_current_dir}${file_name}`);

                    response += (`\n${indent(level)}${file_name} commands:`).replace("_","\\_");
                    listCommands(`${subdir_name}${file_name}`,level+1);
                }
            }
            return response;
        }

        message.channel.send(listCommands());
    }
}

