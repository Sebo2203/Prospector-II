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

The [November combat review](../docs/combat-review-2026-11-09.md) includes a separate diagnostic: `node qa/review-ship-combat.cjs`. It constructs damaged-ship/fleet fixtures, exercises native actions, and reports stalemate, target-dependent surrender, powerless edge withdrawal and engine formula observations to ignored `qa/artifacts/combat-review.json`. It is not a natural career, a balance pass/fail test, or a regression assertion that current defects should remain. Use the same browser setup described above.

Run `npm --prefix qa test -- ship-combat ship-systems` for the tactical arena and persistent equipment. Root rule tests separately check critical behavior without engineer mitigation and malformed core-state rejection. It checks keyboard and compass movement, mouse targeting, cover and exhaust, multi-ship combat, saves, disengagement, and surrender.

```sh
npm --prefix qa test
npm --prefix qa test -- palette previews encounters
```

The full set runs sequentially in isolated processes, with a five-minute ceiling per script. These are **fixture-assisted scenario checks**, separate from the unassisted careers above. Some intentionally position actors, provide test equipment, damage storage or control random outcomes to verify a specific rule.

| Suite | Coverage |
| --- | --- |
| `helmets` | Native U/uppercase toggles and held-key guard, immediate vacuum damage despite full tanks, closing protection, safe breathable/own-ship-airlock behavior, plate exclusion, underwater drowning, debug oxygen protection, ward infection and closing protection, persisted/fatal outcomes and invalid-mode rejection. Checks O stays Options, the legend stays collapsed and there is no helmet context control; records ignored screenshots. |
| `quarantine-air` | Four sealed suit types, armor plates, missing/punctured suits, actual three-turn infection, clean/scrubbed air, protected companions, helmet sprite choice and confirmed exposure-progress save/load. Generated fixtures isolate airborne ward exposure from passenger infection and natural disease spread. |
| `story-rescue` | Saved later appearance through a native turn, local/obstructed/offline distress range, randomized-name routing, shared ringworld hatch states through Enter and movement, normal creature examine and visibility, pixel fixtures/people without glyph/RNG/save mutations, keyboard/pointer onboard medicine with action costs and confirmed persistence, failed-rescue closure without docking/payment, and malformed-plan rejection. Generates ignored `story-rescue.json` and interior/examine/passenger screenshots. Run with `rescue`, `encounters`, `missions`, `palette` and `autosave` for the broader lifecycle; these are fixture-assisted checks, not natural-career frequency/balance or station-infection coverage. |
| `equipment` | Catalog-driven audit of 50 inventory entries (44 usable types), all five ship weapons and two working utility modules; disabled Ship Mining Drill is asserted as a placeholder. Actual paid station/corporate purchases, radio receiving function, real barter, equip/use/consume/return, ranged/melee/nonlethal outcomes, wall/bystander interception, implant modifiers/removal, medical refusals, oxygen/vision, capture redemption, mining, native grapple/Jetpack/drone/C4 actions, and transactional retained-gear persistence. Generates ignored `equipment-audit.json` and `equipment-implants.png`. Run `node qa/run.cjs equipment` after the setup above. New unknown catalog usable types fail coverage. `node qa/equipment-audit.cjs --report-only` records exploratory failures without a failing exit; release validation must use strict/default mode. Mercy equipment also needs `interface`/`missions` and the root quarantine rules. Fixtures grant resources and force bounded outcomes, so this is functional evidence rather than whole-career balance or human playtesting. See the [dated report](../docs/equipment-audit-2026-11-12.md). |
| `audio` | All 24 embedded recordings decode offline once; native firing/misses/refusals, delayed Artemis impact, shield-only hits, dedicated ram/asteroid/wraith cues, boost, tactical/galaxy nebula strikes, first-result scans per planet/moon with quiet repeats across confirmed save/load, recorded ringworld/Mercy hatch openings and ancient locks, ground weapons, C4, landing/liftoff and the restored synthesized docking chime, plus latched alarms. Verifies ground-only original pain, pending/retrigger cancellation, no career/RNG changes and harmless decode failure. Uses controlled fixtures, not human listening or unassisted careers; normal checks need only retained runtime assets. Optional audition pages use the separate checker below. |
| `nebula-combat` | Native gas movement and symmetric shot penalties; unannounced lightning and awaited save/load/menu-stable scheduling, including pending lightning across a failed withdrawal; pixel-identical pending/ordinary gas without warning text/hover/banner; no NPC foresight; size-scaled damage, shield/debug/fatal handling and no duplicate strike; malformed-load preservation, RNG/state-free rendering, screenshots and NEBULA COMBAT reset/return isolation. |
| `ramming` | Native normal/boost ship rams, mutual shield-bypassing hull damage, exact fuel/heat/turn/reload behavior, first/second/non-anchor asteroid impacts and footprint scaling, fatal/mutual outcomes and saved endings, criticals/personnel/debug protection, faster wraith catch-up during uninterrupted movement, equal-speed escape, boost separation and saved cadence/fractional credit. |
| `combat-cover` | Non-anchor ordinary-thrust/fire blocking and collision-enabled boost readiness, close-assault flanking, guided routes and actual impact around a 2×2 rock, saved dimensions/transactional rejection, clipped sprite/ASCII parity without RNG, screenshots and BRIDGE DRILL shape reset/return. Root tests cover 1,024 seeded arenas, clearance, rarity and the sixteen-tile budget. |
| `landing-impact` | Native approaches with full shields, all three starter hull damage ranges, retained shield charge/recharge, NAV 8/9 boundary, unchanged training/turns, component criticals, fatal crash and debug hull protection. Controlled approach/critical rolls on generated terrain; not a career balance audit. |
| `crew-equipment` | Real catalog Assault Carbine acquisition, keyboard selection/cancel/equip, canvas mouse controls and context fallback (transient canvas hit areas cleared for that case), replacement and unequip/re-equip without duplication or extra turns, awaited autosave/load, live +4 ATK/range-four firing and equipment recognition for every ground weapon. |
| `oxygen` | Native injured-crew movement on a generated intact ringworld, no repeating recovery messages, genuine partial-reserve recovery, current-format export/import, retained hostile-air and submerged exertion costs, and infinite-oxygen protection. Controlled floor corridor, enemies removed and fixed random rolls; not a personal-save replay or a natural expedition. |
| `interface` | Lost-hull red-band geometry, consecutive hits, expiry without saved-state changes, repair/import cancellation and reduced motion; Ruptured-tank gauge marking/fill at full, partial and zero usable fuel, capacity text, both UI themes/sizes and repair without fuel creation; Dark cockpit surfaces, gauge and canvas fit with wrapped actions and an active alert, mouse and keyboard log sizing, twelve-person crew row, galaxy map focus and patrol replies, actionable banners, Mercy action hints, and keyboard barter |
| `menu-input` | Persisted Classic and Cockpit selection, canvas density and input at fractional scales, on-screen naming, routine context button contrast, shared Escape behavior, compass waiting and cursor movement, day-night visibility while waiting on a ship, and crew and cargo |
| `stations` | Station and wreck transparency, boarding and career restoration, galaxy art and fog, minimap layout, seamless walking and landing scans at fractional scales, and sand and snow grain |
| `version` | Smaller save status above the bottom-left version at two scales, full-height sidebar, separate footer tools, main menu keyboard and mouse navigation with and without a save, and retired changelog shortcut |
| `palette` | Shift+B open/close, repeat-key and search-focus handling, runtime catalog coverage, category filtering, real interactions, NPC pause/live, search, rebuilding, future catalog injection, exact career restoration and save isolation |
| `previews` | Galaxy sample art/boarding, ASCII, and 80 pixel comparisons with the preserved pre-extraction orbital renderer |
| `ships` | 384 ship/direction/background/opacity combinations, transparency, subtle radio glyphs over space/nebulae, role/combat art, sensor concealment and ASCII |
| `ship-previews` | Native ship-selection and hull-change screenshots, old/new ship compositing comparison |
| `hangar-systems` | Real Hangar keyboard/held-key, mouse, focused context and F3 entry; canvas styling in both UI themes at two sizes, parent navigation and paid repair. Optionally set `PROSPECTOR_QA_SAVE` to an external export to repeat the entry checks after real file import; personal saves are not bundled. Paid Scout engine refits 3→4, plain system rows, Roman ratings in all rated-core detail headings, installed/usable fuel capacity after rupture, integrity/effective labels, damage/power explanations and confirmed save/load readout. |
| `ship-pursuit` | Clear two-step NPC escape and saved pursuit requirement; remote F, elapsed grace, full vision, direct entry and fleet-inclusion guards; paid catch-up and actual interception; authoritative identity/damage, civilian engine ratios/saved banks, safe corner fallback, weapon fallback and free reload refusal |
| `combat-resolution` | Saved immobile/blind/covered stalemates return to stranded/SOS without repairs, rewards or relocation; keyboard/compass waiting, real rescue, exposure and new threats; reload/heat and viable movement/fire retain combat; failed-withdrawal reset; target-independent fleet surrender, refusal/acceptance and saved survivor terms |
| `bridge` | Active crew/condition gunnery and evasion, actual shield/debug-safe crew impacts and fatal officer fallback/grief, recorded deaths and crew-only/delayed bleeding defeat, risky CBT/NAV training, saved launch skill and strict profile/cadence validation, distinct native roles/flanking/return-fire/cooling and resettable BRIDGE DRILL career isolation. |
| `armament` | Duplicate fitting refusal through native keyboard and direct action, no payment/stock/cooldown/time changes even with owned spares, identical guns on separate mounts, paid replacement and stored old deadlines, bounded aligned text and blue Hangar screenshots in both UI themes at two viewport sizes. |
| `artemis` | Launcher ownership guards (installed or station-stored, including another station), refusal without spending credits/ammo/turns/time, retained missiles without a launcher, real launcher/ammunition purchases and magazine cap, guided cover fire for both sides, hit/miss consumption, free guards, keyboard/mouse targeting, energy-weapon fallback, retreat/save identity and stock, stalemate integration, base bombardment and registered debug sample reset/career isolation |
| `missile-flight` | Near/far delayed impact, route tracking and motor expiry, impact-time RNG, no menu/playback stepping, stable saved targets after roster/selection changes, destroyed-launcher retaliation/death, last-enemy flight, target loss, failed/successful withdrawal and accepted surrender |
| `combat-speed` | Generated civilian engine defaults; equal/slower/faster/five-tier tactical pace, per-step heat/exhaust/cover and core failures, one attack/tick per action, no movement stockpile while firing/reloading, fixed player pace per NPC phase, safe fast civilian escape, validated saved fractions and measured escape windows |
| `combat-feedback` | Real outgoing/hull/core hit outcomes produce ordered, separated cue calls; travelling shot with no idle dotted line, preserved target spacing, compact reload text, reduced motion, unchanged game state and pending-cue cancellation on menu return. Timing and synthesis calls are checked; subjective loudness/tone needs human listening. |
| `combat-space` | Continuous space with no tiled range/fog fills, explicit sensor versus weapon range, current-contact culling despite chart history, separate original plasma fade sprites without connecting strokes, removed nearby footer/target heading, original asteroid variants, ASCII and scaled presentation |
| `nebula-encounters` | Manual/early automatic monster fights, natural ram/crystal reward, safe-space/grace/sensor rules, existing palette factory and 40-seed old/new rarity comparison |
| `hulls` | Reviewed keyboard/mouse hull exchange, payment/gear/cooldown/ammo retention, station stores, paid bays/free owned fitting, transactional save/load, additional catalog pages without extra starters, native size-dependent travel/wait/rough landing/liftoff, keyboard/mouse game over on attempting underfuelled liftoff, exact-fuel success/debug exception, preserved ending and return to menu, fractional low-fuel guards and resettable isolated HULL WORKSHOP. Controlled fixtures establish rules; whole-career affordability remains playtesting work. |
| `nebula-damage` | Native debug-checkbox independence, shield absorption/recharge versus actual hull/gauge loss, partial/no shields, truthful protection/fuel logs and save/load; common/major discharges on all starting hulls, plating-independent severity, shield overflow, lethal arcs and the keyboard-accessible ship multiplier. Optional `PROSPECTOR_QA_SAVE` imports a read-only external save before controlled fixtures; no personal save is bundled or modified. |
| `scan-landing` | Initial and returning scans omit own ship in sprite/ASCII views while preserving terrain, landing memory, saves and relanding |
| `calendar` | Parallel action/location totals, identical gameplay state with recording off/on, free menus/failed services, local solar HUD, saves/validation and ending screenshots |
| `attack-confirmation` | In-game patrol/civilian confirmation without browser dialogs, manual nearby/examined targets, free cancellation, input lock, sensor limits, pirate-base controls and immediate raiders/forced interceptions |
| `comms-log` | Full-height scroll panel, natural wrapped row heights, both themes/scales, paged oldest history, reading anchor, newest following and fresh-career reset |
| `ship-rewards` | Real kills with separate controlled accuracy/salvage rolls and legal factory shield stats, deferred station bounties, civilian cash/reputation, overflow recovery/save state, full-hold docking, duplicate settlement, claim validation and patrol replacement |
| `improvised-repair` | Actual success/failure/botch via mouse and keyboard, one combat response, save continuity, no fuel-tank attempt or explanatory hint, two-size menu fit |
| `disengagement` | Forced player/NPC failure and success, reset positions, one-action costs, preserved damage/reloads/identity/save state, blocked routes and improvised repair availability guards |
| `combat-ui` | Player hull deduplication, selected-target hull/shield bar values, four result colors in the rendered sidebar and saved history, keyboard/HUD Escape → main menu → Continue with unchanged encounter state; Shared sidebar combat history, schema-2 local-log recovery, equipment-aware shield states, action readiness without a permanent aim line, disabled controls, natural/unarmed target descriptions, shortcut deduplication, combat reference and crowded readout fit |
| `ship-systems` | Integrated I → SHIP inspection with retained tabs, parent navigation, blocked world controls and scaled menu bounds; passive core readouts, blank unfitted shields, context cleanup, stranded inventory repair, component damage without engineer mitigation, blind chart/scan/target boundaries, kit repair and bypass expiry, pointer boosts, heat and independent reloads, shield delay, retreat/load continuity, disabled NPC sensors, SOS drive recovery, fitting/upgrades and native debug damage controls |
| `turns` | Oxygen, daylight and crew status during surface fire and waiting, paid orbital scans, and one turn per casino event |
| `morale` | Actual encouragement rolls, temporary boost, failure, cooldown enforcement, save/load, exact expiry, repeated attempts and zero base morale |
| `worldgen` | Reachable inhabited aquatic settlements across 100 native worlds, shared underwater diplomacy after reload, and morale at zero |
| `encounters` | Optional initial/later/absent career plans across seeded openings, stable named placement, nearby sensor-only signal, no remote chart-history announcement, transactional save/load and explicit debug boarding |
| `rescue` | 15 spatial Mercy rescue scenarios using real door, movement, medicine, carrying, transport and handoff actions; the fixture is two sectors from the starting station, with paid travel/position checks under current hull fuel costs |
| `career` | 54 fixture-assisted renewable contract completions across three hulls, station sales, provenance, reloads and physical research-console recovery |
| `log` | Removed journal controls, integrated LOG filters, active work first in Records, hidden knowledge, wrapping/deduplication and legacy UI cleanup |
| `missions` | Footer dropdown, six contract types, live progress, destinations, hidden intel, completion, keyboard scrolling, save/load and layout, with a legal one-slot Scout cargo refit |
| `autosave` | Actual IndexedDB failure/recovery, large saves/reload, stale windows, import/export and save-before-transition behavior |

