import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateTablas, shuffle, TABLA_SIZE, MAX_TABLAS } from '../docs/tabla.js';

const cardsOf = (n) => Array.from({ length: n }, (_, i) => ({ id: `c${i + 1}`, name: `Card ${i + 1}`, number: i + 1 }));
const setKey = (tabla) => tabla.map((c) => c.id).sort().join('|');
const layoutKey = (tabla) => tabla.map((c) => c.id).join('|');

test('shuffle keeps every item and does not mutate the input', () => {
    const items = [1, 2, 3, 4, 5];
    const result = shuffle(items);
    assert.deepEqual(items, [1, 2, 3, 4, 5]);
    assert.deepEqual([...result].sort(), [1, 2, 3, 4, 5]);
});

test('generateTablas makes the requested number of 16-card tablas with no repeated card', () => {
    const tablas = generateTablas(cardsOf(30), 20);
    assert.equal(tablas.length, 20);
    for (const tabla of tablas) {
        assert.equal(tabla.length, TABLA_SIZE);
        assert.equal(new Set(tabla.map((c) => c.id)).size, TABLA_SIZE);
    }
});

test('tablas get different card sets when the deck allows it', () => {
    const tablas = generateTablas(cardsOf(24), 20);
    assert.equal(new Set(tablas.map(setKey)).size, 20);
});

test('with exactly 16 cards, tablas differ by arrangement', () => {
    const tablas = generateTablas(cardsOf(16), 20);
    assert.equal(new Set(tablas.map(layoutKey)).size, 20);
});

test('generateTablas rejects too few cards and bad counts', () => {
    assert.throws(() => generateTablas(cardsOf(15), 1), RangeError);
    assert.throws(() => generateTablas(cardsOf(16), 0), RangeError);
    assert.throws(() => generateTablas(cardsOf(16), 1.5), RangeError);
    assert.throws(() => generateTablas(cardsOf(16), MAX_TABLAS + 1), RangeError);
});
