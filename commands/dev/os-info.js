//imports
const os = require("os");
const prettyMilliseconds = require("pretty-ms");
const {sendLongMessage} = require("../../tools/utils");

//module settings
const name = "os-info";
const description = "prints information about the OS the bot is running on"

//main
async function execute(client, message) {
    let output = "";
    output += `OS info:\n`;
    output += ` Uptime: ${prettyMilliseconds(os.uptime * 1000)}\n`;

    output += `  Hostname: ${os.hostname()}\n`;

    //architecture info
    const arch = os.arch();
    const version = os.version();
    output += `  Architecture: \`${arch} (${version})\`\n`;

    output += `  Home path: \`${os.homedir()}\`\n`;

    output += `\n`;
    //cpu info
    output += `  CPUs:\n`
    const cpus = os.cpus();
    for (let i = 0; i < cpus.length; i++) {
        const cpu = cpus[i];
        output += `    ${i}: ${cpu.model}\n`;
    }

    output += `\n`;
    output += `  Memory (free / total): \`${os.freemem()}B/${os.totalmem()}B\`\n`;

    output += `  Network interfaces:\n`;
    const networkInterfaces = os.networkInterfaces();
    const skipInternalBindings = true;

    for (const [interf,bindings] of Object.entries(networkInterfaces)) {
        //skip internal network interfaces
        if (bindings.some(a => a.internal === true) && skipInternalBindings === true) {
            continue;
        }

        output += `    Interface \`${interf}\`:\n`;
        for (let i = 0; i < bindings.length; i++) {
            output += `      Binding \`${i}\`:\n`;
            output += `        Address: \`${bindings[i].address}\`\n`;
            output += `        Netmask: \`${bindings[i].netmask}\`\n`;
            output += `        Family: \`${bindings[i].family}\`\n`;
            output += `        MAC Address: \`${bindings[i].mac}\`\n`;
            output += `        Address: \`${bindings[i].address}\`\n`;
            output += `        Internal: \`${bindings[i].internal}\`\n`;
            output += `        CIDR: \`${bindings[i].cidr}\`\n`;
        }
    }
    await sendLongMessage(output,message.channel);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
}

//helper functions