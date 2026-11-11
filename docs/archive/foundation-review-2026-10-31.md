# Foundation review — October 31, 2026

Status update: experimental.7 addresses the autosave-capacity/failure problem and unifies file/storage compatibility repairs with invalid-import rollback. See the [autosave follow-up](../autosave.md). The review below records the original evidence; combat/dialogue identity, action clocks, generation and morale findings remain open.

Reviewed `experiment/expedition-legacy` at `616d81970e32e225d9c0303a4d7dcc53c87784d5`, version `0.28.0-experimental.6`, against the [roadmap](../roadmap.md). This report describes that historical build. See the roadmap for later fixes and follow-up priorities.

The game has enough working systems to justify developing this codebase further. The modular source layout and single-file distribution are practical. Its foundation needs a focused reliability pass before larger connected stories, sector crises and long careers. File organization is modular; ownership of state, turn progression and persistence is still shared across the game.

The JavaScript source has 108 files and roughly 35,000 lines. Large content/art definition files are not inherently a problem. The more consequential coupling is that keyboard routing, simulation, rendering and saving can all mutate the same global state without a common action boundary.

**Checks performed.** All 31 repository tests and generated-build checks passed. Local headless Edge checks also passed for the 340-sample playground, real gear/cargo/combat interactions, simulation/rebuild/career restoration, log controls, 54 fixture-assisted contract completions across three hulls, and 15 spatial rescue scenarios comprising 858 surface movement steps. Those contract fixtures test transactions and persistence, not 54 complete expeditions. Additional review scenarios used real game functions with controlled state to reproduce the problems below. No gameplay code was changed and no native desktop session was playtested. Pacing, readability and whole-career balance still require human playtesting.

**1. High priority: autosaving can silently stop during a long run.**

