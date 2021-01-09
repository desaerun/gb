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
    if (isNaN(args[0]) || (parseFloat(args[0]) | 0) !== args[0]) {
        try {
            await message.channel.send("You must provide a valid integer input.");
        } catch (e) {
            throw e;
        }
        return;
    }
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
    const deckSize = suits.length * ranks.length;
    console.log(`deck size: ${deckSize} | cards: ${cards}`);

    // if a number bigger than the deck size is given, set it to the maximum size;
    args[0] = (args[0] > deckSize) ? deckSize : args[0];

    let hand = [];
    for (i=1;i<=+args[0];i++) {
        const cardIndex = Math.floor((Math.random() * cards.length));

        const card = cards[cardIndex];
        cards.splice(cardIndex,1);
        hand.push(card);
        console.log(`card: ${card} | cards left: ${cards.join(", ")}`);
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