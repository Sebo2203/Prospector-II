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

## 2026-11-08 — difficulty philosophy and experimental.73 publication

Branch: `experiment/expedition-legacy`; publication requested by the user.

- Added `docs/design-philosophy.md` as the governing difficulty direction: hard roguelike, common early death from accidents/monsters/pirates/environments/bad luck, temporary relief from earned progress, and intended escalation with run age regardless of player readiness. Consistently outrunning the curve should require exceptional cunning. Distinguished legitimate lethal outcomes from broken controls, save corruption and state defects.
- Linked the philosophy from contributor instructions, the documentation index, player introduction and roadmap. Revised the planned Titan's discovery-gated clock so future crisis design agrees with independent run-age pressure. Clearly marked full escalation as future work; the reporting calendar remains cosmetic.
- Publishes the accumulated experimental.63–73 source, generated standalone HTML, guides and portable QA from this chat to the active experimental branch. Main/public release and Windows executable are outside this publication. Local review copies, generated QA artifacts and dependencies remain ignored.
- Updated the combat-feedback regression check to assert the requested bottom-anchored enemy details instead of their obsolete top position; gameplay rendering is unchanged by that test correction.
- Validation: `npm run build` and all 77 repository tests passed; all 33 headless browser suites passed across the initial run and resumed remaining suites after correcting that stale layout assertion. Three bounded smoke careers (scout, freighter, corvette; 80 actions each) completed without JavaScript errors. These are automated scenario checks, not whole-career human playtesting or evidence of final difficulty balance. Prior per-change evidence and limits remain below. Documentation-only philosophy changes do not bump the game version, which remains experimental.73.
- Saves: no additional schema or gameplay change from the philosophy document. Remaining: implement and balance the complete run-age escalation curve through the roadmap; human whole-career playtesting remains outstanding.

## 2026-11-08 — 0.28 experimental.73 restore rare nebula encounters

Branch: `experiment/expedition-legacy`; local review candidate only.

- Fixed manual initiation: gas entities were omitted from the shared F-target roster. They now use the same natural-entity detection radius as their marker (sensors + 2), enter combat directly and do not invoke civilian confirmation/reputation penalties. Nearest/Examine selection and context controls share that target.
- Fixed automatic early encounters: visible monsters previously had all AI disabled until turn 300. Removed that gate so living threats can pursue/engulf immediately. Kept nebula confinement, six-sector prey detection, disengagement grace and safe-space exclusions, and made debug ship invisibility suppress pursuit/engulf as intended. Natural ram behavior, tactical mobility and crystal rewards are unchanged.
- Greatly reduced fresh-generation spawn rates per connected cluster: massive 100% → 12%, expansive 35% → 4%, ordinary 8% → 1%. Removed the guaranteed massive-nebula spawn; at most one entity per cluster. Existing saved populations are not silently deleted or rerolled.
- Validation: rebuilt HTML and all 77 repository tests passed, with new early pursuit, manual targeting, guard and rarity coverage. Four headless Edge suites passed: nebula encounters, attack confirmation, combat UI and palette. The tactical monster screenshot was inspected. Actual gameplay scenarios verified manual and early automatic encounters, natural ram damage, no exhaust, safe-space/grace/blind-player behavior and crystal reward without pirate bounty. Reproducible generation over the same 40 seeds produced 23 entities under new rates versus 216 under old rates (fixture-assisted sample, not a universal density guarantee). Human full-career balance remains unverified.
- Saves: no schema change or migration. Encounter fixes apply to existing entities; rarer generation requires a fresh galaxy. Existing interactive gas playground factories are retained and exercised. Unique standalone HTML delivered in chat; no GitHub upload or Windows executable build.

## 2026-11-08 — 0.28 experimental.72 restore manual galaxy attacks

Branch: `experiment/expedition-legacy`; local review candidate only.

- Replaced experimental.69's native browser confirmation with an in-game canvas prompt. Embedded browsers can suppress native dialogs, silently cancelling civilian attacks. Explicit Attack [Y], Cancel [N] and Escape now work without browser dialogs. Opening/cancelling is free and blocks movement, inspection and world cursor controls; acceptance revalidates the current career and target.
- Unified F/context targeting: manually engage the nearest detected, charted live ship within sensor range, or the ship selected in Examine. This replaces same-tile-only pirates and the one-tile civilian limit. Raiders remain immediate; forced interceptions are unchanged. Fire is handled before movement remaps/Examine; repeated galaxy keydown cannot approve or fire an attack. Unavailable locks report why no target can be engaged.
- Preserved pirate-base Fire fallback and removed stale context references. Existing pursuit fixtures now explicitly approve their intended civilian attack.
- Validation: all 73 repository tests passed and the rebuilt HTML check passed. New headless confirmation/targeting scenarios pass with window.confirm deliberately disabled, including cancel invariance, pointer/keyboard acceptance, nearby pirates/civilians, examined targets, binding conflicts, sensor limits, dead/stale targets, compass blocking and base controls. Five headless Edge suites passed: attack confirmation, ship pursuit, ship combat, interface and combat UI. Inspected the in-game prompt screenshot. Human testing in the user's embedded browser remains outstanding.
- Saves: no schema change; confirmation state is transient and never saved. Unique standalone HTML delivered in chat; no GitHub upload or Windows executable build.

## 2026-11-08 — 0.28 experimental.71 orbital landing-site presentation

Branch: `experiment/expedition-legacy`; local review candidate only.

