# Scripted playthroughs and headless checks

These are the native-action playthrough policies and regression scripts developed during the experiment, now maintained with the game. They run without browser-control gameplay, a desktop build, personal saves or files from the original PC. Use Node.js 22+.

## Install on a fresh computer

From the repository root:

```sh
npm run build
npm test
npm ci --prefix qa
npm --prefix qa run browsers
```

The root build/tests still need no installed packages. Only this optional testing folder depends on Playwright, pinned by its lockfile. The browser command installs Playwright Chromium for the current operating system. Linux machines may need system browser dependencies (`npx playwright install --with-deps chromium` from `qa/`). Windows/macOS/Linux use the same scripts; Windows desktop compilation is unnecessary.

By default no installed Edge/Chrome is assumed. To use an existing browser instead, set `PROSPECTOR_QA_CHANNEL` to `msedge` or `chrome` in your shell. For example, PowerShell: `$env:PROSPECTOR_QA_CHANNEL='msedge'`. Unset it to return to bundled Chromium. All game/fixture/output paths are resolved from the repository, not the shell's current folder.

## Run actual careers

```sh
npm --prefix qa run smoke
npm --prefix qa run playthroughs
npm --prefix qa run retirement
```

- `smoke`: 80 native input selections per starting hull, to verify the controller runs. This is a bounded check, not a completed career or a retirement attempt.
- `playthroughs`: the three short survey/trade/rescue profiles, capped at 1,000 selections each. Retirement can be chosen early by the pilot's policy; a run can instead die or stop at its bound.
- `retirement`: the latest long survey policy, targeting 10,000 credits, capped at 50,000 selections and 15 minutes. Retirement is an attempted outcome, never guaranteed or forced.
- `long`: the earlier long-career policy preserved in `fixtures/pilot-experimental8.js`, with a 20,000-selection cap. This retains the less cautious combat/dialogue behavior for comparison. Prefer `retirement` for further development.

Both policy files originated in the local harnesses; their rescue-target guards now require a known incident so hidden generated coordinates cannot guide the pilot. The three entry-point scripts now share `playthrough-runner.cjs` to remove duplicated setup, obsolete guaranteed-Mercy waits, fixed version strings and machine-specific paths. They run the checked-out game, so old reports are historical evidence, not expected golden outputs. The `long` profile selects the older policy; short/retirement use `playthrough-pilot.js`.

Options are passed after `--`:

```sh
npm --prefix qa run retirement -- --max-actions 3000 --max-minutes 5 --seed 104729
npm --prefix qa run playthroughs -- --ship BULK_FREIGHTER --max-actions 200
```

The pilot reads revealed information and invokes native movement, interactions, inventory, station, combat and dialogue actions. UI selections are assigned directly where necessary; resources, movement outcomes and rewards are not granted by fixtures. Debug remains off. Each run uses a fresh isolated browser profile and blocks HTTP(S) requests, including analytics. A seeded `Math.random` enables repeatable investigation, but this is not a saved deterministic simulation engine: animation/timing and future code changes may change runs.

Output is under ignored `qa/artifacts/`: progress, action/event trace, ending screenshot, summary and controller checkpoint. These are **generated test artifacts**, not the user's saved careers. Repeating a profile replaces its prior output. Set `PROSPECTOR_QA_OUTPUT` to another folder to retain separate runs. Reports record the game version, commit, policy, bounds, errors and actual ending. They do not automatically mean "pass" because the pilot survived or retired; death and bounded stops are recorded honestly. Technical errors exit unsuccessfully.

For interrupted-controller development, `retirement -- --resume /absolute/path/to/checkpoint.json` restores the generated game, pilot and RNG state through the native save parser/installer. It never loads a checkpoint by default and rejects dead/retired careers. Resume is for continuing a recorded run, not replaying a loss; disclose it in any report. The action limit counts total selections including those before resume.

