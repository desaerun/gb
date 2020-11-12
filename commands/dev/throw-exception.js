module.exports = {
    name: "throw-exception",
    description: "Throws a test exception",
    execute: function (client,message,args) {
        throw new Error("This is a test error");
    }
}