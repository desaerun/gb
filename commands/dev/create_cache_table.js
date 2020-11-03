module.exports = {
    execute: function(message) {
        if(message.user.isAdmin())
        let query = "CREATE TABLE messages (id BIGINT,date VARCHAR(255),guild BIGINT,channel,author,content,)"
    }
}
