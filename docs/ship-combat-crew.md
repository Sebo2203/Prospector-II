# Bridge crew, casualties and enemy tactics

Implemented in experimental.86 on `experiment/expedition-legacy`. This build uses career schema **5** and requires a new career. Ship prices, rewards, ammunition prices and other economics are unchanged.

## What the original Prospector did

The original R197 combat source separates propulsion from crew competence: engines provide movement, the gunner participates in weapon skill checks, and the defender's pilot opposes the hit check. Range, active sensors and equipment also modify shooting. Pilot skill and hostile ship count affect escape. Criticals include crew-quarter and bridge impacts that can harm personnel. See the preserved [original source snapshot](https://github.com/roguelikes/prospector/blob/7aba66b/spacecom.bas), especially `com_fire` near line 1311, `com_criticalhit` near lines 1947–1968 and `com_run` near line 1988. The [original manual](https://ruzzoli.de/roguelikes/shrine/prospector/manual.html) describes the officers and their training.

Prospector II adapts that division to its existing skill roster. It does not copy the original dice system, add mandatory Pilot/Gunner officer slots, or change the requested 25% disengagement-failure rule.

## Engines and bridge competence

Engines retain physical movement pace, boost requirements, exhaust strength/lifetime and the existing hull-size fuel relationship. Working engine upgrades no longer directly improve hit probability or evasion. A destroyed drive still prevents maneuvering, so it removes the pilot's evasion contribution.

The active gunner is the strongest capable living crew member in **CBT**. The active helmsman is the strongest in **NAV**. For equal skills, Mercenary is preferred for gunnery and Navigator for the helm, then Captain. Any other capable crew member can take over; the starting Captain and Navigator suffice. One survivor may cover both duties. No new station purchase or compulsory specialist is introduced.

Stunned, asleep and dead crew cannot fill either duty. Existing concussion, fever, sepsis and broken-arm modifiers affect effective skill through the shared crew-status rules. An injured or dead specialist can therefore change combat performance immediately. Loss does not manufacture a replacement officer. The combat readout names the current gunner/helmsman and displays effective CBT/NAV. With no capable operator the corresponding skill is zero, leaving basic weapon accuracy but no skilled bonus. Without propulsion/fuel, piloting contributes zero even if a Navigator is alive.

```text
hit probability = clamp(0.78 + 0.035 × attacker CBT
                        − 0.030 × defender NAV
                        − 0.025 × max(0, distance − 2), 0.15, 0.98)
```

Distance remains Chebyshev arena distance. Sensors, line of fire, mount power, heat, ammunition and reload guards still apply before firing. Weapons do not gain additional raw damage from bridge skill.

NPC ships use explicit `bridgeSkills: {gunnery, piloting}` or a stable hull/type-based profile: default gunnery is `min(6, 1 + floor(maxHp/60))`; patrols use three, and natural entities three. Default piloting is three for patrols/fast authored engines and two otherwise; natural entities use three. Disabling their engines removes their evasion contribution too. These ratings do not match the player's level, wealth or run progress. NPC crews remain abstract skill profiles; this release simulates individual personnel injuries/deaths on the player's roster.

Artemis snapshots the firing crew's effective CBT at launch. Later operator wounds/death cannot change a missile already in flight. On impact it opposes the defender's current piloting; engine grade is no longer saved as missile accuracy. Its finite ammunition, homing, cover routing, flight time and posthumous impacts remain unchanged.

## Risky practice

Each committed player ship shot/launch awards one CBT XP to the actual gunner who fired, hit or miss. Each enemy shot/ram resolved against the player, and each incoming missile reaching its impact roll, can award one NAV XP to the living active pilot who faced it. Piloting practice requires working propulsion/fuel, but zero-skill beginners can learn. A pilot killed by the impact receives no XP. Merely moving, waiting, examining, selecting targets, reopening menus or attempting an unavailable shot grants none. Existing 25 × next-level thresholds and the level-ten cap remain.

The grants represent real committed combat actions with heat/reload/ammunition or incoming harm risk. They are not kill bonuses and do not reward repeated harmless menu actions. Existing engineers and medical supplies retain their repair/treatment roles; station purchases do not train the crew.

