module.exports = {
    name: "throw-exception",
    description: "Throws a test exception",
    execute: function () {
        throw new Error("This is a test error");
    }
}