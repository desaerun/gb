//imports


//module settings
const name = "throw-exception";
const description = "Throws a test exception";
const allowedContexts = [
    "text",
    "dm",
];
const adminOnly = true;

//main
const execute = function () {
    throw new Error("This is a test error");
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
    allowedContexts: allowedContexts,
    adminOnly: adminOnly,
}

//helper functions