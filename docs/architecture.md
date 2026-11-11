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

Combat events use ordinary `addLog` entries with category `combat`, and appear in the normal sidebar and LOG history. There is no separate active combat log or font size. Career schema five includes crew-death counts, NPC bridge profiles/maneuver cadence and missile launch CBT alongside hull refits, station-local equipment stores and delayed missiles; earlier schemas are rejected rather than migrated. Actor identity, clocks and weapon deadlines remain persistent.

### Ship bridge and tactics

`src/combat/ship-crew.js` derives active CBT/NAV operators from the authoritative roster/status rules, supplies stable NPC bridge profiles, awards risk-coupled training and resolves actual hull-loss crew impacts. `pruneDead` records resolved deaths in `G.crewDeaths`; crew-only and delayed bleeding defeats retain a ship-combat cause. Missile launch snapshots contain gunnery rather than engines.

`src/combat/ship-ai.js` owns role/range/weapon preferences and bounded weighted arena routing. Enemies choose a single maneuver, shot or cooling response per committed turn, retaining per-substep heat/exhaust/critical checks. `lastManeuverAt` is saved on the arena actor, drives return-fire cadence and clears on failed-withdrawal resets. Tactic/bridge metadata comes from the vessel or stable defaults, without new rendering RNG. See [bridge/AI rules and original-game references](ship-combat-crew.md).

`src/ui/hud.js` keeps a disposable hull-gauge damage animation outside the career: it tracks only the displayed ship/HP, draws a red lost-HP band with the Web Animations API, and clears it on healing, ship/max-HP changes or hidden/reduced-motion display. Animation completion changes only DOM/presentation state, never HP, turns or saves.

### Ship equipment

`src/combat/ship-environment.js` owns deterministic nebula pocket generation, gas-shot penalties and once-per-career-turn discharges. `combat.environment` stores its family/layout/color, pockets, last processed turn, internal pending discharge and last strike; schema-five validation checks rectangles, overlaps and deadlines transactionally. The internal schedule is not exposed as a player warning or AI foresight. `src/rendering/ship-environment.js` draws the generated cloud texture, chart-clipped pockets and seeded lightning without rule RNG. Normal space uses `{type:'space'}`; an absent environment also has ordinary-space behavior. Native asteroid/ship geometry remains authoritative.

`src/combat/ship-collisions.js` owns size-based mutual ram damage, boost/asteroid impacts and committed-maneuver completion, including fatal turns. `damageShipHull` shares the existing hull/critical path without shield absorption. Player maneuver code checks collisions per substep; physical ram attackers can spend a remaining movement substep on contact rather than stopping at adjacency. The existing saved `ramReadyAt` deadline is validated and still limits their cadence. Collision effects/feedback add no new saved state or migration.

NPC arena escape uses a clear two-step galaxy route and a saved `requiresPursuit` marker. Sensor contact and interception eligibility are separate queries: an escaped contact remains visible but requires adjacency before a player-initiated fight, including direct action calls and fleet inclusion. Patrol replacement and disposable debug reset clear the marker. No save migration was added.

