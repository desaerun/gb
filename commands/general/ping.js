const snowflakeToTimestamp = require("../../tools/snowflakeToTimestamp");

module.exports = {
    name: 'ping',
    description: "this is a ping command",
    execute(client, message) {
        const now = Date.now();
        const msgTimestamp = snowflakeToTimestamp(message.id);
        const latency = now - msgTimestamp;

        console.log(`now: ${now}`);
        console.log(`msgTimestamp: ${msgTimestamp}`);

        message.channel.send(`pong (${latency}ms)`);
    }
}