## Crew can die while the hull survives

Only actual player hull loss during a tactical impact can trigger shipboard casualties. A hit completely absorbed by shields cannot injure personnel. The roll uses actual loss, including a resulting internal tank blast, rather than the nominal weapon roll.

```text
crew-impact probability = min(45%, 10% + 1.25 percentage points × hull HP lost)
crew HP damage = 2 + random integer 0…6 + ceil(hull HP lost / 2)
```

One living crew member is selected uniformly for each successful impact roll; ordinary HP can fall to zero. A surviving victim has a 45% chance of bleeding, concussion, burns or a short stun. Wounds use the existing injury system and persist after combat and through saves. Crew deaths apply existing grief/morale consequences and immediately remove the dead person from bridge selection. The log names the victim and actual impact source. Plasma crossings and incoming Artemis impacts can cause casualties too. There is no engineer-based protection or new medical saving throw.

The ship can lose its last crew member with positive hull HP. This ends the career with a crew-loss explanation. Fatal bleeding during a later combat turn also ends the encounter and retains a space-combat cause. Normal hull destruction still ends the career. Recorded crew deaths now have a saved counter; the ending no longer infers losses from a hard-coded three-person starting crew. This counter records resolved personnel deaths, not an invented reconstruction of every possible off-screen fate.

Debug Infinite hull prevents hull loss and therefore the associated crew-impact roll. Infinite crew HP separately protects personnel while allowing ship damage; disabling one does not enable the other.

## Enemy roles

| Tactic | Behavior |
| --- | --- |
| Close assault | Closes toward three tiles or its shorter weapon range; favors higher-damage available guns and holds to reload/cool once in position. |
| Skirmisher | Uses a range band near its weapon limit, makes room when crowded and uses downtime to reposition; favors faster-reloading guns. |
| Long-range fire | Keeps room near long weapon range, looks for clear firing lanes and routes around blocking cover; favors longer-range available guns. |
| Missile standoff | Uses guided fire while behind cover, seeks standoff range and prioritizes a ready launcher. On losing its usable guided option it falls back to its remaining weapons or flees if none can be used. |
| Fleeing | Unarmed, ammunition-empty or fully unpowered weapon outfits head for an escape edge using existing checked withdrawal rules. |
| Ram attack | Natural gas entities retain close-contact attacks and their existing ram cadence, without engine exhaust. |

Corvettes/heavy assault hulls, Frigates, Cruisers and Flagships receive role metadata in their spawning catalogs. A usable guided launcher selects missile standoff; other ships fall back to their explicit role or their authored equipment/engine profile. The readout shows the detected target's tactic. Tactical decisions are deterministic for a given state; drawing does not roll new personalities.

Routing searches the bounded arena for a reachable firing/range/cover position, weighing path length and plasma danger and respecting actors/asteroids. It can find a route around a wall instead of endlessly choosing the same blocked direction. NPCs use their sensor range and last-known player position; blind ships retain their existing movement restrictions. Visible incoming missiles contribute local avoidance pressure.

Movement, firing and deliberate cooling remain separate responses. Moving does not grant a free shot, additional reload ticks or additional world turns. Substeps retain heat/exhaust, collision, critical and escape checks. Fractional movement credit remains bounded and saved. Ready ships can return fire after a preceding maneuver, preventing pursuit from forcing endless retreat without retaliation. Ships already at standoff range cool deliberately when very hot, rather than moving enough to cancel all passive cooling. The last-maneuver turn is saved and cleared by a failed-withdrawal position reset.

## Asteroid cover

Most combat rocks occupy one tile. Rare elongated rocks occupy 1×2 or 2×1 tiles, and the largest occupy 2×2. Every occupied tile blocks thrust/boost and ordinary shots for either side; guided Artemis missiles route around the whole footprint. Close-assault enemies also seek a clear firing angle when their preferred range is behind cover.

Cover generation is deterministic from the encounter seed/coordinates, keeps the existing sixteen-occupied-tile budget and leaves a one-tile clearance around starting ships. Larger footprints therefore concentrate cover rather than increasing the maximum amount. Empty arenas and natural-entity encounters retain their existing rules. Disengagement resets preserve the rocks. Dimensions persist through ordinary saves; malformed, overlapping or out-of-bounds footprints are rejected transactionally. Single-tile rocks omit dimensions, meaning one tile, without a migration or schema change.

