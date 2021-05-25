const CONFIG = {
    PREFIX: "-", // sets the prefix for commands

    VERBOSITY: 3, // sets verbosity level

    //just hardcoding some channel/guild/user IDs for easier reference
    GUILDS: {
        RAGEAHOLICS: {
            ID: "270271948527894541",
            NAME: "Rageaholics",
            CHANNELS: {
                CODE_SHIT: {
                    ID: "674824072126922753",
                },
            }
        },
        "270271948527894541": {
            ID: "270271948527894541",
            NAME: "Rageaholics",
            CHANNELS: {
                CODE_SHIT: {
                    ID: "674824072126922753",
                },
            }
        },
        BOT_SANDBOX: {
            ID: "576960974825979920",
            NAME: "Bot sandbox",
            CHANNELS: {
                DEV: {
                    ID: "576960974825979935",
                }
            }
        },
        "576960974825979920": {
            ID: "576960974825979920",
            NAME: "Bot sandbox",
            CHANNELS: {
                DEV: {
                    ID: "576960974825979935",
                }
            }
        }
    },
    MEMBERS: {
        DESAERUN: {
            ID: "187048556643876864",
            GUILDS: [
                "270271948527894541",
                "576960974825979920",
            ],
        },
        JOSH: {
            ID: "95693092430020608",
            GUILDS: [
                "270271948527894541",
            ],
        },
        CHARLES: {
            ID: "95693092430020608",
            GUILDS: [
                "270271948527894541",
                "576960974825979920",
            ],
        },
        BIRK: {
            ID: "97542223641464832",
            GUILDS: [
                "270271948527894541",
                "576960974825979920",
            ]
        }
    },

    //legacy
    GUILD_RAGEAHOLICS_ID: "270271948527894541",
    GUILD_BOT_SANDBOX_ID: "576960974825979920",
    USER_DESAERUN_ID: "187048556643876864",
    USER_JOSH_ID: "95693092430020608",
    USER_CHARLES_ID: "97388794692505600",
    USER_BIRK_ID: "97542223641464832",
    CHANNEL_CODE_SHIT_ID: "674824072126922753",
    CHANNEL_DEV_ID: "576960974825979935",
}
module.exports = CONFIG;