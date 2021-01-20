const name = "test";
const description = "test listener";

async function listen(client, message) {
    console.log("made it to test.js");
    if (message.content.match(/^[\s]*\btest\b[\s]*$/i)) {
        await message.channel.send(`this is an test listener response`);
        return true;
    }
    return false;
}

module.exports = {
    name: name,
    description: description,
    listen: listen,
}
