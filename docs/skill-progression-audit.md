# Skill progression audit — experimental.74

Historical findings for experimental.74. Experimental.75 subsequently adopts 25 × next-level XP, restores repeat landing training and makes repeat pulsar observations spend real time/exposure; see [current training rules](crew-progression.md). The measured results below remain unchanged.

Date: 2026-11-08. Build SHA-256: `0e3e9f50e9e6c016c0f6f8f37ad110f1bf81e20ac25e3a0a59f599fe26cfffdf`.

## Finding

The quadratic XP curve appears too steep for level eight to be an attainable long-career progression goal through ordinary work. None of the 21 tested career profiles reached eight. Nine ordinary careers gained no skill levels at all. The strongest Navigator reached level five at turn 5,669 and finished the bounded run at turn 5,789 with 826 earned navigation XP. This is a small policy-driven sample, not proof that level eight is impossible for a skilled human.

The reward distribution also needs attention. Ordinary trade earned no skill XP, and ship combat currently awards no combat-skill XP; ground combat does. A high threshold cannot repair missing rewards for meaningful work. Meanwhile repeated pulsar observations can bypass both time and progression pressure: the separate fixture-assisted check below reached science eight without advancing a career turn.

## Method and limits

- Used the actual built standalone game in isolated headless Edge contexts, debug off. Started fresh careers with 500 credits and the normal Captain/Navigator roster. No XP, money, equipment, immunity or world content was granted; losses were not rewound and no saved careers were resumed.
- Ordinary group: three hull/activity profiles × three seeds (104729, 130363, 155921), up to 3,000 input selections or 60 seconds per run. The existing pilot may retire after several expeditions; these are short careers, not mastery attempts.
- Extended group: all three hulls with a survey policy × two seeds (104729, 155921), up to 12,000 selections or 120 seconds. The policy targets one million credits to suppress early retirement. This does not promise it can earn that amount.
- Focused group: Scout × three seeds for each of two deliberately repetitive policies. One recruits a scientist through the real station action, seeks charted pulsars and repeats observations. The other seeks a charted casino and repeats minimum-stake drinking contests. Only known galaxy cells guide site selection; no teleportation or forced outcome is used in these careers.
- Record every valid XP grant, its caller, recipient, level milestones, turn, remaining XP and outcome. Keep dead/departed crew in the audit. Three contexts run concurrently; wall-clock bounds measure the automation budget, not player time.
- Seeds are reused across hulls and policies. These are 21 profile results over three seed choices, not 21 statistically independent worlds or a measured human success rate.
- Found a pilot defect: it repeatedly requested movement/escape with disabled engines. Added native-action fallback guards and a no-progress cutoff, then made six fresh reruns (three ordinary freighters, two extended freighters and one focused scientist). The table substitutes those final reruns. Intermediate controller-development reruns remain generated artifacts and are not extra independent evidence. No game rules were altered to rescue pilots.
- The focused scientist seed 130363 still reaches a controller stop at turn 380; it is not evidence of a gameplay progression ceiling. A Corvette run stops on dialogue. Deaths are legitimate roguelike outcomes, not test failures. The pilot is not a model of exceptional human play and does not recruit/train every specialist optimally.
- Initial runs seeded new-game generation/actions after startup; startup system-name catalogs were not controlled. The reusable runner now seeds before startup too. Do not expect identical names when replaying initial traces. Observation neutrality was checked separately with startup/action RNG and wall-clock timestamps controlled: identical gameplay state, RNG and input count over 301 native actions, excluding only interpolated sprite animation state (`shipAnim`).

## Career results

The highest skill column includes starting skills: Captain Social 4 is not a level gained. These are 21 distinct profiles, with the six corrected-controller reruns substituted as described above. No profile reached level eight, including any crew member who later died or left.

| Profile | End turn | Input selections | Highest skill | Highest NAV | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| extended-corvette-104729 | 228 | 297 | 4 | 3 | Controller dialogue stop |
| extended-corvette-155921 | 5,193 | 5,669 | 4 | 3 | Death |
| extended-freighter-104729 | 800 | 869 | 4 | 3 | Death |
| extended-freighter-155921 | 1,391 | 1,502 | 4 | 3 | Death |
| extended-scout-104729 | 1,535 | 1,758 | 4 | 4 | Death |
| extended-scout-155921 | 5,789 | 6,313 | 5 | 5 | Time bound |
| focused-science-104729 | 546 | 658 | 4 | 3 | Controller dialogue stop |
| focused-science-130363 | 380 | 684 | 4 | 3 | Controller blocked |
| focused-science-155921 | 5,921 | 6,510 | 4 | 4 | Time bound |
| focused-social-104729 | 1,535 | 1,758 | 4 | 4 | Death |
| focused-social-130363 | 601 | 659 | 4 | 3 | Death |
| focused-social-155921 | 1,693 | 2,187 | 4 | 3 | Contest funds exhausted |
| ordinary-corvette-104729 | 318 | 377 | 4 | 3 | Retirement |
| ordinary-corvette-130363 | 331 | 382 | 4 | 3 | Retirement |
| ordinary-corvette-155921 | 362 | 397 | 4 | 3 | Retirement |
| ordinary-freighter-104729 | 246 | 273 | 4 | 3 | Retirement |
| ordinary-freighter-130363 | 190 | 225 | 4 | 3 | Death |
| ordinary-freighter-155921 | 231 | 253 | 4 | 3 | Death |
| ordinary-scout-104729 | 350 | 411 | 4 | 3 | Retirement |
| ordinary-scout-130363 | 348 | 393 | 4 | 3 | Retirement |
| ordinary-scout-155921 | 352 | 385 | 4 | 3 | Retirement |