[autoSave](https://github.com/Sebo2203/Prospector-II/blob/616d81970e32e225d9c0303a4d7dcc53c87784d5/src/persistence/save-load.js#L15) serializes the complete state to localStorage and suppresses write errors. [renderAll](https://github.com/Sebo2203/Prospector-II/blob/616d81970e32e225d9c0303a4d7dcc53c87784d5/src/rendering/dispatch.js#L4) performs this save even for UI redraws. Generated maps remain in the snapshot.

In one stress scenario, the actual generated galaxy contained 137 non-gas-giant planetary bodies. Generating and scanning their real maps made the snapshot grow from 235,194 characters initially to 5,328,644 after 110 bodies. Edge raised `QuotaExceededError`; the normal autosave call returned silently and the stored turn remained older than the live turn. The exact threshold varies with generated content and browser storage; 110 is an observed scenario, not a guaranteed limit.

This directly threatens the roadmap's long careers and return visits. First make save failure visible and preserve a last-known-good save. Then move large snapshots into storage suitable for their size, with explicit success/failure reporting and recovery. Save after committed actions rather than every redraw. Profile snapshot growth before choosing compression or map-delta formats.

Acceptance: a generated long-career save reloads its latest committed turn; an injected storage failure produces a visible warning and preserves recovery data. Opening inventory or moving a cursor does not repeatedly serialize the world.

**2. High priority: loading can split one entity into multiple independent copies.**

[startShipCombat](https://github.com/Sebo2203/Prospector-II/blob/616d81970e32e225d9c0303a4d7dcc53c87784d5/src/combat/ship.js#L132) stores the pirate object directly in `G.shipCombat.pirate`, while the same object also belongs to the galaxy roster. JSON restores these as separate objects. The loader repairs stranded-ship markers but does not generally rebuild entity references.

Reproduction: start combat with a one-HP pirate, autosave, reload, then fire a guaranteed-hit volley. Before saving, combat target and roster entry are identical; after loading, they differ. The shot marked the combat copy dead and awarded 50 credits while the galaxy roster entry remained alive. The game can therefore retain an enemy it has already paid the player for defeating. [Crew dialogue](https://github.com/Sebo2203/Prospector-II/blob/616d81970e32e225d9c0303a4d7dcc53c87784d5/src/dialogue/engine.js#L18) likewise retains a direct crew object; the dialogue's crew and roster member are separate after reload.

Introduce stable entity IDs and resolve combat/dialogue/escort targets through the authoritative roster. Existing saves need a compatibility step that rebuilds those links. This is a prerequisite for recurring captains, colony ships, escorts and persistent faction actors.

Acceptance: save/load during pirate and neutral combat, crew conversation and transport preserves a single authoritative target; defeat and rewards occur once.

**3. High priority: file import and autosave restore use different migrations, and failed imports can replace the active run.**

[loadFromFile](https://github.com/Sebo2203/Prospector-II/blob/616d81970e32e225d9c0303a4d7dcc53c87784d5/src/persistence/save-load.js#L56) checks only that `galaxy` and `crew` are truthy, assigns the parsed object to `G`, and runs a small subset of compatibility repairs. [loadFromStorage](https://github.com/Sebo2203/Prospector-II/blob/616d81970e32e225d9c0303a4d7dcc53c87784d5/src/persistence/save-load.js#L87) additionally restores ship stats, cargo, weapons/modules, old skills and other fields. There is no root save-format version driving a shared migration sequence.

The same legacy fixture gained ship stats, cargo, installed modules and converted `com` skills through storage restore, but none of those repairs through file import. A malformed `{galaxy:[],crew:[]}` import passed the initial check, triggered an error alert later, and left `G` without the previous career's ship or crew.

Use one loader for both entry points: parse into a candidate, validate structure, migrate by save version, rebuild references, check invariants, then replace the active run. Preserve the previous state until all synchronous preparation succeeds. Keep saveable world state separate from transient UI/input state.

Acceptance: file and storage loading normalize the same fixture identically; invalid files leave the current game intact; old supported versions have explicit fixtures.

**4. High priority: actions do not share consistent turn and survival rules.**

Controlled scenarios produced:

| Action | Global turns consumed | Oxygen, starting at 60 on a hostile surface | Crew infection ticks | Wreck air, starting at 180 |
| --- | ---: | ---: | ---: | ---: |
| Wait on the surface | 1 | 58.5 | 1 | 179 |
| Fire an equipped ranged weapon on the same surface | 1 | 60 | 1 | 179 |
| Scan a selected system body | 1 | Not applicable | 0 | 180 |
| Fire three ship-combat volleys | 0 | Not applicable | 0 | 180 |

[Ranged turn completion](https://github.com/Sebo2203/Prospector-II/blob/616d81970e32e225d9c0303a4d7dcc53c87784d5/src/combat/ranged-fire.js#L116) omits the oxygen handling present in [planet waiting](https://github.com/Sebo2203/Prospector-II/blob/616d81970e32e225d9c0303a4d7dcc53c87784d5/src/actions/wait-and-fuel.js#L110). [Scanning](https://github.com/Sebo2203/Prospector-II/blob/616d81970e32e225d9c0303a4d7dcc53c87784d5/src/actions/survey-and-scan.js#L249) increments the global turn without calling crew/world ticking. [Ship firing](https://github.com/Sebo2203/Prospector-II/blob/616d81970e32e225d9c0303a4d7dcc53c87784d5/src/combat/ship.js#L165) resolves volleys without advancing that turn. Quarantine air can catch up through its elapsed-turn calculation on a later tick; crew status counters do not share that catch-up mechanism.

Define an action-cost policy and one turn-completion path. Its stages should deliberately handle crew conditions, location-specific oxygen/hazards, relevant NPC actions, encounter clocks, death checks, events, saving and presentation. Some actions may intentionally be free or have a different cost; those rules must be explicit and tested. Animation and menu navigation should remain independent from simulation time.

This comes before balancing disease, combat, ship repairs or timed crises: their costs cannot be compared fairly while actions advance different clocks.

Acceptance: a table-driven scenario checks each action's stated cost and every system that should tick, including interrupted actions, retreat, death and save/load.

**5. Medium priority: procedural content needs validity checks in ordinary generation, beyond the debug palette.**

[Habitable generation](https://github.com/Sebo2203/Prospector-II/blob/616d81970e32e225d9c0303a4d7dcc53c87784d5/src/world/special-planets.js#L26) deliberately allows completely dry planets. [Civilization generation](https://github.com/Sebo2203/Prospector-II/blob/616d81970e32e225d9c0303a4d7dcc53c87784d5/src/civilizations/generation-and-state.js#L148) independently selects aquatic species; [underwater generation](https://github.com/Sebo2203/Prospector-II/blob/616d81970e32e225d9c0303a4d7dcc53c87784d5/src/world/interior-generation.js#L194) creates usable seabed only from existing water.

A repeatable scenario selected 40 native aquatic civilization descriptors and ran normal habitable/underwater generators using seeded random input, without the palette adapter. Seven produced zero water, zero passable seabed and zero underwater locals, despite carrying an aquatic civilization descriptor. These are selected generator scenarios, not a statistical estimate of how often all normal careers encounter the defect.

The [palette's authored aquatic adapter](https://github.com/Sebo2203/Prospector-II/blob/616d81970e32e225d9c0303a4d7dcc53c87784d5/src/debug/playground.js#L214) provides a sea for inspection; it does not repair normal galaxy generation. Debug samples and naturally generated content must both be checked. Validate habitat compatibility, landing/exit validity, access to required objectives, door/skill requirements and an available retreat route. Define a bounded repair or regeneration policy when an invariant fails.

Acceptance: a seeded world-generation matrix cannot describe an inhabited aquatic world without an accessible habitat and contact; authored objectives and exits remain reachable under their intended rules.

**6. Medium priority: valid zero values need to survive stat calculations.**

[crewMoraleScore](https://github.com/Sebo2203/Prospector-II/blob/616d81970e32e225d9c0303a4d7dcc53c87784d5/src/crew/morale.js#L55) uses `c.moraleBase || 55`. In a fresh career with no bonuses, grief or absence penalty, setting the base to zero produces a computed morale of 55. Several morale adjustments repeat that default pattern.

Audit fields where zero is meaningful and use an absent-value default rather than a truthiness default. Add boundary checks for zero morale, fuel, hull, shields and empty capacities. This finding does not establish that all those other stats currently fail; they are useful audit boundaries.

Acceptance: base morale zero stays zero before deliberate bonuses/penalties; adjustment and resignation tests exercise the bottom of the range.

**7. Structural work required to make the roadmap sustainable.**

- Give player actions explicit functions and outcomes. The 1,505-line keyboard listener currently routes screens and implements game behavior, with 197 `renderAll` call sites. Its size alone is not the defect; mixed ownership makes another control path or automated player difficult to keep equivalent. Keyboard, mouse and scripted play should call the same action functions.
- Separate world state, UI state and persistence boundaries gradually. `G.mode` represents both locations and screens; `_prevMode`, dialogue, targeting and overlay flags compensate around it. Serializing everything also preserves transient state and duplicated references. Start at the save and action boundaries rather than changing every subsystem at once.
- Retain useful existing definitions for tiles, biomes, commodities, ships and civilization traits. Move new equipment/encounter behavior toward owning definitions with stable IDs; the debug inventory catalog should eventually consume the actual item definitions, rather than becoming an independent authority.
- Make encounter progression a shared lifecycle. Quarantine currently ticks from inside crew-status processing. Future authored worlds and crises need deliberate discovery, activation, ticking, departure, return and completion hooks, with visible deadlines and persistent facts.
- Expand [expedition facts](https://github.com/Sebo2203/Prospector-II/blob/616d81970e32e225d9c0303a4d7dcc53c87784d5/src/missions/expedition.js#L11) beyond surveys, science work and Mercy of Dawn. Record machine-readable participants, locations, outcomes and reasons separately from display text. Civilization contact memory currently keeps only six narrative entries; permanent decisions must not depend on that short display history.
- Make world/simulation randomness reproducible. The current `G.seed` is documented as a market-price seed, not a complete saved world/simulation RNG. The review counted 372 direct `Math.random()` calls across sources. Introduce explicit seeded randomness for generation and gameplay with saved state where needed; cosmetic animation can keep its own timing. This enables repeatable failures and controlled balance comparisons.
- Bring representative synthetic integration checks into the normal verification workflow. CI currently runs [npm test](https://github.com/Sebo2203/Prospector-II/blob/616d81970e32e225d9c0303a4d7dcc53c87784d5/.github/workflows/source-build.yml#L13), while the richer browser scenarios live outside the public tree. Keep private playtester material separate, but commit enough neutral fixtures and real-action checks to cover combat reload, both load paths, action timing, storage failure and ordinary generation on a fresh checkout. The existing green suite missed the reproduced issues above.

**Which existing features are ready to carry more development?**

| Area | Assessment |
| --- | --- |
| Modular sources and generated HTML | Keep this workflow. Assembly-order, syntax and freshness checks are useful. Strengthen subsystem boundaries within it. |
| Debug playground | Useful inspection foundation with searchable catalogs and protected career state. Keep it complete; also test normal generation without its authored conveniences. |
| Physical Mercy of Dawn rescue | The most thoroughly exercised connected encounter: movement, medicine, oxygen, cargo/berths, departure and station handoff. Suitable as a design example after shared clock/save problems are corrected. |
| Science work, survey pay and trading | Existing accounting improvements and renewable jobs support a career. Full expedition economics are not yet established by fixture-assisted transaction tests. |
| Starting hulls and equipment | Meaningful cargo/sensors/crew/combat differences exist. Balance needs complete career trajectories per hull, and equipment needs consistent action costs. Artemis remains explicitly unavailable pending ammunition support. |
| Crew health and morale | Substantial mechanics exist. Their timing/default-value defects should be fixed before escalating to mutiny, fatigue or deeper disease arcs. |
| Civilizations | Rich local traits, language, boundaries, gifts and relationship behavior are worth preserving. Habitat validity, persistence identity and broader regression coverage need work before multi-system diplomacy. |
| Authored worlds and rare sites | Existing generators/content provide a base. Each future arc still needs a tested clue-to-consequence path, valid exits and return state. Having tiles or dialogue does not establish a finished arc. |
| Living factions and crises | Roadmap work, not a completed sector simulation. A station reputation number and local civilization state do not yet supply sustained multi-system faction consequences. |
| Endings | Personal retirement works, but the humanity screen remains disconnected and its indices are randomly selected in the [retirement input path](https://github.com/Sebo2203/Prospector-II/blob/616d81970e32e225d9c0303a4d7dcc53c87784d5/src/input/keyboard.js#L535). The closing sector account is not yet derived from run facts. The career UI also reads a captain-name field new-game setup does not populate, and counts generated planet maps as “Systems Visited.” |

**Recommended order of work.**

1. Repair saves: visible write failures/recovery, one versioned atomic loader, stable entity references, long-run storage checks.
2. Establish action costs and shared turn progression; add regression coverage for oxygen, status counters, encounter clocks and zero-value stats.
3. Validate ordinary world generation and access/retreat invariants across seeds, alongside palette completeness.
4. Measure actual careers with each hull: preparation, travel, work, fuel/repairs/wages, crew recovery, upgrades and voluntary retirement. Record net income, damage, time and reasons for failure. Use scripted runs for repeatability and human runs for judgment.
5. Introduce the shared encounter/fact framework through one connected return-visit arc, then use it for factions, first contact, crises and fact-based endings.

The recommended next deliverable is a foundation-hardening pass with these acceptance checks, followed by balance work on the existing career. The review recommends these changes; it does not mark them implemented or claim that all game systems have been exhaustively verified.
