# Working on Prospector II

- Edit `src/`, then run `npm run build`. `index.html` is generated and remains the single-file release artifact. Never patch it directly.
- Start with `docs/architecture.md` and `docs/source-map.md`; search relevant functions and callers instead of reading the entire game. Skip `src/assets/sprites.js` unless editing embedded images.
- `src/build-manifest.json` is the explicit assembly order. Preserve the order and script boundaries. These files share globals; they are not independent ES modules.
- Preserve the `G` save shape, localStorage keys, inline-handler function names, DOM IDs, turn progression, startup order, and 1400 x 720 root layout unless the task explicitly changes them.
- Check callers as well as definitions. New biomes affect generation, creatures, tile/ASCII rendering and scans; crew statuses affect ticking, combat, UI and saves; dialogue changes affect state, available options and barter.
- Run `npm test` after building. For runtime changes, open the built HTML in a browser and check the affected behavior. Syntax/build checks alone do not establish gameplay correctness.
- `npm run verify:migration` audits the initial extraction against the recorded original HTML hash. It is deliberately separate from normal tests because later gameplay edits should change that hash.
- `src/html/legacy-design-notes.html` is an unchanged historical comment embedded in the release for exact migration parity. Some descriptions and line references are outdated; current code and `docs/architecture.md` take precedence.
- Do not edit or package Windows executables as part of source organization work.
- Prefer deterministic scenario tests against actual game functions and scripted headless integration checks. Do not navigate the game through browser-control tools unless the user asks. Automated checks cover rules and persistence; report separately what still needs human playtesting.
- `experiment/expedition-legacy` is the active experimental branch; `main` is the public release. The old development tips are preserved as archive tags (see `docs/branch-history.md`).
