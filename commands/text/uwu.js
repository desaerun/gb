//imports
const {getRandomArrayMember,sendLongMessage} = require("../../tools/utils.js");

//module settings
const name = "uwu";
const description = "uwuifys text";
const params = [
    {
        param: "text",
        type: "String",
        description: "The text to be uwu-ified",
        default: [
            `I sexually Identify as an Attack Helicopter. Ever since I was a boy I dreamed of soaring over the oilfields dropping hot sticky loads on disgusting foreigners. People say to me that a person being a helicopter is Impossible and I'm fucking retarded but I don't care, I'm beautiful. I'm having a plastic surgeon install rotary blades, 30 mm cannons and AMG-114 Hellfire missiles on my body. From now on I want you guys to call me "Apache" and respect my right to kill from above and kill needlessly. If you can't accept me you're a heliphobe and need to check your vehicle privilege. Thank you for being so understanding.`,
            `What the fuck did you just fucking say about me, you little bitch? I'll have you know I graduated top of my class in the Navy Seals, and I've been involved in numerous secret raids on Al-Quaeda, and I have over 300 confirmed kills. I am trained in gorilla warfare and I\'m the top sniper in the entire US armed forces. You are nothing to me but just another target. I will wipe you the fuck out with precision the likes of which has never been seen before on this Earth, mark my fucking words. You think you can get away with saying that shit to me over the Internet? Think again, fucker. As we speak I am contacting my secret network of spies across the USA and your IP is being traced right now so you better prepare for the storm, maggot. The storm that wipes out the pathetic little thing you call your life. You're fucking dead, kid. I can be anywhere, anytime, and I can kill you in over seven hundred ways, and that's just with my bare hands. Not only am I extensively trained in unarmed combat, but I have access to the entire arsenal of the United States Marine Corps and I will use it to its full extent to wipe your miserable ass off the face of the continent, you little shit. If only you could have known what unholy retribution your little "clever" comment was about to bring down upon you, maybe you would have held your fucking tongue. But you couldn't, you didn't, and now you're paying the price, you goddamn idiot. I will shit fury all over you and you will drown in it. You're fucking dead, kiddo.`,
            `This is probably the worst thing I've ever seen. 100 years from now when I'm dying on a hospital bed and I'm asked what my biggest regret was it will be that I turned on my internet and scrolled through the internet on that fateful day... I will never be able to recover from this. No amount of therapy will save me. No amount of prescription pills will let me recover. I am a shell. This memory is so bad my brain is physically rejecting it and now I have a headache every time I think about it. Why did you post this, thinking it was a good idea? You've permanently ruined my life because of this, I hope you're happy. I hope that one day this gets branded as a war crime and you get hauled off to prison, never to see the light of day again. The fact that you're already not in a psych ward for insanity is so baffling I have lost all faith in every kind of justice system. If you subscribe to any religion, you'd best spend the rest of your time atoning for this ultimate sin. Have a terrible day, I hope this creation of yours haunts you in your dreams.`,
            `First off: I am not joking. I wish I was joking.\n` +
            `\n` +
            `I've been with my wonderful boyfriend Greg for over 4 years now, and this Christmas was our third spent together. He's so much fun to be around, handsome, charming, and our sex life is great. Except for one small problem.\n` +
            `\n` +
            `Every year now starting in December he starts referring to his cum as "Greggnog." When I first heard him say this, it was in the context of a joke, so I laughed, and then I forgot about it. A few days after this, we're exchanging some spicy texts before he gets home from work he says to me, in all seriousness, "I can't wait to pour Greggnog all over your face." I could not believe he just said that to me, but I didn't know what else to do at the time but go along with it.\n` +
            `\n` +
            `Fast forward to this December. This phrase re-enters his vocabulary at the same time every year. It makes me cringe beyond belief, but until this year he used it sparingly enough for me to just be able to laugh and say "shut the fuck up."\n` +
            `\n` +
            `I'm sure that 2020 has done at least some irreparable psychic damage to all people, but unfortunately, for my boyfriend, this has manifested in the form of him referring to his cum as "Greggnog" non-stop. This month he has been using the term almost exclusively, in all contexts, and it is driving me batshit insane. I sat him down to talk last week, and I asked him very clearly and directly to stop. At the time, he said he would, and it did slow down for a few days, but it is now four days after Christmas and he's back at it again with no end in sight.\n` +
            `\n` +
            `He absolutely means the world to me, and I saw myself spending the rest of my life with him, but I have serious doubts now whether or not I can if every Christmas is going to be like this. So please, reddit, what do I do to make this stop for good?`
        ],
    }
];

