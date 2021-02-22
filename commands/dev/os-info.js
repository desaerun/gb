//imports
const os = require("os");
const prettyMilliseconds = require("pretty-ms");
const {sendLongMessage} = require("../../tools/utils");

//module settings
const name = "os-info";
const description = "prints information about the OS the bot is running on";
const params = [
    {
        param: "...sections",
        description: "Specify which parts of the OS info are desired.",
        type: "String",
        default: "all",
    },
];
const helpText = "Valid section titles are `all`,`user`,`cpu`,`net`,`db`,`tokens`. Multiple sections can be specified," +
    " separated by spaces.";

//main
async function execute(client, message, args) {
    let output = "```";
    output += `OS info:\n`;
    output += ` Uptime: ${prettyMilliseconds(os.uptime * 1000)}\n`;

    output += `  Hostname: ${os.hostname()}\n`;

    //architecture info
    const arch = os.arch();
    const version = os.version();
    output += `  Architecture: ${arch} (${version})\n`;

    if (includeSection("user",args)) {
        output += `\n`;
        const userInfo = os.userInfo();
        output += `  User info:\n`;
        output += `    Username: ${userInfo.username}\n`;
        output += `    UID: ${userInfo.uid}\n`;
        output += `    GID: ${userInfo.gid}\n`;
        output += `    Shell: ${userInfo.shell}\n`;
        output += `    Home path: ${os.homedir()}\n`;
    }

    if (includeSection("cpu",args)) {
        output += `\n`;
        //cpu info
        output += `  CPUs:\n`
        const cpus = os.cpus();
        for (let i = 0; i < cpus.length; i++) {
            const cpu = cpus[i];
            output += `    ${i}: ${cpu.model}\n`;
        }
    }

    if (includeSection(["memory","mem"],args)) {
        output += `\n`;
        const usedMem = bytesToHumanReadable(os.totalmem() - os.freemem());
        const freeMem = bytesToHumanReadable(os.freemem());
        const totalMem = bytesToHumanReadable(os.totalmem());
        output += `  Memory (used / free / total): ${usedMem} / ${freeMem} / ${totalMem}\n`;
    }

    if (includeSection(["network","net"],args)) {
        output += `\n`;
        output += `  Network interfaces:\n`;
        const networkInterfaces = os.networkInterfaces();
        const skipInternalBindings = true;

        for (const [interfaceName, bindings] of Object.entries(networkInterfaces)) {
            //skip internal network interfaces
            if (bindings.some(a => a.internal === true) && skipInternalBindings === true) {
                continue;
            }

            output += `    Interface ${interfaceName}:\n`;
            for (let i = 0; i < bindings.length; i++) {
                output += `      Binding ${i}:\n`;
                output += `        Address: ${bindings[i].address}\n`;
                output += `        Netmask: ${bindings[i].netmask}\n`;
                output += `        Family: ${bindings[i].family}\n`;
                output += `        MAC Address: ${bindings[i].mac}\n`;
                output += `        Address: ${bindings[i].address}\n`;
                output += `        Internal: ${bindings[i].internal}\n`;
                output += `        CIDR: ${bindings[i].cidr}\n`;
            }
        }
    }
    if (includeSection(["db","database"],args)) {
        output += `\n`;
        output += `  Database info:\n`;
        output += `    Hostname: ${process.env.DB_HOSTNAME}\n`;
        output += `    Port: ${process.env.DB_PORT}\n`;
        output += `    DB name: ${process.env.DB_DB_NAME}\n`;
    }
    if (includeSection(["token","tokens"],args)) {
        output += `\n`;
        output += `  Tokens:\n`;
        output += `    Discord API: ${process.env.BOT_TOKEN}\n`;
    }

    output += "```";
    await sendLongMessage(output,message.channel);
}

//module export
module.exports = {
    name: name,
    description: description,
    execute: execute,
    params: params,
    helpText: helpText,
}

//helper functions
function includeSection(sections,args) {
    if (args.includes("all")) {
        return true;
    }
    if (Array.isArray(sections)) {
        const intersect = sections.filter(s => args.includes(s));
        return intersect.length > 0;
    }
    return !!args.includes(sections);
}

function bytesToHumanReadable(bytes, si=false, dp = 1) {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }

    const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10**dp;

    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


    return bytes.toFixed(dp) + ' ' + units[u];
}