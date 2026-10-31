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

## Runtime model

This is a source organization step, not a conversion to ES modules. The main game still executes in one classic inline script with shared lexical bindings and global functions. The separate analytics and feedback/barter script blocks remain in their original positions. This preserves inline HTML handlers, declaration visibility and registration order.

`G` is the mutable game state, initialized in `src/core/new-game.js`. Keyboard routing lives in `src/input/keyboard.js`. Actions update state and request rendering; `src/rendering/dispatch.js` selects views, while HUD/sidebar/context controls live under `src/ui/`. Persistent saves and loading are in `src/persistence/save-load.js`. Startup waits for embedded sprites, generates procedural sprites, and displays the menu in `src/core/startup.js`.

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

## Migration audit

Run `npm run verify:migration` to compare assembled output with the SHA-256 and byte count of the original committed HTML. This catches any altered or missing byte, including code, CSS, markup and assets. It is a one-time migration invariant, not an ongoing gameplay test: intentional later changes will make it fail. The historical design comment is retained in `src/html/legacy-design-notes.html` solely to preserve that exact output; use this document for the current development workflow.
