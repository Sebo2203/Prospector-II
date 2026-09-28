# Prospector II: the road to a finished game

Prospector II should become a turn-based expedition roguelite about making a living at the edge of a changing sector. A run starts with a vulnerable ship, a small crew, and practical work: survey, trade, salvage, research, or fight. The player can retire with what they earned, or stay long enough to uncover ancient places, meet another spacefaring people, and decide what happens when the sector faces a crisis. The ending should remember the places visited, people helped or harmed, and dangers left unresolved.

This is a destination and an order of work, not a promise to put every idea from the original comments into one release. The comments in `src/html/legacy-design-notes.html` supply the strange worlds, ships, and threats below. Their implementation labels are historical: current code is the source of truth.

## What a complete run should feel like

1. **Find a foothold.** Choose a ship and an economic route. A trader, explorer, and combat pilot can all survive, but each solves problems differently. Early jobs teach the sector's rules and fund the next expedition.
2. **Follow a lead.** A distress call, survey anomaly, station rumor, or civilization points toward a larger story. Exploration reveals clues before it asks for irreversible decisions.
3. **Change the sector.** The player makes choices that affect a world, faction, route, or crew member. Those effects appear later through news, encounters, prices, access, or danger rather than only in the immediate dialogue.
4. **Decide when to leave.** Retirement is available before the grand stories are complete. Staying creates chances for a richer legacy and exposes the crew to growing risk. A run closes with a personal career account and a sector outcome based on what actually happened.

The game needs four promises to make this work. **Knowledge matters:** scans, examination, rumors, and the journal help the player make informed choices. **The crew matters:** wounds, illness, morale, and expertise affect expeditions and recovery. **The sector remembers:** sites, civilizations, factions, and crises persist through saves and respond to decisions. **Careers differ:** the starting hull and chosen livelihood create useful approaches, not mandatory story locks.

For example, a surveyor could answer a quarantine ship's call, carry a sick passenger to a station, and later find the station refusing incoming ships. The same run might discover the robot factory responsible for raids, negotiate help from an alien colony, and divert a planet-killing vessel. The final account would mention those linked events. Another captain could sell the quarantine ship for parts, never meet the colony, and retire early with a very different story.

## The foundation already in the game

The modular `src/` tree already contains a generated galaxy, planets and civilizations, surface exploration, ship and ground combat, crew conditions and morale, stations, science work, saves, and several authored encounter types. Ringworlds, ruined ringworlds, bloom worlds, nuclear-war worlds, and talking trees have code now, despite older comments describing them as plans. The roadmap should deepen and connect these systems before adding another long list of isolated encounters.

| Existing piece | What still prevents it from carrying a full run |
| --- | --- |
| Procedural worlds and authored oddities | Many discoveries need a lead, a decision, and a later consequence. |
| Crew health, disease, hallucinations, and morale | These need readable warnings, recovery choices, and occasional story consequences. |
| Civilizations and station interactions | Local state needs to feed sector news, diplomacy, access, and endings. |
| Science contracts | The small set of one-time jobs runs out; careers need renewable work and larger expeditions. |
| Artemis launcher and ship equipment | The launcher lacks ammunition, and damage/repair is not yet a meaningful ship-management loop. |
| Six authored humanity outcomes | Retirement skips the sector-outcome screen; outcomes need to follow run history instead of a random selection. |

## Release 0.27 — The expedition remembers

Make the sector legible before making it bigger. Add a saved **captain's journal** with discovered systems and bodies, scan findings, civilization notes, unsold survey work, active leads, and a compact history of major decisions. The journal should distinguish a rumor from something confirmed. Unknown places remain unknown. A separate event history lets later encounters and endings react to facts without parsing prose from the log.

Build one complete incident on that foundation: the **Quarantine Ship**. A distress signal leads to a drifting vessel with an illness and a valuable cargo. The captain can rescue survivors, isolate them, strip the ship, or leave. The crew's health and morale, the next station's response, and the journal should reflect the choice. The ship is a small enough story to establish the pattern for every later authored encounter: lead → discovery → informed choice → immediate cost → delayed response.

**Exit:** Leave the incident, save and reload, then encounter a later consequence that agrees with the journal. The first implementation slice is the shared journal/history data and view; the second is this incident.

## Release 0.32 — A ship and crew worth bringing home

Turn resources into expedition decisions. Give engines, sensors, life support, weapons, and cargo systems condition that affects existing actions. Damage should be visible, repairable with parts or station service, and serious without producing arbitrary soft locks. Finish the **Artemis launcher** with ammunition, purchase, combat use, and save behavior. Add a modest ship lab that converts survey or salvage finds into a small set of useful field supplies; it should support exploration, not become a broad crafting tree.

Crew illness, fatigue, and morale should have warnings and remedies. A mutiny or refusal is a rare escalation of neglected conditions with chances to de-escalate. Give each starting hull at least one distinct advantage in crisis resolution: cargo space and supplies, scientific analysis, or tactical force. No choice of hull should make an ending unreachable.

**Exit:** A damaged expedition can make a deliberate retreat, repair, and return. At least one encounter supports materially different approaches by hull. All new resource states survive save/load.

## Release 0.40 — Worlds with stories

Build three substantial planet arcs from the old design notes, each with clues, an approach, a discovery, a risk, a choice, and a visible aftermath:

