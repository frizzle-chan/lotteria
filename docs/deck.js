// Deck: the player's set of Lotería cards and the rules that keep it valid.
//
// Invariants owned here (and nowhere else):
//   - every card name is non-empty and unique, ignoring case
//   - every card has a unique id and a unique number
//   - in-memory state only changes after the card store has saved it
//
// Storage sits behind a card store seam with two adapters:
//   IndexedDBCardStore (browser) and MemoryCardStore (tests).
// A card store implements: loadAll(), add(card), put(card), replaceAll(cards).

export const IMPORT_MODES = Object.freeze(['replace', 'merge', 'append']);

export class DeckError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'DeckError';
        this.code = code;
    }
}

const nameKey = (name) => name.trim().toLowerCase();

// True when a deck-file card has what the Deck needs to import it.
export const isImportableCard = (card) =>
    card !== null &&
    typeof card === 'object' &&
    typeof card.name === 'string' &&
    card.name.trim() !== '' &&
    typeof card.image === 'string' &&
    card.image !== '';

export class Deck {
    #store;
    #cards;
    #listeners;
    #newId;
    #queue;

    constructor(store, cards = [], { newId } = {}) {
        this.#store = store;
        this.#cards = cards.map((card) => ({ ...card }));
        this.#listeners = new Set();
        this.#newId = newId || (() => Date.now() + Math.random());
        this.#queue = Promise.resolve();
    }

    // Load a Deck from a card store, in card-number order.
    static async open(store, options) {
        const cards = await store.loadAll();
        cards.sort((a, b) => (a.number || 0) - (b.number || 0));
        return new Deck(store, cards, options);
    }

    get size() {
        return this.#cards.length;
    }

    // A copy of the cards in number order; mutating it does not touch the Deck.
    list() {
        return this.#cards.map((card) => ({ ...card }));
    }

    has(name) {
        const key = nameKey(name);
        return this.#cards.some((card) => nameKey(card.name) === key);
    }

    // Called with the new card list after every successful change. Returns an unsubscribe function.
    subscribe(listener) {
        this.#listeners.add(listener);
        return () => this.#listeners.delete(listener);
    }

    // Add one card. Throws DeckError('empty-name' | 'duplicate-name'); store errors propagate unchanged.
    add(name, image) {
        return this.#serialize(async () => {
            const trimmed = typeof name === 'string' ? name.trim() : '';
            if (!trimmed) {
                throw new DeckError('Please enter a card name', 'empty-name');
            }
            if (this.has(trimmed)) {
                throw new DeckError(`A card named "${trimmed}" already exists`, 'duplicate-name');
            }

            const card = {
                id: this.#mintId(new Set(this.#cards.map((c) => c.id))),
                name: trimmed,
                image,
                number: nextNumber(this.#cards),
            };

            await this.#store.add(card);
            this.#commit([...this.#cards, card]);
            return { ...card };
        });
    }

    // Rename the card with this id. Returns the updated card.
    // Throws DeckError('not-found' | 'empty-name' | 'duplicate-name'); store errors propagate unchanged.
    rename(id, name) {
        return this.#serialize(async () => {
            const index = this.#cards.findIndex((card) => card.id === id);
            if (index === -1) {
                throw new DeckError('That card is no longer in the deck', 'not-found');
            }
            const trimmed = typeof name === 'string' ? name.trim() : '';
            if (!trimmed) {
                throw new DeckError('Please enter a card name', 'empty-name');
            }
            const key = nameKey(trimmed);
            if (this.#cards.some((card) => card.id !== id && nameKey(card.name) === key)) {
                throw new DeckError(`A card named "${trimmed}" already exists`, 'duplicate-name');
            }

            if (trimmed === this.#cards[index].name) {
                return { ...this.#cards[index] };
            }
            const card = { ...this.#cards[index], name: trimmed };
            await this.#store.put(card);
            this.#commit(this.#cards.map((c, i) => (i === index ? card : c)));
            return { ...card };
        });
    }

    // Import cards from a deck file.
    //   replace: the incoming cards become the Deck (keeps their ids and numbers where unique)
    //   merge:   add incoming cards whose name is not already in the Deck
    //   append:  add every incoming card, renaming duplicates "Name (2)", "Name (3)", ...
    // Merged and appended cards get fresh ids and numbers continuing after the Deck.
    // Returns { added, skipped, renamed } counts.
    // Throws DeckError('bad-mode' | 'empty-import'); an empty import never touches the Deck.
    import(incoming, mode) {
        return this.#serialize(async () => {
            if (!IMPORT_MODES.includes(mode)) {
                throw new DeckError(`Unknown import mode "${mode}"`, 'bad-mode');
            }
            const all = Array.isArray(incoming) ? incoming : [];
            const valid = all.filter(isImportableCard);
            if (valid.length === 0) {
                throw new DeckError('No valid cards found in the import file.', 'empty-import');
            }

            const result = mode === 'replace'
                ? this.#planReplace(valid)
                : this.#planAdd(valid, mode === 'append');

            await this.#store.replaceAll(result.cards);
            this.#commit(result.cards);
            return { added: result.added, skipped: result.skipped + all.length - valid.length, renamed: result.renamed };
        });
    }

    clear() {
        return this.#serialize(async () => {
            await this.#store.replaceAll([]);
            this.#commit([]);
        });
    }

    // Run changes one at a time, so each one plans against the result of the previous one.
    #serialize(work) {
        const run = this.#queue.then(work);
        this.#queue = run.catch(() => {});
        return run;
    }

    #planReplace(incoming) {
        const cards = [];
        const names = new Set();
        const ids = new Set();
        const numbers = new Set();
        const needsNumber = [];
        let skipped = 0;

        for (const source of incoming) {
            const name = source.name.trim();
            if (names.has(nameKey(name))) {
                skipped++;
                continue;
            }
            names.add(nameKey(name));

            const id = source.id !== undefined && source.id !== null && !ids.has(source.id)
                ? source.id
                : this.#mintId(ids, incoming);
            ids.add(id);

            const card = { id, name, image: source.image, number: source.number };
            if (Number.isInteger(card.number) && card.number > 0 && !numbers.has(card.number)) {
                numbers.add(card.number);
            } else {
                needsNumber.push(card);
            }
            cards.push(card);
        }

        // Cards with a missing or clashing number go after the highest kept number.
        let next = nextNumber(cards.filter((card) => !needsNumber.includes(card)));
        for (const card of needsNumber) {
            card.number = next++;
        }

        return { cards, added: cards.length, skipped, renamed: 0 };
    }

    #planAdd(incoming, renameDuplicates) {
        const cards = [...this.#cards];
        const names = new Set(cards.map((card) => nameKey(card.name)));
        const ids = new Set(cards.map((card) => card.id));
        let next = nextNumber(cards);
        let added = 0;
        let skipped = 0;
        let renamed = 0;

        for (const source of incoming) {
            let name = source.name.trim();
            if (names.has(nameKey(name))) {
                if (!renameDuplicates) {
                    skipped++;
                    continue;
                }
                name = uniqueName(name, names);
                renamed++;
            }
            names.add(nameKey(name));

            const id = this.#mintId(ids, incoming);
            ids.add(id);
            cards.push({ id, name, image: source.image, number: next++ });
            added++;
        }

        return { cards, added, skipped, renamed };
    }

    #mintId(taken, incoming = []) {
        const reserved = new Set(incoming.map((card) => card && card.id));
        let id = this.#newId();
        while (taken.has(id) || reserved.has(id)) {
            id = this.#newId();
        }
        return id;
    }

    #commit(cards) {
        this.#cards = cards;
        const snapshot = this.list();
        this.#listeners.forEach((listener) => listener(snapshot));
    }
}