`fixtures/palette-orbit-baseline.js` is the original `src/rendering/system.js` from gameplay commit `826210e`, before the shared body-art extraction. It is a visual regression reference, not production code. Do not regenerate it from current code just to make a comparison pass.

Keep these scripts with relevant code changes. Add a focused scenario for a changed behavior, rebuild `index.html`, and run the affected suite. Do not edit production code or weaken assertions merely to make an existing fixture/controller work. Report manual readability, desktop behavior and whole-career balance separately from scripted evidence.

GitHub's Source build workflow installs Chromium on Linux and runs the three-hull smoke check plus all regression suites alongside the dependency-free root tests. Long careers remain explicit runs rather than automatic CI work.


`node qa/run.cjs crew-balance` checks two-person starts on all hulls, two engineer recruits, station upgrades without engineers or purchased XP, SOS offers/repairs at full fuel followed by actual movement, retained orbital readings without duplicate comms data (partial scans, moons, gas giants and generated zero life), repeat landing training with launch costs, saved fading morale and lethal NPC fuel-explosion bounty handling. It uses disposable fixtures and controlled action rolls; it does not measure whole-career survival or final progression balance.


## Measure skill progression

Run `node qa/run-skill-audit.cjs ordinary`, `extended`, or `focused` against the built game. An optional next argument filters profile IDs (`extended freighter`). These are fresh, seeded native-action careers, with observer-only XP accounting and explicit time/action bounds. Focused policies deliberately seek charted pulsars/casinos and grind their native actions; they are not ordinary exploration. The observer retains dead/departed crew and milestone turns. `PROSPECTOR_QA_OUTPUT` selects a separate generated-report directory.

