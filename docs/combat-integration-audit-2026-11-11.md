# Combat integration audit — November 11, 2026

Branch: `experiment/expedition-legacy`. Local build: **0.28.0-experimental.96**. No GitHub publication or executable packaging.

The combined mechanics ran without runtime errors, invalid sampled saves, actor overlaps, negative resources or incorrect action-turn accounting in the final audit. One genuine integration defect was reproduced and fixed: a player withdrawal attempt advanced the turn and missiles but omitted nebula scheduling. A failed attempt could leave a pending discharge with an expired deadline, preventing the continuing encounter from passing save validation. Withdrawal now advances the environment before resolving the encounter/reset. The strict save validator remains intact; schema five is unchanged.

These measurements support continuing human playtesting of the current combat foundation. They do not certify final balance, optimal tactics or a whole-career survival rate. Frequent deaths against deliberately selected severe threats are compatible with the [design philosophy](design-philosophy.md).

## Reproduction and limits

After the portable dependency/browser setup in [qa/README.md](../qa/README.md), run:

```sh
npm run build
npm test
node qa/combat-integration-audit.cjs
node qa/run.cjs ramming nebula-combat combat-cover combat-ui combat-speed ship-combat bridge combat-resolution missile-flight artemis disengagement ship-systems ship-pursuit palette autosave
```

The audit uses the real built HTML in isolated headless Microsoft Edge on this Windows machine, with HTTP(S)/analytics blocked. The same runner defaults to Playwright Chromium on other machines. Fixed baseline-generation seed: `111126`; six separately seeded combat cases per single-enemy pairing. The measured HTML SHA-256 is `2d3ab7bfdb3d43e6975f36c30699d4143ead8fb3678ea82914666119baa48fdf`. The final audit completed in 130 seconds here; timing is not a performance benchmark.

The maintained [runner](../qa/combat-integration-audit.cjs), [pilot/observer](../qa/combat-integration-policy.js) and [shared fixture](../qa/ship-combat-fixture.js) produce ignored `qa/artifacts/combat-integration.json`, including every result, event counters, final damage/crew/weapon states, recent traces and save comparisons. Re-running replaces that report unless `PROSPECTOR_QA_OUTPUT` selects another directory. This document retains the meaningful findings; personal saves, generated traces and screenshots are not committed.

The default coverage is:

- **864 isolated single-enemy fights:** three starter hulls × starting/trained crews × space/nebula × ranged/selective-ram pilots × six threats × six seeds. Bound: 90 actions.
- **48 isolated two-ship fights:** the same hull/crew/environment/policy combinations, with two pairings: close-assault Corvette plus sniper Cruiser, or skirmishing Frigate plus Artemis Raider.
- **24 three-encounter chains:** a weak raider, skirmisher and missile opponent in sequence, with real paid sector movement between encounters. Damage, injuries, losses, heat, reloads, ammunition and fuel carry forward. No healing, repairs, resupply or revival. Bound: 90 actions per fight; stop on death, withdrawal or cap.
- **24 paired save comparisons:** replay the same seed/profile against a sniper with and without a real current-format import at action twelve, then compare the complete final serialized career. All 24 imported while still fighting and matched exactly.
- **14 extended cap investigations:** recreate the original unfinished cases at a 200-action bound, separately from the main matrix.

The fixtures grant a legal Freighter gun bay and fitted weapon, rather than testing its unarmed factory start. Scout/Freighter use a Mass Driver or Pulse Laser; Corvette uses Railgun + Mass Driver or Artemis + Mass Driver. Artemis fits only the legal larger Corvette mount and starts with eight missiles. Enemy Artemis has three missiles plus a conventional fallback. Starting crews have CBT 1/NAV 3; trained crews have CBT 6/NAV 6. Both are two-person crews, and skills/equipment are grants rather than economic achievements. Other purchased upgrades, implants and modules are not sampled.

Ship profiles cover close assault, skirmishing, sniper and missile standoff. Natural profiles are a 150-HP/18-attack mobility-three Wraith and a 260-HP/26-attack mobility-three Devourer. They also have controlled ordinary-space counterparts to isolate environment effects; this does not imply those are normal world spawns. Threat types are deliberately equally weighted, irrespective of natural rarity. No conclusion about an ordinary new player's death rate follows from the pooled percentage.

