# Expedition Legacy experiment

This branch develops a complete captain's career in the spirit of Matthias Mennel's original Prospector, retaining Prospector II's existing systems. It begins from the latest modular development code, including walkable casinos, interior salvage fixes, synthesized repair/refuel sounds and the desktop wrapper.

## Direction

The original's manual describes a freelance captain earning retirement money through exploration, resource and data sales, trading, or piracy. A vulnerable ship and a crew with distinct expertise make expeditions risky. Strange worlds and ancient remains reward curiosity. Retirement is the captain's decision, rather than a mandatory final battle.

Sources: [Mennel's manual 1.1, reproduced from the original release](https://ruzzoli.de/roguelikes/shrine/prospector/manual.html), [original manual PDF](https://ruzzoli.de/roguelikes/shrine/prospector/Manual.pdf). The similarly named game by Mathias Kaindl is a different game and is not the reference for this experiment.

The project vision recovered from earlier development discussions adds a living sector, richer planetary civilizations, mechanical consequences for dialogue, walkable inhabited locations, authored mysteries, and an ending that remembers the run. Keep the five civilization tiers and their different contact rules, language, gifts, aid, permissions and boundaries. Preserve surface exploration, crew conditions and morale, trade, science, salvage, combat and the retirement economy.

Build depth by connecting these systems. New stories should offer clues before costs, support different hulls, permit retreat, and leave persistent facts. Avoid making every career follow the same story. Larger crises should begin through discovery, with visible stakes and deadlines; there is no hidden universe-wide failure timer at character creation.

## Playable now: 0.28 experimental.2

Press **J** in space, orbit, on a planet or at a station for the expedition journal. It shows survey progress, unsold survey value, established civilization relationships, active follow-up and a structured career history. Records live in the save; repeated scans update a finding without repeating the first-discovery entry. A generated but unobserved map is excluded. Legacy saves receive empty history without fabricated past events.

A fresh run receives an incomplete distress transmission from **Mercy of Dawn**, on an empty tile near the starting station. The transmitted coordinates use the same one-based display as the galaxy HUD. Fly there and press **Enter** to board a persistent 32 by 20 deck. The earlier four-choice resolution menu has been removed.

The bridge, medical stores, cargo hold, engineering compartment and sealed isolation ward connect through pressure hatches. Emergency lighting, fog of war and line of sight govern discovery. Survivors are visible individuals with positions, health and transport state. Their exact room positions vary within the authored layout.

**Interaction:** move normally; Enter operates the equipment underfoot, opens an adjacent closed hatch, or assists/releases a nearby survivor. X examines visible equipment and people. T gives medical care to an adjacent survivor. P deploys a recovered isolation pod. At the engineering pump, R manually restores temporary pressure. L departs only from your own airlock. There are no remotely selectable rescue outcomes.

**Survival:** the wreck begins with 180 turns of reserve air when first boarded. Time continues during movement, work, waiting and travel after retreat. At zero reserve, crew suit oxygen matters and survivors left without a pod take progressive asphyxiation damage. The ordinary oxygen gauge reflects the actual atmosphere. Repairing life support stops depletion; the manual pump only buys time. A recovered coupling or an ordinary repair kit fixes the pump, while engineering skill of at least 3 permits a three-turn bypass without consuming either item.

**People and equipment:** Mira can walk, Rowan needs an injury stabilized or two crew to carry them, and Ilya is infectious. A medikit stabilizes the injury; a medic with skill 3 can improvise a splint over three turns. Antibiotics treat the infection. Those supplies are ordinary inventory items and can instead be spent on your crew. Two folded pods can be recovered from stores. Carrying one casualty or pod at a time requires two living crew. A set-down pod cannot move by itself.

**Exposure:** contaminated ward tiles expose crew whose suits are absent or punctured; intact flight suits protect against the air. Reconnecting the local scrubber removes that environmental exposure. An untreated passenger in shared ship quarters can infect the crew during travel. These exposures enter the existing crew infection and disease system; there is no new station-wide epidemic simulation.

**Transport:** assisted survivors path through open, passable tiles one cardinal step per turn. Carried survivors remain with the away team. They enter your ship only at the airlock. Normal passenger capacity equals unused crew bunks plus one emergency berth, with a minimum of one. Pods occupy real cargo slots and protect occupants from shared-air exposure. A small hull may require return trips; repairing life support makes that practical. Full holds or berths leave people physically aboard the wreck. Jettisoning an occupied pod records the passenger as lost, not delivered. Departure leaves untransported followers and carried casualties at their actual deck positions.

**Aftermath:** docking at a major station transfers only actual onboard passengers to medical care, pays 100 cr per person and improves standing once per delivery. Loading a save or redocking cannot repeat a payment. Recovered instruments are a normal cargo commodity, sold through the existing station market, not an incident button that creates credits. There is no automatic salvage fine or omniscient station inquiry. The journal records observations and actions; it does not disclose predetermined outcome prices. Deaths out of sight remain unconfirmed until observed. The retirement record counts delivered and still-onboard survivors.

**Saves:** all deck, door, supply, repair, survivor and passenger state persists in ordinary saves. Older saves without this encounter remain playable. Resolved incidents from experimental.1 retain their history and cannot be replayed for new rewards. Start fresh to experience the new ship. The Windows experiment has a separate app identifier from the regular game.

Two existing defects surfaced while exercising the encounter: planet waiting failed to advance the global turn, and cardinal line-of-sight rays could drift along the wrong axis. Both are corrected in this branch. A previously undefined casino-departure variable in lift-off is also corrected. These changes do not update main.

## What follows

1. Human playtesting of the spatial incident: clarity of local actions, lighting, time pressure, ferry trips and medical tradeoffs. Tune those observations before adding another encounter.
2. Connect journal leads to the sealed ringworld, robot factory and Apollo's Sanctuary; each gets a return visit and a persistent aftermath.
3. Add renewable career work, faction news and first contact beyond a single planet.
4. Develop opt-in sector crises and a fact-driven final sector account. Existing random humanity outcomes are not yet wired to this history.

The broader [roadmap](roadmap.md) remains the destination; these items are planned rather than implemented.

## Validation

`npm run build` assembles `src/` into `index.html`; `npm test` checks the build and targeted behavior. Tests traverse 100 generated decks for reachability, check closed hatches and survivor movement, resource depletion across serialization, berth and cargo limits, lost pods, once-only delivery and cardinal/diagonal visibility.

A separate local headless harness runs the complete built game in Edge. It starts scenarios at the wreck but walks the interior using real movement and interaction functions. Its scenarios cover all three hulls, a complete treated rescue and flight to a station, physically carried injured survivors, small-ship capacity and return trips, isolation pods, actual storage and file loading mid-rescue, real inventory jettison, ordinary-market salvage sales, missing equipment, breached-suit infection and lethal life-support neglect. The test setup suppresses unrelated galaxy pirate interception to isolate encounter behavior; it does not prove survival through every sector encounter. The harness stays outside the public tree, consistent with the earlier tooling cleanup. These checks establish the tested rules and paths; human playtesting is still needed to judge pacing, readability, balance and enjoyment.
