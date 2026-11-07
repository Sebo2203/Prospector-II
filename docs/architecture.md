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

## Save compatibility policy

Backward save compatibility is not a project requirement. Do not spend development work on migrations, compatibility shims or preserving obsolete save formats unless the user explicitly requests it. Change and bump the career schema when it improves the implementation, and reject unsupported files clearly. Current-format validation, transactional integrity and preserving the active career when an import fails are still required. Existing compatible formats may continue to load; that does not create a compatibility promise for future builds. This policy is also recorded in `AGENTS.md`.

## Runtime model

This is a source organization step, not a conversion to ES modules. The main game still executes in one classic inline script with shared lexical bindings and global functions. The separate analytics and feedback/barter script blocks remain in their original positions. This preserves inline HTML handlers, declaration visibility and registration order.

`G` is the mutable game state, initialized in `src/core/new-game.js`. Keyboard routing lives in `src/input/keyboard.js`. Actions update state and request rendering; `src/rendering/dispatch.js` selects views, while HUD/sidebar/context controls live under `src/ui/`. Persistent saves and loading are in `src/persistence/save-load.js`. Startup waits for embedded sprites, generates procedural sprites, and displays the menu in `src/core/startup.js`.

The root keeps a 1400×720 logical layout. `src/ui/scaling-and-compass.js` fits it to the viewport with CSS layout zoom, with transform scaling as a fallback. Drawing and pointer hit areas use `canvasWidth` and `canvasHeight`. The main canvas backing dimensions are the displayed size in device pixels and can change on resize or display density changes. Use the backing dimensions for pixel reads and writes.

### Action timing

`src/actions/turns.js` coordinates the career clock. A committed action advances the global turn once, and a completed turn ticks crew conditions and timed incidents. Physical surface actions also advance local daylight, refresh sight, and apply oxygen and local hazards. Movement and waiting keep their own effects such as injury costs and medic aid. Paid orbital scans consume one fuel and one turn, and a casino event consumes one turn at buy-in. Menu navigation, inventory management and failed checks that consume no resources remain free.

The tactical arena uses local rounds for exhaust. Committed actions also advance the career clock while the encounter resolves locally. Ship reloads use absolute career-turn deadlines, while heat and shields tick through `finishCareerTurn`. Galaxy movement keeps its existing travel and wait rules.

### Shared menu controls and combat presentation

`canvasMenuButton` records its displayed shortcut and current view on the transient canvas hit area. The context bar suppresses an action already present as an explicit button in that view. This removes duplicate controls while retaining the shortcut on the primary control. Fire and Boost readiness come from the same queries used by the action guards; unavailable context buttons are disabled with the reason visible. The tactical aiming line uses the actual selected shot status.

Combat events use ordinary `addLog` entries with category `combat`, and appear in the normal sidebar and LOG history. There is no separate active combat log or font size. Schema-2 encounters from earlier builds are accepted: matching archived local-log entries are promoted to the sidebar once, retaining their order and original turns, and the obsolete local log fields are dropped. Actor identity, clocks and weapon deadlines are unchanged. Tactical movement/speed rules are unchanged by this presentation pass.

### Ship equipment

`src/ships/systems.js` owns hull mount profiles, installed-versus-effective core ratings, power allocation, heat, shields, critical damage and engineer repairs. Nominal player equipment stays in `G.shipStats`; the physical six-core integrity/temporary repair map, heat, shield charge/recharge deadline, system clock and per-mount `weaponReadyAt` deadlines live on `G.ship`. NPCs use the same persistent fields and a generated `systemStats`/weapon loadout on their authoritative roster actor. Encounters retain display aliases, synchronized from that actor; loading rebinds reload-array aliases and actor IDs.

`G.shipStats.maxFuel` is installed capacity, while `G.maxFuel` is the usable limit after tank damage. `syncPlayerShipSystems` clamps actual fuel and shields without creating either resource. Temporary improvised repairs derive effective values from the current career turn and never heal integrity. NPCs catch up cooling and shield recharge on entering an encounter. Replacing a destroyed patrol creates healthy core state; retreating preserves the same damaged ship. The debug palette uses an explicit 1,000-unit tank and resets core/readiness state when returning to a gallery.

