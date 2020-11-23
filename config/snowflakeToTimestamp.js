/*
* converts a discord snowflake to a timestamp
 */
export default function snowflakeToTimestamp(snowflake) {
    const discord_epoch = 1420070400000
    const timestamp_64 = BigInt.asUintN(64,snowflake);
    let message_timestamp_bits = Number(timestamp_64 >> 22n);
    return message_timestamp_bits + discord_epoch;
}