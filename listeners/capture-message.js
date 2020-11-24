captureMessage = require("../tools/capture-message");
module.exports = {
    name: "capture-message",
    description: "Captures a message",
    listen(client, message) {
        captureMessage(message);
    }
}