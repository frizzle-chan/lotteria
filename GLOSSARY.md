# Glossary

- **Card** — one picture in the game: `{ id, name, image, number }`. Names are unique ignoring case; numbers are unique and are what gets printed on the card.
- **Deck** — the player's full set of Cards and the module that owns its rules (`docs/deck.js`). All changes to Cards go through it.
- **Card store** — where the Deck saves Cards. Implements `loadAll()`, `add(card)`, `replaceAll(cards)`. Adapters: `IndexedDBCardStore` (browser), `MemoryCardStore` (tests).
- **Deck file** — the exported JSON (`version`, `deckName`, `exportDate`, `cardCount`, `cards`) used to move a Deck between devices.
- **Import mode** — how a Deck file joins the Deck:
  - *Replace*: the file's Cards become the Deck, keeping their ids and numbers where unique.
  - *Merge*: add Cards whose name the Deck doesn't have yet.
  - *Append*: add every Card, renaming duplicates `Name (2)`, `Name (3)`, …
- **Tabla** — a printable 4×4 board of 16 Cards picked at random from the Deck.
- **Card Draw** — the presentation mode where the game master draws Cards one at a time without replacement.
