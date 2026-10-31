# Development changelog

This is the ongoing record of meaningful changes to Prospector II. Newest work comes first. Entries distinguish implemented behavior from planned work and record the reason, validation, save impact and remaining limits. Git history contains the exact file changes.

The experimental entries below were backfilled on October 31, 2026 from commits and the existing development notes. Historical validation describes checks recorded for those changes; it does not imply every old version was rerun during the backfill. Earlier development remains in [the historical changelog](Changelog%20Prospector%20II.txt) and Git history.

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
- Saves: older research data retains legacy compatibility; new contracts require matching provenance. Remaining: full career costs, recovery, combat readiness and pacing. Details: [career-loop polish](docs/development-pass.md).

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
- Earlier changes: [historical changelog](Changelog%20Prospector%20II.txt), [branch history](docs/branch-history.md) and Git history. GitHub Pages follows main; selecting another GitHub branch does not change the hosted game.
