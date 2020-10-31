module.exports = {
    name: 'check-presence',
    description: "check the presences cache of current server",
    execute(client, message, args) {
        let current_guild = message.guild;
        console.log(`current guild: ${current_guild}`);
        message.channel.send(`current_guild: \`\`${current_guild}\`\``);
        console.log(message.guild.presences);
    }
}