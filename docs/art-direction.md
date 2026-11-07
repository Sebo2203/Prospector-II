# Ship art and the first galaxy polish pass

Implemented in `0.28.0-experimental.10` on `experiment/expedition-legacy`, November 1, 2026. This pass covers ships and their compositing. Planetary terrain, buildings, creatures, stars and station artwork still have further consistency work ahead.

## Reference and credits

The visual reference is Matthias Mennel's **Prospector R197**, specifically its original `graphics/ships.bmp` and `graphics/ships2.bmp`. The preserved release data is available at [upstream data commit 1b928c0](https://github.com/roguelikes/prospector/tree/1b928c0bb95643302b9dc4ece55fd1fba6e5ba1e/graphics). Its [original copyright notice](https://github.com/roguelikes/prospector/blob/1b928c0bb95643302b9dc4ece55fd1fba6e5ba1e/README.txt) credits **David Gervais and Deon** for graphics. This is an altered import for Prospector II, not original artwork created for this project.

The two unmodified BMP sheets and the full unmodified notice are retained under `art/source/prospector/`. Their SHA-256 hashes are:

| File | SHA-256 |
| --- | --- |
| ships.bmp | `bd5f490cead801fb2c831de731514755c8e8b92e3c5f28c969400bb65a96e773` |
| ships2.bmp | `7043644e105827f80686705e70f33cd029337882c6997289d7c1ec08a644f4c1` |

No generated replacement art was needed after locating the original direction sheets. The original gray metal, cyan windows, warm exhaust, shading and pixel scale establish the style for this pass.

## What changed

- Player Scout, Corvette and Bulk Freighter art now comes from clean imports of original hulls. Their eight original movement frames replace runtime raster rotation. The northward frame is also used by ship selection, hull-change cards and combat portraits, so the same hull appears throughout these views.
- Ship-selection cards reserve space below the taller hulls and wrap descriptions inside each card. Hull-change statistics are separated from the ship and exhaust; native 2x/3x pixel scaling is retained.
- Trader, cargo ship, science ship and patrol have separate original hull silhouettes. They no longer share a recolored pirate ship. Restrained amber, steel, cyan and blue tints supplement the shapes. The pirate remains red. Stranded research vessels use the science silhouette; ordinary stranded vessels retain a freighter silhouette.
- Tints operate on a cached copy of sprite pixels, preserving alpha. The map background is neither painted over nor multiplied by the tint. Source images have independent weakly held caches; a new sprite load cannot reuse an old image's tint. The existing opacity arguments now work, including dim stranded wrecks.
- Importing removes the exact magenta atlas matte. At its boundary it reverses magenta contamination in edge pixels while preserving interior colors and black hull details. Tiny disconnected fragments more than two pixels from the main hull are removed when they contain at most three pixels; nearby lamps, antennae and exhaust tips remain.
- Player headings use exact original frames, with integer screen positions. NPCs retain their existing north-facing map presentation. Their role silhouettes also appear in neutral-target combat. ASCII mode has T/C/S/P for the new civilian keys; existing player and pirate symbols remain.
- Ship roles and behavior, detection, radio pings, encounter placement, movement speed, combat, prices and saves are unaffected. The existing debug palette's trader/cargo/science/patrol samples display the new art without requiring new scenario registrations.

## Radio contacts

From experimental.13, unknown pirate and civilian radio contacts share a small, muted yellow `?` (14px Courier New, `#c9b66b`) centered on the galaxy tile. It is drawn directly over the existing map with no panel fill or border. Sensor/radio ranges, fog rules and identified ship artwork are unchanged; the symbol never reveals a contact's role or allegiance.

## Stations and wrecks

From experimental.14, station artwork is composited over the ordinary space layer. The original starbase sprite retains its genuine alpha; casino/pirate renderers no longer paint tile-sized background fills, and the destroyed pirate-base marker has no matte. Starbase loading no longer falls back to a solid colored tile. Station art preserves underlying pixels outside its silhouette, including over colored backgrounds.

Derelict galaxy objects now use original code-authored 24px wreck art: a fractured orbital ring, severed spokes, breached hub, exposed rusty plating and detached debris. `src/rendering/station-art.js` caches this on a transparent canvas. Native derelicts, the derelict biome sample and Mercy use the same renderer; ASCII retains its existing glyph. No generated bitmap or external art source is required. The existing stations and wrecks keep their interactions, names, placement and saves.

## Full galaxy map

