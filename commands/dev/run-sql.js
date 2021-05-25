//imports
const {sendMessage} = require("../../tools/sendMessage");

//prisma
const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();

//module settings
const name = "run-sql";
const description = "Runs SQL queries directly";
const params = [
    {
        param: "query",
        type: "String",
        description: "An SQL query",
        default: "SELECT * FROM message LIMIT 5",
    }
];
const allowedContexts = [
    "text",
    "dm",
];
const adminOnly = true;

//main
const execute = async function (message, args) {
    let query = args.join(" ");
    let result;
    try {
        if (
            query.startsWith("SELECT") ||
            query.startsWith("SHOW")
        ) {
            result = await prisma.$queryRaw(query);
        } else {
            result = await prisma.$executeRaw(query);
        }
    } catch (e) {
        await sendMessage(`MySQL error: ${e}`, message.channel);
        return false;
    }
    if (result && Array.isArray(result) && result.length > 0) {
        const outputLines = [];
        for (let row of result) {
            outputLines.push(`\`\`\`${JSON.stringify(row)}\`\`\``)
        }
        const output = outputLines.join("\n");
        await sendMessage(output, message.channel);
    } else if (result) {
        await sendMessage(`Query was executed successfully. Affected rows: ${result}`, message.channel);
    } else {
        await sendMessage("Query was executed successfully, but no rows were returned.", message.channel);
    }
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
    allowedContexts: allowedContexts,
    adminOnly: adminOnly,
}

//helper functions