import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Deck, DeckError, MemoryCardStore } from '../docs/deck.js';

let counter = 0;
const newId = () => `id-${++counter}`;

async function deckWith(names = []) {
    const deck = await Deck.open(new MemoryCardStore(), { newId });
    for (const name of names) {
        await deck.add(name, `img:${name}`);
    }
    return deck;
}

class FailingStore extends MemoryCardStore {
    async add() { throw new Error('disk full'); }
    async put() { throw new Error('disk full'); }
    async replaceAll() { throw new Error('disk full'); }
}

test('add numbers cards sequentially and trims names', async () => {
    const deck = await deckWith();
    const a = await deck.add('  La Luna ', 'img');
    const b = await deck.add('El Sol', 'img');
    assert.equal(a.name, 'La Luna');
    assert.deepEqual([a.number, b.number], [1, 2]);
    assert.notEqual(a.id, b.id);
});

test('add rejects empty and duplicate names, ignoring case', async () => {
    const deck = await deckWith(['La Luna']);
    await assert.rejects(deck.add('   ', 'img'), { code: 'empty-name' });
    await assert.rejects(deck.add('la luna', 'img'), (e) => e instanceof DeckError && e.code === 'duplicate-name');
    assert.equal(deck.size, 1);
});

test('a failed save leaves the deck unchanged', async () => {
    const deck = await Deck.open(new FailingStore([{ id: 'x', name: 'El Sol', image: 'i', number: 1 }]), { newId });
    await assert.rejects(deck.add('La Luna', 'img'), /disk full/);
    await assert.rejects(deck.import([{ name: 'El Gallo', image: 'i' }], 'append'), /disk full/);
    await assert.rejects(deck.clear(), /disk full/);
    assert.deepEqual(deck.list().map((c) => c.name), ['El Sol']);
});

test('changes persist to the store and reload', async () => {
    const store = new MemoryCardStore();
    const deck = await Deck.open(store, { newId });
    await deck.add('La Luna', 'img');
    await deck.import([{ name: 'El Sol', image: 'i' }], 'merge');
    const reloaded = await Deck.open(store);
    assert.deepEqual(reloaded.list(), deck.list());
});

test('open orders cards by number', async () => {
    const store = new MemoryCardStore([
        { id: 'b', name: 'El Sol', image: 'i', number: 2 },
        { id: 'a', name: 'La Luna', image: 'i', number: 1 },
    ]);
    const deck = await Deck.open(store);
    assert.deepEqual(deck.list().map((c) => c.number), [1, 2]);
});

test('list returns a copy', async () => {
    const deck = await deckWith(['La Luna']);
    deck.list()[0].name = 'hacked';
    deck.list().push({});
    assert.deepEqual(deck.list().map((c) => c.name), ['La Luna']);
});

test('merge skips existing names and continues numbering with fresh ids', async () => {
    const deck = await deckWith(['La Luna', 'El Sol']);
    const existingIds = deck.list().map((c) => c.id);
    const result = await deck.import([
        { id: existingIds[0], name: 'LA LUNA', image: 'i', number: 1 },
        { id: existingIds[1], name: 'El Gallo', image: 'i', number: 1 },
    ], 'merge');
    assert.deepEqual(result, { added: 1, skipped: 1, renamed: 0 });
    const gallo = deck.list().find((c) => c.name === 'El Gallo');
    assert.equal(gallo.number, 3);
    assert.ok(!existingIds.includes(gallo.id));
});

test('append renames duplicates instead of breaking the unique-name rule', async () => {
    const deck = await deckWith(['La Luna']);
    const result = await deck.import([
        { name: 'La Luna', image: 'i' },
        { name: 'la luna', image: 'i' },
        { name: 'El Sol', image: 'i' },
    ], 'append');
    assert.deepEqual(result, { added: 3, skipped: 0, renamed: 2 });
    assert.deepEqual(deck.list().map((c) => c.name), ['La Luna', 'La Luna (2)', 'la luna (3)', 'El Sol']);
    assert.deepEqual(deck.list().map((c) => c.number), [1, 2, 3, 4]);
});

test('replace keeps file ids and numbers, fixing clashes and duplicates', async () => {
    const deck = await deckWith(['Old Card']);
    const result = await deck.import([
        { id: 'a', name: 'La Luna', image: 'i', number: 7 },
        { id: 'a', name: 'El Sol', image: 'i', number: 7 },
        { id: 'c', name: 'la luna', image: 'i', number: 2 },
        { id: 'd', name: 'El Gallo', image: 'i' },
    ], 'replace');
    assert.deepEqual(result, { added: 3, skipped: 1, renamed: 0 });
    const cards = deck.list();
    assert.deepEqual(cards.map((c) => c.name), ['La Luna', 'El Sol', 'El Gallo']);
    assert.equal(cards[0].id, 'a');
    assert.notEqual(cards[1].id, 'a');
    assert.equal(cards[0].number, 7);
    assert.equal(new Set(cards.map((c) => c.number)).size, 3);
    assert.ok(cards.slice(1).every((c) => c.number > 7));
});

test('import skips invalid cards and rejects unknown modes', async () => {
    const deck = await deckWith();
    const result = await deck.import([null, { name: '' , image: 'i' }, { name: 'X' }, { name: 'Ok', image: 'i' }], 'merge');
    assert.deepEqual(result, { added: 1, skipped: 3, renamed: 0 });
    await assert.rejects(deck.import([], 'overwrite'), { code: 'bad-mode' });
});

