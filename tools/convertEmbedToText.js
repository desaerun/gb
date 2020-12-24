module.exports = function convertEmbedToText(embed) {
    let messageContent = "";
    messageContent += "\n\n";
    messageContent += "\*\*\*\*\*Embedded Content\*\*\*\*\*";
    if (embed.title) {
        if (embed.url) {
            messageContent += `\n[**${embed.title}**](${embed.url})`;
        }
        messageContent += `\n${embed.title}`;
    }
    if (embed.description) {
        messageContent += `\n${embed.description}`;
    }
    for (const field of embed.fields) {
        messageContent += `\n**${field.name}**`;
        messageContent += `\n    ${field.value}`;
    }
    if (embed.author) {
        messageContent += `\n${embed.author}`;
        if (embed.timestamp) {
            const formattedTimestamp = moment(embed.timestamp).format("MMM Do YYYY h:mm:ssa");
            messageContent += `at ${formattedTimestamp}`;
        }
    }
    return messageContent;
}