Combat asteroid records use `x,y` plus optional `width,height` in the range 1–2 (omitted means a single tile). `shipCombatAsteroid` is the shared footprint collision query for movement, line of fire, enemy routing and guided missiles; `shipCombatAsteroidTiles` supplies rendering/generation cells. Seeded generation reserves spawn clearance and caps occupied cover at sixteen tiles. Rendering selects a dedicated native-size sprite for each large footprint and clips uncharted cells. Generated source art/prompts and proportional preparation are documented in [art direction](art-direction.md); the ordinary importer embeds checked-in PNGs without extra build dependencies. Schema-five validation rejects overlapping, out-of-bounds and malformed footprints; see [combat cover](ship-combat-crew.md#asteroid-cover).

`SHIP_CLASSES.size` derives the `nebulaSignature` physical size multiplier for charged-gas damage (Scout 1, Corvette 1.5, Freighter 2.5). `rollNebulaDischarge` in `src/world/hazards.js` rolls ordinary versus major intensity, scales by that class multiplier and navigation, and rounds once. The existing nebula movement branch controls event occurrence, fuel effects, shielding and critical resolution; it calls the severity roll only after selecting a damage event. The ship tab derives the same multiplier from the class catalog. No size state is persisted, and hull plating/current damage cannot change this multiplier. New hull definitions supply size and physical/layout parameters through `registerShipHull`.

`src/ships/hull-framework.js` derives hull limits, mount/power/thermal profiles, shared refit budgets, drive pace and operating fuel costs. It owns reversible refits, condition-aware reviewed hull exchanges and station equipment storage. Factory definitions and fixed starting packages are separate from the extensible purchase catalog. `src/ui/hull-yard.js` renders its paged quote screen. `G.shipRefits` records paid refit quantities, and `G.hangarStores` retains weapons/deadlines and utilities per station; both remain validated in career schema five. See [hull framework](hull-framework.md).

`src/ships/systems.js` owns installed-versus-effective core ratings, power allocation, heat, shields, critical damage and engineer repairs. Nominal player equipment stays in `G.shipStats`; the physical six-core integrity/temporary repair map, heat, shield charge/recharge deadline, system clock and per-mount `weaponReadyAt` deadlines live on `G.ship`. NPCs use the same persistent fields and a generated `systemStats`/weapon loadout on their authoritative roster actor. Encounters retain display aliases, synchronized from that actor; loading rebinds reload-array aliases and actor IDs.

`G.shipStats.maxFuel` is installed capacity, while `G.maxFuel` is the usable limit after tank damage. `syncPlayerShipSystems` clamps actual fuel and shields without creating either resource. Temporary improvised repairs derive effective values from the current career turn and never heal integrity. NPCs catch up cooling and shield recharge on entering an encounter. Replacing a destroyed patrol creates healthy core state; retreating preserves the same damaged ship. The debug palette uses an explicit 1,000-unit tank and resets core/readiness state when returning to a gallery.

`src/ui/ship-systems.js` draws an in-canvas detail page, with the Hangar frame or shared inventory tabs according to its entry point. Its cursor is ephemeral, outside the saved career; it leaves the underlying gameplay mode intact so `repairShipSystem` still invokes the correct location turn process. Temporary mode restoration inside a field repair keeps the page open; a real career/location change discards it. Mouse and keyboard share component selection and repair actions, movement is blocked while inspecting, and browsing remains free. See the [equipment guide](experiment.md#mounts-core-systems-and-damage) for the rules and `qa/ship-systems-scenarios.cjs` for native integration coverage.

`SHIP_AMMO` in `src/ships/systems.js` owns magazine names, prices and capacity. Persistent `ship.ammo` counts are shared across that ship's mounts; `shipWeaponAvailability` checks supplies and `commitShipWeapon` consumes one only for a valid committed shot. Save validation rejects unknown, fractional, negative or over-capacity counts, including NPCs not yet initialized for combat. New ships start empty unless their owning generation/scenario explicitly stocks missiles. NPC loadouts are assigned once with their system stats. `shipCombatWeaponCanReach` is the shared launch range/cover rule used by player fire, enemy selection/status and stalemate detection; guided launch bypasses the direct firing-line requirement while sensor locks remain mandatory.

`src/combat/ship-missiles.js` owns turn-based flight. `combat.missiles` stores source/target indices into the stable encounter participant array, position, launch gunnery CBT/range values, last processed local round and motor ticks. No object aliases or wall-clock animation state are saved. A bounded breadth-first route avoids cover/current bystanders, is recomputed toward the original target each flight tick and does not consume RNG; impact rolls use current defender piloting NAV. `lastRound` prevents launch-turn or duplicate stepping, and four motor ticks bound pursuit. Actor roster reordering and target selection cannot redirect a salvo. Live missiles prevent victory/stalemate transitions; dead launchers remain in the encounter array until incoming ordnance resolves. Withdrawal processes flight once before rolling; failed resets preserve missile positions, while accepted surrender/successful escape discard the closed arena. `G.baseMissiles` uses target coordinates and absolute career-turn deadlines; `finishCareerTurn` resolves this stationary bombardment without extra turns or duplicate turret replies. Playback remains disposable; it cannot move missiles or roll damage.

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


### Crew progression and scan readings

`crew/morale.js` separates lasting base changes from temporary drink/chemical/event modifiers. `beginCareerTurn` ticks their decay once per committed action, independently of the reporting calendar. `crewMoraleBreakdown` and gameplay share the score; unpaid visits describe past base losses. `crew/skills.js` owns linear 25 × next-level XP costs, surplus/cap handling and valid grants; the crew panel reads the same threshold. New careers have Captain and Navigator only. Station technicians need no onboard engineer and purchases grant no training XP. Repeat approaches train navigation because each launch spends fuel and every approach rerolls crash risk; the former `navigationTrainingAwarded` field is ignored. See [crew progression](crew-progression.md).

`bodyScanReadings` in `actions/survey-and-scan.js` supplies detailed orbital rows. The orbital renderer separately derives terrain percentage from the selected body's scan mask, floors partial coverage below 100%, and uses 100% for a full scan; gas giants omit this surface-only label. Rendering does not reveal terrain or update scan state. Actual generated populations override biome estimates, including zero, and moons use their own body descriptor. `bodyScanHint` separately supplies at most one broad comms clue for a civilization, an unusual world, revealed scattered structures or a special companion after a full gas-giant scan. It never calls the detailed reading formatter, reveals identities/disposition/coordinates or consumes randomness. Ordinary successful scans are silent; failure/resource/offline/completed-scan refusal feedback remains. Survey records, scan state, costs and XP are unchanged. Gas giants have no breathable surface. Rendering and hint selection remain read-only.

`rollFuelTankExplosion` in `ships/systems.js` applies internal hull damage after a tank critical without calling hull/critical damage recursively. Player fuel loss follows capacity clamping; NPCs use implicit reserves. Damage returns include the blast so combat feedback and ordinary death/reward paths remain authoritative. `rescueServices` derives SOS offer text from actual propulsion failure and transferable fuel; acceptance revalidates the living adjacent actor before charging or repairing.


### Repeatable training and pulsar exposure

`applyPulsarExposure` in `world/hazards.js` contains the former galaxy-movement radiation block. Movement, `doWaitGalaxy` and `doStrandedWait` call the same helper once per action. The helper applies existing range/damage/dose rules without advancing turns itself. Pulsar interaction calls `doWaitGalaxy('scan')` before awarding XP to surviving scientists, so observations, field repair waits and SOS waits cannot freeze radiation or NPC activity. `finishCareerTurn` still owns status ticks; no observation counter, new save field or duplicate career tick is introduced. Paid successful scans train independently of coverage growth; the completed-scan refusal remains free and awards nothing.