- Orbital scans now draw only the underlying terrain at the saved landing site, including on previously visited planets. Removed the visit-dependent player-ship sprite/ASCII marker, which incorrectly made the ship appear left behind after liftoff. Landing coordinates and stored surface tiles remain unchanged.
- Validation: rebuilt HTML and all 73 repository tests passed. Two headless Edge suites passed: new scan-landing scenarios and existing station/terrain rendering checks. Covered initial scan, land/liftoff/revisit, sprite and ASCII modes, render state invariance, save/reload, landing at the remembered spot and moving to a new one. Inspected the returning-scan screenshot. Human playtesting remains outstanding.
- Saves: no schema or gameplay change. Unique standalone HTML delivered in chat; no GitHub upload or Windows executable build.

## 2026-11-07 — 0.28 experimental.70 parallel calendar reporting

Branch: `experiment/expedition-legacy`; local review candidate only.

- Added a saved reporting calendar alongside the unchanged turn simulation. Galaxy turns record 1 hour, surface/interior exploration 5 minutes, orbital actions 10 minutes, combat actions 1 minute, field repair attempts 15 minutes and casino events 30 minutes. Explicit station docking/transit/services record time without adding gameplay turns. Menus, inspection and failed checks remain free. See the current [rates and limits](docs/time-reporting.md).
- HUD retains TURN and adds ELAPSED. Planet LOCAL time maps the existing daylight cycle to a 24-hour solar dial rather than changing lighting progression. Fixed-light/interior environments retain appropriate existing indicators. No gameplay reads the reporting clock: resource costs, NPC responses, statuses, rescue/mission timers, reloads and daylight remain turn-based.
- Added elapsed/location totals to records and endings, plus combat/field-repair totals to retirement. Standard days are 24 hours and reporting months 30 days. Saved location/activity sums are validated before loading. Existing careers do not receive invented historical durations; use a new career for full-career totals.
- Validation: rebuilt HTML and all 73 repository tests passed, including four new calendar rules tests. Nine affected headless Edge suites passed: calendar, turns, combat speed, improvised repair, interface, LOG, autosave, ship systems and hangar systems. Final calendar and persistence/repair checks include tactical waiting in combat totals. Deterministic off/on comparison confirmed identical serialized gameplay state apart from the reporting clock. HUD at two sizes and retirement/death screenshots were inspected. Human pacing/readability playtesting remains outstanding.
- Saves: schema 2 unchanged, new optional validated reporting state. No migration or timer conversion. No GitHub upload or Windows executable build; unique standalone HTML delivered in chat.

## 2026-11-07 — 0.28 experimental.69 confirm civilian attacks

Branch: `experiment/expedition-legacy`; local review candidate only.

- Player-initiated attacks on station patrols and unarmed civilian vessels now ask “Do you REALLY want to attack” and name the target/reputation risk. Cancelling does not spend a turn, harm reputation or change hostility/flight state. Keyboard and pointer fire share the same guard. Raiders, other armed civilians and automatic hostile interception retain existing behavior.
- Recorded a proposed elapsed-calendar/activity-time design in the roadmap for discussion. Time rules, turn costs, timers and retirement reports are unchanged in this build; the proposal is not described as implemented.
- Validation: rebuilt HTML and all 69 repository tests passed. Three headless Edge suites passed: attack confirmation, ship pursuit and interface, covering free cancellation, pointer/keyboard acceptance, raiders and forced defense; human playtesting remains outstanding.
- Saves: no schema or state change; confirmation is a transient native browser dialog. Unique standalone HTML delivered in chat; no GitHub upload or Windows executable build.

## 2026-11-07 — 0.28 experimental.68 full-height comms history

Branch: `experiment/expedition-legacy`; local review candidate only.

- Removed the fixed 18-message sidebar and 12-message crew-dialogue limits. Comms fills the remaining sidebar height; wrapped rows retain their natural height rather than shrinking into overlapping/clipped lines.
- Uses an initial 80-message rendering window with older pages loaded on upward scrolling. Saved messages are not discarded. New traffic follows the bottom only when already viewing the newest messages; otherwise a scaled visual entry anchor preserves the reader's place. History paging does not advance time or save UI state, and a fresh career resets it. Archive-only entries remain in the dedicated LOG tab.
- Validation: rebuilt HTML, all 69 repository tests and four headless Edge suites passed (comms log, interface, LOG and combat UI), including both themes at 1400×720 and 1000×620, all 240 historical messages, multiline rows, reading position during new messages, latest following and career reset. Screenshots were inspected. Human playtesting remains outstanding.
- Saves: no schema change or migration; existing log history retained. Unique standalone review HTML delivered in chat; no GitHub upload or Windows executable build.

## 2026-11-07 — 0.28 experimental.67 ship salvage and station bounties

Branch: `experiment/expedition-legacy`; local review candidate only.

- Replaced money-only pirate salvage and empty civilian wreck rewards with role-weighted nothing/credits/equipment/cargo tables. Freighters favor bulk goods, researchers instruments/supplies, traders money/trade goods, patrols and guards crew equipment, and roamers stolen cargo. Reuses runtime shop and commodity catalogs, excluding quest items and installed ship weapons. Civilian reputation consequences remain.
- Pirate kills retain their 50–149 cr bounty but now defer it to accessible major BASE docking; pirate cash salvage joins the claim. Docking settles once before payroll. Pending claims appear in Active Missions and LOG records and survive saves. Civilian cash is immediate. Pirate-base bonuses and gas-entity rewards are unchanged.
- Overflow cargo remains at encounter coordinates using existing persistent cargo drops, with generic item labels, cargo markers and one-unit recovery. Full holds no longer block docking at a station under a drop. Dead civilian markers no longer hide salvage from Examine. Per-ship resolution guards prevent repeat rewards; replacement patrols receive fresh eligibility.
- Validation: build and all 69 repository tests passed; deterministic tables cover each role/outcome, real catalog items, duplicate prevention, deferred cash and overflow recovery. Seven headless Edge suites passed: ship rewards, ship combat, combat UI, missions, pursuit, autosave and career. Scenarios verify actual kills, pending records, saved claims/drops, single settlement, malformed-claim rejection, full-hold docking and patrol replacement; final rewards/autosave/career checks include payment before payroll. Human economic/career balance remains unverified; weights and amounts are initial choices.
- Saves: schema 2 unchanged; new pending-claim totals are validated when present. No migration or retroactive bounties. Existing roster/drop serialization preserves flags and cargo. New uniquely named standalone HTML delivered in chat; no GitHub upload or Windows executable build.

