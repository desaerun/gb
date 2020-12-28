module.exports = {
    name: "print-env",
    description: "prints environment variables",
    execute: function (client,message) {
        message.channel.send(`
            \`\`\`DISCORD_KEY=${process.env.BOT_TOKEN}\`\`\`
            \`\`\`YOUTUBE_KEY=${process.env.YOUTUBE_TOKEN}\`\`\`
        `)
    }
}