const snowflakeToTimestamp = require(".../tools/snowflakeToTimestamp");

module.exports = {
    name: 'ping',
    description: "this is a ping command",
    execute(client, message) {
        let msgTimestamp = snowflakeToTimestamp(message.id);
        let latency = msgTimestamp - Date.now();

        message.channel.send(`pong (${latency}ms)`);
    }
}