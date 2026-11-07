# Development changelog

This is the ongoing record of meaningful changes to Prospector II. Newest work comes first. Entries distinguish implemented behavior from planned work and record the reason, validation, save impact and remaining limits. Git history contains the exact file changes.

Early experimental entries were backfilled on October 31, 2026 from commits and the existing development notes. Historical validation describes checks recorded for those changes; it does not imply every old version was rerun during the backfill. Earlier development remains in [the historical changelog](docs/archive/Changelog%20Prospector%20II.txt) and Git history.

## How we maintain this record

- Update this file in the same commit as every meaningful gameplay, balance, UI, debugging, architectural or development-workflow change. Group related fixes into one entry; routine generated-file updates belong with their source change.
- Record the date, branch and version when applicable; what changed and why; checks actually run and their limits; save compatibility or migration; and unresolved work. Include commit/PR references when available. Documentation-only work does not need a new game version.
- Record reversals and removals explicitly. Keep earlier entries as history and say which behavior superseded them.
- Keep detailed current behavior in the relevant system guide. Keep future intentions in the roadmap; update its status when work lands. Link those documents from the entry instead of maintaining competing histories.
- Before handoff, check that the changelog, README's current description and any affected guide agree with the implementation. Test results are evidence for the checked scenarios, not a claim of final balance or human playtesting.

Entry format for future work:

```text
## YYYY-MM-DD — Version or development-pass title
Branch: branch-name. Reference: commit/PR when available.
Changes and reason: implemented behavior, including removals and balance changes.
Validation: checks actually run; fixture use and human-playtesting limits.
Saves: compatibility, migration or reset requirements.
Remaining: known limitations or follow-up; link to the relevant guide/roadmap.
```

## 2026-11-07 — 0.28 experimental.46 stabilizes save identity

Development on `experiment/expedition-legacy`.

- Career saves use a versioned schema and store IDs for combat opponents, radio merchants, rescuers, crew dialogue actors and active casino contestants. Buying fuel after a reload now updates the merchant's real stock. Crew conversations stay with the selected person when names collide, and combat references survive roster reordering.
- Autosaves and imports share schema and reference validation. Malformed imports leave the active run in place. Start a new career for this version.
- All 47 repository tests and four headless Edge suites passed. They covered the new identity cases, large-world reload, interrupted writes, debug isolation, and Mercy of Dawn persistence. Action clocks and world generation are separate follow-up changes.

## 2026-11-07 — 0.28 experimental.45 adds tactical ship combat

Released on `experiment/expedition-legacy`.

- Replaced the ship-to-ship volley screen with a turn-based arena. Fly with the compass or movement keys, select an enemy and a weapon, and manage range and reloads. Optional asteroids block movement and fire. Engine exhaust harms any ship that crosses it. Stronger engines leave more damaging, longer-lived trails.
- Nearby pirates or hostile patrols can join the same fight, up to four opponents. Disengage at an edge. Enemies with a ready weapon and clear shot can fire once as you leave. Surrender uses **H**, leaving **S** available for movement. Added the **PIRATE WING** Debug Palette sample.
- Encounters resume from saves with their positions, cooldowns, and hazards. Older combat saves start the tactical map with their existing opponent, hull, and shields. The first balance pass needs human playtesting.
- All 47 repository tests and seven headless Edge suites passed. Checked a wing encounter with cover and an unarmed freighter disengagement in installed Firefox.

## 2026-11-07 — 0.28 experimental.44 removes scan seams and repeating terrain grain

Released on `experiment/expedition-legacy`.

- Applied the same device-pixel tile alignment to walking and landing scans in every biome. Fog, smoke, and terrain share those edges in both Sprites and ASCII.
- Varied the sampling of the existing sand and snow textures by world position so their repeating grain no longer forms bands at fractional window scales.
- Reproduced the frozen scan seams and sand bands in experimental.43. Verified the fixes in installed Firefox at multiple window sizes and display densities, and with all 47 repository tests and five headless Edge suites. Existing saves require no migration.

## 2026-11-07 — 0.28 experimental.43 fixes Firefox minimap layout and surface seams

Released on `experiment/expedition-legacy`.

- Set explicit HUD minimap dimensions so Firefox keeps the canvas inside its panel beside the compass and map button at fitted window scales.
- Aligned surface terrain, fog, and lighting to shared device-pixel edges to remove the thin grid at fractional scales in Sprites and ASCII.
- Reproduced both issues on experimental.42. Checked minimap layout and shaded surfaces in installed Firefox at multiple viewport sizes and display densities. All 47 repository tests and five headless Edge suites passed. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.42 spawns debug star systems beside the ship

Released on `experiment/expedition-legacy`.

- **Spawn System** now uses the same empty neighboring sectors as **Spawn Galaxy Object**. Both controls report when all neighboring sectors are blocked.
- All 47 repository tests and three headless Edge suites passed. The debug menu check covered both spawners, an occupied neighbor, a free diagonal at the map edge, and the generated planet map. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.41 fixes the save label and spawns objects beside the ship

Released on `experiment/expedition-legacy`.

- Sized the top-right save and version rows to fit their text, fixing the clipped save label. The block stays right-aligned in both HUD styles.
- **Spawn Galaxy Object** uses an empty neighboring sector, including diagonals and map edges. It skips existing contacts and reports when every neighboring sector is blocked. **Spawn System** still places systems near Starbase Alpha.
- All 47 repository tests and five headless Edge suites passed. Reproduced the clipping on experimental.40 and checked both HUD styles at two window sizes. Verified adjacent spawning at a map edge, occupied sectors, and palette rebuilds. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.40 stabilizes orbit and groups debug catalogs

Released on `experiment/expedition-legacy`.

- Moved the version and save status to the top-right HUD. Orbit reserves room for wrapped context actions and alerts, so the system map keeps the same scale. The compass and map controls stay anchored below.
- Restored gear and cargo category headings and added a category filter to both the spawner and sample directory. Categories follow the runtime catalogs. New commodities appear even before a specific category is assigned. The sandbox controls use **Debug Palette** again.
- All 47 repository tests and six headless Edge suites passed. Reproduced the orbital resize on experimental.39 and verified fixed bounds at 1400×720 and 800×600. Verified category filtering and future catalog additions in both menus. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.39 makes the debug tools clickable

Released on `experiment/expedition-legacy`.

- Replaced the debug hotkeys with clickable toggles, spawn controls, civilization tools, reports, and searchable gear and sample lists. Shift+B still opens the tools during a career. A Playground button opens them inside the sandbox.
- Added click confirmations for surface regeneration, civilization replacement, and playground rebuilds. The sandbox keeps its own state and **Return to Career** restores the retained run.
- All 47 repository tests and seven headless Edge suites passed, including the debug click-through at 800×600, footer layout, autosave, and exact career restoration. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.38 separates the controls and status strip

