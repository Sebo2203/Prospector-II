# Ship combat review — 9 November 2026

Reviewed the local `0.28.0-experimental.77` build on `experiment/expedition-legacy`. No combat rules were changed or published by this review.

Follow-up: local experimental.78 implements fixes for the two confirmed problems below. Stalemates between immobile ships with no usable firing line return to stranded/SOS handling, and the highest surviving fleet demand governs surrender independently of selection. `qa/combat-resolution-scenarios.cjs` checks these fixes; see the [changelog](../CHANGELOG.md#2026-11-09--experimental78-combat-stalemates-and-fleet-surrender). The observations below describe the reviewed experimental.77 behavior. Engine/loadout balance, bridge skills, enemy tactics and powerless edge withdrawal remain open questions.

The tactical system is a useful experimental foundation, but it is not ready to call finished or balanced. Fix the two reproducible rule problems below before adding more combat content. Neither fix requires making encounters safer.

Later follow-up: experimental.86 separates CBT gunnery/NAV evasion from engines, adds real player crew casualties/training and four enemy tactic families with cover routing. It also records 192 bounded matchups and fixes retreat/overheat loops found by that audit. See [current combat rules and limits](ship-combat-crew.md). The remaining observations below are historical findings against experimental.77, not a claim that these features are still absent.

## What is working

Positioning matters through cover, weapon range, exhaust and reaching an escape edge. Independent mount reloads make moving, firing another mount, waiting and boosting different decisions. Reactor capacity, mount sizes and heat constrain fitting. Shields and persistent component damage connect the encounter to preparation, repairs and later survival. Multiple enemies, civilian escape, reputation consequences, salvage and station-paid bounties give fights consequences outside the arena.

Keep lethal criticals, risky withdrawal and enemies the starting ship cannot beat. Frequent deaths are consistent with the design philosophy; they are not evidence that these mechanics failed. The requested 25% disengagement failure and position reset are deliberate rules, not findings to reverse.

## Confirmed problems

### 1. Disabled ships can produce a combat stalemate

Controlled fixture: Scout with a Mass Driver, destroyed engines, no engineer, zero credits and no cargo; enemy with destroyed sensors at the ordinary six-tile starting separation. Movement is refused, the five-range weapon cannot fire, retreat requires reaching an edge, and surrender is refused. The blind enemy neither moves nor attacks. After surrender and 30 waits (31 committed turns), positions and both hull values were unchanged, and combat remained active.

The runtime has no path in this state to ordinary stranded/SOS processing. The source rules explain why further tactical waits do not solve the position or equipment problem. This demonstrates a possible state, not its frequency in natural careers. A clear terminal loss or a dangerous transition into disabled-ship handling would resolve it; a guaranteed rescue is unnecessary.

Relevant code: `moveShipInCombat`, `moveShipCombatEnemy`, `moveShipCombatEnemyStep`, `doShipRetreat`, and `doShipSurrender`.

### 2. Selecting a weaker target changes surrender terms for the entire fleet

Controlled fixture: a Flagship and Corvette wingman, with 600 player credits and no cargo. The Flagship demands 495 value; the wingman demands 159. The player's offer is 300 in either case. Selecting the wingman and surrendering accepts that offer and marks **both ships** satisfied. Selecting targets is free.

`updateShipCombatTarget` changes `combat.pirate`, which `doShipSurrender` uses for the demand. Acceptance then satisfies every living enemy. Fleet terms should use a stable encounter authority or an explicit fleet calculation, independent of the firing cursor.

## Balance and integration concerns

These are review judgments, not measured whole-career balance failures:

- **Engines multiply advantages.** They improve relative movement, hit probability, evasion, exhaust damage and exhaust persistence. At range five, engine-five versus engine-one accuracy is 97.5%, while the reverse shot is 37.5%. An engine-one opponent gets two movement steps per ten player actions against engine five; its weapon firing opportunities are not reduced by that movement ratio. Exhaust damage rises from two to ten. Stronger engines cost more boost heat, but ordinary movement still costs two heat and no fuel. Test real affordable fittings and pursuit/escape policies before deciding whether this is too strong; do not weaken engines from this table alone.
- **Crew skills barely participate in ship combat.** Engineers matter for field repairs, and existing crew conditions still tick. However, ship hit chance uses engines and distance rather than crew skills, and firing/kills grant no direct combat or navigation XP. Ship fighting therefore does little to develop the core bridge crew. Ground combat does have training grants. Decide on modest, clearly attributed contributions rather than automatically adding large skill bonuses or XP for harmless waiting.
- **Enemy tactics are limited.** Armed ships mostly pursue and fire, or hold while reloading/cooling; unarmed ships flee and natural entities close to ram. Armed movement scores immediate distance and exhaust danger. It does not plan flanks or consistently express distinct long-range and close-range roles. Role-specific tactics and a test for repeated kiting would add more decisions than simply increasing hull HP.
- **Powerless edge escape needs an explicit rule.** A fixture at the edge successfully withdrew with zero fuel and destroyed engines. If this represents coasting, describe that consistently. If withdrawal requires propulsion, its action guard and readiness display need to agree. This review does not classify coasting itself as a defect.

## Evidence and limits

`npm test` passed all 86 root tests and the generated-source check. Five headless suites passed: `ship-combat`, `ship-systems`, `combat-speed`, `disengagement`, and `ship-pursuit`. They establish their checked behavior, not final balance.

Run the diagnostic fixtures with `node qa/review-ship-combat.cjs` after the normal [QA setup](../qa/README.md). They use the built HTML, isolated browser storage, blocked HTTP(S), actual game actions and deliberately constructed states. Fixed randomness isolates the rule interactions. The diagnostic reports observations rather than asserting that the current undesirable behavior should remain. Generated results go to ignored `qa/artifacts/combat-review.json`.

This pass did not measure natural stalemate frequency, survival rates across all hulls/loadouts, combat profitability over a career, or human enjoyment/readability. The independent run-age escalation curve is still planned; the cosmetic hours/days clock does not supply it.

Recommended order: resolve stalemates and fleet surrender, measure engine/loadout and kiting matchups, then connect bridge skills and enemy roles more deliberately. Preserve the harsh survival target throughout.