Each larger shape has a dedicated generated pixel-art sprite at its native footprint resolution, drawn proportionally without stretching or assembling smaller rocks. Original one-tile art is unchanged. Visibility clips each occupied tile independently, so seeing an edge does not disclose uncharted portions. ASCII shows one `#` per charted occupied tile. The existing BRIDGE DRILL sample includes every footprint shape. See [art preparation and prompts](art-direction.md).

## Physical collisions and ramming

Move toward an adjacent enemy ship to ram it, or face it and press **B** to boost into it. Mouse compass movement and the Boost control use the same actions as the keyboard. Contact is a physical collision, not a weapon accuracy roll. Ships remain in separate cells; movement stops before the struck ship even if it is destroyed. Boost can also crash into an asteroid on either of its two steps, including any occupied cell of a larger rock. Ordinary movement into an asteroid remains a free blocked move. Arena edges, unavailable engines, insufficient boost fuel and excessive heat still refuse the action.

Ramming damages **both hulls directly**, bypassing shields. The impact uses one 6–10 roll, multiplied by 2.5 when boosted. Damage to the target is impact × attacker size / defender size; recoil is impact × defender size / attacker size, each rounded once with a minimum of one. Larger hulls therefore have an advantage against smaller bodies, and a small ship boosting into a heavy opponent can destroy itself. Player size comes from its physical hull blueprint, unaffected by purchased plating or current HP. NPCs use an available blueprint, civilian body size (cargo 2.5, trader/patrol 1.5, science 1), wraith/devourer size 2/4, or a stable fallback sqrt(factory max HP / 40), clamped to 0.75–4. This is the current gameplay proxy, not a complete NPC mass model.

Boost crashes into one-, two- and four-tile asteroids deal **15–25**, **21–35** and **30–50** hull damage respectively. Asteroids remain in place. Collisions use ordinary component criticals, tank-explosion risk, personnel wounds/deaths and debug protection. Shield charge/recharge is not consumed by the collision itself; a shield-generator critical can still reduce capacity. Killing the other ship does not cancel recoil. Both can be destroyed, and the player's death still ends the career.

Normal ramming costs its ordinary two heat; boost pays its full fuel and heat even on a first-step crash. Every committed collision spends one career turn, including a fatal one. Collisions do not reset or consume weapon reloads/ammunition. The surviving active helmsman can earn one NAV XP from a real ram; these actions do not grant gunnery practice.

Natural ram attackers spend movement credit to make contact: they may close and use another available substep to ram in the same response. A mobility-three wraith can therefore catch a continuously moving mobility-two player. This preserves fractional movement, one contact per response and the existing two-turn ram deadline; it grants no extra gun shot. Equal mobility does not manufacture catch-up, and boost can open the gap.

## Escape and interception

An escaping NPC follows two clear galaxy steps and must finish at least two sectors away in Chebyshev distance: at least one unoccupied sector lies between it and the player. Both the intermediate sector and destination exclude occupied sectors, pulsars and black holes. Cardinal routes are preferred, with a diagonal fallback at obstructed edges. If no separated route exists, escape is refused without a failure roll. The existing 25% disengagement-failure roll and starting-position reset remain.

Successfully escaped contacts retain their authoritative ship, damage, ammunition and reloads. Their saved `requiresPursuit` flag permits interception only after the player closes to an adjacent sector (or the same sector). Sensor visibility still shows the contact; pressing F, waiting out the five-turn NPC disengagement grace, reloading or directly requesting combat cannot bypass pursuit. Escaped ships cannot be pulled into another distant encounter as wingmen. Ordinary newly encountered targets retain their sensor-range engagement rules. Once intercepted, the pursuit requirement clears; normal relative engine movement still determines whether the player can catch a fleeing vessel.

## Nebula combat