From experimental.25, the full map opened with **M** or the HUD map button draws discovered objects with the same artwork as the galaxy view at nine pixels per sector before window scaling. A green ring marks the player ship. Identified ships use their hull art and unidentified radio contacts use a yellow `?`. Unscanned sectors remain covered. The map has an illustrated key and uses graphics even in ASCII mode.

The HUD minimap fits the whole galaxy. From experimental.26, it uses darker explored space against slate fog, brighter color-coded landmarks, and a green cross for the player. The muted rectangle marks the current galaxy viewport. Explicit canvas dimensions keep it inside its panel when the interface scales.

From experimental.27, the sidebar map frame fits the width of the chart at its existing scale. Close the full map with the top-left **ESC** control or the **Escape** or **M** key.

## Flight interface

From experimental.31, the broad surfaces behind the cockpit instruments and controls use the original dark palette. The individual readouts, vessel plate, segmented gauges, crew and comms console, compass keys, and map frames use the cockpit finish. The display readout names the current view, including navigation, orbital view, orbital scan, surface, and stations. The reduced-motion preference keeps gauge warnings steady.

The version and save status sit in the top-right of the HUD. The shortcuts area uses the dark game background.

In **Options → UI Style**, choose **Cockpit** for the instrument finish or **Classic** for the experimental.27 appearance. The choice applies immediately and is stored in the browser's options. Both styles use the current controls and bottom status strip. **Render Mode** independently switches between sprites and ASCII.

From experimental.34, the title menus, playfield canvas, and full galaxy chart draw at the displayed pixel density. Canvas sprite images use nearest-neighbor sampling. The HTML HUD, sidebar, and overlays are laid out at the fitted scale in browsers with CSS zoom support.

The context bar uses the shortcut legend's muted gray for the general Examine, Inventory, and Options buttons. Local actions and warnings retain their accents. The galaxy view uses an opaque space background and pixel-aligned fog boundaries at fractional scales. Walking and landing scans share the same device-pixel tile edges for all biomes. Sand and snow sample the original textures at offsets tied to world coordinates so their grain does not repeat in a grid.

The context bar wraps actions onto a second row and scrolls vertically if more space is needed. The orbital view reserves space for both rows and an alert, so planets and text stay at the same scale. Other views can shrink to fit the available space while keeping their aspect ratio. In-game panels use the context bar for shared keyboard hints and keep local instructions for controls the bar does not show.

The compass and map controls stay anchored at the bottom when context actions wrap or an alert appears.

## Source organization and reproduction

Run `npm run art:ships` after intentionally changing the original sheet selection or importer. It uses Node's built-in filesystem and compression modules; no graphics package or network access is needed. `node tools/import-prospector-ships.js --check` verifies reproducibility. The normal build consumes the checked-in generated sprite file and does not run the importer.

| File | Responsibility |
| --- | --- |
| `tools/import-prospector-ships.js` | BMP decoding, frame selection, matte cleanup and RGBA PNG encoding |
| `src/assets/ship-sprites.js` | Generated embedded images: eight hulls, eight directions each |
| `src/rendering/ship-art.js` | Civilian role mapping and compass-frame selection |
| `src/rendering/sprite-loader.js` | Load original assets plus ship overrides before menus/game rendering |
| `src/rendering/sprite-effects.js` | Alpha-preserving tint cache and drawing |
| `src/rendering/galaxy.js`, `src/combat/ship.js` | Use the shared role mapping in their presentation |

Rows are zero-based. Scout uses ships row 0; Corvette row 3; Bulk Freighter row 12; trader row 7; cargo row 15; science row 8; patrol row 9. Pirate uses ships2 row 0. The original number-pad columns are SW 0, S 1, SE 2, W 3, E 5, NW 6, N 7, NE 8. Column 4 is a separate parked/portrait drawing and is not used as a movement frame. Each retained asset is 24 by 24 pixels, with no resizing.

## Conventions for future work

1. Judge assets at the game's actual 24px tile size, then inspect enlarged pixels. A readable outline matters more than added texture.
2. Keep shapes recognizable without role color. Hull material, cockpit and engine accents should share the same visual vocabulary.
3. Give entity sprites genuine alpha. Terrain, stars and nebulae belong to the background layer; avoid baking any of them into ships or tint functions.
4. Check source edges over empty space and both nebula colors. Keep legitimate dark outlines; removing every dark pixel would damage the hull.
5. For directional pixel art, prefer authored frames. Keep stationary portraits and the moving hull consistent.
6. For the next planetary pass, finish a complete biome's ground, transitions, obstacles, inhabitants and interactables together. Reduce ground noise and reserve strong contrast for meaningful objects. This is a future pass, not a completed terrain overhaul.

