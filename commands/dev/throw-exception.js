//imports

//module settings
const name = "throw-exception";
const description = "Throws a test exception";

//main
const execute = function () {
    throw new Error("This is a test error");
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions