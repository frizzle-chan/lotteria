# CLAUDE.md

## Browser support

Target only the latest versions of the major browsers, including Safari on iPadOS (Card Draw is built for iPads). Use any language or platform feature those versions support (ES modules, `#private` members, optional chaining, …) without polyfills, transpiling or fallbacks. Don't flag old-browser compatibility as a defect in reviews. If a feature isn't yet in every current major browser, check support before relying on it.

## Project layout

- `docs/` is the published GitHub Pages site. There is no build step: the files there are what the browser runs.
- `docs/deck.js` owns the Deck: card rules (unique names, ids, numbers) and storage through a card store (`IndexedDBCardStore` in the browser, `MemoryCardStore` in tests). All card changes go through it; `docs/script.js` is the UI.
- `docs/sw.js` is the service worker. When adding or renaming a file the app loads, add it to `STATIC_CACHE_URLS` and bump `CACHE_NAME`.
- `GLOSSARY.md` defines the domain terms (Card, Deck, Tabla, Card Draw, import modes). Use them.

## Checks

- `npm test` runs the Node unit tests in `tests/` (`node --test`, no dependencies).
- `node validate.js` checks that expected features and elements exist.
- To try the app: `npm start`, then open http://localhost:8000.
