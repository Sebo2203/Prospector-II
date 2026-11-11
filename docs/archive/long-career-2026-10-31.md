# Long retirement attempt — October 31, 2026

Played experimental.8 on `experiment/expedition-legacy`, including the new random Mercy location. Main is unchanged.

## Outcome

Captain Mara Vale's Light Scout **Far Lantern II** survived **3,354 turns and 3,752 pilot actions**, ending with **3,719 credits** when a Dreadnought destroyed it at Pyreth System (77,14). The pilot's chosen goal was 10,000 credits before voluntary retirement. It did not reach that goal or retire. Lower-value retirement was available but was not chosen.

| Measure | Result |
| --- | ---: |
| Starting cash | 500 cr |
| Final and highest checkpoint cash | 3,719 cr |
| Station visits, including initial visit | 39 |
| Surface expeditions, including interiors | 20 |
| Game's planets-scanned counter | 68 |
| Completed science contracts | 1 |
| Delivered survivors | 1 |
| Ship-combat actions | 37 |
| Crew before destruction | All four at full health |
| Final ship upgrades | Hull 120, fuel 120, engine 3, sensors 5, shield 1 |
| JavaScript errors | 0 |

## What happened

- **Opening:** the ship started at (46,46); Mercy was at (39,24), 29 Manhattan tiles away instead of the old four-to-seven-tile band. This is one random placement, not a guarantee of distance. The distress transmission still provides coordinates.
- **Turns 23–58:** the pilot boarded, found Mira, escorted her to the airlock and delivered her to Omega for 100 credits. It did not repair life support or revisit the other compartments. The pilot never learned the other survivors' fate during play. A separate ending-save inspection shows Rowan and Ilya later died after the air reserve failed; those hidden facts did not guide decisions.
- **Early exploration:** the five-corpse contract did not match the scout's work. The pilot abandoned it and accepted a civilization survey. Survey data and surface samples funded fuel, payroll, equipment and upgrades.
- **Turns 420–1737:** it purchased hull, engine, sensor, tank and shield improvements, eventually reaching the upgrades above. It bought four ordinary handguns and equipped the crew through the inventory. Earlier pirate encounters were survivable, but one station return arrived with hull 35 and another with hull 41. Repairs consumed real money. It destroyed a Raider Gunship and Raider Frigate for 255 credits combined.
- **Turn 2201:** after detecting a medieval mammalian civilization around Vega, it completed the civilization survey for **750 credits**. Primitive walking-tree and tribal aquatic civilizations were also detected during this career. This does not establish successful diplomacy or correct aquatic settlement generation.
- **Late exploration:** the next artifact contract remained unfinished. Surface exploration and combat continued; all four crew survived and recovered to full health. The last station return sold 180 credits of survey data and 304 credits of samples, then refueled for 66 credits, leaving 3,719 credits.
- **Turn 3354:** a Dreadnought intercepted the scout. Its single Mass Driver was outmatched by three enemy guns. Five exchanges removed its 120 hull. The pilot kept firing at 43 hull, just above its 35% retreat threshold (42), and the next volley killed it. It made no retreat or surrender attempt in that final encounter. No resurrection or post-death replay was used to improve the result.

## Cash flow

The complete native-action trace records **9,866 positive** and **6,647 negative** credit changes: **500 + 9,866 − 6,647 = 3,719**. These are net action deltas, not separate gross revenue and expenses: a survivor handover and payroll can share one docking action.

Purchase-action totals include fuel 1,627 cr, repairs 1,350 cr, ship upgrades 2,050 cr and four handguns 600 cr. Survey/sample sale actions added 8,699 cr, the completed contract 750 cr and pirate victories 255 cr. These selected categories describe the costs and rewards; the complete action ledger above reconciles the balance.

## Findings and limits

The survey/sample economy supported a long career, equipment, repairs and wages, but this run did not demonstrate wealthy retirement. Frequent docking was expensive. The pilot revisited handled systems and took cautious return trips that a human could consolidate. This alone is insufficient evidence for cheaper fuel or larger rewards.

The strongest controller finding is that a fixed low-hull retreat threshold is inadequate against a stronger enemy. Future pilots should consider observable enemy class, guns and damage before losing most of the hull. The final death remains the reported result. The surface policy also prioritized returning with one survivor over stabilizing Mercy's life support.

The death screen displayed **Crew lost −1**, despite no crew loss before destruction, and labels generated map count as planets visited. Its “Credits earned” shows ending cash rather than gross income. These reporting defects are not repaired here. The known action-clock inconsistency is also visible: all five final exchanges occur at global turn 3354. See the [foundation review](foundation-review-2026-10-31.md) for other unresolved issues.

## Method

- One seeded normal career, **104729**, Light Scout, debug and cheats off. A 20,000-action cap was available; native death ended it first.
- Headless Edge executed actual actions for movement, scanning, walking, combat, inventory, purchases, sales, contracts and docking. No resources, health, mission completion, teleportation or retirement were injected. Only ordinary UI selections were assigned in game state.
- Decisions used revealed galaxy objects, visible enemies and known surface terrain. Public distress coordinates were allowed information. Postmortem inspection is identified above and did not guide play.
- A preliminary controller calibration stopped at action 562: its frontier selector treated an out-of-bounds neighbor as fog on the opposite end of a row. That private pilot bug was corrected and the **same seed** replayed from the start. No alternative seed was chosen for a favorable outcome, and no gameplay mechanics were changed to improve the result.
- The final career used no reloads or reversal of consequences. Periodic game/controller checkpoints and the ending save are retained for diagnosis. Seeded random state is recorded; cross-version or wall-clock-dependent replay identity is not guaranteed.
- One policy and seed cannot establish class balance, Dreadnought fairness, all contracts, long-term diplomacy or the retirement economy. No manual desktop playthrough is claimed.

## Placement validation and saves

All 39 repository tests passed. New tests cover 100 seeded placements across all four quadrants, removal of the old distance band, bounds, occupied-cell preservation, existing encounter stability and a full galaxy. Headless checks exercised every galaxy palette factory, including Mercy, interactions, rebuild, save isolation and exact career return. Fifteen rescue regressions traversed 866 actual surface steps without JavaScript errors.

Existing saves retain encounter coordinates and progress. Only fresh placement changes; there is no save-format migration. The initial signal, visible marker, first-boarding timer and debug sample remain available.
