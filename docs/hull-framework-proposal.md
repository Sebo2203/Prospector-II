# Hull framework and purchase economy — proposal

Status: historical design proposal reviewed against experimental.82 on 9 November 2026. The accepted first implementation is now in experimental.83; see [current hull rules, prices and limitations](hull-framework.md). Findings and tentative language below describe the pre-implementation review, not current behavior.

## Findings in the current game

- Every hull change costs 3,000 credits, independent of target hull or the ship being surrendered. There is no trade-in credit.
- Changing hull resets purchased stat upgrades. Hull HP percentage and available fuel are carried into the new limits; core damage/readiness state is recreated. Installed weapon/module arrays, cargo and crew are retained without a complete transfer/fit transaction. Some retained weapons can become offline or inaccessible when the new hull has fewer/smaller mounts. A purchase should explicitly resolve this before payment.
- Class limits live in `SHIP_CLASSES`, mount/reactor/cooling profiles in `SHIP_HULL_SYSTEMS`, and additional cargo caps in both station actions and UI. The same three hull IDs are repeated in Hangar drawing, selection and purchase code as well as starting selection.
- The Scout is described as fast and nimble but has engine 2→3, while the Corvette has 3→5. One engine rating currently governs several advantages. A future framework should distinguish efficient exploration and maneuverability from raw military thrust, rather than claiming those are already different systems.
- Nearby economic anchors: mounts/modules unlock for 500 credits, the Artemis launcher costs 1,200, science jobs pay 500–900 gross, and retirement is offered at 10,000 credits. Gross rewards are not disposable profit after fuel, repair and payroll. No fresh career-income survey was run for this proposal.

## Physical constraints, then fitting choices

Size should create room and exposure, not make every large ship superior. Start with a few meaningful hull inputs:

| Input | What it constrains |
| --- | --- |
| Physical size | Usable volume, room for bays/habitation/tanks, profile and environmental exposure |
| Structural strength | Supported armor and weapon loads; reinforcement also contributes mass/cost |
| Machinery capacity | Space and connections for drives, reactors, cooling and shield equipment |
| Hull geometry | Mount placement, drive arrangement and maneuverability; a cargo box and patrol craft use space differently |
| Engineering quality | Efficiency/compactness and the performance achievable from installed machinery and instruments |

The default **layout** allocates these resources to the ship's purpose. It is an allocation, not an unexplained bonus to every statistic. Avoid replacing eighteen unrelated caps with eighteen equally unrelated multipliers.

Use one fitting calculation for all hulls. The important hard constraints are of the form:

```text
sum(component space) <= usable fitting space
sum(mount/armor structural load) <= frame support
component and mount dimensions fit the available bays/attachment geometry
installed power demand <= reactor output
```

Heat remains a runtime tradeoff: a hot loadout can be legal but cannot fire continuously. Cargo, tanks, crew accommodation, utility modules and machinery should eventually compete for internal space. More volume makes a Freighter flexible, while its frame/machinery/geometry prevent that volume from becoming a free military conversion.

Separate the maximum envelope from the current outfit. Buying equipment improves performance inside the envelope. More extensive station refits can reallocate a limited amount of space, for example trading some cargo for a utility bay or defensive weapon. They cannot replace the ship's fundamental frame or erase all its weaknesses. Do not advertise every separate maximum as simultaneously attainable.

Exact coefficients, component volumes and resulting limits need a small prototype matrix before runtime replacement. The current numbers are not a physics baseline that the formulas must reproduce exactly. First migrate the existing roles into a coherent shared calculation; broader drive/mass/agility changes require their own combat-balance pass.

## Preserve useful specialties

| Hull | Remains best at | What upgrades can bridge | Persistent compromise |
| --- | --- | --- | --- |
| Scout | Efficient long-range survey and precision instruments | Basic defense, endurance and a little utility capacity | Small fitting volume and limited sustained weapon/crew/cargo load |
| Corvette | Supporting powerful weapons, shields and combat machinery | Enough exploration utility for a combat expedition | Limited expedition/cargo volume and running cost |
| Freighter | Cargo, expedition supplies, crew and utility flexibility | Convoy defense, adequate sensors and a better drive | Poor maneuverability, large signature and limited military frame/machinery support |

