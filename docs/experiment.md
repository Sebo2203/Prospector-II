# Expedition Legacy experiment

This branch develops a complete captain's career in the spirit of Matthias Mennel's original Prospector, retaining Prospector II's existing systems. It begins from the latest modular development code, including walkable casinos, interior salvage fixes, synthesized repair/refuel sounds and the desktop wrapper.

## Direction

The original's manual describes a freelance captain earning retirement money through exploration, resource and data sales, trading, or piracy. A vulnerable ship and a crew with distinct expertise make expeditions risky. Strange worlds and ancient remains reward curiosity. Retirement is the captain's decision, rather than a mandatory final battle.

Sources: [Mennel's manual 1.1, reproduced from the original release](https://ruzzoli.de/roguelikes/shrine/prospector/manual.html), [original manual PDF](https://ruzzoli.de/roguelikes/shrine/prospector/Manual.pdf). The similarly named game by Mathias Kaindl is a different game and is not the reference for this experiment.

The project vision recovered from earlier development discussions adds a living sector, richer planetary civilizations, mechanical consequences for dialogue, walkable inhabited locations, authored mysteries, and an ending that remembers the run. Keep the five civilization tiers and their different contact rules, language, gifts, aid, permissions and boundaries. Preserve surface exploration, crew conditions and morale, trade, science, salvage, combat and the retirement economy.

Build depth by connecting these systems. New stories should offer clues before costs, support different hulls, permit retreat, and leave persistent facts. Avoid making every career follow the same story. Larger crises should begin through discovery, with visible stakes and deadlines; there is no hidden universe-wide failure timer at character creation.

## Playable now: 0.28 experimental.1

Press **J** in space, orbit, on a planet or at a station for the expedition journal. It shows survey progress, unsold survey value, established civilization relationships, active follow-up and a structured career history. Records live in the save; repeated scans update a finding without repeating the first-discovery entry. A generated but unobserved map is excluded. Legacy saves receive empty history without fabricated past events.

A fresh run receives a distress transmission from **Mercy of Dawn**, placed on an otherwise empty tile near the starting station. Its transmitted coordinates are charted. Fly there and press **Enter**. Contact confirms three survivors and a fever. The experiment currently uses a transmission/transfer encounter, not a walkable quarantine interior.

| Decision | Immediate result | Next major station |
| --- | --- | --- |
| Sealed life pod | 20 fuel, one turn, crew morale +2 | Three survivors treated; 300 cr; standing +4 |
| Open-airlock rescue | One turn; one living crew member gains fever; morale +1 | Three survivors treated; 300 cr less 120 cr screening; standing +2 |
| Rescue beacon | 5 fuel and one turn | Tug confirms three survivors recovered; 100 cr; standing +1 |
| Strip emergency cargo | 180 cr and one turn; morale -3; survivors lose life support | Loss inquiry; up to 80 cr fine, no debt; standing -2 |

Leaving the encounter without choosing remains possible and costs nothing. You can return. Once a decision is made it cannot be farmed by reopening the encounter; the station follow-up pays or fines once, including after reload. No particular hull, item or cargo slot is required. The pod is a dedicated mission state, not sellable cargo. No disease spreads to stations in this first slice; the open rescue uses the existing crew fever and treatment mechanics. There is no new encounter countdown. Retirement statistics include the recorded incident legacy.

Older saves remain playable and do not receive a newly invented distress event. Start fresh to see this slice. Debug infinite fuel does not waive encounter fuel costs; the choice screen says so explicitly.

## What follows

1. Deepen this incident with an explorable vessel, environmental clues and medical alternatives using existing equipment. Extend scenario coverage before adding more outcomes.
2. Connect journal leads to the sealed ringworld, robot factory and Apollo's Sanctuary; each gets a return visit and a persistent aftermath.
3. Add renewable career work, faction news and first contact beyond a single planet.
4. Develop opt-in sector crises and a fact-driven final sector account. Existing random humanity outcomes are not yet wired to this history.

The broader [roadmap](roadmap.md) remains the destination; these items are planned rather than implemented.

## Validation

`npm run build` assembles `src/` into `index.html`; `npm test` checks the build and targeted behavior. Deterministic expedition tests cover costs, exposure, insufficient fuel, remote attempts, discovery deduplication, old state and idempotent follow-up across serialization.

A separate local headless scenario harness runs the complete built game in Edge. It exercises keyboard input, all three hulls and all four decisions, the real crew status system, actual station docking, storage and file loading, journal rendering and hidden-world exclusion. The harness stays outside the public tree, consistent with the earlier tooling cleanup. These checks establish the tested rules and paths; human playtesting is still needed to judge pacing, readability, balance and enjoyment.
