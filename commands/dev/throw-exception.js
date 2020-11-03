module.exports = {
    name: "throw-exception",
    description: "Throws a text exception",
    execute: function (message, client) {
        throw new Error("This is a test error");
    }
}