Known pilot limits: it can mishandle bleeding, recruiting, civilization warnings and physically honoring withdrawal; the older policy can loop on dialogue and retreat too late. Input selections and game turns are different quantities. Review the trace and [historical reports](../docs/archive/README.md) before attributing a poor run to balance. Improving a controller must not silently change game rules or erase consequences.

## Regression scenarios

Run `npm --prefix qa test -- ship-combat ship-systems` for the tactical arena and persistent equipment. Root rule tests separately check critical mitigation and malformed core-state rejection. It checks keyboard and compass movement, mouse targeting, cover and exhaust, multi-ship combat, saves, disengagement, and surrender.

```sh
npm --prefix qa test
npm --prefix qa test -- palette previews encounters
```

The full set runs sequentially in isolated processes, with a five-minute ceiling per script. These are **fixture-assisted scenario checks**, separate from the unassisted careers above. Some intentionally position actors, provide test equipment, damage storage or control random outcomes to verify a specific rule.

| Suite | Coverage |
| --- | --- |
| `interface` | Dark cockpit surfaces, gauge and canvas fit with wrapped actions and an active alert, mouse and keyboard log sizing, twelve-person crew row, galaxy map focus and patrol replies, actionable banners, Mercy action hints, and keyboard barter |
| `menu-input` | Persisted Classic and Cockpit selection, canvas density and input at fractional scales, on-screen naming, routine context button contrast, shared Escape behavior, compass waiting and cursor movement, day-night visibility while waiting on a ship, and crew and cargo |
| `stations` | Station and wreck transparency, boarding and career restoration, galaxy art and fog, minimap layout, seamless walking and landing scans at fractional scales, and sand and snow grain |
| `version` | Smaller save status above the bottom-left version at two scales, full-height sidebar, separate footer tools, main menu keyboard and mouse navigation with and without a save, and retired changelog shortcut |
| `palette` | Shift+B open/close, repeat-key and search-focus handling, runtime catalog coverage, category filtering, real interactions, NPC pause/live, search, rebuilding, future catalog injection, exact career restoration and save isolation |
| `previews` | Galaxy sample art/boarding, ASCII, and 80 pixel comparisons with the preserved pre-extraction orbital renderer |
| `ships` | 384 ship/direction/background/opacity combinations, transparency, subtle radio glyphs over space/nebulae, role/combat art, sensor concealment and ASCII |
| `ship-previews` | Native ship-selection and hull-change screenshots, old/new ship compositing comparison |
| `hangar-systems` | Real Hangar keyboard/held-key, mouse, focused context and F3 entry; canvas styling in both UI themes at two sizes, parent navigation and paid repair. Optionally set `PROSPECTOR_QA_SAVE` to an external export to repeat the entry checks after real file import; personal saves are not bundled. |
| `ship-pursuit` | Actual civilian edge escape and one-sector displacement, authoritative identity/damage/save continuity, faster-player catch-up, civilian engine ratios and saved fractional bank, safe corner fallback, automatic fireable-mount cycling and explanatory free reload refusal |
| `combat-speed` | Generated civilian engine defaults; equal/slower/faster/five-tier tactical pace, per-step heat/exhaust/cover and core failures, one attack/tick per action, no movement stockpile while firing/reloading, fixed player pace per NPC phase, safe fast civilian escape, validated saved fractions and measured escape windows |
| `combat-feedback` | Real outgoing/hull/core hit outcomes produce ordered, separated cue calls; travelling shot with no idle dotted line, preserved target spacing, compact reload text, reduced motion, unchanged game state and pending-cue cancellation on menu return. Timing and synthesis calls are checked; subjective loudness/tone needs human listening. |
| `combat-space` | Continuous space with no tiled range/fog fills, explicit sensor versus weapon range, current-contact culling despite chart history, separate original plasma fade sprites without connecting strokes, removed nearby footer/target heading, original asteroid variants, ASCII and scaled presentation |
| `nebula-encounters` | Manual/early automatic monster fights, natural ram/crystal reward, safe-space/grace/sensor rules, existing palette factory and 40-seed old/new rarity comparison |
| `scan-landing` | Initial and returning scans omit own ship in sprite/ASCII views while preserving terrain, landing memory, saves and relanding |
| `calendar` | Parallel action/location totals, identical gameplay state with recording off/on, free menus/failed services, local solar HUD, saves/validation and ending screenshots |
| `attack-confirmation` | In-game patrol/civilian confirmation without browser dialogs, manual nearby/examined targets, free cancellation, input lock, sensor limits, pirate-base controls and immediate raiders/forced interceptions |
| `comms-log` | Full-height scroll panel, natural wrapped row heights, both themes/scales, paged oldest history, reading anchor, newest following and fresh-career reset |
| `ship-rewards` | Real kills, deferred station bounties, civilian cash/reputation, overflow recovery/save state, full-hold docking, duplicate settlement, claim validation and patrol replacement |
| `improvised-repair` | Actual success/failure/botch via mouse and keyboard, one combat response, save continuity, no fuel-tank attempt or explanatory hint, two-size menu fit |
| `disengagement` | Forced player/NPC failure and success, reset positions, one-action costs, preserved damage/reloads/identity/save state, blocked routes and improvised repair availability guards |
| `combat-ui` | Player hull deduplication, selected-target hull/shield bar values, four result colors in the rendered sidebar and saved history, keyboard/HUD Escape → main menu → Continue with unchanged encounter state; Shared sidebar combat history, schema-2 local-log recovery, equipment-aware shield states, action readiness without a permanent aim line, disabled controls, natural/unarmed target descriptions, shortcut deduplication, combat reference and crowded readout fit |
| `ship-systems` | Integrated I → SHIP inspection with retained tabs, parent navigation, blocked world controls and scaled menu bounds; passive core readouts, blank unfitted shields, context cleanup, stranded inventory repair, component damage and engineer mitigation, blind chart/scan/target boundaries, kit repair and bypass expiry, pointer boosts, heat and independent reloads, shield delay, retreat/load continuity, disabled NPC sensors, SOS drive recovery, fitting/upgrades and native debug damage controls |
| `turns` | Oxygen, daylight and crew status during surface fire and waiting, paid orbital scans, and one turn per casino event |
| `morale` | Actual encouragement rolls, temporary boost, failure, cooldown enforcement, save/load, exact expiry, repeated attempts and zero base morale |
| `worldgen` | Reachable inhabited aquatic settlements across 100 native worlds, shared underwater diplomacy after reload, and morale at zero |
| `encounters` | One hidden Mercy at generation, seeded repeatability, sensor-only detection, no exploration spawns, save/load and explicit debug boarding |
| `rescue` | 15 spatial Mercy rescue scenarios using real door, movement, medicine, carrying, transport and handoff actions |
| `career` | 54 fixture-assisted renewable contract completions across three hulls, station sales, provenance, reloads and physical research-console recovery |
| `log` | Removed journal controls, integrated LOG filters, active work first in Records, hidden knowledge, wrapping/deduplication and legacy UI cleanup |
| `missions` | Footer dropdown, six contract types, live progress, destinations, hidden intel, completion, keyboard scrolling, save/load and layout |
| `autosave` | Actual IndexedDB failure/recovery, large saves/reload, stale windows, import/export and save-before-transition behavior |

`fixtures/palette-orbit-baseline.js` is the original `src/rendering/system.js` from gameplay commit `826210e`, before the shared body-art extraction. It is a visual regression reference, not production code. Do not regenerate it from current code just to make a comparison pass.

Keep these scripts with relevant code changes. Add a focused scenario for a changed behavior, rebuild `index.html`, and run the affected suite. Do not edit production code or weaken assertions merely to make an existing fixture/controller work. Report manual readability, desktop behavior and whole-career balance separately from scripted evidence.

GitHub's Source build workflow installs Chromium on Linux and runs the three-hull smoke check plus all regression suites alongside the dependency-free root tests. Long careers remain explicit runs rather than automatic CI work.
