//imports

//module settings
const name = "uwu";
const description = "uwuifys text";
const params = [
    {
        param: 'text',
        type: 'String',
        description: 'The text to be uwu-ified',
        default: 'I sexually Identify as an Attack Helicopter. Ever since I was a boy I dreamed of soaring over the oilfields dropping hot sticky loads on disgusting foreigners. People say to me that a person being a helicopter is Impossible and I\'m fucking retarded but I don\'t care, I\'m beautiful. I\'m having a plastic surgeon install rotary blades, 30 mm cannons and AMG-114 Hellfire missiles on my body. From now on I want you guys to call me "Apache" and respect my right to kill from above and kill needlessly. If you can\'t accept me you\'re a heliphobe and need to check your vehicle privilege. Thank you for being so understanding.',
        required: false,
    }
];

//main
async function execute(client, message, args) {
    const uwuText = uwuify(args.join(" "));
    const chunkSize = 2000;

    //send text in _chunkSize_ chunks
    for (let i=0;i<uwuText.length;i+=chunkSize) {
        await message.channel.send(uwuText.substr(i,chunkSize));
    }
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
        text = params[0].default;
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
        '^_^'
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
        stutter: .18,
        actions: .1,
        faces: .1,
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
            const randomAction = getRand(0,actions.length-1);
            textToAdd.set(i+1,`*${actions[randomAction]}*`);
        }

        //add random faces
        if (Math.random() < frequency.faces) {
            const randomFace = getRand(0,faces.length-1);
            textToAdd.set(i+1,faces[randomFace])
        }

        //change exclamation marks
        if (Math.random() < frequency.exclamations && words[i].endsWith("!")) {
            const randomExclamation = getRand(0,exclamations.length-1);
            words[i] = words[i].replace("!",exclamations[randomExclamation]);
        }
    }

    //add in replacements
    let offset = 0;
    for (const [index,addedText] of textToAdd) {
        words.splice(index+offset,0,addedText);
        offset++;
    }

    console.log(`Modified fulltext: ${words.join(" ")}`);
    //join everything back together and return
    return words.join(" ");
}
function getRand(min,max) {
    return Math.floor(min + Math.random() * (max-min));
}