`node qa/check-skill-observer.cjs` compares observation on/off with deterministic startup/gameplay RNG and timestamps, excluding only visual sprite interpolation from the state comparison. `node qa/probe-skill-sources.cjs` deliberately bypasses travel using positional fixtures to isolate reward sources; never count these probes as successful careers. Neither tool changes the shipped game. See the [dated experimental.74 report](../docs/skill-progression-audit.md) for outcomes, controller failures, curve calculations and limits.


`node qa/run.cjs repeat-training` verifies repeat clean/rough approaches and launch fuel, paid-scan XP versus free completed-scan viewing, repeated native Enter observations with exact time/fuel/hull/radiation costs, lethal observation stopping XP, and exposure while waiting/stranded at the existing range boundaries. These are disposable risk-coupling scenarios, not unassisted careers. The source probe now stops at death rather than counting refused interactions after game over.


`node qa/run.cjs scan-comms` verifies quiet ordinary successful scans, one restrained civilization/special-world hint without identities or numeric readings, selected moons, gated gas-giant companion hints, retained orbital details, selected-moon terrain coverage at 37/99/100%, no gas-giant surface percentage, paid scan costs, failure feedback and free completed-scan refusal. The rule tests separately cover hinted versus concealed scattered structures and deterministic hint selection. Fixtures intentionally select world types; this is not a natural discovery-frequency or spoiler-comprehension playtest.