## 2026-11-07 — 0.28 experimental.66 shorter repair label

Branch: `experiment/expedition-legacy`; local review candidate only.

- Shortened the ship-system action to “Attempt improvised repair” and updated its existing browser scenarios and current guide. Skill checks, costs, repair outcomes and reactor power rules are unchanged.
- Validation: rebuilt HTML, all 65 repository tests and the headless Edge improvised-repair scenario passed. Reactor explanation checked against actual output, core thresholds, shield capacity, mount allocation, cooling and stranded life-support code. Human playtesting remains outstanding.
- Saves: no schema or gameplay change. Deliver a new standalone HTML in chat; no GitHub upload or Windows executable build.

## 2026-11-07 — 0.28 experimental.65 improvised repair checks

Branch: `experiment/expedition-legacy`; local review candidate only.

- Removed the impossible fuel-tank improvised action and the explanatory bypass hint. Replaced ship-system bypass labels, countdown text and relevant flight warnings with improvised repair terminology. The action is now “Try to do an improvised repair.” Quarantine life-support rewiring is a separate mechanic and is unchanged.
- Replaced guaranteed temporary support with an engineering check by the strongest living engineer: success 25% + 7 points per effective skill, capped at 95%. Skill 0 has a 25% botch band and skill 1 a 15% band, causing 5–10 additional core damage; other failed rolls leave integrity unchanged. Skill 2+ failures cannot worsen damage. Each valid outcome costs one turn, no kit, and gives the normal combat/NPC response. Success earns 2 XP; failed/botched work earns 1 after the check.
- Success retains 15-career-turn temporary support without healing physical integrity (14 turns after installation). Kit/station repair limits and prices are unchanged. Added deterministic boundary/guard/performer tests and portable browser coverage for real outcomes, controls, persistence and menu fit.
- Validation: root build and all 65 repository tests passed. Five headless Edge suites passed: improvised repair, ship systems, hangar systems, disengagement and combat UI. Checked mouse/keyboard success, failure and botched work, exact combat action costs, saved temporary support, omitted fuel-tank action and hint, and screenshots at 1400×720 and 1000×620. Human balance/playtesting remains outstanding. The skill probabilities are an initial balance choice.
- Saves: schema unchanged; the existing internal temporary-support deadline field is retained. No migration. Deliver a unique standalone HTML in chat; no GitHub upload or Windows executable build.

## 2026-11-07 — 0.28 experimental.64 failed disengagement

Branch: `experiment/expedition-legacy`; local review candidate only.

- Player and NPC edge escape attempts now share a 25% failure chance. Failed attempts reposition the player and all remaining opponents to their original arena starts, clear exhaust and movement credit, and preserve damage, equipment, resources, deadlines and galaxy identities/positions. Dead and escaped ships stay out. This replaces guaranteed escape on an otherwise eligible attempt.
- Failed player attempts retain normal return fire and cost one career turn/local round. Failed NPC attempts stop the NPC phase without extra actions or clock ticks. No-safe-route NPCs cannot roll. Existing successful escape consequences remain.
- The Disengage button shows the failure chance. Bypass help now explains the damage threshold and temporary integrity support; bypass rules are unchanged. Updated current guides and portable QA registration.
- Validation: root build, all 62 repository tests and seven headless Edge suites passed (disengagement, ship combat, pursuit, tactical speed, combat UI, hangar systems and ship systems); deterministic headless checks cover both failure paths, success boundary, resource/deadline preservation, save/load, blocked exits, no revival and bypass guards. Human combat balance/playtesting remains outstanding; 25% is an initial balance choice.
- Saves: no schema change or migration; existing encounter spawn positions are deterministic. Deliver a new versioned standalone HTML in chat; no GitHub upload or Windows executable build.

## 2026-11-07 — 0.28 experimental.63 local review candidate

Branch: `experiment/expedition-legacy`; delivered locally, not published.

- Packages this chat's combat presentation changes: mounts below the arena, player status at the top-right and enemy details anchored to the bottom-right with flexible space between them. The intermediate mounts-under-player layout is superseded.
- Changed delivery to a unique, versioned standalone HTML file linked in chat, matching the previous chat's file delivery. Added ignored `outputs/` and recorded the workflow in the handoff guide. No GitHub upload or Windows executable build.
- Validation: rebuilt HTML, all 62 repository tests passed and the delivered file SHA-256 matches generated `index.html`. The UI/space scenarios and two-size screenshot inspection passed before this version-only packaging step. Opening the delivered file in the user's browser remains to be confirmed.
- Saves: schema and gameplay unchanged.

## 2026-11-07 — Place combat mounts below the arena

Branch: `experiment/expedition-legacy`; version unchanged (presentation only).

- Replaced the preceding vertical mount arrangement with horizontal selectable cards in the empty strip below the combat map. Mount readiness, damage/range/heat and selected-mount peak heat/reload remain visible.
- Kept player status at the top of the right panel and anchored enemy details to its bottom. Wrapped names, shields and weapon details expand upward into the flexible middle gap.
- Saves: no format or gameplay changes.
- Validation: rebuilt the HTML; all 62 repository tests and headless Edge combat UI/space scenarios passed. Checked bottom anchoring, the flexible gap, three selectable mount cards, ASCII and scaled rendering; inspected screenshots at 1400×720 and 1000×620. Human playtesting remains outstanding.

