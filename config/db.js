//pull db info from .env file
const db = {
    host: process.env.DB_HOSTNAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_DB_NAME,
    charset: "utf8mb4",
}
module.exports = db;