## Original ship pass validation

The experimental.10 ship pass recorded **44 passing repository tests**, including native frame bounds, matte removal, black/interior-color preservation, tiny-fragment handling, compass selection, role mapping and reproducible generated assets. Build checks verify that the bundled HTML matches the modular sources.

Separate headless Edge checks exercised **384 combinations** of eight hulls, eight headings, three backgrounds and two opacities. **152,064 source-transparent pixel positions** retained the exact underlying background. Partial source alpha and black pixels were retained; drawing restored the caller's alpha/smoothing state. Integration checks exercised player headings in the native galaxy renderer, all four existing palette roles, matching combat portraits, sensor/radio concealment and ASCII rendering. Full palette interaction, rebuilding, autosave isolation and exact return-to-career checks also passed without JavaScript errors.

Static comparison sheets and game screenshots were visually inspected, including native ship selection and station hull-change previews. These checks establish compositing and integration correctness; they do not replace feedback on silhouette recognition during human play. No manual desktop playthrough or completed planetary art pass is claimed. No save migration is needed.

Run the maintained `ships`, `ship-previews`, and `stations` suites to check current art. [Browser test setup](../qa/README.md)

## Tactical space and original plasma art

Experimental.58 removes the tactical grid, tiled weapon-range lighting, rectangular fog masks and colored ship-cell fills. Empty and undiscovered space share one dark background with a sparse, deterministic star field. The selected contact uses corner brackets and the arena edge remains. From experimental.60, fast shot animations replace the permanent dotted targeting line. Sensor range is stated separately from each weapon's range; live contacts and exhaust use the current sensor boundary while explored asteroid locations remain charted.

Plasma uses four original 24px cells from Prospector R197's [space.bmp](https://github.com/roguelikes/prospector/blob/1b928c0bb95643302b9dc4ece55fd1fba6e5ba1e/graphics/space.bmp), retained unmodified in `art/source/prospector/space.bmp`. SHA-256: `d236ffd3f1d5d8ad58386baa3468c74d412543aa55a3a4977b4f24670a87aa24`. The original [spacecom.bas lines 320–323](https://github.com/roguelikes/prospector/blob/1b928c0bb95643302b9dc4ece55fd1fba6e5ba1e/spacecom.bas#L320) uses `gtiles(81..84)` for plasma streams; [fileIO.bas lines 631–643](https://github.com/roguelikes/prospector/blob/1b928c0bb95643302b9dc4ece55fd1fba6e5ba1e/fileIO.bas#L631) loads those cells from the atlas, row 5, columns 0–3. The original notice and David Gervais/Deon attribution above also cover this imported material.

This is an altered import for Prospector II: exact magenta becomes transparent, all other source pixels remain unchanged, and the runtime selects smaller sprites as exhaust expires. From experimental.59, the connecting glow is removed and exhaust uses separate sprites only; new segments no longer record unused direction fields. There is no animation, new timer or random render roll. ASCII uses warm `*` / `·` symbols. Damage values moved off the map cells into hover and, initially, a nearby-hazard summary. Experimental.60 removes that footer summary at the user's request; hover remains. No plasma damage, lifetime, movement or sensor-range balance changed.

Run `npm run art:plasma` to regenerate `src/assets/combat-sprites.js`, or `node tools/import-prospector-plasma.js --check` to verify it. The importer reuses the ship importer's BMP decoder/PNG encoder and requires no additional dependency. Root tests check the retained atlas hash, non-matte pixel identity, alpha and reproduction; `combat-space` checks the actual renderer, sensor boundaries and both render modes at two display sizes.

Experimental.60 also imports four shaded rock/debris cells from the same retained atlas: (column,row) (11,4), (0,2), (1,2), (3,2). The original combat renderer uses `gtiles(76)` (11,4) for asteroids. These replace flat rectangle drawings with varied 24px silhouettes. The existing ship-import matte cleanup removes magenta-contaminated edge pixels and preserves interior blacks. Selection is position-based and consumes no gameplay RNG. Run the same `art:plasma` command to reproduce all eight combat sprites. Root tests verify distinct asteroid variants and clean alpha edges; the browser scenario checks all four native silhouettes and ASCII fallback.