A fight involving the player's nebula sector, or a primary target in nebula gas, receives that nebula's blue/pink theme. Seeded arenas vary between gas-only and mixed gas/asteroid layouts. Dense pockets are traversable 2×2, 2×3 or 3×2 areas and do not overlap solid rocks or initial ship-clearance zones. Ordinary fire starting inside or crossing a pocket loses **15 percentage points of accuracy**, retaining the existing 15% minimum. This applies symmetrically; gas does not block the shot or guided missile routes, and guided impacts and rams keep their existing hit rules.

Lightning is unannounced. After the opening two actions, eligible turns have a 10% chance to schedule a pocket discharge internally. It resolves on the following committed combat action, with a four-turn scheduling cooldown. There is no advance outline, glow, readout, hover hint, log warning or emergency banner, and NPCs cannot see the pending strike. Damage is 4–10 × physical hull size, rounded once, using ordinary shields, criticals and combat crew-casualty handling. NPCs use their blueprint size where available and one otherwise. Hull/crew debug protection retains its existing effects; hazard kills use normal encounter reward handling. Opening menus, drawing, saving and loading do not advance the schedule or roll strikes.

Pocket layout, internal pending discharge, scheduling and the last resolved strike persist with the encounter. A player withdrawal attempt advances lightning along with missiles and ship ticks, including when withdrawal fails and positions reset; it cannot freeze the storm or leave an expired saved deadline. Discovery clips dense gas to charted cells; the broad nebula backdrop is atmospheric decoration. ASCII uses `~` for dense gas and shows an arc only after a strike. A generated transparent texture supplies the organic clouds, without warning rectangles. Pulsar and wormhole arenas remain future work in the [roadmap](roadmap.md).

## Debug and validation

**BRIDGE DRILL** in the debug palette opens a real four-role encounter against a factory Corvette with Captain, Navigator, Mercenary and Medic. Hull and crew invulnerability are disabled for this disposable sample. Try positioning, shooting, injury treatment and withdrawals. Visiting again resets ships, crew, injuries, missiles and the temporary debug flags; leaving restores the gallery outfit/flags, and Return to Career restores the retained career. Sandbox autosaves cannot replace it.

New modules are `src/combat/ship-crew.js` and `src/combat/ship-ai.js`, assembled before tactics in the explicit build manifest. Save validation checks launch CBT, optional NPC bridge ratings/tactics, maneuver deadlines and the crew-death counter. Earlier schemas are rejected; no migration is supplied.

Run the [maintained QA scripts](../qa/README.md): `node qa/run.cjs bridge` checks concrete rules and regression cases; `node qa/combat-matchups.cjs` measures bounded matchups using the shared native-action fixture/controller. Generated reports remain ignored in `qa/artifacts`.

The recorded first audit uses 192 single-enemy fights: three player hulls, starting versus trained CBT/NAV, four enemy role/loadout pairs and eight seeds, half with authored cover. The Freighter receives one legal gun bay/Mass Driver; equipment and trained skill are fixture grants. The policy seeks range, fires available weapons and attempts low-hull withdrawal, with an 80-action cap. Presentation is suppressed; turns, damage, criticals, injuries, learning and withdrawal use the actual game functions. It is not an economy simulation or an unassisted career study.

In that audit, starting crews won 39/96 and died 26/96; trained crews won 49/96 and died 16/96. Other outcomes were withdrawal, enemy escape and one capped trained-Freighter fight with damaged sensors. Personnel deaths before ship loss occurred in 15 starting-crew fights and ten trained-crew fights. The measurements exposed and led to fixes for endless standoff retreat and permanent maneuver-heating. Skill helped without guaranteeing survival. These outcomes depend on the controller, fixed fittings, small seed set and action cap; they do not establish final balance or human enjoyment. Independent run-age escalation and richer NPC crew simulation remain separate future work.

The [November 11 integration audit](combat-integration-audit-2026-11-11.md) extends measurement to seeded space/nebula arenas, ordinary/boost rams, missiles, natural enemies, two-ship fleets, carry-forward attrition and exact saved continuation. Its maintained runner is `qa/combat-integration-audit.cjs`; use the [QA instructions](../qa/README.md#integrated-combat-audit) to reproduce it. Scripted fitting grants and limited policies remain explicit limits; the earlier 192-fight numbers above are historical, not expectations for the new sample.