Both pilots read current visible contacts, charted rocks and visible exhaust. They fire ready weapons, use safe-looking boosts and attempt withdrawal below 30% hull or without usable powered ammunition. The mixed pilot also tries ordinary/boost rams when the size/remaining-hull calculation looks favorable. It does not ram with offline engines. Neither policy can read the pending lightning schedule. They lack human planning, repairs, surrender, deliberate asteroid crashes and sophisticated reacquisition after losing contact. During development an offline-engine ram choice was corrected in the test pilot; the final matrix recorded no free action refusals.

Only rendering and feedback playback are suppressed within batches. Native actions still own enemy responses, travel, fuel, heat, reloads, missiles, damage, criticals, casualties, training and endings. Every committed action is checked to spend exactly one turn. Resource/actor invariants are checked after each action; current-format snapshots are parsed every ten actions and at endings. Seed-multiple-of-three fights also import at action twelve if active. The primary matrix committed **19,935 combat turns**, **2,370 snapshot validations** and **196 mid-fight imports**; the chains, extended cases and paired comparisons are additional and are not included in those totals.

## Main outcomes

The **912 standalone fights** produced 530 victories, 134 player withdrawals, 231 deaths, three enemy escapes and 14 bounded stops. A victory requires every encountered enemy to be destroyed. An enemy escape or player withdrawal is not counted as a victory; a capped fight is unresolved.

| Hull | Fights | Victories | Deaths | Player withdrawals | Enemy escapes | 90-action caps |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Light Scout | 304 | 127 | 119 | 56 | 2 | 0 |
| Bulk Freighter | 304 | 153 | 76 | 64 | 1 | 10 |
| Attack Corvette | 304 | 250 | 36 | 14 | 0 | 4 |

The armed Corvette is strongly favored in this equipment sample; these are different hulls with different legal fittings, not a controlled comparison of hull size alone. The Freighter's larger hull and ram size help survival, but its mobility-one/sensor-one profile struggles to finish long-range opponents. The Scout's low mass/hull leaves very little margin for natural-entity contact. All 48 Scout/Wraith cases ended in death despite this pilot using boosts and attempting low-hull withdrawal. That deserves deliberate human testing of early disengagement, not an automatic nerf based on mortality alone.

| Comparison | Fights | Victories | Deaths | Fights with a personnel death before hull loss |
| --- | ---: | ---: | ---: | ---: |
| Starting crews | 456 | 252 | 124 | 104 |
| Trained crews | 456 | 278 | 107 | 88 |
| Ranged policy | 456 | 265 | 113 | 93 |
| Selective-ram policy | 456 | 265 | 118 | 99 |
| Ordinary space | 456 | 258 | 115 | 103 |
| Nebula | 456 | 272 | 116 | 89 |

Training helped on aggregate without eliminating danger. Selective ramming did **not** increase aggregate victories and incurred slightly more deaths/personnel-loss fights in this sample. That is evidence against an obvious universal ram win button for these policies; it is not proof an expert cannot exploit the current formula. Environment changes alter positioning, accuracy and random-roll histories, so the space/nebula totals are not a statistically independent difficulty estimate.

| Opponent | Fights | Victories | Deaths | Player withdrawals | Enemy escapes | Caps |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Weak close-assault raider | 144 | 144 | 0 | 0 | 0 | 0 |
| Skirmisher | 144 | 133 | 2 | 7 | 0 | 2 |
| Sniper | 144 | 78 | 19 | 35 | 2 | 10 |
| Artemis Raider | 144 | 67 | 28 | 48 | 1 | 0 |
| Wraith | 144 | 92 | 48 | 4 | 0 | 0 |
| Devourer | 144 | 2 | 116 | 26 | 0 | 0 |
| Two-ship fleet | 48 | 14 | 18 | 14 | 0 | 2 |

The weakest 30-HP raider is easy for these granted armed outfits; missile opponents, multiple enemies and severe natural threats are substantially more dangerous. The Devourer is overwhelmingly lethal in these tested fits. Encounter frequency, spotting/preparation and the decision to engage are not simulated here.