- **The sealed ringworld:** investigate a flourishing habitat with an infection. Risk exposure to learn its source, search for a cure, seal it, or retreat. Survivors and future visitors depend on the decision.
- **The robot factory:** descend into an automated industrial world. Destroy, reprogram, or abandon its surviving core. A neglected or mishandled core can send robot ships into nearby systems later.
- **Apollo's Sanctuary:** a temple world with a guardian that can be fought, studied, or approached through a discovered ritual. The peaceful path rewards preparation rather than guessing dialogue options.

Make leads appear through surveys, rumors, and the journal. Use the game's visual language—surface tiles, examination text, and strong ASCII moments—to make each place recognizable. Add smaller rare hazards, such as a sandworm or crystal minefield, only after the three arcs can be played from first clue to consequence.

**Exit:** Every arc can be completed through at least two distinct approaches, and the resulting world state is visible on a return visit or elsewhere in the sector.

## Release 0.50 — A living sector

Make stations, pirates, research groups, and local civilizations react to what the captain does. Keep standing understandable: players should see who trusts or fears them and why. Add sector news at stations and in the journal to report changes the player could reasonably learn. Contact with a nonspacefaring civilization should allow observation, trade, interference, or protection with consequences for that society and for interested factions.

Give pirates and patrols interactions besides instant combat: demands, bargains, pursuit, assistance, and consequences for attacking neutral vessels. Refresh science contracts after a cooldown, with targets known to be reachable; add a few multi-step research expeditions that point toward the world arcs. Let trading and salvage remain viable ways to fund a run as the sector changes.

**Exit:** A player can explain a station's attitude from recorded actions, find work after early contracts are exhausted, and witness at least one civilization or route change without revisiting the original choice screen.

## Release 0.62 — First contact beyond a planet

Introduce an **alien colony ship** and an authored colony world as a connected arc. The player learns enough language and context through observation, recovered records, gifts, or research to understand what is being asked. Escort, negotiate, trade, refuse, or attack; none should be a disguised correct-answer button. Existing planetary civilizations provide context, but this is the first spacefaring group able to answer the player's actions across systems.

Peace opens cooperation and new ways to solve a crisis; hostility creates a sustained military and economic cost; cautious neutrality remains playable. Cargo, science, and combat ships should bring different strengths to the contact. The alien captain or prospector from the original notes can become a recurring character whose attitude reflects the relationship.

**Exit:** First contact changes later encounters, station news, access, and the final sector account. The player can finish the run on peaceful, neutral, or hostile terms.

## Release 0.74 — The sector in danger

Make the **planet-killing Titan** the major late-run crisis. Rumors and debris foreshadow it; direct discovery starts a clearly shown clock. The player can investigate a weakness, assemble help, disable or redirect it, attack at great cost, or leave it alone. Targets, warnings, and deadlines must be readable. The robot factory's spreading ships form a slower, smaller crisis that can intersect with faction and alien choices.

Crises should escalate through encounters, map state, station news, and lost or protected worlds. A player who retires before resolving one is making a valid choice; the ending tells the truth about that risk. No crisis timer starts invisibly at game creation, and no critical resolution depends on a single rare random drop.

**Exit:** The Titan can be resolved by more than one route or allowed to strike, and the sector changes accordingly. The robot threat can be contained, redirected, or left to spread.

## Release 0.85 — Endings that belong to this run

Wire the existing personal retirement story, humanity/sector outcome screen, and career statistics into one continuous ending. Choose the outcome from saved events: worlds preserved or lost, civilizations changed, alien relationship, faction standing, and unresolved crises. Randomness may vary wording and incidental detail, but it should never claim the player saved a world they watched fall. Support early retirement, a wealthy career, a peaceful first-contact legacy, a hard-won secure sector, and fatal endings without demanding that every run touch every arc.

**Exit:** Two runs with different major decisions produce different, accurate closing accounts. Saving and reloading before retirement does not change the facts of the ending.

## Release 0.95 → 1.0 — Finish the game

Play complete runs with each starting hull and with at least one trade, science, and combat-focused career. Balance earnings, repairs, encounter frequency, travel time, and crisis pacing around those runs. Keep rare stories surprising without making progress depend on them. Audit keyboard controls, ASCII readability, encounter exits, save migration, and the generated `index.html` build. Give new players an opening contract and clear explanations for the journal, ship condition, and retirement choice.

**1.0 means:** a new player can begin, learn, earn, make consequential choices, and reach a coherent ending without developer intervention; major paths do not trap the player; saves restore those paths; the built single-file distribution plays the same game as the modular source.

## After 1.0: expansions, not prerequisites

The old comments have enough ideas for years of additions: a prison planet that can release a monster, a stellar gun, a dying sun, a space whale, the nebula devourer, a human seed ship, a maze, more predators, invasions, troop transport, and nuclear weapons. Colony and station construction are especially large systems and deserve their own expansion. These should attach to the journal, faction, crisis, and ending framework above so they become new stories within the same game, rather than isolated scenes. None is required to call the core game complete.

## How to build it

Deliver each release through small, reviewable vertical slices. For an authored encounter, the slice includes discovery, choice, response, departure, save/reload, and any promised later consequence. Document the new state before adding it to saves, keep older saves readable, and test the actual player path in a browser. Edit `src/`, rebuild `index.html`, and run the build checks for gameplay changes. Preserve the current classic-script/shared-global order and turn rules unless a feature explicitly changes them. Keep private playtester material out of the public repository.
