// Tabla generation: random 4×4 boards of Cards drawn from the Deck.

export const TABLA_SIZE = 16;
export const MAX_TABLAS = 100;

// Fisher–Yates shuffle; returns a new array.
export function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// Build `count` Tablas from `cards`. Each Tabla is 16 distinct Cards. Tablas get
// different sets of Cards where the Deck is big enough, and otherwise at least a
// different arrangement, so no two players hold the same board.
export function generateTablas(cards, count, random = Math.random) {
    if (cards.length < TABLA_SIZE) {
        throw new RangeError(`A Tabla needs at least ${TABLA_SIZE} cards; the deck has ${cards.length}.`);
    }
    if (!Number.isInteger(count) || count < 1 || count > MAX_TABLAS) {
        throw new RangeError(`Number of tablas must be a whole number from 1 to ${MAX_TABLAS}.`);
    }

    const tablas = [];
    const usedSets = new Set();
    const usedLayouts = new Set();
    const ATTEMPTS = 200;

    for (let n = 0; n < count; n++) {
        let tabla;
        for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
            tabla = shuffle(cards, random).slice(0, TABLA_SIZE);
            const layout = tabla.map((card) => card.id).join('|');
            const set = tabla.map((card) => card.id).sort().join('|');
            // Prefer a new set of Cards; settle for a new arrangement once sets run out.
            // With exactly 16 cards every Tabla has the same set, so go straight to layouts.
            const wantNewSet = cards.length > TABLA_SIZE && attempt < ATTEMPTS / 2;
            const fresh = wantNewSet ? !usedSets.has(set) : !usedLayouts.has(layout);
            if (fresh) break;
        }
        usedSets.add(tabla.map((card) => card.id).sort().join('|'));
        usedLayouts.add(tabla.map((card) => card.id).join('|'));
        tablas.push(tabla);
    }
    return tablas;
}
