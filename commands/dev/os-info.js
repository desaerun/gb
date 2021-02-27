//imports
const os = require("os");
const prettyMilliseconds = require("pretty-ms");
const {sendMessage} = require("../../tools/sendMessage");

//module settings
const name = "os-info";
const description = "prints information about the OS the bot is running on";
const params = [
    {
        param: "...sections",
        description: "Specify which parts of the OS info are desired.",
        type: "String",
    },
];
const helpText = "Valid section titles are `all`,`user`,`cpu`,`net`,`db`,`tokens`. Multiple sections can be " +
    "specified, separated by spaces.";

//main
async function execute(client, message, args) {
    let fields = [];
    fields.push(`OS info:`);
    fields.push(` Uptime: ${prettyMilliseconds(os.uptime * 1000)}`);
    fields.push(`  Hostname: ${os.hostname()}`);

    //architecture info
    const arch = os.arch();
    const version = os.version();
    fields.push(`  Architecture: ${arch} (${version})`);

    if (includeSection("user", args)) {
        fields.push(``);
        const userInfo = os.userInfo();
        fields.push(`  User info:`);
        fields.push(`    Username: ${userInfo.username}`);
        fields.push(`    UID: ${userInfo.uid}`);
        fields.push(`    GID: ${userInfo.gid}`);
        fields.push(`    Shell: ${userInfo.shell}`);
        fields.push(`    Home path: ${os.homedir()}`);
    }

    if (includeSection("cpu", args)) {
        fields.push(``);
        //cpu info
        fields.push(`  CPUs:`);
        const cpus = os.cpus();
        for (let i = 0; i < cpus.length; i++) {
            const cpu = cpus[i];
            fields.push(`    ${i}: ${cpu.model}`);
        }
    }

    if (includeSection(["memory", "mem"], args)) {
        fields.push(``);
        const usedMem = bytesToHumanReadable(os.totalmem() - os.freemem());
        const freeMem = bytesToHumanReadable(os.freemem());
        const totalMem = bytesToHumanReadable(os.totalmem());
        fields.push(`  Memory (used / free / total): ${usedMem} / ${freeMem} / ${totalMem}`);
    }

    if (includeSection(["network", "net"], args)) {
        fields.push(``);
        fields.push(`  Network interfaces:`);
        const networkInterfaces = os.networkInterfaces();
        const skipInternalBindings = true;

        for (const [interfaceName, bindings] of Object.entries(networkInterfaces)) {
            //skip internal network interfaces
            if (bindings.some(a => a.internal === true) && skipInternalBindings === true) {
                continue;
            }

            fields.push(`    Interface ${interfaceName}:`);
            for (let i = 0; i < bindings.length; i++) {
                fields.push(`      Binding ${i}:`);
                fields.push(`        Address: ${bindings[i].address}`);
                fields.push(`        Netmask: ${bindings[i].netmask}`);
                fields.push(`        Family: ${bindings[i].family}`);
                fields.push(`        MAC Address: ${bindings[i].mac}`);
                fields.push(`        Address: ${bindings[i].address}`);
                fields.push(`        Internal: ${bindings[i].internal}`);
                fields.push(`        CIDR: ${bindings[i].cidr}`);
            }
        }
    }
    if (includeSection(["db", "database"], args)) {
        fields.push(``);
        fields.push(`  Database info:`);
        fields.push(`    Hostname: ${process.env.DB_HOSTNAME}`);
        fields.push(`    Port: ${process.env.DB_PORT}`);
        fields.push(`    DB name: ${process.env.DB_DB_NAME}`);
    }
    if (includeSection(["token", "tokens"], args)) {
        fields.push(``);
        fields.push(`  Tokens:`);
        fields.push(`    Discord API: ${process.env.BOT_TOKEN.substr(0,6)}...${process.env.BOT_TOKEN.substr(-6)}`);
    }

    const output = "```" + fields.join("\n") + "```";
    await sendMessage(output, message.channel, false, true);
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
function includeSection(sections, args) {
    if (args.includes("all")) {
        return true;
    }
    if (Array.isArray(sections)) {
        const intersect = sections.filter(s => args.includes(s));
        return intersect.length > 0;
    }
    return !!args.includes(sections);
}

function bytesToHumanReadable(bytes, si = false, dp = 1) {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }

    const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10 ** dp;

    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


    return bytes.toFixed(dp) + ' ' + units[u];
}