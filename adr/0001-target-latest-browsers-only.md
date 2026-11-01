# 1. Target only the latest browser versions

- Status: Accepted
- Date: 2026-11-01

## Context

Lotería is a static PWA served from `docs/` with no build step, so the code the browser runs is the code in the repo. Supporting older browsers would mean avoiding newer language features (for example `#private` class members, which need Safari/iPadOS 15) or adding a transpile step.

## Decision

Support only the current versions of the major browsers, including Safari on iPadOS, which the Card Draw presentation mode is built for. Use any language or platform feature those versions support, without polyfills, transpiling or fallbacks for older ones.

## Consequences

- Code can use modern syntax and APIs directly, such as ES modules, `#private` members and optional chaining.
- Devices that can't update to a current browser aren't supported. Don't treat old-browser compatibility as a defect in reviews.
- If a feature isn't yet in every current major browser, check support before relying on it.