A refitted Freighter can be a useful armed hauler; a dedicated military hull should still use comparable weapons more effectively. A refitted Corvette can explore; an equivalent investment in the Scout should retain survey/endurance advantages. Later hulls can be larger or more technologically advanced without being better in every activity. Size already increases charged-gas exposure; other size penalties should be introduced only alongside their actual gameplay rules, not presented as existing behavior.

## Replace the flat switching fee with a purchase quote

Provisional factory-standard hull values, including their stock essential systems but excluding weapons and optional utility gear:

| Hull | Proposed list value |
| --- | ---: |
| Light Scout | 3,000 cr |
| Bulk Freighter | 4,500 cr |
| Attack Corvette | 6,000 cr |

These are starting tuning values, not measured final balance. Their differences reflect fitting/industrial complexity as well as size; the largest ship need not be the most expensive.

Use:

```text
net purchase = target hull price + transfer service + purchased additions - old hull trade-in
```

Initial model: 500-credit transfer service, up to 50% of the old bare hull's list value as trade-in, reduced by hull/core condition. Return perhaps 25% of condition-adjusted, documented investment in permanent hull refits; do not silently erase all of it. Transfer compatible weapons, utilities and missiles as owned equipment, with no double counting in the hull trade-in. Final condition weights and refit recovery need verification before shipping.

Illustrative healthy, unmodified swaps, with no equipment purchases/refit recovery:

| Swap | Proposed net charge |
| --- | ---: |
| Scout → Freighter | 3,500 cr |
| Scout → Corvette | 5,000 cr |
| Freighter → Scout | 1,250 cr |
| Freighter → Corvette | 4,250 cr |
| Corvette → Scout | 500 cr |
| Corvette → Freighter | 2,000 cr |

These starter values cannot generate an immediate cash payout from selling the starting Corvette into a Scout. Round trips lose value. Selling a genuinely earned expensive later ship into a cheaper one may legitimately release capital; that is not automatically an exploit.

The quote must show old-ship valuation, retained gear, new-ship condition/equipment, removed refits, crew/cargo capacity, and exact final payment before the transaction. Resolve incompatible weapons, excess crew, modules and cargo by an explicit legal transfer/sale/unload decision, or block/cancel the swap. Do not silently delete them or retain active equipment beyond the new limits. A factory-standard replacement should have its advertised condition; the old ship's damage belongs in its trade-in valuation rather than being mysteriously copied onto a new frame.

Measure affordability using whole-career net earnings and the ability to keep a fuel/repair/payroll reserve after purchase. A higher sticker price alone does not make progression healthy. Later specialist hulls can initially be explored in an 8,000–15,000 range and larger/advanced hulls above it, but those bands remain hypotheses, especially against the current retirement threshold.

## More hulls without more starters

Keep an explicit `STARTER_HULL_IDS` list containing exactly Scout, Freighter and Corvette. Store all purchasable definitions in one hull registry. Hangar availability/stock queries use the registry, never the starter list or another repeated three-item array. A future hull can be purchasable later without entering character creation.

Separate factory hull, starting loadout and current owned outfit/upgrades. An initial Corvette's railgun belongs to its starting package; buying a bare Corvette must not silently create or duplicate one. Use one derived-stat/fitting API for menus, purchases, combat, hazards, debug and save validation. Preserve authoritative state until a complete purchase quote validates and commits.

The Hangar needs a scrolling/paged catalog before its list grows beyond three cards. Combat currently has a tested three-mount strip; larger derived mount counts need an explicit readable layout rather than compressed cards. New hulls must receive usable normal interactions and debug coverage before availability is enabled.

Suggested first implementation: consolidate the registry/starting list and price/quote logic, then introduce shared fitting budgets and refit limits for the three existing hulls. Add later hulls only after those rules work. No new hulls, trade-in system, fitting budgets, mass-based motion or prices described here are implemented by this proposal.
