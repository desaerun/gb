module.exports = {
    name: "print-env",
    description: "prints environment variables",
    execute: function (client,message,args) {
        message.channel.send(`
            \`\`\`DISCORD_KEY=${process.env.BOT_TOKEN}\`\`\`
            \`\`\`YOUTUBE_KEY=${process.env.YOUTUBE_TOKEN}\`\`\`
        `)
    }
}