## Combined mechanics and attrition

The standalone sample exercised **2,520 boosts**, **277 player rams** (including **69 boost rams**), **1,888 incoming natural rams**, **478 player missiles** and **504 enemy missiles**. Rules for travel time, recoil, shield bypass, criticals, crew damage and finite ammunition stayed active. Personnel deaths before hull destruction occurred in **192 fights**. These are event counts, not accuracy or damage-efficiency rates.

The 456 nebula fights split evenly into **228 gas-only** and **228 mixed** layouts, with **602 lightning discharges**. Observed lightning hull loss after protection was 37 player HP and 66 enemy HP across the primary matrix. Many discharges hit no actor or were shielded; those small hull totals do not measure shield pressure or the severity of deliberately remaining in a struck pocket. They do suggest lightning was intermittent background pressure for these routes, rather than the main source of deaths. No lightning-balance adjustment was made.

**120 fights** had at least one multi-tile rock. Neither cautious pilot crashed into an asteroid; this audit cannot estimate human crash frequency. The separate `ramming` and `combat-cover` scenarios verify actual first-/second-step/non-anchor crashes, all footprint damage ranges, stopped movement, costs, deaths, full shields and saved endings. Similarly, the moving-target Wraith chase, exact missile impacts, surrender, stranded rescue and mouse/keyboard paths are established by the focused suites, not by pretending the matrix deliberately chose all those actions.

The 24 chains reached **67 encounters**. Eight pilots cleared all three, twelve ended by withdrawal and four died. Clearance includes destruction or enemy escape, not a claim of three kills. Scout completed 0/8 chains, Freighter 1/8 and Corvette 7/8. This demonstrates meaningful carry-forward attrition and the value of repair/resupply opportunities; the scripted short sequence does not assess their availability or price in a real expedition.

## Capped fights and the confirmed defect

Ten original caps involved a Freighter (eight snipers and two fleets); four involved a Corvette (two snipers and two skirmishers). The extended replays resolved **ten by player withdrawal** and **two by victory**, leaving two unresolved at 200 actions. The moving/reloading traces and later endings do not indicate twelve permanent game stalemates.

The remaining two were starting/trained mixed-policy Corvettes against the seed-three skirmisher in ordinary space. Their sensor component was at 50%, leaving an effective sensor range of zero. The pilot kept patrolling the edge rather than withdrawing because it still had ample hull and nominally usable weapons. Its blind reacquisition/retreat policy is limited. Direct native withdrawal probes each spent one turn, failed the ordinary failure roll, reset positions correctly and retained a valid snapshot. These probes establish that the action was available and functioning; they do not claim eventual successful escape from those two particular probes. Existing deterministic `disengagement` checks cover success as well as failure. No automatic forced victory or game-rule change was added for these controller loops.

The **actual defect** was separate: pending nebula lightning was not advanced by `doShipRetreat`. The new `nebula-combat` regression failed against experimental.95 before the fix and passes against .96. It schedules an imminent discharge, takes a real failed player withdrawal, verifies environment advancement and parses the continuing career. .96 calls the same native environment advancement used by other combat actions after missile resolution. A continuing encounter can no longer retain that expired charge; withdrawal is also no longer a storm-free action. No migrations or weaker save checks were introduced.

## Validation and remaining work

Built the HTML; all **114 root tests** and generated source/version checks passed. All **15 named headless suites** in the reproduction command passed against .96. The integration audit completed with zero recorded runtime errors, all invariants/sampled saves valid, and **24/24 exact paired saved continuations**. Debug reset/return and career isolation, failed-load preservation, asynchronous autosave failures/recovery and stale-window protection passed their relevant suites. Development smoke/intermediate measurements are not added to the final sample size above.

Human follow-up should focus on early Wraith escape, slow-hull sniper fights, loss of sensor lock and whether the ram size advantage feels fair across more equipment. Wider fitting/skill/crew samples, real economic acquisition, encounter distributions, whole-career recovery, richer pilot policies, independent run-age escalation and subjective readability/enjoyment remain outside this audit. Pulsar and wormhole combat environments remain planned. No mortality-driven balance changes, GitHub publication or Windows executable were part of this pass.