## 2026-11-07 — Group player mounts under the player ship

Branch: `experiment/expedition-legacy`; version unchanged (presentation only).

- Moved the weapon-mount list and selected-mount heat/reload detail directly below YOUR SHIP status. Selected enemy information follows the complete player section so it no longer separates the ship from its weapons.
- Saves: no format or gameplay changes.
- Validation: rebuilt the HTML; all 62 repository tests and the headless Edge combat UI suite passed, including section order and the damaged three-mount layout at 1400×720 and 1000×620. Inspected the crowded-layout screenshot. Human playtesting remains outstanding.

## 2026-11-07 — 0.28 experimental.62 applies engine pace to tactical movement

Released on `experiment/expedition-legacy`.

- Merchant Vessel / Free Trader and Survey Vessel / Research Ship default engines are now rating 2. Cargo remains 1 and Station Patrol 3. Centralized these defaults so fresh generation and neutral initialization agree; explicit individual fittings remain authoritative.
- Applied the galaxy pursuit engine ratio to tactical NPC movement through one shared budget kernel and separate arena fractions. Equal engines move one tile per player action; faster opponents can move several tiles and slower ones bank fractional movement. Normal player movement remains one tile and Boost two. The readout exposes player engine and target engine/mobility plus its movement ratio. Natural entities use authored mobility and retain their ram cadence and lack of exhaust.
- Each NPC substep checks collision, cover, plasma, core damage and escape, adds movement heat and lays exhaust. Actors stop on reaching clear firing range and do not receive a free attack. Drive/sensor damage can interrupt remaining steps. Firing or holding range clears movement credit, preventing stockpiled bursts. The player's engine reference is captured once per NPC phase; an early enemy critical changes the next phase's pace rather than giving later actors inconsistent allowances.
- Kept one global turn, reload/cooling/shield/status tick and at most one NPC attack per committed action. Fractional movement survives save/load and invalid saved banks are rejected transactionally. Fixed near-integer floating-point loss in the shared ratio, including the 3/5 cycle.
- Consequences: engine investment now affects interception, disengagement and range control alongside existing evasion and exhaust effects. Slow hulls are under more pressure from fast ships; Boost, weapon reach and cover become more valuable. More movement creates more exhaust and movement heat. These are intended tradeoffs, not a claim of completed balance.
- Validation: all 62 repository tests and 25 headless Edge suites passed. New deterministic/native coverage checks role defaults, 1:3/3:1/equal/3:5 movement, separate banks, exact fractions, save continuity/rejection, per-step cover/exhaust/heat/criticals, no extra shots or clock ticks, no reload stockpile and consistent player pace across a multi-enemy phase. A waiting-player test measured a rating-2 trader escaping seven tiles in 4, 7, 11 and 18 turns against player engines 1, 2, 3 and 5. Existing combat, repairs, pursuit, save, rescue and career checks passed; crowded readouts were inspected. Whole-career balance and human tactical playtesting remain necessary.
- Saves: schema 2 unchanged; no migration added. New arena actors record a movement fraction. Existing instantiated ships retain their fitted engine ratings; new/default traders and scientists receive rating 2. Damage, reload duration, weapon rate of fire, ordinary action costs and galaxy patrol/rescue step rates are unchanged. [Tactical movement and tradeoffs](docs/experiment.md#tactical-ship-combat), [shared movement boundary](docs/architecture.md#galaxy-ship-movement-and-tactical-exits)

## 2026-11-07 — 0.28 experimental.61 connects civilian escape and weapon readiness

Released on `experiment/expedition-legacy`.

- Unarmed tactical escape now moves the authoritative NPC ship one adjacent safe galaxy sector before marking it escaped. The player is not displaced. Exits prefer cardinal neighbours, fall back to a safe diagonal at obstructed corners, avoid the player, black holes, pulsars and occupied sectors, and refuse escape if every adjacent sector is blocked. Damage, identity and the existing disengagement grace remain on the ship.
- Shared the pirate fractional engine-ratio movement budget with unarmed civilian ships near the player and during flight. Equal engines trade one step for one; slow ships bank fractional movement and fast ships can open a gap. Distant roaming retains the two-step cap, and damaged engines affect movement. Removed science ships' alternating-turn movement gate. Attacked unarmed ships flee using current or last known threat position until clear of the ten-sector interaction radius, and cannot volunteer to rescue their attacker. Existing patrol and active rescue step rates are preserved; tactical movement allowances are unchanged.
- Added cyclic weapon fallback using complete target readiness: reload, heat, power, sensor lock, range and cover. An already-ready current mount stays selected; otherwise the next genuinely fireable mount is selected at engagement, target/selection changes, turn synchronization and fire attempts. One action still fires one mount, and existing reload deadlines remain unchanged.
- Failed reload attempts now name the weapon and explain that it is still reloading, how many turns remain, and that moving or waiting advances it. Multiple-mount refusals also explain that no alternate can fire at the target. Compact readouts retain Reload in 2t. Refusal and auto-selection consume no turn.
- Validation: all 60 repository tests and 24 headless Edge suites passed. New rule coverage checks fractional/equal/faster/disabled engine budgets, ordinary and fleeing science movement, and safe escape candidates. The new native pursuit scenario covers actual escape/catch-up, identity and save/load continuity, fractional-bank persistence, safe corner exits, sequential alternate-mount firing, unchanged reload deadlines, explicit no-cost refusal and rejected out-of-range/unpowered fallback. Existing combat scenarios were adjusted to test blocked fire only when no alternate can fire. Full rescue, trade, career and persistence checks passed. These checks do not establish whole-career balance.
- Saves: schema 2 unchanged; no migration added. NPC coordinates, movement bank and fleeing/last-threat data use the existing career snapshot. Weapon damage, heat costs, reload durations, shot sounds and tactical NPC speed are unchanged. [Civilian flight](docs/experiment.md#civilian-flight-and-pursuit), [combat controls](docs/experiment.md#tactical-ship-combat)

## 2026-11-07 — 0.28 experimental.60 adds distinct combat shot feedback

Released on `experiment/expedition-legacy`.

- Removed the nearby-plasma footer and SELECTED TARGET heading at the user's request. Target names retain their previous vertical spacing below the player section. Remaining reloads read Reload in 2t across combat status/context text; the redundant static duration footer now shows an actual countdown only while reloading.
- Replaced rectangle asteroids with four shaded original Prospector rock/debris sprites from the retained space atlas. Existing matte cleanup gives them clean transparent edges; native pixel scale and ASCII rock symbols remain. Position-based variants consume no random rolls.
- Removed the permanent dotted hit/aim line. Shots show a fast 110ms travelling projectile and short impact flash, with impact-only feedback for natural rams and reduced-motion preferences. Plasma remains separate original sprites.
- Added distinct synthesized outgoing-hit confirmation and incoming shield/hull/core cues. Actual core integrity changes select the heavier critical cue. An ephemeral queue separates projectile/impact feedback in attack order, including multiple attackers, and cancels on career/menu/encounter changes. Rules and logs resolve on the original turn; playback adds no time or damage and is not serialized. Rapid repeated input bounds pending presentation to twelve events.
- Validation: all 57 repository tests and 23 headless Edge suites passed. New coverage verifies real outgoing/hull/core outcomes and ordered cue timing, animation strokes, no idle dotted line/footer/target heading, preserved spacing, reload labels, reduced-motion behavior, menu cancellation and unchanged turn/damage state. Asset checks verify four distinct asteroid imports with clean edges and reproducibility. Existing combat, controls, repairs, log, save/load and world scenarios passed; screenshots were inspected. Cue scheduling and synthesis calls were tested; subjective sound balance and aesthetic approval require human playtesting.
- Saves: schema 2 unchanged, no migration added. Heat, reload deadlines, sensors, exhaust strength/lifetime, core damage rolls, action costs and NPC speed are unchanged. [Combat presentation and controls](docs/experiment.md#tactical-ship-combat), [feedback boundary](docs/architecture.md#tactical-audiovisual-feedback)

## 2026-11-07 — 0.28 experimental.59 simplifies combat readouts and menu access

Released on `experiment/expedition-legacy`.

- Removed the duplicate player hull row/bar from the combat panel; the left hull gauge remains its display. Selected targets now have proportional hull and fitted-shield bars with numeric values and shield state. Unfitted shields remain absent and crowded three-mount layouts still fit.
- Escape and the top-left ESC button now use the normal transactional save-and-return-to-main-menu action during combat. Continue restores the same encounter without advancing time, disengaging or triggering enemy actions. This replaces combat's Escape-only movement/disengagement hint; actual withdrawal remains R at the arena edge.
- Player weapon hits are green and player misses muted gray. Enemy hits are red and enemy misses yellow, including natural ram results. The same classes persist into saved LOG history; player hits on pirate bases also use green. Added a neutral gray log class without changing unrelated messages.
- Reversed experimental.58's connecting exhaust glow. Original plasma sprites, fading, hazard information, strength and expiry remain; new segments no longer store unused direction fields.
- Validation: all 56 repository tests and six affected headless Edge suites passed. Scenarios verify actual sidebar colors after real hit/miss actions, accurate half-full target bars, omitted player hull duplication, keyboard and HUD Escape/menu/Continue preserving encounter state and result classes, sprite-only exhaust, scaled/ASCII presentation, crowded readouts, combat rules, shared menu routing, log and autosave behavior. Screenshots were inspected; aesthetic preference still needs the user's playtest.
- Saves: schema 2 unchanged; no migration added. Damage, shields, heat, reloads, trail damage/lifetime, movement and NPC speed are unchanged. [Combat controls and presentation](docs/experiment.md#tactical-ship-combat)

## 2026-11-07 — 0.28 experimental.58 gives tactical combat an empty-space presentation

Released on `experiment/expedition-legacy`.

- Removed the combat grid, tiled weapon-range shading, rectangular fog fills and colored ship-cell backgrounds. The arena now uses continuous dark space with sparse fixed stars and selected-target corner brackets. Targeting readiness and the arena's disengagement boundary remain visible.
- Clarified the reported range discrepancy: the former lit area was selected-weapon reach with clear firing lanes, not sensors. The readout now states actual sensor range separately from mount range. Ships and live exhaust use one shared current-sensor predicate; charted asteroid positions remain known. Sensor formulas, weapon reach and target rules are unchanged.
- Replaced numeric exhaust cells with the original Prospector R197 plasma sprites, imported from its retained unmodified space atlas with original credits/notice. Exact magenta becomes alpha; other source pixels are preserved. Existing damage and expiry determine the fade sprite; movement direction supports connecting glow. Nearby damage/lifetime values remain available without hover in a directional summary, including the boost destination. ASCII uses warm exhaust symbols.
- Validation: all 56 repository tests and 22 headless Edge suites passed. The new source-asset test verifies atlas hash, pixel identity/transparency and reproducibility. The combat-space scenario covers absence of tiled fills, contact/exhaust culling after sensor damage despite chart history, original fade sprites, hazard information, no rendering RNG or state changes, and sprite/ASCII presentation at two window sizes. Existing combat, core, repair, save/load and gameplay scenarios passed; screenshots were inspected. Human aesthetic approval and combat balance remain playtest work.
- Saves: schema 2 unchanged. New trail segments record direction for presentation; no migration was added. Hull/core damage, exhaust strength/lifetime, heat, reloads, turn costs and NPC speed are unchanged. [Original art and reproduction](docs/art-direction.md#tactical-space-and-original-plasma-art)

## 2026-11-07 — 0.28 experimental.57 integrates Ship Systems into its parent menus

Released on `experiment/expedition-legacy`.

- Replaced the separate browser Ship Systems dialog with an in-canvas page. Hangar inspection uses its blue station heading, dark action rows, selection marker and Back control. I → SHIP inspection retains the actual inventory tabs and yellow selection; Back returns to the ship overview. F3 from flight/combat opens the same detail content without changing gameplay mode.
- Select a core to see integrity, effective performance, active bypass duration and applicable repairs. Repairs have visible costs or unavailability reasons. Heat, power, repair kits, mounts and utility equipment remain on the page. Unfitted shields remain absent, and ship-overview core cards remain passive. Removed the old native dialog markup and its separate CSS.
- Mouse and keyboard share the existing repair action. Up/Down selects a core; Left/Right or Tab selects a repair; Enter applies it; Escape goes back. Held activation cannot repeat a repair. The compass and gameplay keys cannot advance the world while inspecting. Focused context controls and other overlays retain their own input handling.
- Validation: all 55 repository tests and all 21 headless Edge suites passed. Affected scenarios cover both UI themes and multiple window sizes, parent navigation, held keys, mouse/context/F3 entry, field and station repairs, combat continuity and blocked world controls. The supplied Hangar save also passed through real file import without modification. Screenshots were inspected; human readability preference still needs the user's playtest.
- Saves: no schema change; menu selection is not persisted. Repair amounts, credit/kit/turn costs, combat rules and equipment fitting are unchanged. [Equipment and controls](docs/experiment.md#mounts-core-systems-and-damage)

## 2026-11-07 — 0.28 experimental.56 fixes Hangar keyboard activation

Released on `experiment/expedition-legacy`.

- Reproduced the reported Core Systems failure using the supplied save and a fresh career. Pressing Enter on the Hangar action opened the native modal, then the same key's browser default action clicked its newly focused Close button. Station activation now consumes Enter/Space before dispatch, so the board remains open. Repeated activation keys cannot repeatedly trigger its native buttons; separate intentional button presses, Tab and Escape still work.
- Recorded the user's standing policy in `AGENTS.md`, the architecture guide and autosave guide: backward save compatibility is not a requirement, and migrations/compatibility shims must not be added unless explicitly requested. Removed the conflicting instructions to preserve save shape and legacy-read compatibility. Current-format validation, transactional integrity and preserving an active career on failed load remain required.
- Validation: all 55 repository tests and five affected headless Edge suites passed. The new Hangar scenario uses real keyboard, held-key, canvas click, context-button and F3 paths, verifies deliberate modal activation and paid repair, and optionally imports a supplied save through the real file picker. The supplied save passed without modification. Personal saves and generated screenshots are excluded from commits.
- This fix changes keyboard handling, not the save format or game rules. [Save compatibility policy](docs/architecture.md#save-compatibility-policy)

## 2026-11-07 — 0.28 experimental.55 unifies combat information and controls

Released on `experiment/expedition-legacy`.

- Deleted the separate combat log panel and its font controls. Engagements, attacks, component damage, surrender warnings and results now use the normal sidebar and saved LOG history; combat history is categorized explicitly. Attack messages precede their damage/kill outcomes, and victory messages are recorded once. The normal sidebar size controls and +/− keys also work during combat.
- Reorganized the combat readout around hull, fitted shields, heat, selected target and weapon readiness. Unfitted generators have no shield/recharge display, including in the detailed inspector. Installed shields distinguish full, delayed, recharging, damaged, failed, unpowered and heat-limited conditions. Healthy reactor/sensor data is quieter; failures remain visible. Unarmed ships and natural ram attackers have appropriate descriptions.
- Replaced abbreviated heat/range labels with readable damage/range/heat information and selected-shot peak heat/reload duration. Fire, Boost and pre-edge Disengage controls show unavailability before the player tries them; Fire/Boost reuse actual action guards. Clear firing lanes are shaded, and the target line agrees with full shot readiness rather than range/cover alone.
- Removed duplicate context controls when an explicit menu button already carries the same shortcut, including cargo examination and Close. Core readouts remain passive and inspection stays on its static button. The generic F3 context button is now combat-only, including removal planetside and in orbit. Keyboard shortcuts remain available.
- Removed the top TACTICAL COMBAT title, top hint strip and repeated bottom control hints. The arena and readout move up into that space; the HUD identifies the view and the collapsed Shortcuts panel provides combat-specific reference using the configured wait key.
- Validation: all 55 repository tests and 20 headless Edge suites passed, with affected scenarios rerun after the final header removal. The new combat UI scenario covers shield states/absence, matching action/aim readiness, shared history and save/load, old local-log recovery, single victory recording, natural/unarmed targets, static-menu deduplication, shortcut reference and crowded three-mount layouts at two window sizes. These validate rules and presentation, not human readability approval or combat balance.
- Saves: career schema 2 stays compatible with experimental.52–54. Matching old combat log entries retain their original turns when made visible in the sidebar. Movement allowance, NPC speed, engine effects, reloads and combat costs are unchanged; speed design remains a separate task.

## 2026-11-07 — 0.28 experimental.54 removes redundant ship controls

Released on `experiment/expedition-legacy`.

- Unfitted shields leave a blank core slot in the ship overview. Fitted generators continue to show their actual integrity and charge.
- Core overview cards are passive readouts with no click action, hover tooltip or pointer cursor. The static **Inspect / repair [F3]** button opens the existing board; the global F3 shortcut still works.
- Removed the duplicate F3 context button from galaxy and inventory views, and removed Jettison/Confirm jettison from the context bar. The ship menu retains its static jettison/confirmation control and the J shortcut. Other context views retain their systems access.
- Validation: all 55 repository tests and affected browser scenarios passed, including blank/fitted shield rendering, passive card clicks/cursor, static inspection and F3, context cleanup, stranded inventory repair, layout and existing menu/combat behavior. Equipment rules and career schema 2 are unchanged; experimental.52–53 saves remain supported.

## 2026-11-07 — 0.28 experimental.53 exposes ship systems throughout play

Released on `experiment/expedition-legacy`.

- Fixed incomplete equipment UI integration from experimental.52: the F3 shortcut already worked outside combat, but the context button appeared only during combat/stranding. Ordinary play now shows the same muted **Ship systems [F3]** control, including the ship inventory tab.
- Added all six core integrity/effective readouts directly to **I → SHIP**, alongside weapon mounts and utility slots. Click a core or **Inspect / repair [F3]** to open the existing board; F3 and keyboard activation of the context button invoke the same action. Inspection stays free, and closing the board preserves the inventory tab.
- Fixed the stranded overlay covering inventory and clearing its pointer hit areas. An engineer can now use the actual ship-inventory core controls to bypass a disabled drive while stranded. Shortened the ellipsis limit on long context labels to keep the extra action within the existing wrapped layout; full action text remains available in the button title.
- Validation: all **55 repository tests** and the affected headless Edge scenarios passed, including native galaxy/orbit access, I → SHIP mouse and keyboard paths, all six core cards at two window sizes, free inspection, actual repair while stranded, and existing context wrapping/menu input. This is a UI/access correction; equipment rules and career schema 2 are unchanged, so experimental.52 saves remain supported.

## 2026-11-07 — 0.28 experimental.52 gives tactical ships persistent equipment

Released on `experiment/expedition-legacy`.

- Expanded the existing weapon slots into hull-specific light/medium/heavy mounts and a reactor fitting budget. Core services and shields reserve power; damaged reactors leave later mounts offline without deleting equipment. Existing utility module slots remain separate. Added purchasable reactor and cooling grades and explicit fitting failures before credits are charged.
- Gave engines, reactor, shield generator, cooling, sensors and fuel tank independent persistent integrity. Installed ratings stay separate from effective performance. Hull hits can cause component criticals; a living engineer reduces their probability and severity. Shields absorb damage before a critical can occur.
- A rating-one sensor can fail at 75% integrity. Failed sensors preserve known charts while blocking new galaxy reveals, live markers, paid scans, unfamiliar orbital layouts and tactical target locks. NPC sensor failure also stops tracking and firing. At 50% tank integrity, usable capacity becomes half of the installed tank and excess fuel leaks out. Repairs restore capacity without producing fuel.
- Replaced encounter-local shields/reloads and raw multi-gun NPC volleys with shared ship rules: independent absolute reload deadlines, common weapon heat, passive cooling, 20 shield points per grade, a three-turn recharge delay and 3 recharge per turn. Waiting doubles cooling. Boost moves two clear tiles along the ship's heading for 2 fuel and heat. Base attacks also use ready, powered mounts and shield absorption. Heat, shields, reloads and damage survive retreat, re-engagement and saving; each successful action advances one career turn.
- Added the **F3 / Core systems** board, available through ship inventory and the hangar, with direct combat/stranding controls. Engineers spend a kit and one turn to restore up to 85%, or one turn for a 15-turn bypass. Station technicians restore full integrity for credits. Emergency rescue can recover failed propulsion. A disabled engine alone leaves life support stable when fuel and reactor power remain; empty fuel or insufficient reactor power retains the stranded exposure hazard.
- Added real core-damage/rupture/restore debug buttons. The disposable palette uses an explicit 1,000-unit tank and resets test core/readiness state on gallery return. Updated the maintained pilot to read the visible component status, use native repair actions and estimate actual mounted enemy weapons.
- Validation: all **55 repository tests** and **19 headless Edge suites** passed, with affected combat/system scenarios rerun after final display and recovery adjustments. Coverage includes repair/bypass boundaries and expiry, engineer mitigation, blind chart/scan/target behavior, boost costs, fitting, heat/reloads/shields, authoritative NPC state across storage reload, retreat, SOS recovery, debug controls and storage failure recovery. Three bounded native-action careers reached retirement without JavaScript errors: Scout 313 turns / 357 selections / 568 credits; Freighter 402 / 458 / 758; Corvette 416 / 466 / 1,096. These are automated scenarios and short careers, not human combat-balance approval.
- Saves: career schema **2**, requiring a new career; earlier formats are rejected before replacing an active run. No save migration is supplied, as requested. The IndexedDB envelope/storage schema stays unchanged. Artemis ammunition, richer enemy equipment generation, aimed component shots, additional utility combat modules and long-career combat balance remain future work. [Current equipment rules](docs/experiment.md#mounts-core-systems-and-damage)

## 2026-11-07 — 0.28 experimental.51 adds hull type to the HUD

Released on `experiment/expedition-legacy`.

- Added a Hull Type readout immediately to the right of the vessel name. It uses the current ship class and refreshes with the HUD.
- All 47 repository tests and three headless Edge suites passed. The header check covered all three hulls and a long vessel name, alongside the existing menu, scaling and footer checks. The save schema supports experimental.46–50 careers.

## 2026-11-07 — 0.28 experimental.50 adds the Active Missions dropdown

Released on `experiment/expedition-legacy`.

- Added a collapsed Active Missions button below Shortcuts. Its footer panel shows accepted science contracts, discovered Mercy of Dawn rescue work and the mysterious package delivery. General survey records and completed work are excluded.
- Objectives show destination coordinates, specimen totals and remaining counts, recovered data, missing delivery cargo and known passenger progress. Research searches use the reported fix, preserving the hidden ship location. Hidden rescue details stay concealed.
- Progress refreshes during ordinary play. The scrollable panel supports keyboard focus, navigation and Escape. It shares its space with Shortcuts, and the compass, minimap and version remain clear.
- All 47 repository tests and five headless Edge suites passed. The new scenario covers six contract types, updates and completion, knowledge boundaries, keyboard scrolling, actual save/load and footer placement in both UI styles at two window sizes. The save schema supports experimental.46–49 careers.

## 2026-11-07 — 0.28 experimental.49 rearranges the footer and sidebar

Released on `experiment/expedition-legacy`.

- Moved the save indicator above the version in the bottom-left corner. The save text is 10px and the version is 13px. The compass and minimap occupy the bottom-right of the play area.
- Extended the crew and Comms Log sidebar from the HUD to the bottom edge. Context actions, alerts and footer controls fit beside it. Long action labels use an ellipsis, with their complete text retained in the button and available on hover.
- All 47 repository tests and four headless Edge suites passed. Both UI styles were checked at two window sizes, with save failure labels and alerts. The interface checks also covered wrapped actions, a stable orbital map, compass placement, menu navigation and minimap fit. The save schema supports experimental.46–48 careers.

## 2026-11-07 — 0.28 experimental.48 gives encouragement a temporary effect

Released on `experiment/expedition-legacy`.

- Successful encouragement adds +3 to current morale for 30 career turns. The crew's base outlook is preserved. Failed encouragement has no morale effect, and either result starts the existing 40-turn cooldown.
- Dialogue choices show the boost duration and cooldown. The crew morale breakdown shows encouragement as a separate contribution with its remaining turns. Saving and loading preserve the expiry time.
- Eligible later attempts now work within the same conversation, while revisiting a result during cooldown cannot award another boost.
- All 47 repository tests and four headless Edge suites passed. The morale check exercised actual dialogue rolls, cooldown enforcement, save/load, exact expiry, repeat attempts and zero base morale. Earlier permanent gains are already part of saved base outlook. The new rule applies to subsequent attempts and supports experimental.46–47 careers.

## 2026-11-07 — 0.28 experimental.47 toggles the debug menu

Released on `experiment/expedition-legacy`.

- Pressing Shift+B while the debug menu is open now closes it through the normal dismiss action, including from a focused search field. Holding the shortcut does not close the menu immediately after opening.
- All 47 repository tests and three headless Edge suites passed. The regression checks opening, closing, reopening, key repeat, search focus and career preservation. The save schema supports experimental.46 careers.

## 2026-11-07 — 0.28 experimental.46 stabilizes saves, turns and generation

Development on `experiment/expedition-legacy`.

### Career playtests

- All 47 repository tests and all 16 headless Edge suites passed on the final build.
- Three seeded, unassisted short careers reached retirement with no JavaScript errors. The scout retired at turn 313 with 568 credits, the freighter at turn 361 with 476, and the corvette at turn 419 with 896. The same freighter seed had previously ended in destruction.
- A longer scout run targeting 10,000 credits ended in a Dreadnought encounter at turn 3,153 with 1,856 credits. The short retirements establish that all three paths can reach an ending. Profitability, threat pacing and human combat balance remain open.

### Tactical withdrawal

- A successful retreat stops surviving opponents from pursuing or automatically restarting combat for the next five career turns. They keep their hostility and damage, and the player can choose to attack again. This addresses a freighter playtest where a Raider Frigate re-engaged after 13 withdrawals.
- All 47 repository tests and the Edge combat suite passed, including a reload during the pursuit break.

### World generation and morale

- Aquatic civilizations now have a connected basin next to the default landing site. Settlements and locals spawn inside it, and seabed obstacles stay outside that footprint. Surface and underwater views share the civilization's diplomacy state after a reload. Hostile primitive locals now initialize with their own description.
- A base morale of zero remains zero until a real modifier applies. The crew screen uses the same value as the morale rules.
- All 47 repository tests passed. The seeded Edge regression verified reachable inhabitants across 100 native aquatic worlds and all five technology tiers. It also checked diplomacy after reload and morale moving from 0 to 3 and back to 0. Freshly generated planets use the new terrain rules.

### Action timing

- Committed tactical movement, firing, waiting and withdrawal each advance the career clock and crew conditions. Movement and weapon reloads still use tactical rounds, and the arena keeps its own positions.
- Surface fire, gear use, drilling, diving, and waiting use the same daylight, oxygen, crew and hazard rules. A paid orbital scan or casino buy-in ticks crew conditions once. Menu selections and blocked actions are free.
- All 47 repository tests and five headless Edge suites passed. The timing check measured oxygen, daylight, crew status, and scan costs. Tactical, rescue, career, and autosave scenarios also passed. Saves from the first experimental.46 checkpoint use the same schema.

### Career saves

- Career saves use a versioned schema and store IDs for combat opponents, radio merchants, rescuers, crew dialogue actors and active casino contestants. Buying fuel after a reload now updates the merchant's real stock. Crew conversations stay with the selected person when names collide, and combat references survive roster reordering.
- Autosaves and imports share schema and reference validation. Malformed imports leave the active run in place. Start a new career for this version.
- All 47 repository tests and four headless Edge suites passed. They covered the new identity cases, large-world reload, interrupted writes, debug isolation, and Mercy of Dawn persistence.

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