Hull-cost changes also update the maintained pilot’s return-fuel estimate to use actual sector consumption; short-career reports remain bounded evidence, not an affordability guarantee.

## Check sound audition pages

For optional sound auditions, `node qa/check-audio-preview.cjs outputs/page.html expectedClipCount` checks actual browser decoding, distinct clip labels, one-at-a-time native playback and shared volume without network access. Generate the page first using the tools in [the audio guide](../docs/audio.md); generated auditions are deliberately not required by the normal regression suite. These checks establish functional playback, not subjective sound quality. `python tools/preview-collision-audio.py` creates four optional layered collision auditions using the same encoder setup and existing pinned CC0 sources; check its printed HTML path with an expected count of `4`.

## Combat crew and tactics audit

Run `node qa/run.cjs bridge` for deterministic rules, or `node qa/combat-matchups.cjs` for 192 seeded native-action single-enemy fights: three hulls × two crew profiles × four role/loadout pairs × eight seeds, half with authored cover, at most 80 selections each. The shared `qa/ship-combat-fixture.js` is a controlled fixture, not an unassisted career: it grants a legal Freighter gun bay/gun and trained CBT/NAV where requested. The policy seeks firing range, fires available mounts and attempts low-hull withdrawal. Rendering is suppressed inside batches; actual turns, reloads, heat, shields, impacts, criticals, injuries, crew XP and escape remain native. Debug is off. Economic affordability is not simulated.

