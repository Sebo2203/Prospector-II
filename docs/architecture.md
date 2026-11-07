# Modular source experiment

The game is developed in thematic source files and distributed as a single `index.html`. The initial extraction is byte-identical to the committed HTML at the revision in `migration-baseline.json`. No gameplay code, assets, script boundaries, or initialization order were rewritten.

## Development

Use Node.js 22 or newer. There are no npm dependencies and no installation step.

1. Find the relevant subsystem in [the source map](source-map.md), then search for callers and related state.
2. Edit source under `src/`. For a new file, add it to the appropriate ordered list in `src/build-manifest.json`.
3. Run `npm run build`, then `npm test`.
4. Open the built HTML in a browser and exercise the behavior you changed.
5. Commit the source and rebuilt `index.html` together.

The build injects source text into `src/index.template.html`. It preserves source order and whitespace, checks individual and combined JavaScript syntax, and rejects duplicate, omitted or incorrectly configured inputs. `npm run check` detects an out-of-date generated HTML without rewriting it. CI runs the same checks.

## Release version

`package.json` → `version` is the only manually maintained current version. Edit that one value, run `npm run build`, then `npm test`, and commit the generated output with the change. No separate version-editing pass is needed.

`tools/version.js` validates the value and supplies `GAME_VERSION` and `GAME_VERSION_LABEL` to the single-file build. The HUD and canvas menu share the derived label. The build also synchronizes desktop package/lock metadata, the Tauri configuration and the game package's Cargo manifest/lock entry; dependency versions are preserved. `npm run check` rejects stale packaging metadata or HTML. Desktop `npm run sync`, `dev` and `build` run the same source build first. If using `PROSPECTOR_INDEX`, that override still chooses the HTML copied into the desktop wrapper; the developer is responsible for choosing a matching external artifact.

Current guides link to the version source rather than duplicate a changing number. Historical release notes and changelog entries keep their original versions. The canonical version is embedded in the generated HTML, so offline play needs no external version file.

Optional browser-based checks and native-action playthrough controllers live in [qa/](../qa/README.md), with their own pinned Playwright dependency and portable Chromium setup. They resolve the built HTML relative to the repository and keep generated evidence in ignored `qa/artifacts/`. The root build/tests retain their dependency-free setup. Fixtures used by scenario checks are separate from unassisted career policies; both must report their actual limits and outcomes.

## Runtime model

This is a source organization step, not a conversion to ES modules. The main game still executes in one classic inline script with shared lexical bindings and global functions. The separate analytics and feedback/barter script blocks remain in their original positions. This preserves inline HTML handlers, declaration visibility and registration order.

`G` is the mutable game state, initialized in `src/core/new-game.js`. Keyboard routing lives in `src/input/keyboard.js`. Actions update state and request rendering; `src/rendering/dispatch.js` selects views, while HUD/sidebar/context controls live under `src/ui/`. Persistent saves and loading are in `src/persistence/save-load.js`. Startup waits for embedded sprites, generates procedural sprites, and displays the menu in `src/core/startup.js`.

The root keeps a 1400×720 logical layout. `src/ui/scaling-and-compass.js` fits it to the viewport with CSS layout zoom, with transform scaling as a fallback. Drawing and pointer hit areas use `canvasWidth` and `canvasHeight`. The main canvas backing dimensions are the displayed size in device pixels and can change on resize or display density changes. Use the backing dimensions for pixel reads and writes.

### Action timing

`src/actions/turns.js` coordinates the career clock. A committed action advances the global turn once, and a completed turn ticks crew conditions and timed incidents. Physical surface actions also advance local daylight, refresh sight, and apply oxygen and local hazards. Movement and waiting keep their own effects such as injury costs and medic aid. Paid orbital scans consume one fuel and one turn, and a casino event consumes one turn at buy-in. Menu navigation, inventory management and failed checks that consume no resources remain free.

The tactical arena uses local rounds for exhaust. Committed actions also advance the career clock while the encounter resolves locally. Ship reloads use absolute career-turn deadlines, while heat and shields tick through `finishCareerTurn`. Galaxy movement keeps its existing travel and wait rules.