Released on `experiment/expedition-legacy`.

- Gave the save and version strip its own footer row and added space below the compass, minimap, and map button. The controls stay anchored when context actions wrap or a critical alert appears.
- All 47 repository tests and four headless Edge suites passed. The new spacing check failed on experimental.37 and passed at 1400×720, 800×600, and 640×480 on experimental.38. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.37 anchors the compass

Released on `experiment/expedition-legacy`.

- Anchored the compass, minimap, and map button above the save and version strip. The footer absorbs the remaining height as context actions wrap and alerts appear.
- All 47 repository tests and four headless Edge suites passed. The anchor check reproduced the movement on experimental.36 and verified the controls stay in place at 1400×720 and 800×600. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.36 wraps context actions and removes repeated hints

Released on `experiment/expedition-legacy`.

- Context actions wrap onto a second row. Longer lists scroll vertically. When a critical banner and the second row share the screen, the playfield fits the available height and the footer controls stay visible.
- Removed repeated keyboard hints from dialogue, radio trade, stations, inventory, landing scans, and in-game Options. Screen-specific instructions and clickable Back and Close controls remain available.
- All 47 repository tests and six headless Edge suites passed. Verified both context rows, alert and footer fit, and second-row input at 1400×720 and 800×600. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.35 quiets routine actions and removes galaxy seams

Released on `experiment/expedition-legacy`.

- The general Examine, Inventory, and Options buttons use the same muted gray as the shortcut legend in both UI styles. Context-specific actions retain their accents and existing input routes.
- Fixed the faint grid in the galaxy view caused by drawing neighboring tile backgrounds on fractional device pixels. Empty space and fog now use an opaque base and pixel-aligned edges.
- All 47 repository tests and five headless Edge suites passed. Reproduced the seams on experimental.34 and verified uniform pixels across tile boundaries in Sprites and ASCII at a fractional scale. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.34 sharpens in-game text

Released on `experiment/expedition-legacy`.

- The shared game canvas and full galaxy map now draw at the displayed pixel density, including text in station menus, inventory, dialogue, combat, scan views, and map markers. Sprite images retain nearest-neighbor sampling. The HUD, sidebar, and HTML overlays use layout scaling where supported.
- Kept the save and version strip at the bottom under fractional scaling, removed seams from the chart's fog, and removed the overlapping hints at the foot of in-game Options.
- All 47 repository tests and all 13 headless Edge suites passed across runs. The first full run timed out in the ship-art suite, which passed on rerun. Checked fractional viewports, pointer targets, and an open chart during an emulated display-density change. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.33 adds a Classic UI setting

Released on `experiment/expedition-legacy`.

- Added **UI Style** to both Options screens. **Classic** brings back the experimental.27 look, and **Cockpit** remains the default. The selected style is saved with browser options. Both styles use the current bottom footer and controls.
- Put the Render Mode hint inside its row with more contrast. Title menus draw at the displayed pixel density, and in-game Options uses smoother sampling. The playfield retains its pixel-art presentation.
- All 47 repository tests and five headless Edge suites passed. Checked style switching by mouse and keyboard, persistence after reload, fractional-scale menu hit targets, the footer, and save/load. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.32 anchors the status strip at the bottom

Released on `experiment/expedition-legacy`.

- Pinned the save and version strip to the bottom of the play area. The shortcut area and status strip share the game background, removing the color seam left by the unused alert space.
- All 47 repository tests and four headless Edge suites passed. Checked the bottom edge with the alert visible and hidden at 1400×720 and 800×600. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.31 restores cockpit instruments on dark panels

Released on `experiment/expedition-legacy`.

- Restored the segmented gauges, vessel plate, status readouts, crew and comms console, and raised compass and map controls from experimental.29. The broad surfaces around them use the original dark palette.
- All 47 repository tests and four headless Edge suites passed. Checked the cockpit at 1400×720 and 800×600 and reran the day-night wait regression. The feedback keyboard test now waits for the dialog's initial focus. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.30 restores dark panels and updates sight while waiting

Released on `experiment/expedition-legacy`.

