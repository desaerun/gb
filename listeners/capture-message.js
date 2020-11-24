captureMessage = require("../tools/capture-message");
module.exports = {
    name: "capture-message",
    description: "Listens for a message, captures and stores it to the db",
    listen(client, message) {
        captureMessage(message);
        return false; //make sure other listeners are executed
    }
}