//imports

//module settings
const sendLongMessage = require("../../tools/sendLongMessage");
const name = "uwu";
const description = "uwuifys text";
const params = [
    {
        param: 'text',
        type: 'String',
        description: 'The text to be uwu-ified',
        default: [
            "I sexually Identify as an Attack Helicopter. Ever since I was a boy I dreamed of soaring over the oilfields dropping hot sticky loads on disgusting foreigners. People say to me that a person being a helicopter is Impossible and I'm fucking retarded but I don't care, I'm beautiful. I'm having a plastic surgeon install rotary blades, 30 mm cannons and AMG-114 Hellfire missiles on my body. From now on I want you guys to call me \"Apache\" and respect my right to kill from above and kill needlessly. If you can't accept me you're a heliphobe and need to check your vehicle privilege. Thank you for being so understanding.",
            "What the fuck did you just fucking say about me, you little bitch? I'll have you know I graduated top of my class in the Navy Seals, and I've been involved in numerous secret raids on Al-Quaeda, and I have over 300 confirmed kills. I am trained in gorilla warfare and I\'m the top sniper in the entire US armed forces. You are nothing to me but just another target. I will wipe you the fuck out with precision the likes of which has never been seen before on this Earth, mark my fucking words. You think you can get away with saying that shit to me over the Internet? Think again, fucker. As we speak I am contacting my secret network of spies across the USA and your IP is being traced right now so you better prepare for the storm, maggot. The storm that wipes out the pathetic little thing you call your life. You're fucking dead, kid. I can be anywhere, anytime, and I can kill you in over seven hundred ways, and that's just with my bare hands. Not only am I extensively trained in unarmed combat, but I have access to the entire arsenal of the United States Marine Corps and I will use it to its full extent to wipe your miserable ass off the face of the continent, you little shit. If only you could have known what unholy retribution your little \"clever\" comment was about to bring down upon you, maybe you would have held your fucking tongue. But you couldn't, you didn't, and now you're paying the price, you goddamn idiot. I will shit fury all over you and you will drown in it. You're fucking dead, kiddo.",
            ],
        required: false,
    }
];

//main
async function execute(client, message, args) {
    const uwuText = uwuify(args.join(" "));
    await sendLongMessage(uwuText,message.channel);
}

//module export
module.exports = {
    name: name,
    description: description,
    params: params,
    execute: execute,
}

//helper functions
function uwuify(text) {
    //trim whitespace
    text = text.trim();
    if (text.length === 0) {
        text = params[0].default[getRand(0,params[0].default.length)];
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
    replacements.set(/(The)/g,"Da");
    replacements.set(/(the)/g,"da");
    replacements.set(/(THE)/g,"DA");
    replacements.set(/(th)/g,"d");
    replacements.set(/(Th|TH)/g,"D");
    replacements.set(/([lr])/g,"w");
    replacements.set(/([LR])/g,"W");
    replacements.set(/^n([aeoiu])/g,"ny$1");
    replacements.set(/^N([aeoiu])/g,"Ny$1");
    const actions = [
        'blushes',
        'sweats',
        'sees bulge',
        'notices bulge',
        'thinks about your bulge',
        'runs away',
        'hugs',
        'huggles tightly',
        'boops your nose',
        'screams',
        'looks at you',
        'pounces on you',
    ];
    const faces = [
        ':3',
        'x3',
        'owo',
        'OwO',
        'uwu',
        'UwU',
        '^-^',
        '^\_^'
    ];
    const exclamations = [
        '!?',
        '?!',
        '!??',
        '??!',
        '?!?',
        '!?!?!?!??!?',
        '??!!',
        '!11!!'
    ];
    const frequency = {
        stutter: .14,
        actions: .08,
        faces: .10,
        exclamations: .8,
    }

    //textToAdd will hold the faces, actions, etc. that are being spliced in to the text
    let textToAdd = new Map();

    const words = text.split(" ");
    for (let i=0;i<words.length;i++) {

        //skip over some abbreviations
        for (const [re,replacement] of replacements) {
            const wordPart = words[i].match(/([\d\w]+)/);
            if (wordPart && wordPart[1].length > 2 && !noReplace.includes(wordPart[1].toLowerCase())) {
                words[i] = words[i].replace(re, replacement);
            }
        }

        //add random stutters
        if (Math.random() < frequency.stutter) {
            const stutterChar = words[i][0];
            words[i] = stutterChar + '-' + words[i].toLowerCase();
        }

        //add random actions
        if (Math.random() < frequency.actions) {
            const randomAction = getRand(0,actions.length);
            textToAdd.set(i+1,`*\\*${actions[randomAction]}\\**`);
        }

        //add random faces
        if (Math.random() < frequency.faces) {
            const randomFace = getRand(0,faces.length);
            textToAdd.set(i+1,faces[randomFace])
        }

        //change exclamation marks
        if (Math.random() < frequency.exclamations && words[i].endsWith("!")) {
            const randomExclamation = getRand(0,exclamations.length);
            words[i] = words[i].replace("!",exclamations[randomExclamation]);
        }
    }

    //add in replacements
    let offset = 0;
    for (const [index,addedText] of textToAdd) {
        words.splice(index+offset,0,addedText);
        offset++;
    }

    console.log(`modified fulltext: ${words.join(" ")}`);
    //join everything back together and return
    return words.join(" ");
}
function getRand(min,max) {
    return Math.floor(min + Math.random() * (max-min));
}