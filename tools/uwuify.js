const {cartesianProduct, getRandomArrayMember, isUrl} = require("./utils");

/**
 * Uwu-ifies text
 * @param text The text to uwu-ify
 * @param replacementsFreqBase the frequency to replace the text
 * @returns {string} The uwu-ified text
 */
function uwuify(text, replacementsFreqBase = 1) {
    if (text && text.length === 0) {
        return "";
    }
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
        if (isUrl(words[i])) {
            continue;
        }
        if (words[i].startsWith(":") && words[i].endsWith(":")) {
            continue;
        }
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
                    /[a-z]/i.test(words[i].charAt(0)) && //don't apply a stutter if the first char is not a letter
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

    //join everything back together and return
    return words.join(" ");
}

exports.uwuify = uwuify;

/**
 * Uwuifies the text only if Uwu-mode is on, otherwise returns the text unchanged.
 * @param text
 * @returns {string|*}
 */
function uwuifyIfUwuMode(text) {
    if (uwuMode) {
        return uwuify(text);
    }
    return text;
}

exports.uwuifyIfUwuMode = uwuifyIfUwuMode;

/**
 * generates all the combinations possible of replacing the W's in a string with L's or R's (attempt to un-uwuify
 * the string).  Returns an array with the combinations.
 * @param word
 * @returns {String[]}
 */
function generateUwuCombinations(word) {
    let combinations = [];

    let replacements = ["l", "r"];
    let chars = [...word]; // chars is an array of chars for word
    let indices = [];

    // get index of all the "w"s in the string
    let idx = chars.indexOf("w");
    while (idx !== -1) {
        indices.push(idx);
        idx = chars.indexOf("w", idx + 1);
    }
    //indices now contains the indices in chars array where w's exist
    // e.g. "wow" -- indices = [0,2];

    let sets = [];
    for (let i = 0; i < indices.length; i++) {
        sets.push([chars[indices[i]], ...replacements]);
    }
    let replacementCombos = cartesianProduct(...sets);

    for (let i = 0; i < replacementCombos.length; i++) {
        let _chars = chars;
        for (let j = 0; j < indices.length; j++) {
            _chars[indices[j]] = replacementCombos[i][j];
        }
        combinations.push(_chars.join(""));
    }
    return combinations;
}
exports.generateUwuCombinations = generateUwuCombinations;