//main
async function execute(client, message, args) {
    const uwuText = uwuify(args.join(" "));
    await sendLongMessage(uwuText, message.channel);
    message.delete();
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
    uwuify: uwuify,
}

//helper functions

/**
 * Uwu-ifies text
 * @param text The text to uwu-ify
 * @param replacementsFreqBase the frequency to replace the text
 * @returns {string} The uwu-ified text
 */
function uwuify(text, replacementsFreqBase = 1) {
    //trim whitespace
    text = text.trim();
    if (text.length === 0) {
        text = getRandomArrayMember(params[0].default);
    }

    const noReplace = [
        "lol",
        "lmao",
        "rofl",
        "idk",
        "idc",
        "ftl",
        "ianal",
    ];
    const replacements = new Map();
    replacements.set(/^(The)$/g, "Da");
    replacements.set(/^(the)$/g, "da");
    replacements.set(/^(THE)$/g, "DA");
    replacements.set(/(th)/g, "d");
    replacements.set(/(Th|TH)/g, "D");
    replacements.set(/([lr])/g, "w");
    replacements.set(/([LR])/g, "W");
    replacements.set(/^n([aeoiu])/g, "ny$1");
    replacements.set(/^N([aeoiu])/g, "Ny$1");
    const actions = [
        "blushes",
        "sweats",
        "sees bulge",
        "notices bulge",
        "thinks about your bulge",
        "runs away",
        "hugs",
        "huggles tightly",
        "boops your nose",
        "screams",
        "looks at you",
        "pounces on you",
    ];
    const faces = [
        ":3",
        "x3",
        "owo",
        "OwO",
        "uwu",
        "UwU",
        "^-^",
        "^\\_^"
    ];
    const exclamations = [
        "!?",
        "?!",
        "!??",
        "??!",
        "?!?",
        "!?!?!?!??!?",
        "??!!",
        "!11!!"
    ];
    const frequency = {
        replacements: replacementsFreqBase,
        stutters: .12,
        actions: .05,
        faces: .10,
        exclamations: .8,
    }
    const cooldowns = {
        stutters: 1,
        actions: 3,
        faces: 5,
        exclamations: 1,
    }
    const cooldownCounter = {
        stutters: 0,
        actions: 0,
        faces: 0,
        exclamations: 0,
    }

    //split text to an array of words
    const words = text.split(" ");

    //calculate how much the replacement increment should increase by
    //it should be replacing 100% of the message by 85% of the way through.
    const replacementsFreqIncrement = (1 - frequency.replacements) / (words.length / 100 * 85);
    for (let i = 0, replacementsFreqCurrent = replacementsFreqBase; i < words.length; i++, replacementsFreqCurrent += replacementsFreqIncrement) {
        if (i > words.length / 7 || replacementsFreqBase === 1) {
            if (Math.random() < replacementsFreqCurrent) {

                //replace characters one word at a time
                for (const [re, replacement] of replacements) {
                    const wordPart = words[i].match(/([\d\w]+)/);
                    if (
                        wordPart && wordPart[1].length > 2 && //only replace if word is >= 3 characters long
                        !noReplace.includes(wordPart[1].toLowerCase()) //skip some abbreviations
                    ) {
                        words[i] = words[i].replace(re, replacement);
                    }
                }

                //change exclamation marks
                if (
                    Math.random() < frequency.exclamations &&
                    words[i].endsWith("!") &&
                    i - cooldownCounter.exclamations > cooldowns.exclamations

                ) {
                    words[i] = words[i].replace("!", getRandomArrayMember(exclamations));
                    cooldownCounter.exclamations = i;
                }

                //add random stutters
                if (
                    Math.random() < frequency.stutters &&
                    i - cooldownCounter.stutters > cooldowns.stutters
                ) {
                    const stutterChar = words[i][0];
                    words[i] = stutterChar + '-' + words[i].toLowerCase();
                    cooldownCounter.stutters = i;
                }

                //add random actions
                if (
                    Math.random() < frequency.actions &&
                    i - cooldownCounter.actions > cooldowns.actions
                ) {
                    words.splice(i + 1, 0, `*\\*${getRandomArrayMember(actions)}\\**`);
                    i++;
                    cooldownCounter.actions = i;
                }

                //add random faces
                if (
                    Math.random() < frequency.faces &&
                    i - cooldownCounter.faces > cooldowns.faces
                ) {
                    words.splice(i + 1, 0, getRandomArrayMember(faces));
                    i++;
                    cooldownCounter.faces = i;
                }
            }
        }
    }

    console.log(`modified fulltext: ${words.join(" ")}`);
    //join everything back together and return
    return words.join(" ");
}