function nextNumber(cards) {
    return cards.reduce((max, card) => Math.max(max, card.number || 0), 0) + 1;
}

function uniqueName(name, takenKeys) {
    for (let n = 2; ; n++) {
        const candidate = `${name} (${n})`;
        if (!takenKeys.has(nameKey(candidate))) {
            return candidate;
        }
    }
}

// Card store adapter for tests and anything without IndexedDB.
export class MemoryCardStore {
    constructor(cards = []) {
        this.cards = cards.map((card) => ({ ...card }));
    }

    async loadAll() {
        return this.cards.map((card) => ({ ...card }));
    }

    async add(card) {
        this.cards.push({ ...card });
    }

    async put(card) {
        const index = this.cards.findIndex((c) => c.id === card.id);
        if (index === -1) {
            this.cards.push({ ...card });
        } else {
            this.cards[index] = { ...card };
        }
    }

    async replaceAll(cards) {
        this.cards = cards.map((card) => ({ ...card }));
    }
}

// Card store adapter backed by IndexedDB. Each write is one transaction:
// it resolves when the transaction commits and rejects if it aborts.
export class IndexedDBCardStore {
    #db;

    constructor(db) {
        this.#db = db;
    }

    static open(dbName = 'LoteriaDB', version = 1) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, version);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(new IndexedDBCardStore(request.result));
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains('cards')) {
                    const store = db.createObjectStore('cards', { keyPath: 'id' });
                    store.createIndex('name', 'name', { unique: true });
                    store.createIndex('number', 'number', { unique: false });
                }
            };
        });
    }

    loadAll() {
        return new Promise((resolve, reject) => {
            const request = this.#db.transaction('cards', 'readonly').objectStore('cards').getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    add(card) {
        return this.#write((store) => store.add(card));
    }

    put(card) {
        return this.#write((store) => store.put(card));
    }

    replaceAll(cards) {
        return this.#write((store) => {
            store.clear();
            cards.forEach((card) => store.add(card));
        });
    }

    #write(work) {
        return new Promise((resolve, reject) => {
            const transaction = this.#db.transaction('cards', 'readwrite');
            transaction.oncomplete = () => resolve();
            // A failed request reaches onerror first; transaction.error is still null then, so use the request's error.
            transaction.onerror = (event) => reject(event.target.error || transaction.error);
            transaction.onabort = () => reject(transaction.error || new Error('Transaction aborted'));
            try {
                work(transaction.objectStore('cards'));
            } catch (error) {
                // A synchronous throw (e.g. DataCloneError) does not abort the transaction by itself;
                // without this, an earlier clear() in the same transaction would still commit.
                transaction.abort();
                reject(error);
            }
        });
    }
}
