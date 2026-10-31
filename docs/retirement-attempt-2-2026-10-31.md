# Second retirement attempt — October 31, 2026

Played experimental.9 on `experiment/expedition-legacy`. The goal was to reach 10,000 credits and choose native station retirement. The career ended in crew death instead; no successful retirement is claimed.

## Result

| Measure | Result |
| --- | ---: |
| Hull / captain / ship | Light Scout / Mara Vale / Far Lantern III |
| Seed | 104729, fixed before play |
| Last global turn | 5,067 |
| Ending cash | 3,842 cr, from 500 cr |
| Surface expeditions, including interiors | 28 |
| Station visits, including initial visit | 65 |
| Game's planets-scanned counter | 113 |
| Completed science contracts | 1 |
| Delivered passengers | Mira Vale |
| Native ship retreat attempts / surrender offers | 31 / 1 |
| Final ship | Hull 120/120, fuel 85/120, engine 3, sensors 5, shield 1 |
| Ending | All crew dead on Matar II |
| Captured JavaScript errors | 0 |

The trace records 17,500 input/action selections, but **11,858 were repeated observe/back dialogue selections** during a pilot bug at turn 3451. They did not advance time and must not be presented as 17,500 meaningful gameplay turns. There were 5,066 actions that advanced the global clock, from its initial turn 1. Other native actions, including ship combat and station services, can legitimately have zero global-turn cost under the current game rules.

## The career

The opening had **no Mercy wreck, marker or coordinates message**. Normal exploration discovered its nearby distress transmission on **turn 290**, at (12,9). The pilot boarded on turn 293, found Mira on 298, brought her aboard on 308 and delivered her to Omega on 319. It did not restore life support or complete the other rescues.

Exploration and sample sales funded equipment and the same final ship upgrades as the previous run. The initial corpse contract was relinquished; a civilization survey completed on **turn 2007 for 750 credits**. A subsequent 20-biodata contract remained unfinished. This pilot takes relatively short surface trips and sells available samples rather than deliberately stockpiling enough for that contract; its failure does not show that the contract is impossible.

Surface risks caused lasting losses. Scientist Moreau was killed by a Void Kratharwrak on **turn 819**. On Menkar III, Captain Vale suffered heavy bleeding and further creature attacks. A medikit restored health but did not resolve the ongoing bleeding; Vale died on **turn 1463**. The game continued with navigator Cass Strand and engineer Hana Brown. The pilot did not recruit replacements.

The revised ship policy used enemy guns, attack range and hull displayed in combat. It tried to escape stronger enemies before fighting down to a low hull threshold. That kept the ship alive through multiple Dreadnought interceptions. It also encountered repeated interception/escape chains, exhausted fuel twice, used the normal SOS system and survived assistance from other vessels. A station patrol transferred 70 fuel for free on turn 3319. Retreat was therefore useful but not a complete solution to navigation, pursuit or fuel management.

At an Information Age crystalline settlement on **turn 3451**, the private controller repeatedly selected observation and Back. It was stopped at a retained checkpoint, corrected to prefer untried dialogue routes, then resumed from that same state through the game's snapshot parser and installer. The corrected choices requested the local contact protocol, presented identification and stated intent, then ended contact. The crew, resources, losses, world and random state were retained; the career was not restarted or rewound to avoid a consequence.

On **turn 5042**, the two remaining crew landed on Matar II, a habitable world with a **territorial medieval Fungoid civilization**. The log explicitly warned that a patrol was blocking the road and expected a response with T. The controller kept walking and exploring. The warnings escalated, defenders appeared, and its eventual choice to withdraw was followed by more exploration instead of an immediate physical return. A hostile creature and local defenders attacked. The attempted return path also bumped into defenders, causing melee combat. Brown died on **5066** and Strand on **5067**. The ship itself still had full hull and substantial fuel.

## What this establishes

- Mercy can arise naturally during an ordinary career, without a startup lead. This one success does not measure its overall occurrence frequency.
- Stronger-enemy-aware retreat improved survival against ships in this run, but pursuit chains still consumed fuel and money.
- Survey income supported thousands of turns, equipment and repairs. It did not reach the chosen retirement target here.
- The final deaths expose shortcomings in the **pilot**: it must respond to explicit contact warnings, honor withdrawal spatially, avoid populated territory when shorthanded, handle bleeding, and consider replenishing crew. A pathfinding policy that treats these worlds primarily as sample routes is not a competent whole-game player.
- There is insufficient evidence here to recommend easier civilizations, weaker creatures, larger rewards, or cheaper services. The game's warnings and consequences operated; the controller failed to use them well.

The native-action ledger reconciles **500 + 12,304 positive action credit changes − 8,962 negative changes = 3,842**. These are net changes per action, not a gross economic ledger: one action may combine payroll, delivery or other effects.

## Method and limits

Headless Edge executed actual movement, scanning, surface interaction, inventory, combat, trading, station treatment, contracts, SOS and rescue functions. Debug and cheats were off for the career. Only normal UI selection fields were assigned in game state; resources, mission success and retirement were not injected. Decisions used charted geography, visible enemies, revealed terrain and public messages. The seed was retained from the previous experiment for comparability, but the new random event rolls and changed policy alter subsequent random outcomes, so it is not a controlled balance comparison.

One controller checkpoint resume was required to fix the dialogue loop. It occurred after existing losses, outside ship combat, and retained those consequences. This is different from the previous report's uninterrupted career and is disclosed here. The final death was not replayed. The action ceiling was raised to 50,000 to allow continued play despite the inflated dialogue count; native death ended the run first. No manual native playthrough or statistically representative balance claim is made.

The complete local trace, final save and ending screenshot are retained separately. The first-contact choice loop and forced random outcomes used in the separate encounter QA scenarios are not game changes or fixtures in the reported career.

## Encounter implementation and validation

Mercy is absent at galaxy generation. Normal galaxy movement passes newly revealed sectors from the actual sensor/shadowcasting result to the encounter code. Each eligible interior VOID sector has a **1-in-1,000** roll; a hit creates one nearby Mercy incident and its discovery log entry. No deadline guarantees a hit. Charted sectors persist in saves, so waiting, backtracking and loading a charted area do not reroll it. The player, other objects, existing ships and loose cargo are excluded. Existing Mercy incidents prevent another spawn, including after completion. Initial station reveal and remote drone reveal do not roll. Debug worlds do not roll; the palette's explicit Mercy factory remains guaranteed.

All **40 repository tests** passed. Headless QA confirmed **12 fresh careers without a Mercy wreck, marker or startup message**, a losing discovery roll, no reroll on charted movement, an actual movement discovery within sensor range, one signal, a dormant air clock before boarding and transactional save/load retention. Separate fixture tests covered all palette factories and career restoration, plus 15 spatial rescue scenarios with **869 actual surface steps**, without JavaScript errors. Forced rolls and isolated worlds were used only for these labeled QA scenarios.

Existing saves keep any already-created wreck, progress and historical signal messages. No save-format migration or retroactive log deletion is performed. Start a fresh career to observe the new opening; use Shift+B → F2 and the Mercy sample for repeatable personal playtesting.
