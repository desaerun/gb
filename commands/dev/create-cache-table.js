module.exports = {
    name: 'create-cache-table',
    description: 'Creates a table for the messages cache',
    execute: function(client,message,args) {
        let query = "CREATE TABLE messages (id BIGINT,date VARCHAR(255),guild BIGINT,channel,author,content,)";
    }
}