- Waiting on the surface now refreshes the sight mask after advancing the planet clock. Visibility contracts as daylight fades and expands as it returns, even on the ship tile. Previously explored terrain remains charted.
- Restored the original dark HUD, gauges, and controls from before the cockpit trial. Kept the display mode names and the Crew Status and Comms Log panels, with darker sidebar framing. See [Flight interface](docs/art-direction.md#flight-interface).
- All 47 repository tests and six headless Edge suites passed. The wait regression reproduced on experimental.29 and passed at dusk and dawn using both the compass and keyboard. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.29 finishes the cockpit styling

Released on `experiment/expedition-legacy`.

- Extended the steel bezel and instrument finish to the status rail, crew and comms console, and map housing. The top rail now shows the vessel name and the current display, including navigation, orbital view, orbital scan, and surface.
- Styled the compass, context actions, and other cockpit buttons as raised keys with hover, focus, and pressed states. Normal gauges use cool colors, with warm colors for warnings. Reduced-motion mode keeps critical gauge labels steady.
- All 47 repository tests and six headless Edge suites passed. Checked the native and 800×600 layouts, 12 crew badges, pointer and keyboard controls, display labels, alerts, maps, and save/load. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.28 tries a cockpit bezel and instruments

Released on `experiment/expedition-legacy`.

- Set the main display in a dark steel bezel using the existing canvas margin. Restyled the fuel, hull, and oxygen gauges as recessed instruments with segmented fills, quarter marks, and numeric readouts. Gauge values, warning thresholds, and map input are unchanged.
- All 47 repository tests and four headless Edge suites passed across runs. Checked the full canvas and instrument fit at 1400×720 and 800×600, plus critical fuel and oxygen states. The feedback keyboard check failed once and passed on rerun. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.27 trims the map controls

Released on `experiment/expedition-legacy`.

- Removed the duplicate Escape button below the full map. The top-left Escape control, Escape and M keys, and click outside the map still close it. The sidebar minimap panel is 128 pixels wide instead of 220 and fits the whole galaxy at the same scale.
- All 47 repository tests and four headless Edge suites passed. Checked the compact map at native and scaled window sizes, whole-galaxy coverage, and keyboard and pointer dismissal. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.26 clarifies the sidebar minimap

Released on `experiment/expedition-legacy`.

- Increased the contrast between explored space and fog. Stations, wrecks, and hazards use brighter markers, and a green cross marks the player. The sidebar keeps the whole galaxy in view. See [Full galaxy map](docs/art-direction.md#full-galaxy-map).
- All 47 repository tests and three headless Edge suites passed. The map fixture checked landmarks at opposite ends of the galaxy, hidden wrecks, fog contrast, and the player marker. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.25 draws artwork on the full galaxy map

Released on `experiment/expedition-legacy`.

- The full galaxy map now uses compact versions of the galaxy artwork for charted landmarks and visible ships, with an illustrated key and a green ring around the player. It uses artwork in ASCII mode. Fog and sensor limits still apply, with a yellow question mark for unknown radio contacts. The small HUD minimap keeps its color-coded tiles. See [Full galaxy map](docs/art-direction.md#full-galaxy-map).
- All 47 repository tests and five headless Edge suites passed. A controlled map fixture checked ten landmark types, hidden wrecks, ship contacts, and identical HUD minimap pixels. The overlay fit at 1400×720 and 800×600. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.24 adds map targeting by mouse

Released on `experiment/expedition-legacy`.

- Moved **Shortcuts** up to the footer divider. Map clicks now select tiles in galaxy and planet Examine views and in landing scans. Landing still requires confirmation. In ground firing mode, a click aims and a second click on the same tile fires through the existing ranged action.
- All 47 repository tests and five headless Edge suites passed. Tested scaled map coordinates, idle map clicks, landing at the selected site, and the two-click firing sequence. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.23 collapses the shortcut legend

Released on `experiment/expedition-legacy`.

- Hid the gray shortcut legend by default. The **Shortcuts** button opens or closes the reference by mouse or keyboard. The top-left **ESC** button appears during play. The title and setup screens use their own navigation.
- All 47 repository tests and three headless Edge suites passed. Checked the toggle, the scaled footer, and Escape visibility at startup, during setup and play, and after returning to the main menu. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.22 makes context actions clickable

Released on `experiment/expedition-legacy`.

- Made context actions and the top-left ESC button use the existing shortcut routing. Added mouse entry points for Inventory and Options in the context bar, item-use actions, and clickable selection arrows. The gray shortcut legend remains a reference.
- Gave the compass Wait tile a pointer cursor and hover highlight. Compass directions now also control the examine, aim, and landing cursors. World tiles remain passive.
- Added on-screen keys for vessel registration, feedback text, and common movement bindings. Added Shift+Z for diving or surfacing, Shift+O for shipboard oxygen refill, and Shift+X to release a tow. Escape cancels void and rescue prompts through either input method.
- All 47 repository tests and 13 headless Edge suites passed. The input scenarios covered on-screen naming, station and patrol actions, map and feedback dismissal, item use, scan and landing controls, and firing. Existing saves require no migration.

## 2026-11-05 — 0.28 experimental.21 restores the gray shortcut legend

Released on `experiment/expedition-legacy`.

- Returned the bottom shortcut legend to muted static text and removed the Inventory and Options buttons added there in experimental.19. Open these menus with **I** and **O**. Menu choices support mouse and keyboard.
- The build, all 47 repository tests, and the menu-input, interface, and version browser suites passed. Verified that the legend retains its color on hover and clicks leave gameplay state alone. The barter resize check now waits for the scale update and measures both bounds together. Existing saves require no migration.

## 2026-11-05 — 0.28 experimental.20 polishes ship registration

Released on `experiment/expedition-legacy`.

- Spaced the captain and ship name fields, gave the instructions a separate line above the buttons, and increased their contrast. Ship selection now highlights the card under the pointer using the same selection as the arrow keys.
- The build, all 47 repository tests, and four headless Edge suites passed. Verified the ship highlight and mixed mouse and keyboard input, and inspected the registration screen at a scaled viewport. Existing saves require no migration.

## 2026-11-05 — 0.28 experimental.19 adds mouse and keyboard menu controls

Released on `experiment/expedition-legacy`.

- Added click targets to main menu setup, options and keybindings, station services, dialogue, inventory and crew selection, cargo inspection, radio trade, barter, casino menus, and the debug palette directory. Mouse and keyboard use the same actions. Long crew lists scroll to the selected person.
- Added mouse buttons for Inventory and Options, keyboard activation for HUD and save-notice buttons, and keyboard log text sizing. Cargo hover is a preview, with details accessible by click or **X**.
- The HUD compass remains the pointer movement and wait control with normal step effects. Menus block compass movement while open. Direct tile interaction, pickup commands, and combat firing use gameplay keys.
- The build, all 47 repository tests, and all 13 headless Edge suites passed. The input scenarios cover scaled canvas clicks, station refueling, patrol replies, mouse and keyboard barter, crew and cargo, and the compass exception. Existing saves require no migration.

## 2026-11-05 — 0.28 experimental.18 compacts the crew sidebar

Released on `experiment/expedition-legacy`.

- Replaced the vertical crew summary with one role badge and health meter per living crew member. All 12 supported crew fit on one line, with individual health colors for repeated roles. A pulsing exclamation mark shows an active known condition. Reduced motion keeps the marker steady. Hover shows the person's name, exact HP, and known conditions. The detailed Crew view still carries the full roster.
- The build, all 47 repository tests, and five headless Edge suites passed. The interface check covered a full 12-person row at 800×600 and 1400×720, low and critical HP, condition visibility and recovery, reduced motion, crew loss, and the detailed Crew view. Existing saves require no migration.

## 2026-11-05 — 0.28 experimental.17 fixes map reopening during dialogue

Released on `experiment/expedition-legacy`.

- Clicking the galaxy map button could leave it focused after the map closed. Enter or Space then chose a dialogue reply and also clicked the focused button. The full map now takes focus when it opens and releases it on close. Dialogue consumes Enter and Space even when a HUD button has focus.
- Reproduced the issue in experimental.16 with the station patrol's threat reply. Verified mouse and keyboard map controls, Enter/Space and numbered replies, and the focused button case in headless Edge. All 47 repository tests and the four affected browser suites passed. Existing saves require no migration.

## 2026-11-05 — 0.28 experimental.16 improves interface priorities

Released on `experiment/expedition-legacy`.

- Centered civilization barter inside the scaled game area. Trade lists scroll independently, long names wrap, and the current keyboard selection stays visible as the offer changes.
- Made Enter hints describe the selected action in orbit, at stations, in dialogue and barter, and aboard Mercy of Dawn. Removed the persistent wreck-air readout from Mercy's context bar. Examine the engineering pump to read the remaining reserve.
- Made Records the default LOG view, with active contracts, known open rescue leads, and pending deliveries above survey records, contacts, and history.
- Reserved the full-width banner for immediate actions such as a rescue decision, critically low fuel or oxygen, an armed explosive, or an adjacent singularity. Routine updates, radio traffic, and NPC speech go to the sidebar log.
- The build, all 47 repository tests, and all 12 headless Edge suites passed across test runs. The interface checks exercised keyboard barter with long lists at 800×600, 1400×720, and 2560×1440, Mercy actions and pump examination, and routine versus critical messages. The rescue fixture now waits for file import to finish before sending keys. Existing saves open without migration.

## 2026-11-05 — Reorganize the project documentation

Documentation update on `experiment/expedition-legacy` for experimental.15.

- Shortened the README to downloads and navigation. The [documentation index](docs/README.md) groups player, development, testing, and planning guides. The handoff links to the maintained build and testing instructions. The expedition guide covers current log, survey, research, and rescue mechanics.
- Moved seven dated reports and older handoff or release records to the [archive](docs/archive/README.md). Updated references and pinned the foundation review’s source links to the commit it reviewed. Corrected the roadmap and debug guide to describe fixed Mercy placement, and directed readers to the checked-in browser suites.
- Verified local links, heading anchors, and historical source references. The generated build check and `git diff --check` passed. The HTML, source, package metadata, and save behavior match experimental.15.

## 2026-11-05 — 0.28 experimental.15 removes the in-game changelog

Released on `experiment/expedition-legacy`.

- Removed the main menu Change Log button, its V shortcut, the embedded release notes screen and its scroll handlers. Release history lives in the repository documentation. The v0.25 and v0.2 summaries from the menu are now in the [historical changelog](docs/archive/Changelog%20Prospector%20II.txt).
- Rebuilt the standalone HTML with the experimental.15 version and synchronized desktop metadata. All 47 repository tests, the generated build check, and the Edge menu/version and autosave suites passed. Browser checks covered keyboard and mouse navigation with and without a save, the retired shortcut, and saved-game Continue. Inspected the main menu screenshot and checked the runtime sources and generated HTML for remaining changelog references. Packaged desktop builds were outside the scope of this check.
- Existing saves open without migration. This change only removes the release notes screen and its controls.

## 2026-11-02 — 0.28 experimental.14: transparent stations and derelict wreck art

Branch: `experiment/expedition-legacy`; main/public build unchanged.

- Verified the original starbase sprite already has genuine transparency (308 of 576 pixels). Removed the solid-color loading fallback and render it over normal space so the cleared canvas cannot show a differently colored square. Removed tile-sized matte fills from casino/pirate artwork and the destroyed pirate-base marker; station object art now composites over the ordinary galaxy background.
- Replaced graphical derelicts' boxed dagger placeholder with original code-authored 24px wreck artwork: broken orbital ring, severed spokes/docking arm, breached core, rusty plates and debris. It is cached once on an alpha canvas and shared by native derelict stations, their palette biome sample and Mercy. Updated the maintained preview generator to use the actual renderer. Existing ASCII symbols, placement, names, docking/boarding, interiors, salvage and rescue rules remain unchanged. No new object or catalog type was introduced. [Art guidance](docs/art-direction.md).
- Bumped the canonical package version to `0.28.0-experimental.14`; rebuilt HTML and automatically synchronized desktop metadata. Validation: all 47 repository tests and generated-source/version checks passed, plus four Edge browser suites (`stations`, `previews`, `palette`, `version`) without JavaScript errors. The new station suite verifies true alpha/corner transparency and 3,243 preserved background pixel positions across space/blue/pink nebulae, actual derelict/Mercy render and boarding paths, ASCII and exact career restoration. Preview checks retained all 80 orbital comparisons, 67 galaxy sample renders and native biome entry paths. Inspected native-size and enlarged station/wreck artwork. `git diff --check` passed. No packaged desktop executable or manual whole-career playtest is claimed.
- Saves: no schema, keys or migration changes; existing worlds use the art immediately. Remaining: human feedback on tiny wreck recognition and broader planetary artwork.

## 2026-11-02 — 0.28 experimental.13: subtle radio contacts

Branch: `experiment/expedition-legacy`; main/public build unchanged.

- Replaced the filled blue radio-contact panels and outlined boxes with a small muted-yellow `?` on a transparent background. Pirates and civilians share the same centered glyph, preserving unknown identity. A shared renderer restores canvas drawing state. Identified ships, detection/radio ranges, fog rules and gameplay are unchanged. Updated [art guidance](docs/art-direction.md).
- Bumped only the canonical root package version; the build automatically synchronized game labels and desktop packaging metadata to `0.28.0-experimental.13` and rebuilt the single-file HTML. Packaged executables were not rebuilt.
- Validation: `npm run build`, all 47 repository tests and generated-source/version checks passed. Edge headless `ships` and `version` suites passed without JavaScript errors: 384 ship compositing cases, unchanged sensor concealment/identified artwork, and the version labels. Extended the existing art scenarios to verify the question mark's yellow color and unchanged background pixels outside the small glyph over space and both nebula colors. Inspected the actual galaxy radio-contact screenshot. `git diff --check` passed; no manual desktop or whole-career playtest is claimed.
- Saves: no state, schema, keys or migration changes. Existing careers use the new presentation immediately. Remaining: visual feedback at native tile size.

## 2026-11-02 — One source for the release version

Branch: `experiment/expedition-legacy`; build/workflow change, game remains `0.28.0-experimental.12`. Main/public build unchanged.

- Root `package.json` is now the only manually maintained current version. The source build supplies `GAME_VERSION` / `GAME_VERSION_LABEL` to the HTML and canvas menu, and synchronizes desktop package/lock metadata, Tauri config and the game package's Cargo manifest/lock version. Dependency versions remain unchanged. Desktop sync/dev/build runs this same build first. Stale metadata or HTML fails `npm run check` / `npm test`.
- Removed independently maintained current-version strings from the HUD/menu and changed current guides to link to the canonical version. Historical release notes, chronology and changelog numbers are preserved. Added contributor guidance and [release workflow documentation](docs/architecture.md).
- Validation: `npm run build`, all 47 root tests plus generated-source/metadata checks and the new Edge browser version suite passed. A simulated version bump verifies HTML/runtime values, all five desktop files, stable/prerelease labels, stale-file detection, rejected unsafe values, unchanged dependency versions and unchanged historical notes. Browser checks verified actual canvas-menu text and the visible in-game label against the canonical version, with no JavaScript errors; inspected the screenshot. `npm --prefix desktop run sync` rebuilt and copied the HTML successfully. No Rust compilation, packaged executable or whole-career playtest is claimed. `git diff --check` passed.
- Saves/gameplay: unchanged; no keys, schema or migrations. The game remains a self-contained offline HTML file. Remaining: desktop executable packaging is outside this workflow change.

## 2026-11-02 — 0.28 experimental.12: fixed Mercy placement at galaxy generation

Branch: `fix/experimental-save-indicator`, targeting `experiment/expedition-legacy`; PR #4. Main/public build unchanged.

- Corrected release numbering to `0.28.0-experimental.12` across the game, package and desktop metadata. The previous unnumbered save-indicator download is superseded by this build, which retains the state-only `Saved` indicator.
- Removed experimental.9–11's 1-in-1,000 exploration spawn rolls. Galaxy generation now selects Mercy once, uniformly across eligible interior VOID cells, excluding opening station reveals, the player, other ships, loot and existing objects. A full galaxy safely omits it. There is no forced nearby placement or narrow starting-distance band, and no additional minimum travel distance beyond opening visibility.
- The wreck exists before exploration and remains hidden until ordinary nebula-aware sensors reach its saved sector. Detection (including a remote drone reveal) records one signal and coordinates; it never spawns or relocates the wreck. No initial marker, signal or LOG records leak the location. Air and survivor clocks still start on first boarding. Debug boarding and save protection remain intact. Updated both testing pilots and their startup report to distinguish a generated hidden wreck from a known encounter.
- Validation: rebuilt HTML; all 46 repository tests and generated-source checks passed; five Edge headless suites (`encounters`, `rescue`, `log`, `palette`, `autosave`) passed with no JavaScript errors. Coverage includes 100 seeded placement cases, blocked/occupied/full galaxies, zero RNG during reveal, nebula occlusion, 12 real generated openings with seeded repeatability, hidden/known save-load stability, no spawn in old incident-free worlds, 15 spatial rescues / 862 surface steps, hidden LOG records, palette interactions/restoration and IndexedDB recovery/stale-window/large-save checks (8,077,073 characters / 175 maps). Three-hull smoke careers completed 80 selections each without JavaScript errors. These are scripted checks, not human whole-career playtesting or a distance-balance study. Desktop executable packaging was not run.
- Saves: optional `discovered:false` marks only newly generated hidden incidents; old records without this field stay known and retain their exact position/progress. Existing worlds without Mercy are not backfilled. Start a fresh career to use the new generation rule. No storage keys or root save schema changed. Remaining: broader encounter-distance feedback and existing foundation findings; see [current experiment rules](docs/experiment.md).

## 2026-11-02 — Save indicator cleanup and Mercy discovery investigation

Branch: `fix/experimental-save-indicator`, targeting `experiment/expedition-legacy`; follow-up to `0.28.0-experimental.11`, no new release or public build.

- Removed the redundant turn counter from the bottom saved indicator: it now reads `Saved`. `Saving…`, `AUTOSAVE FAILED`, the debug protection message, failure/retry/export controls and saved turn metadata are unchanged. Rebuilt the single-file HTML from source and updated [the autosave guide](docs/autosave.md).
- Investigated Mercy against experimental tip `3e80186`. Experimental.9 (`8b236ff`) replaced experimental.8's galaxy-wide random placement with a 1-in-1,000 roll per newly charted eligible empty sector in actual movement sensor reveals. A successful roll creates the wreck nearby; no minimum distance or turn delay exists. Early nearby discovery is permitted, not a placement bug. Opening reveals do not roll; existing saves retain old incidents. The exact observed player's encounter cannot be diagnosed without its save. [Current rules](docs/experiment.md#mercy-of-dawn) explain the distinction. No encounter generation, reveal, probability, turn, combat or rescue behavior changed.
- Validation: `npm run build`, all 45 `npm test` tests and generated-source checks passed; `git diff --check` passed. Headless `encounters` and `autosave` suites passed using installed Edge after the bundled Chromium download failed. Added assertions for exact Saved/Saving/failure badge text during real commits, pending saves, transaction failure and retry. Encounter checks covered 12 clean openings, winning/losing rolls, native movement, no rerolls, uniqueness, save/load and debug boarding. Actual IndexedDB checks retained recovery, stale-window protection, export and a 7,207,008-character / 155-map reload with no JavaScript errors. These are controlled scenarios, not a human desktop playthrough or encounter-frequency balance study.
- Saves: no format, keys, migration or reset changes. Existing locations and rescue progress remain intact. Main, published releases and packaged executables are untouched. Remaining: wider discovery-frequency playtesting and the existing foundation findings.

## 2026-11-01 — Preserve playthrough automation in the repository

Branch: `experiment/expedition-legacy`; testing workflow only, game remains `0.28.0-experimental.11`.

- Moved the reusable native-action playthrough controllers and headless regression scenarios into [qa/](qa/README.md), with pinned Playwright dependencies, Chromium setup, repository-relative paths and ignored generated outputs. The earlier and current pilot policies and pre-extraction orbital renderer are preserved from the local harnesses.
- Consolidated the three playthrough entry points into a shared runner with fresh isolated careers, seed/action/time controls, actual-version reports, explicit checkpoint continuation and rejection of finished-career resumes. Removed obsolete startup waits for guaranteed Mercy encounters. The older policy remains available for historical comparison; pilot limitations are documented rather than hidden by game changes.
- Added nine portable regression suites covering palettes/art, native encounters/rescues, station/contract rules, the integrated log and real IndexedDB persistence. Added Linux headless checks to the GitHub Source build workflow. The aquatic-generation diagnostic reports the existing defect separately from passing tests.
- Corrected [the handoff](docs/handoff.md) and contributor instructions: the user needs the automation tools available from a fresh checkout, not personal saves transferred. No personal saves, old raw playthrough traces, generated checkpoints, browser profiles, dependency folders, packaged executables or transfer ZIP are included.
- Local validation: all 45 root tests/build checks and all nine suites passed using a newly installed Playwright Chromium on Windows. The three-hull smoke runs each made 80 selections; both long policies made 120, and native checkpoint continuation advanced the current policy from 120 to 144 without a reset. A separately exported checkout with a path containing spaces, its own clean dependency installation and an unrelated working directory passed a 24-selection career and all 80 orbital comparisons. Both policy files match the originals exactly; the renderer baseline matches commit `826210e`. The separate diagnostic still reports 7 dry aquatic worlds among 40 selected generators. No complete new retirement career or manual desktop playthrough is claimed.
- Saves/gameplay: no production code, generated HTML, game version or save format changed. Test careers and evidence are generated afresh into ignored artifacts. Remaining: known pilot weaknesses and the previously documented game foundation defects; do not interpret a controller's poor decisions as balance proof.

## 2026-11-01 — Laptop development handoff

Branch: `experiment/expedition-legacy`; documentation only, game remains `0.28.0-experimental.11`.

- Added [a fresh-chat/computer handoff](docs/handoff.md), linked from the experimental README, with the exact branch/version, setup and playing instructions, agreed design decisions, remaining foundation findings and relevant reports. This preserves the development context independently of chat access.
- Clarified that public Play/download links serve main, careers need JSON export/import between devices, and extended headless harnesses and packaged Windows builds are local artifacts rather than files supplied by a clone. No transfer ZIP was created, at the user's request.
- Validation: verified the remote experimental tip matches gameplay commit `1bcf37e`, checked instructions against source/current guides and checked local Markdown link targets. No game code, generated HTML, version or save format changed; gameplay tests were not rerun for this documentation-only update.

## 2026-11-01 — 0.28 experimental.11: correct galaxy palette object previews

Branch: `experiment/expedition-legacy`; main unchanged.

- Fixed the biome palette creating The Void Royale and Derelict Station as yellow-star systems. They now use native CASINO/DERELICT cells, their existing galaxy artwork and the same boarding-map keys as normal play. Both casino entries board their actual walkable decks.
- Planetary and civilization samples now show previews of their bodies instead of the yellow-star wrapper. The ordinary orbital view and palette share the existing body colors and drawing routines: habitable continents, banded gas giants, asteroids, intact and broken ringworlds. Ancient-station and cave samples use existing station/entrance art. Dedicated star samples retain their real star artwork, and catalog-derived future biome samples receive body previews automatically.
- Added missing casino/derelict ASCII glyphs; palette body previews also support ASCII. Regular graphical galaxy systems still use star icons. No new art assets, object types, encounter probabilities or gameplay balance changes were introduced.
- Validation: all 45 repository tests/build checks passed. Headless checks rendered all 67 galaxy samples (including 20 biomes and 21 civilization scenarios), exercised native biome boarding/orbit/landing, confirmed both casino render/boarding paths and ASCII previews, and restored the career exactly. All 80 biome/scan-state orbital comparisons matched the previous renderer pixel-for-pixel. Full palette interaction, rebuild, future-catalog injection and save-isolation regressions passed without JavaScript errors. Screenshots were inspected; no manual desktop playthrough is claimed.
- Saves: no career-format changes. Rebuild an already-open test palette with Shift+B then Shift+F2 to replace its old wrapper cells; re-entering from the career also creates the corrected palette. Existing career worlds are unaffected. Remaining: broader art polish and human feedback on tiny previews. See [debug playground](docs/debug-playground.md).

## 2026-11-01 — 0.28 experimental.10: original ship art and seamless compositing

Branch: `experiment/expedition-legacy`; main unchanged.

- Reimported eight hulls and their original eight-way frames from Prospector R197's ship sheets, credited to David Gervais and Deon. Preserved the original BMPs and notice with a reproducible Node importer. Removed the magenta matte, corrected contaminated boundary pixels and isolated tiny atlas spill. Native frames replace rotating the player sprite. [Art direction, provenance and maintenance](docs/art-direction.md).
- Trader, cargo, science and patrol vessels now have separate silhouettes and restrained role colors. Stranded research vessels and neutral-target combat use the matching role art. Player ship selection, hull-change cards and combat portraits share the refreshed hull images. Selection cards now reserve space for taller hulls and wrap descriptions; hangar statistics clear the larger freighter's exhaust. ASCII civilian keys use T/C/S/P.
- Fixed tinted sprites replacing the background with an opaque dark tile. Tinting now preserves source alpha on a cached offscreen image; original shading and engine colors remain legible. Existing opacity arguments now work. Unknown radio contacts still hide their silhouette outside sensors.
- Validation: 44 tests/build checks passed. Headless checks covered 384 hull/direction/background/opacity cases and 152064 unchanged background pixel positions, partial alpha, black hull details and drawing-state restoration. Native galaxy, civilian combat, sensor concealment, ASCII and full palette interaction/reset/save-isolation/return checks passed without JavaScript errors. Inspected the rendered previews and screenshots. No manual desktop playthrough is claimed.
- Saves: no changes or migration. This pass changes presentation and asset tooling, not ship statistics or gameplay rules. Remaining: human feedback on recognition at native scale; planetary art, terrain transitions, creatures, buildings and other galaxy assets need later consistency passes.

## 2026-10-31 — 0.28 experimental.9: optional Mercy discovery, no opening signal

Branch: `experiment/expedition-legacy`; main unchanged.

- Removed the guaranteed galaxy-generation placement and startup coordinates/marker from experimental.8. Normal movement now rolls a 1-in-1,000 encounter chance for each newly charted eligible empty sector in the actual sensor reveal. A hit creates one nearby wreck and records its distress signal. There is no guaranteed travel/turn threshold; known sectors cannot be farmed by backtracking. Initial station reveal, remote drones and debug worlds do not roll. The palette retains its explicit, boardable Mercy sample.
- Kept occupied cells, objects and borders protected, the first-boarding air clock unchanged and existing incidents unique. No other gameplay balance, combat or dialogue changes were made for testing.
- Completed a [second retirement attempt](docs/archive/retirement-attempt-2-2026-10-31.md): Mercy was first discovered on turn 290; the Scout reached turn 5067 and 3842 credits before its remaining crew died on a territorial world. It did not retire. The private pilot used earlier ship retreats, but mishandled surface warnings, bleeding and crew replacement. One checkpoint continuation corrected a repeated dialogue-selection loop without reversing losses; inflated input counts and the test limits are disclosed.
- Validation: all 40 tests and build checks passed. Headless checks covered 12 clean openings, losing/winning discovery rolls, actual movement/sensor range, repeat-visit suppression, one signal and durable save/load. Palette coverage, interactions and restoration passed; 15 rescue regressions traversed 869 real steps. Neither these scenarios nor the career captured JavaScript errors. No manual desktop playthrough is claimed.
- Saves: schema unchanged; already-created incidents and historical messages remain in older saves. Fresh careers have no startup Mercy encounter. Previously charted areas are not rerolled. Remaining: wider encounter-frequency playtesting, a more competent full-game pilot and the existing foundation findings; successful wealthy retirement remains unproven.

## 2026-10-31 — 0.28 experimental.8: random Mercy location and a long career

Branch: `experiment/expedition-legacy`; main unchanged.

- Removed Mercy of Dawn's four-to-seven-tile starting-distance band. Fresh encounters choose uniformly among eligible interior VOID cells across the galaxy, excluding the player and existing ships or loot. No object is overwritten; a full galaxy safely omits the incident. Initial distress coordinates, the marker and the first-boarding air clock remain. Repeatable testing stays in the debug galaxy palette.
- Recorded a [long retirement attempt](docs/archive/long-career-2026-10-31.md): one normal seeded Scout career, 3,752 native actions / 3,354 turns, 20 expeditions, one completed science contract, one survivor delivery and 3,719 ending credits. A Dreadnought destroyed the ship before the chosen 10,000-credit target. The report separates the pilot's late retreat from balance conclusions; it does not claim successful retirement.
- Validation: 39 tests/build checks passed, including 100 seeded locations, occupied positions, saved-location stability and a full galaxy. Headless palette factories/interactions, reset, save isolation and exact career restoration passed. Fifteen rescue scenarios passed with 866 actual surface steps and no JavaScript errors; the long career also had no JavaScript errors. No manual native playthrough is claimed.
- Saves: no schema changes; existing position/progress is preserved. New careers use random placement. No balance or combat mechanics were changed for the simulation.
- Remaining: enemy-strength-aware retreat in the private pilot; inconsistent action clocks and other foundation findings. The run additionally exposed negative crew-loss reporting on the death screen. Other survivors' postmortem state is separated from player knowledge in the report.

## 2026-10-31 — Three observation-limited career playthroughs

Branch: `experiment/expedition-legacy`; played `692bcf5`, experimental.7. Documentation only.

- Recorded three fresh native-action careers in [the playthrough report](docs/archive/playthroughs-2026-10-31.md): Scout early retirement on turn 325 with 993 credits and one survivor delivered; Freighter destruction on turn 194 after repeated escapes, fuel exhaustion and refused surrender; Corvette early retirement on turn 260 with 462 credits, repaired life support and two deliveries.
- Used revealed information, normal resources and real actions with debug off. Corrected pilot-control mistakes during calibration and replayed the same predetermined seeds; did not reverse final outcomes through reloads. The report distinguishes early-retirement policy, incomplete objectives and pilot mistakes from game defects and balance evidence.
- Validation: all three final runs ended through native retirement/death paths, below their safety action ceiling, with no captured JavaScript/input errors. Retained action/event traces, screenshots and final save files locally. This is not a statistical hull comparison or proof of full 10,000-credit careers. No gameplay code, save format or version changed.

## 2026-10-31 — 0.28 experimental.7: durable autosaves and recovery

Branch: `experiment/expedition-legacy`.

- Replaced quota-limited localStorage autosave writes with an asynchronous IndexedDB store. Current and previous valid snapshots commit atomically; integrity checks recover a damaged primary without overwriting a valid backup. Existing localStorage saves remain readable and are retained after migration.
- Added visible saving/saved/failed status, persistent failure notices, retry and export of current unsaved progress. Menu/quit transitions wait for commit and preserve the active game on failure. Pending/failed browser closes request an unsaved-progress warning.
- Captured snapshots before queueing; serialized writes, coalesced pending work and skipped identical snapshots. Render-triggered writes use a bounded 200 ms schedule. Cross-window conflict checks stop stale careers from overwriting a newer save and offer an explicit load/export choice.
- Unified compatibility repairs for file and stored saves, added structural/integrity validation and rollback on failed preparation, and guarded asynchronous transitions/loads. Debug worlds remain excluded. Exported JSON retains the existing game-state shape.
- Validation: 36 repository tests passed. Actual browser storage checks covered aborted transactions, retained backups, failure/export/retry, corruption recovery, legacy import, matching file/storage repairs, invalid-file rollback, stale windows and save-before-menu/quit. A full reload restored a 10,124,288-character snapshot with 210 generated maps, beyond the old localStorage quota. Existing gameplay regressions were also exercised; native quit invocation was mocked, and no manual native playtest is claimed.
- Saves: legacy reads preserved; database envelope format/schema version 1. Continue and save operations are asynchronous. Remaining: full snapshot serialization and the render scheduling hook await broader action-boundary work; combat/dialogue identity and other audited gameplay defects remain open. Details: [autosave guide](docs/autosave.md).

## 2026-10-31 — Foundation and roadmap review

Branch: `experiment/expedition-legacy`. Reviewed gameplay commit `616d819`; game version remains `0.28.0-experimental.6`.

- Added a [foundation review](docs/archive/foundation-review-2026-10-31.md) distinguishing current strengths, reproduced defects, architectural risks, feature readiness and recommended work order. Findings are open; this pass does not fix gameplay.
- Reproduced silent autosave quota failure during generated-world growth, detached combat/dialogue entities after reload, divergent file/storage migrations, an invalid import replacing the active state, inconsistent action/oxygen/status clocks, dry aquatic civilizations and zero-morale defaulting to 55.
- Validation: all 31 repository tests/build checks passed. Existing headless palette/log scenarios, 54 fixture-assisted contract completions and 15 rescue scenarios with 858 surface steps passed. New controlled review scenarios and a seeded 40-world aquatic generation matrix supplied the defect evidence. Human whole-career balance and native desktop playtesting were not performed.
- Recommended persistence/identity repairs, shared turn progression and ordinary generation invariants before more connected content. Added a roadmap reference to the review; recommendations are not completed milestones.
- Saves: no format or gameplay changes in this documentation-only pass. The review records existing save defects that require subsequent fixes.

## 2026-10-31 — Establish the development record

Branch: `experiment/expedition-legacy`. Game version remains `0.28.0-experimental.6`.

- Added this central changelog and backfilled the experimental releases and branch cleanup so development is traceable beyond individual chats.
- Linked it from the README and historical changelog. Added a repository instruction requiring future work to update the record in the same commit.
- Corrected stale current-status descriptions of the latest debug work and renewable science contracts. Existing system guides remain the detailed references.
- Validation: checked backfilled entries against Git history and system notes; checked relative document links and the documentation diff. This pass changes documentation only; local gameplay checks were not rerun.
- Saves: no effect. Remaining: older pre-experiment work has a partial historical changelog and Git history, not a reconstructed release-by-release narrative.

## 2026-10-31 — 0.28 experimental.6: tighter debug palettes

Branch: `experiment/expedition-legacy`. [Commit 490a6d1](https://github.com/Sebo2203/Prospector-II/commit/490a6d1).

- Halved galaxy sample spacing from 10 by 8 tiles to 5 by 4. Surface spacing changed from five to three tiles, halving the clear gap from four to two tiles. The surface gallery dimensions shrink with the layout.
- Abbreviated long map labels to avoid overlaps; the searchable directory retains full names. This makes more samples visible together without placing them directly adjacent.
- Validation: 31 tests and build-freshness checks passed; headless palette interaction, simulation toggle, rebuild and exact-career-restoration checks passed. Inspected galaxy and surface screenshots; GitHub CI passed.
- Saves: career format unchanged. Rebuilding a test palette discards its temporary changes; F4 restores the retained career.
- Remaining: human feedback on label readability and layout. Details: [debug playground](docs/debug-playground.md).

## 2026-10-31 — 0.28 experimental.5: reusable debug playgrounds

Branch: `experiment/expedition-legacy`. [Commit c307228](https://github.com/Sebo2203/Prospector-II/commit/c307228).

- Added disposable galaxy and surface test worlds through Shift+B: F2 galaxy, F3 surface, F6 searchable directory, F7 live NPC simulation, Shift+F2 rebuild, and F4 return. At introduction they contain 340 samples/scenarios, including 22 registered galaxy object definitions.
- Included galaxy objects, star types, biomes, civilization tiers/aggression/species, terrain/building tiles, equipment, implants, commodities, creature body archetypes and a gunner. Items, cargo and creatures use ordinary pickup, equipment, communication and combat rules.
- Paused NPC movement by default for inspection. Added full scenarios for fixtures whose interaction depends on a casino, civilization or rescue incident; isolated raw tiles remain visual/collision samples.
- Retained the original career outside the sandbox; blocked sandbox autosaves, save exports/imports and gameplay analytics. Return, menu and quit paths dispose of test state safely. Re-entry/reset restores test resources and permits recovery after death.
- Read surface samples from runtime catalogs and used a shared galaxy spawn registry. Added coverage checks and maintenance instructions so future additions must remain represented.
- Fixed research objectives/defenders spawning in isolated hull-damage pockets by selecting reachable deck tiles. Aquatic contact scenarios provide an actual sea, use the normal underwater key and find a valid landing tile when coordinates are absent. Added isolation pods and the pump coupling to debug gear.
- Validation: 31 tests passed; headless checks visited the factories, generated biomes/civilizations and surface samples, then exercised real pickup, cargo loading, equipping and combat. Checked simulation, search, death recovery, future catalog injection, save isolation and exact restoration. Existing rescue/log checks and 54 fixture-assisted contract completions across three hulls passed; GitHub CI passed. Contract fixtures are not 54 fully played expeditions.
- Saves: no career-format migration; sandbox state is deliberately not saved. Remaining: human playtesting of usability; arbitrary procedural stat/trait combinations are not separate exhibits. Details: [debug playground](docs/debug-playground.md).

## 2026-10-31 — 0.28 experimental.4: expedition economy and renewable work

Branch: `experiment/expedition-legacy`. [Commit 0fbbc0e](https://github.com/Sebo2203/Prospector-II/commit/0fbbc0e).

- Science sales preserve usable gear, medicine, quest items, live creatures and reserved contract specimens. Sale quotes and transactions use the same eligibility rules.
- Excluded artificial interiors from planetary survey pay; combined scan/exploration coverage without double counting. Civilization documentation and ordinary survey sales no longer consume each other's rewards.
- Made science work renewable after cooldown, with cargo eligibility, target/range constraints and contract-specific research data. Added relinquishing blocked/lost jobs without reward, preserving unrelated cargo.
- Retired completed research ships through normal world ticks and restored shared contact-marker references after loading. Counted sample, survey and bulk-market proceeds consistently as gross career earnings.
- Added active job details and contract history to LOG → RECORDS. Kept rewards, prices and general combat/resource balance unchanged while repairing the existing career loop.
- Validation: 26 tests passed, plus real station transactions and 54 fixture-assisted contract completions across all three hulls with save/load between jobs; physical research-console recovery and rescue/log regressions were also checked. This establishes tested accounting and persistence, not whole-career balance.
- Saves: older research data retains legacy compatibility; new contracts require matching provenance. Remaining: full career costs, recovery, combat readiness and pacing. Details: [career-loop polish](docs/archive/development-pass.md).

## 2026-10-31 — 0.28 experimental.3: integrate records into the existing log

Branch: `experiment/expedition-legacy`. [Commit 633e808](https://github.com/Sebo2203/Prospector-II/commit/633e808).

- Removed the standalone Expedition Journal screen, J shortcut, menu/context buttons and popup styles. Moved discovery, survey, civilization and survivor records into the existing I → LOG screen, with the sixth RECORDS filter.
- Kept normal keyboard/mouse filtering and scrolling, wrapped long records, and preserved the existing ship-inventory jettison action. This follows the decision that expedition history belongs in the built-in log.
- Validation: scripted log checks covered removed entry points, keyboard/mouse filters, hidden discoveries, event deduplication, chronological wrapping, migration and exit; spatial rescue regressions were checked.
- Saves: retained expedition history and removed the obsolete popup UI flag on load. Remaining: human assessment of log readability. Details: [current experiment](docs/experiment.md).

## 2026-10-31 — 0.28 experimental.2: replace menu outcomes with a physical rescue

Branch: `experiment/expedition-legacy`. [Commit fd7572a](https://github.com/Sebo2203/Prospector-II/commit/fd7572a).

- Replaced the quarantine choice menu with the walkable Mercy of Dawn: rooms, operable hatches, fog of war, visible survivors, medical supplies, contaminated areas, life support, salvage and an airlock. Player decisions now follow movement and work in the world.
- Added individual treatment, escort/carrying, physical isolation pods, repairs/manual pumping, real reserve-air depletion and crew infection. Passenger berths and cargo slots govern transport; small hulls can make return trips.
- Station delivery accepts actual onboard passengers and pays once. Salvage sells through the ordinary commodity market; no remote incident option grants a resolved rescue.
- Corrected planet waiting failing to advance time, cardinal line-of-sight drift and an undefined casino-departure variable found during testing.
- Validation: generated-deck reachability, hatches, survivor movement, atmosphere persistence, transport limits and once-only delivery checks; headless spatial scenarios exercised real movement, medical/repair work, pods, cargo, retreat and station delivery across the three hulls. Controlled setup isolated the rescue from unrelated pirate interception.
- Saves: deck and survivor state persists; older resolved menu incidents retain their history without becoming repeatable rewards. A fresh run is required for the new incident when the older save lacks it.
- Remaining: human assessment of pressure, visibility, action clarity and medical/transport tradeoffs. Details: [current experiment](docs/experiment.md).

## 2026-10-31 — 0.28 experimental.1: initial experiment, later superseded

Branch: `experiment/expedition-legacy`. [Commit d38db07](https://github.com/Sebo2203/Prospector-II/commit/d38db07); [history reconciliation 13b9d56](https://github.com/Sebo2203/Prospector-II/commit/13b9d56).

- Established the experimental branch, a persistent expedition discovery/event register, an initial journal UI and a menu-based quarantine rescue. The experimental desktop wrapper uses its own app identifier.
- Recorded the original Prospector reference, the sequel's direction and the plan to connect existing systems into a captain's career.
- The menu-based encounter missed the intended world interaction and was replaced in experimental.2. The separate journal UI was removed in experimental.3. The persistent history foundation remains.
- Validation: targeted expedition/history and build checks were introduced; see the original commit for that version's implementation. Saves: history initializes for legacy saves without inventing discoveries. Do not use this entry as a description of the current interface.

## 2026-10-31 — Branch cleanup and pre-experiment main baseline

[Main promotion e9b6f36](https://github.com/Sebo2203/Prospector-II/commit/e9b6f36). Details: [branch history](docs/branch-history.md).

- Preserved the old `dev-build` and `modular-source-experiment` tips under archive tags and removed the redundant branches. Closed the obsolete modular-extraction draft PR.
- Promoted the exact pre-experiment development snapshot to main at the owner's request: modular sources, walkable casinos, repair/refuel sounds and the preceding gameplay fixes. Experimental gameplay remains on `experiment/expedition-legacy`.
- Validation: recorded original tips and compared the promoted snapshot with the archived development files. Saves: the promotion itself does not introduce an experimental save migration.
- Earlier changes: [historical changelog](docs/archive/Changelog%20Prospector%20II.txt), [branch history](docs/branch-history.md) and Git history. GitHub Pages follows main; selecting another GitHub branch does not change the hosted game.
