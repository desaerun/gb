//imports

//module settings
const name = "deal";
const description = "deals a hand of cards";
const params = [
    {
        param: 'size',
        type: 'Integer',
        description: 'How many cards to deal',
        default: 1,
        required: true,
    },
];
//main
async function execute(client, message, args) {
    //build a deck
    const suits = [
        "Hearts",
        "Spades",
        "Diamonds",
        "Clubs",
    ];
    const ranks = [
        "One",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven",
        "Eight",
        "Nine",
        "Ten",
        "Jack",
        "Queen",
        "King",
        "Ace",
    ]
    let cards = [];
    let i = 0;
    for (let suit=0;suit<suits.length;suit++) {
        for (let rank=0;rank<ranks.length;rank++,i++) {
            console.log(`rank: ${rank} / ${ranks[rank]} | suit: ${suit} / ${suits[suit]}`);
            cards.push(`${ranks[rank]} of ${suits[suit]}`);
        }
    }
    console.log(`cards: ${cards}`);
    let hand = [];
    for (i=1;i<=+args[0];i++) {
        let card = 1 + (Math.random() * cards.length);
        hand.push(cards.splice(card,1)[0]);
        console.log(`cards left: ${cards}`);
    }
    try {
        await message.channel.send(`Dealt the following cards: **${hand.join("**, **")}**`);
    } catch (e) {
        throw e;
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