`src/ui/ship-systems.js` draws an in-canvas detail page, with the Hangar frame or shared inventory tabs according to its entry point. Its cursor is ephemeral, outside the saved career; it leaves the underlying gameplay mode intact so `repairShipSystem` still invokes the correct location turn process. Temporary mode restoration inside a field repair keeps the page open; a real career/location change discards it. Mouse and keyboard share component selection and repair actions, movement is blocked while inspecting, and browsing remains free. See the [equipment guide](experiment.md#mounts-core-systems-and-damage) for the rules and `qa/ship-systems-scenarios.cjs` for native integration coverage.

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

## Tactical audiovisual feedback

`src/combat/ship-feedback.js` owns an ephemeral queue outside the career. Real weapon/core outcomes enqueue immutable source/destination and hit metadata after rules resolve; it sequences 110ms projectile travel and separated impact cues without applying damage or advancing the clock. The rendering animation loop redraws active playback. Final encounter feedback can finish over the combat view before the galaxy returns. Career/mode/encounter changes cancel playback; repeated input bounds pending presentation to twelve events. No callbacks mutate saved combat state. Reduced-motion preferences suppress projectile travel. `src/audio/sound-effects.js` supplies separate outgoing, shield, hull and core cues; existing browser autoplay requirements still apply. Native `combat-feedback` scenarios verify timing, real critical metadata, cancellation and unchanged gameplay state.

## Galaxy ship movement and tactical exits

`shipRelativeMoveBudget` in `src/ships/neutral-movement.js` is the shared ratio kernel. Its galaxy wrapper `galaxyShipMoveBudget` serves pirate pursuit and unarmed civilian interaction/flight. It stores fractional `_chaseMoveBank` on the authoritative ship and uses effective engine ratings; normal distant roaming retains the existing two-step cap. Patrol/rescue routing keeps its existing step rate. `galaxyShipEscapeChoices` filters bounded, unoccupied nonhazardous destinations for civilian flight and tactical escape. Tactical edge escape changes the roster ship's coordinates before marking its arena actor escaped. It never creates a second ship or moves the player.

`selectReadyShipCombatWeapon` uses the same complete readiness query as actual firing, checking the current mount before scanning cyclically for a valid alternate. Selection runs at engagement/target/manual-selection/turn synchronization and again before fire. Failed attempts use `shipCombatBlockedFireMessage`; neither fallback selection nor refusal advances time or changes absolute reload deadlines.

Tactical movement wraps `shipRelativeMoveBudget` with a separate fractional `moveBank` on each arena actor. New actors start at zero; the snapshot retains the fraction and rejects non-finite/out-of-range credit before installation. One player reference engine is captured per NPC phase. Only movement decisions spend/earn movement credit; firing or holding range clears it. Multi-step movement reuses the normal single-step planner, collision/cover, heat, exhaust, damage and escape paths, stopping on range, death, escape or drive/sensor failure. It never repeats attacks or career ticks. `NEUTRAL_ENGINE_RATINGS` in `src/ships/classes.js` is the single default source for generation and neutral stat initialization; explicit individual fittings remain authoritative.


### Failed tactical disengagement

Player and NPC withdrawals share `SHIP_DISENGAGE_FAILURE_CHANCE` (25%). Arena spawn constants are reused for creation and failed-withdrawal repositioning; no new save fields or migrations are needed. Failure clears trails, pending visual feedback, aiming and active opponents' movement credit, refreshes sensors/readiness, and preserves authoritative ship damage, resources and world coordinates. Dead/escaped actors are not revived. NPC failure propagates a reset result through the step planner and stops the phase; it does not repeat NPC actions or career ticks. A failed player attempt retains normal return fire and its single career tick, advances the local round once and remains in combat. No-safe-route NPC failures do not roll or reset.


### Improvised ship repair

`repairShipSystem(id, 'improvised')` replaces the guaranteed bypass action. It selects the living engineer with the highest effective engineering skill and resolves one random skill check before awarding XP. Success uses the existing `bypassUntil` deadline as the internal temporary-support field; no new save state or migration is introduced. Failure/botch still follows the normal field-action turn path, including the combat response. Only effective skill 0–1 can botch, using ordinary core damage and synchronization. The fuel-tank UI omits this method and the action guard rejects it. Public-facing labels/logs refer to improvised repair; legacy internal save-field naming is not UI terminology.


### Ship rewards and deferred claims

`src/combat/ship-rewards.js` owns role-weighted salvage and station bounty settlement. `resolveShipCombatKill` marks each roster ship `combatRewardsResolved` before applying rewards; patrol replacement clears the marker. The existing inventory/commodity catalogs supply items. Overflow cargo reuses the persistent `nebulaLoot` cargo-drop collection with item-specific labels and non-crystal cargo markers.

`G.pirateBounties` stores aggregate pending `credits` and `kills`, initialized for new careers and created on the first new kill when absent. No historical kills are paid retroactively. Current-format parsing validates present totals before installing a save. Authorized BASE docking clears the claim before crediting it, ahead of payroll; no menu or render path pays claims. Active missions and records derive pending information from the same state. No schema change or migration is required.


### Sidebar comms history

`renderCommsLog` owns transient sidebar history paging outside the career save. The flex log fills the remaining right sidebar height and message rows do not shrink. It initially renders 80 non-archived messages; scrolling toward the oldest visible edge loads another 80 without dropping saved history or advancing time. New messages follow the latest edge only while already there; otherwise the visible entry is anchored across redraws using the displayed scale. A new career resets the transient window. Crew dialogue uses the same log view. The dedicated LOG tab remains the full archive, including archive-only entries.


### Parallel reporting calendar

`src/actions/calendar.js` records reporting minutes through `beginCareerTurn(activity)` and explicit turn-free station/transit hooks. This sidecar never drives gameplay. `G.careerTime` contains elapsed minutes plus independent location/activity sums; all present counters are validated before save installation. The HUD, current records and endings read it. Local solar text derives from the existing `planetTurn` cycle, preserving lighting and off-world pause. See [rates and boundaries](time-reporting.md).


### Galaxy attack targeting and confirmation

`galaxyAttackTarget` is shared by the galaxy Fire action and context bar. It chooses the examined eligible ship, otherwise the nearest living pirate/civilian/gas entity in current Manhattan detection range on charted terrain. Gas entities use the same sensor-plus-two radius as their drawn marker. Radio-only/out-of-range contacts are not target locks. Fire routes before movement remaps and Examine routing, with repeats ignored outside combat. Pirate-base fire remains the fallback when no eligible ship is selected.

Patrol/unarmed confirmation is a transient `shipAttackPrompt` outside `G`, drawn as a blocking canvas menu. The keyboard and compass block world actions while open; Y/N and canvas buttons share the resolver. The resolver revalidates career identity, actor presence, life and range before accepting. Cancelling and opening do not alter gameplay or reporting time; reload/menu/career transitions cannot resurrect an approved action. Native `window.confirm` is no longer used, so embedded browser suppression cannot silently cancel an attack. Automatic interceptions bypass the player-initiation confirmation as before.


### Nebula encounter activity and rarity

`moveGasEntities` no longer defers AI until turn 300. Natural pursuit/engulf checks retain nebula confinement, six-sector prey detection and disengagement grace, and now honor debug ship invisibility. The shared galaxy Fire selector includes the authoritative gas roster and sends natural entities directly to `startShipCombat`, bypassing civilian reputation logic. `nebulaEntitySpawnChance` in galaxy generation supplies the new per-connected-cluster rates; it does not repopulate or thin loaded galaxies. The existing gas-object playground factory remains the source for disposable interactive specimens.
