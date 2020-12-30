module.exports = {
    name: 'ping',
    description: "this is a ping command",
    execute(client, message) {
        let msgTimestamp = snowflakeToUnixMs(message.id);
        let latency = msgTimestamp - Date.now();

        message.channel.send(`pong (${latency}ms)`);
    }
}

function snowflakeToUnixMs(snowflake) {
    return Math.floor((snowflake/4194304)+1420070400000);
}