The generated `qa/artifacts/combat-matchups.json` records per-fight outcomes, bounded stops, final hull/crew losses and actor conditions, plus summaries and game version. Death/escape/cap is measured rather than treated as an automatic test failure. Errors and failure to commit actions are test failures. A capped run can reflect limited policy, damaged sensors, range control or insufficient time; inspect it rather than silently counting it as a win/loss. These fixtures do not establish whole-career survival or human enjoyment. Current rules, original source references and the recorded first results are in [the combat guide](../docs/ship-combat-crew.md).

## Integrated combat audit

Run `node qa/combat-integration-audit.cjs` against the built HTML for the wider collision/environment audit. Setup uses the shared fixture, a fixed baseline-generation seed and a separate repeatable combat RNG stream per case. Debug protection is off. The default matrix has **864 single-enemy fights** (three starter hulls × two crew profiles × two environments × two policies × six threats × six seeds) and **48 two-ship fleet fights**. It also runs **24 three-encounter chains** through paid sector movement without repairing, healing, resupplying or replacing casualties, and **24 paired uninterrupted/imported replays** comparing the complete final serialized career. These are scripted encounters with granted legal fittings/skills, not unassisted careers or encounter-frequency estimates.

The two policies use visible contacts and charted cover, ordinary fire, ready boosts, heat/ammunition guards and low-hull withdrawal. The mixed policy additionally tries favorable ordinary/boost rams using the published size formula. It cannot inspect pending lightning. Native actions own responses, missiles, reloads, collisions, injuries, criticals, XP and turn costs; rendering/feedback playback is suppressed within batches. The pilot deliberately avoids known asteroid crashes, does not perform repairs or surrender, and can make poor choices after losing contact. Free refusals are recorded and followed by a native wait. Specific asteroid crashes, moving-target chases, surrender, repair and UI paths remain covered by their deterministic scenario suites.