The longest ordinary careers ended around turns 318–362 with 35–85 navigation XP; the starting Navigator needs 320 just to gain level four. The three ordinary trade profiles earned no skill XP at all. Using the corrected controller, two extended freighters ended in ship destruction at turns 800 and 1,391 rather than accumulating thousands of refused movement inputs.

The best extended Navigator earned 790 navigation XP from scanning, 35 from first approaches and one from nebula navigation: 826 total. Level four arrived at turn 1,977 and level five at turn 5,669. The run ended at the wall-clock bound while still playable, with one living crew member. Its reported calendar totals about 162 days; that cosmetic clock does not drive the XP rules or difficulty escalation.

One focused social career reached a casino but ran out of contest money at turn 1,693. The Captain earned 212 social XP from contests and 23 from ground combat, leaving Social at four because level five alone costs 500. Other focused runs died or stopped before a useful training result. A recruited scientist cannot be assumed to gain science simply by accompanying a survey: that policy's successful scanners chiefly train the best Navigator.

## Separate XP-source diagnostics — not careers

`node qa/probe-skill-sources.cjs` uses disclosed positional fixtures and real native actions. These results must not be included as successful unassisted careers.

- **Pulsar:** bought a Scientist for the normal 200 credits (Science 2), then positioned the ship at a naturally generated pulsar, bypassing travel. Repeated `doInteract()` 1,990 times. The scientist earned exactly 3,980 XP and reached Science 8; global turn stayed at 1 and credits stayed at 300 after recruitment. This confirms a repeat-observation/free-time XP loophole, not realistic exploration progression. Travel and surviving the pulsar were not tested here.
- **Drinking contests:** positioned a normal starting Captain at the minimum-stake casino screen, with the original 500 credits and ordinary seeded rolls. After 64 contests/289 inputs, the Captain had 172 social XP, remained level 4, had 9 HP and 20 credits, and could not afford another contest. Turn reached 65. No money was added. This sample does not show a reliable shortcut to eight through drinking.

## Curve comparison and next experiment

Current cost to gain level L is 20 × L². Starting at NAV 3 with zero XP, reaching eight requires 3,800 XP: roughly 1,900 two-XP scans, ignoring first-approach and nebula rewards. A hired level-two specialist needs 3,980 XP to reach eight. Starting Captain Social 4 needs 3,480.

The following is a **fixed-earned-XP calculation**, not replayed careers. It applies the best observed Navigator's 826 XP to candidate thresholds while holding earnings constant. Faster skills would change decisions, success rates and survival, so these are candidate directions to test, not predictions of identical outcomes.

| Cost to gain level L | NAV 3→8 total XP | Level at the same 826 earned XP |
| --- | ---: | ---: |
| Current 20 × L² | 3,800 | 5 |
| Candidate 20 × L | 600 | 9 |
| Candidate 25 × L | 750 | 8 |
| Candidate 30 × L | 900 | 7 |

A linear 20–25 × next-level curve is a more plausible next experiment: still two to two-and-a-half times the pre-.74 thresholds, while allowing a long surviving specialist to approach eight. Before adopting it, also audit missing role-appropriate XP (especially trade/contracts, research handovers and ship combat) and remove repeated free pulsar training. Re-run the same career profiles after any actual balance change; do not guarantee survival, grant free recovery or judge every death as a defect.

## Reproduction

```powershell
$env:PROSPECTOR_QA_CHANNEL='msedge' # optional installed channel; otherwise use bundled Chromium
node qa/run-skill-audit.cjs ordinary
node qa/run-skill-audit.cjs extended
node qa/run-skill-audit.cjs focused
node qa/check-skill-observer.cjs
node qa/probe-skill-sources.cjs
```

An optional third argument filters profile IDs, e.g. `extended freighter`. Set `PROSPECTOR_QA_OUTPUT` to retain multiple runs in separate directories. JSON outcomes, XP-by-source, milestones and recent decisions are generated under ignored `qa/artifacts/`; the observers, controllers and this report are versioned source. The single-file game and experimental.74 review build are unchanged. No GitHub publication was made for this audit.


## Experimental.75 follow-up

After adopting 25 × next-level costs and repeatable landing training, one fresh native survey run reused Scout seed 155921 with the current pilot. It ended in crew death at turn 2,409 / 2,673 input selections. The Navigator earned 455 NAV XP and reached level six; no level eight was observed in this run. The initial .74 run for that profile reached five at turn 5,669 before its bound at 5,789. This is not a controlled survival-rate comparison: skill improvements change later choices/RNG outcomes, and the final pilot/startup-seeding fixes also differ from the early audit. It verifies meaningful progression without promising the same ending or mastery. No loss was resumed or rerolled. Raw .75 evidence is generated in `qa/artifacts/skill-audit-experimental75/`.
