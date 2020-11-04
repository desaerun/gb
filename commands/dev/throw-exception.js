module.exports = {
    name: "throw-exception",
    description: "Throws a test exception",
    execute: function (message, client) {
        throw new Error("This is a test error");
    }
}