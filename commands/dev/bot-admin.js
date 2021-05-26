//imports
const {sendMessage} = require("../../tools/sendMessage");

//prisma
const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();

//module settings
const name = "bot-admin";
const description = "manages bot administrators"
const params = [
    {
        param: "Subcommand",
        type: "Enum{add,remove}",
        description: "The subcommand",
    },
    {
        param: "User",
        type: "Snowflake|Mention",
        description: "The userID or @Mention for the user to modify"
    }
]
const allowedContexts = [
    "text",
    "dm",
];
const adminOnly = true;

//main
const execute = async function (message, args) {
    if (!args[0]) {
        await sendMessage("You must provide a subcommand.", message.channel);
        return true;
    }
    const subCommand = args[0];

    if (subCommand !== "grant" && !args[1]) {
        await sendMessage("You must provide a userId or Mention", message.channel);
        return true;
    }
    let targetUserId;
    if (args[1]) {
        targetUserId = args[1].replace(/[^\d]/g, "");
    }

    let executingUserFromDb = await prisma.author.findUnique({
        where: {
            id: message.author.id,
        },
    });
    if (!executingUserFromDb) {
        await sendMessage("Your user ID was not found in the database.", message.channel);
        return true;
    }

    let targetUserFromDb;

    if (subCommand === "add" ||
        subCommand === "del" ||
        subCommand === "delete" ||
        subCommand === "remove" ||
        subCommand === "rem") {
        if (!executingUserFromDb.isSuperAdmin) {
            await sendMessage("You do not have permission to use this command.", message.channel);
            return true;
        }
        if (!args[1]) {
            await sendMessage("You must include a target user.", message.channel);
            return true;
        }
        targetUserFromDb = await prisma.author.findUnique({
            where: {
                id: targetUserId,
            }
        });
        if (!targetUserFromDb) {
            await sendMessage("That user was not found in the DB.", message.channel);
            return true;
        }
    }
    switch (subCommand) {
        case 'add': {
            if (targetUserFromDb.isAdmin) {
                await sendMessage("That user is already an Admin.", message.channel);
                return true;
            }
            const verifyMessage = await sendMessage(`You are about to grant admin for this bot to `
                + `${targetUserFromDb.displayName}(${targetUserId}). Please react with ✅ to verify.`, message.channel);
            await verifyMessage.react("✅");
            await verifyMessage.react("🛑");
            const filter = (reaction, user) => {
                return user.id === message.author.id &&
                    (reaction.emoji.name === "✅" || reaction.emoji.name === "🛑");
            }
            const collector = verifyMessage.createReactionCollector(filter, {max: 1, time: 60000})
            collector.on("collect", async r => {
                    if (r.emoji.name === "✅") {
                        console.log("check passed");
                        await verifyMessage.delete();
                        targetUserFromDb = await prisma.author.update({
                            where: {
                                id: targetUserId,
                            },
                            data: {
                                isAdmin: true,
                            },
                        });
                        if (targetUserFromDb.isAdmin) {
                            await sendMessage(`You have granted Admin privileges to ${targetUserFromDb.displayName}`
                                + `(${targetUserFromDb.id}).`, message.channel);
                        } else {
                            await sendMessage("Something went wrong granting Admin privileges",
                                message.channel);
                        }
                        return true;
                    } else {
                        console.log("check failed");
                        await verifyMessage.delete();
                        await sendMessage(`You declined the reaction check and did not grant Admin to `
                            + `${targetUserFromDb.displayName}(${targetUserFromDb.id}).`, message.channel);
                    }
                }
            );
            break;
        }
        case 'delete':
        case 'del':
        case 'remove':
        case 'rem': {
            if (!targetUserFromDb.isAdmin) {
                await sendMessage("That user is not an Admin.", message.channel);
                return true;
            }
            if (targetUserFromDb.isSuperAdmin) {
                await sendMessage("That user is a SuperAdmin, you may not remove their Admin privileges.",
                    message.channel);
                return true;
            }
            const verifyMessage = await sendMessage(`You are about to remove admin for this bot to `
                + `${targetUserFromDb.displayName}(${targetUserId}). Please react with ✅ to verify.`, message.channel);
            await verifyMessage.react("✅");
            await verifyMessage.react("🛑");
            const filter = (reaction, user) => {
                return user.id === message.author.id &&
                    (reaction.emoji.name === "✅" || reaction.emoji.name === "🛑");
            }
            const collector = verifyMessage.createReactionCollector(filter, {max: 1, time: 60000})
            collector.on("collect", async r => {
                    if (r.emoji.name === "✅") {
                        console.log("check passed");
                        await verifyMessage.delete();
                        targetUserFromDb = await prisma.author.update({
                            where: {
                                id: targetUserId,
                            },
                            data: {
                                isAdmin: false,
                            },
                        });
                        if (!targetUserFromDb.isAdmin) {
                            await sendMessage(`You have removed Admin privileges for ${targetUserFromDb.displayName}`
                                + `(${targetUserFromDb.id}).`, message.channel);
                        } else {
                            await sendMessage("Something went wrong removing Admin privileges",
                                message.channel);
                        }
                        return true;
                    } else {
                        console.log("check failed");
                        await verifyMessage.delete();
                        await sendMessage(`You declined the reaction check and did not remove Admin for `
                            + `${targetUserFromDb.displayName}(${targetUserFromDb.id}).`, message.channel);
                    }
                }
            );
            break;
        }
        case 'grant': {
            if (!executingUserFromDb.isSuperAdmin) {
                const superAdminExists = !!await prisma.author.findFirst({
                    where: {
                        isSuperAdmin: true,
                    }
                });
                if (superAdminExists) {
                    await sendMessage("At least one SuperAdmin already exists for this bot.", message.channel);
                    return true;
                }
                const verifyMessage = await sendMessage("You are about to become a SuperAdmin for this bot. "
                    + "Please react with ✅ to verify.", message.channel);
                await verifyMessage.react("✅");
                await verifyMessage.react("🛑");
                const filter = (reaction, user) => {
                    return user.id === message.author.id &&
                        (reaction.emoji.name === "✅" || reaction.emoji.name === "🛑");
                }
                const collector = verifyMessage.createReactionCollector(filter, {max: 1, time: 60000})
                collector.on("collect", async r => {
                    if (r.emoji.name === "✅") {
                        console.log("check passed");
                        await verifyMessage.delete();
                        executingUserFromDb = await prisma.author.update({
                            where: {
                                id: message.author.id,
                            },
                            data: {
                                isSuperAdmin: true,
                                isAdmin: true,
                            },
                        });
                        if (executingUserFromDb.isSuperAdmin) {
                            await sendMessage("You have been granted SuperAdmin privileges.", message.channel);
                        } else {
                            await sendMessage("Something went wrong granting you SuperAdmin privileges",
                                message.channel);
                        }
                        return true;
                    } else {
                        console.log("check failed");
                        await verifyMessage.delete();
                        await sendMessage("You declined the reaction check and were not granted SuperAdmin.",
                            message.channel);
                    }
                });
                return true;
            }
            if (!args[1]) {
                await sendMessage("You are already a SuperAdmin -- You must include a target user.",
                    message.channel);
                return true;
            }
            targetUserFromDb = await prisma.author.findUnique({
                where: {
                    id: targetUserId,
                }
            });
            if (!targetUserFromDb) {
                await sendMessage("That user ID does not exist in the DB.", message.channel);
                return true;
            }
            if (targetUserFromDb.isSuperAdmin) {
                await sendMessage("That user is already a SuperAdmin.", message.channel);
                return true;
            }
            const verifyMessage = await sendMessage(`You are about to grant SuperAdmin for this bot to `
                + `${targetUserFromDb.displayName}(${targetUserId}). Please react with ✅ to verify.`, message.channel);
            await verifyMessage.react("✅");
            await verifyMessage.react("🛑");
            const filter = (reaction, user) => {
                return user.id === message.author.id &&
                    (reaction.emoji.name === "✅" || reaction.emoji.name === "🛑");
            }
            const collector = verifyMessage.createReactionCollector(filter, {max: 1, time: 60000})
            collector.on("collect", async r => {
                    if (r.emoji.name === "✅") {
                        console.log("check passed");
                        await verifyMessage.delete();
                        targetUserFromDb = await prisma.author.update({
                            where: {
                                id: targetUserId,
                            },
                            data: {
                                isSuperAdmin: true,
                                isAdmin: true,
                            },
                        });
                        if (targetUserFromDb.isSuperAdmin) {
                            await sendMessage(`You have granted SuperAdmin privileges to ${targetUserFromDb.displayName}`
                                + `(${targetUserFromDb.id}).`, message.channel);
                        } else {
                            await sendMessage("Something went wrong granting SuperAdmin privileges",
                                message.channel);
                        }
                        return true;
                    } else {
                        console.log("check failed");
                        await verifyMessage.delete();
                        await sendMessage(`You declined the reaction check and did not grant SuperAdmin to `
                            + `${targetUserFromDb.displayName}(${targetUserFromDb.id}).`, message.channel);
                    }
                }
            );
            break;
        }
        default:
            await sendMessage(`\`${subCommand}\` is not a valid subcommand.`)
            return true;
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