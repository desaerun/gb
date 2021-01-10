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
    const replacements = new Map();
    replacements.set(/(th)/g,"d");
    replacements.set(/(Th|TH)/g,"D");
    replacements.set(/([lr])/g,"w");
    replacements.set(/[LR]/g,"W");
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
        stutter: .3,
        actions: .1,
        faces: .1,
        exclamations: .8,
    }

    text = text.trim();
    // replace characters
    console.log(`Full text: ${text}`);
    for (const [re,replacement] of replacements) {
        text = text.replace(re,replacement);
    }


    const randomExclamation = getRand(0,exclamations.length-1);
    console.log(`Modifying exclamation: ${exclamations[randomExclamation]}`);
    text.replace(/(!)/g,exclamations[randomExclamation]);

    console.log(`Modified text: ${text}`);


    const words = text.split(" ");
    let addedStuff = new Map();

    for (let i=0;i<words.length;i++) {
        if (Math.random() < frequency.stutter) {
            const stutterChar = words[i][0];
            words[i] = stutterChar + '-' + words[i].toLowerCase();
        }
        if (Math.random() < frequency.actions) {
            const randomAction = getRand(0,actions.length-1);
            addedStuff.set(i+1,`*${actions[randomAction]}*`);
        }
        if (Math.random() < frequency.faces) {
            const randomFace = getRand(0,faces.length-1);
            addedStuff.set(i+1,faces[randomFace])
        }
        if (Math.random() < frequency.exclamations)  {
            const randomExclamation = getRand(0,exclamations.length-1);
            console.log(`Modifying exclamation: ${exclamations[randomExclamation]}`);
            words[i].replace(/(!)/g,exclamations[randomExclamation]);
        }
    }

    //add in replacements
    let offset = 0;
    for (const [index,newStuff] of addedStuff) {
        words.splice(index+offset,0,newStuff);
        offset++;
    }

    console.log(`Modified fulltext: ${words.join(" ")}`);
    //join everything back together and return
    return words.join(" ");
}
function getRand(min,max) {
    return Math.floor(min + Math.random() * (max-min));
}