Each fight is bounded to 90 actions. Capped cases are recreated with a 200-action bound and reported separately; remaining capped ships at an edge receive an explicit native withdrawal probe. Deaths, withdrawals and bounds are measured outcomes; illegal resources, actor overlap, incorrect turn accounting, invalid current-format snapshots, runtime errors or changed save/load continuation fail the audit. Snapshots are validated every ten actions and at endings; seed-multiple-of-three cases also import at action twelve if still fighting. The paired runs compare identical seeds with and without that import, retaining RNG rather than resetting it at load.

Use `--smoke` for a small controller check. `--seeds 1` through `--seeds 32` changes the single-enemy sample, and `--cap 10` through `--cap 200` changes its bound. Optional exact filters are `--hull LIGHT_SCOUT`, `--threat sniper`, `--env nebula`, `--policy mixed` and `--family single` (or `fleet`/`chain`). The chain and resume bounds stay fixed at 90. Smoke takes the first twelve selected singles and first two fleets/chains; it is intentionally not a balanced subset.

Output is ignored `qa/artifacts/combat-integration.json` (`combat-integration-smoke.json` for smoke), including version/build hash, setup seed, policies, results, event totals, final conditions, recent traces, extended caps and replay comparisons. `PROSPECTOR_QA_OUTPUT` selects another directory. The recorded results and remaining balance questions are in the [November 11 integration report](../docs/combat-integration-audit-2026-11-11.md). Small seeded samples and these two simple pilots do not establish optimal play, whole-career affordability, the difficulty curve or human enjoyment.