test('subscribers hear about successful changes only', async () => {
    const deck = await deckWith();
    const sizes = [];
    const unsubscribe = deck.subscribe((cards) => sizes.push(cards.length));
    await deck.add('La Luna', 'i');
    await assert.rejects(deck.add('La Luna', 'i'));
    await deck.clear();
    unsubscribe();
    await deck.add('El Sol', 'i');
    assert.deepEqual(sizes, [1, 0]);
});

class SlowStore extends MemoryCardStore {
    async add(card) { await new Promise((r) => setTimeout(r, 10)); return super.add(card); }
    async replaceAll(cards) { await new Promise((r) => setTimeout(r, 10)); return super.replaceAll(cards); }
}

test('concurrent adds get distinct numbers', async () => {
    const deck = await Deck.open(new SlowStore(), { newId });
    await Promise.all([deck.add('Y', 'i'), deck.add('Z', 'i')]);
    assert.deepEqual(deck.list().map((c) => `${c.name}#${c.number}`), ['Y#1', 'Z#2']);
});

test('a double add of the same name reports duplicate-name', async () => {
    const deck = await Deck.open(new SlowStore(), { newId });
    const [first, second] = await Promise.allSettled([deck.add('Y', 'i'), deck.add('Y', 'i')]);
    assert.equal(first.status, 'fulfilled');
    assert.equal(second.reason.code, 'duplicate-name');
    assert.equal(deck.size, 1);
});

test('an add during an import is not lost', async () => {
    const store = new SlowStore();
    const deck = await Deck.open(store, { newId });
    await Promise.all([deck.import([{ name: 'A', image: 'i' }], 'merge'), deck.add('B', 'i')]);
    assert.deepEqual(deck.list().map((c) => c.name), ['A', 'B']);
    assert.deepEqual((await Deck.open(store)).list().map((c) => c.name), ['A', 'B']);
});

test('a failed change does not block later ones', async () => {
    const deck = await deckWith(['Y']);
    await assert.rejects(deck.add('Y', 'i'));
    await deck.add('Z', 'i');
    assert.equal(deck.size, 2);
});

test('an import with no valid cards throws and leaves the deck alone', async () => {
    const store = new MemoryCardStore();
    const deck = await Deck.open(store, { newId });
    await deck.add('La Luna', 'i');
    for (const mode of ['replace', 'merge', 'append']) {
        await assert.rejects(deck.import([{ name: '' }, null], mode), { code: 'empty-import' });
        await assert.rejects(deck.import([], mode), { code: 'empty-import' });
    }
    assert.deepEqual(deck.list().map((c) => c.name), ['La Luna']);
    assert.equal(store.cards.length, 1);
});

test('rename changes the name, keeps id and number, and saves it', async () => {
    const store = new MemoryCardStore();
    const deck = await Deck.open(store, { newId });
    const card = await deck.add('La Luna', 'img');
    const seen = [];
    deck.subscribe((cards) => seen.push(cards.map((c) => c.name)));

    const renamed = await deck.rename(card.id, '  La Luna Llena ');
    assert.deepEqual(renamed, { ...card, name: 'La Luna Llena' });
    assert.deepEqual(deck.list(), [renamed]);
    assert.deepEqual(store.cards, [renamed]);
    assert.deepEqual(seen, [['La Luna Llena']]);
});

test('rename allows changing only the case of a name', async () => {
    const deck = await deckWith(['la luna']);
    const [card] = deck.list();
    assert.equal((await deck.rename(card.id, 'La Luna')).name, 'La Luna');
});

test('rename rejects empty, duplicate and unknown cards', async () => {
    const deck = await deckWith(['La Luna', 'El Sol']);
    const [luna] = deck.list();
    await assert.rejects(deck.rename(luna.id, '  '), { code: 'empty-name' });
    await assert.rejects(deck.rename(luna.id, 'el sol'), { code: 'duplicate-name' });
    await assert.rejects(deck.rename('missing', 'El Gallo'), { code: 'not-found' });
    assert.deepEqual(deck.list().map((c) => c.name), ['La Luna', 'El Sol']);
});

test('a failed rename leaves the deck unchanged', async () => {
    const deck = await Deck.open(new FailingStore([{ id: 'x', name: 'El Sol', image: 'i', number: 1 }]), { newId });
    await assert.rejects(deck.rename('x', 'La Luna'), /disk full/);
    assert.equal(deck.list()[0].name, 'El Sol');
});

test('renaming to the same name does not save or notify', async () => {
    let puts = 0;
    class CountingStore extends MemoryCardStore {
        async put(card) { puts++; return super.put(card); }
    }
    const deck = await Deck.open(new CountingStore(), { newId });
    const card = await deck.add('La Luna', 'img');
    const seen = [];
    deck.subscribe((cards) => seen.push(cards));

    assert.deepEqual(await deck.rename(card.id, ' La Luna  '), card);
    assert.equal(puts, 0);
    assert.deepEqual(seen, []);
    await assert.rejects(deck.rename(card.id, null), { code: 'empty-name' });
});

test('queued renames check names against earlier renames', async () => {
    const deck = await deckWith(['La Luna', 'El Sol']);
    const [luna, sol] = deck.list();
    const first = deck.rename(luna.id, 'El Gallo');
    const second = deck.rename(sol.id, 'el gallo');
    await first;
    await assert.rejects(second, { code: 'duplicate-name' });
    assert.deepEqual(deck.list().map((c) => c.name), ['El Gallo', 'El Sol']);
});