### Ship equipment

`src/ships/systems.js` owns hull mount profiles, installed-versus-effective core ratings, power allocation, heat, shields, critical damage and engineer repairs. Nominal player equipment stays in `G.shipStats`; the physical six-core integrity/bypass map, heat, shield charge/recharge deadline, system clock and per-mount `weaponReadyAt` deadlines live on `G.ship`. NPCs use the same persistent fields and a generated `systemStats`/weapon loadout on their authoritative roster actor. Encounters retain display aliases, synchronized from that actor; loading rebinds reload-array aliases and actor IDs.

`G.shipStats.maxFuel` is installed capacity, while `G.maxFuel` is the usable limit after tank damage. `syncPlayerShipSystems` clamps actual fuel and shields without creating either resource. Temporary bypasses derive effective values from the current career turn and never heal integrity. NPCs catch up cooling and shield recharge on entering an encounter. Replacing a destroyed patrol creates healthy core state; retreating preserves the same damaged ship. The debug palette uses an explicit 1,000-unit tank and resets core/readiness state when returning to a gallery.

`src/ui/ship-systems.js` is a native modal using the same `repairShipSystem` action as scripts and keyboard/pointer access. Field repair invokes the relevant location turn process; browsing remains free. See the [equipment guide](experiment.md#mounts-core-systems-and-damage) for the rules and `qa/ship-systems-scenarios.cjs` for native integration coverage.

| Source area | Responsibility |
| --- | --- |
| `core`, `input`, `actions`, `movement` | State, startup, controls, player actions and turns |
| `world` | Galaxy/planet/interior generation, terrain, creatures, visibility and hazards |
| `crew`, `ships`, `combat` | Crew health/skills/morale, NPC ships and battles |
| `civilizations`, `dialogue`, `content` | Civilization state and encounters, dialogue engine/data, endings |
| `economy`, `missions` | Trading, station shops, barter, casino and science jobs |
| `rendering`, `ui`, `styles`, `html` | Canvas drawing, menus/panels, layout and markup |
| `assets`, `audio` | Embedded sprite data and generated sound |
| `persistence`, `platform`, `integrations`, `debug` | Saves, desktop link, analytics/feedback and diagnostics |

## Boundaries and limitations

The source files are contiguous extractions at complete top-level statement boundaries. A few names intentionally describe more than one responsibility because the original code interleaves those concerns. Large object literals (tile drawings and dialogue definitions) and the keyboard listener remain intact. Moving declarations or splitting these internals should be a separate, tested change.

Global coupling still exists. A file boundary does not guarantee an independent subsystem. Locate references before changing a function, and retain dependencies across systems. Smaller files help selective reading; they do not automatically guarantee lower token use or correct changes.

Embedded Base64 sprites are isolated in `src/assets/sprites.js` so they need not be read for ordinary logic edits. The build still embeds them into HTML. Google Analytics and Formspree remain external network integrations; this extraction makes no new offline guarantees. The tracked Windows executable is unchanged and is not rebuilt by the HTML build command.

The experimental ship-art pass adds generated overrides in `src/assets/ship-sprites.js`, shared role/frame selection in `src/rendering/ship-art.js` and reproducible import tooling. See [art direction and provenance](art-direction.md). Original source BMPs are retained separately; the release still embeds the derived PNGs and needs no external image files.

Orbital-body colors and drawing helpers live in `src/rendering/system-body-icons.js`. The system view and disposable debug palette reuse them. The palette uses native object cells for casinos and derelicts; planetary/civilization fixture previews change only its presentation, while ordinary galaxy systems retain their stars.

## Migration audit

Run `npm run verify:migration` to compare assembled output with the SHA-256 and byte count of the original committed HTML. This catches any altered or missing byte, including code, CSS, markup and assets. It is a one-time migration invariant, not an ongoing gameplay test: intentional later changes will make it fail. The historical design comment is retained in `src/html/legacy-design-notes.html` solely to preserve that exact output; use this document for the current development workflow.
