# Prospector II feature roadmap

This roadmap focuses on complete gameplay additions that build on systems already in the game. Each milestone should be implemented as its own change, with its source files and rebuilt `index.html` kept in sync.

## 1. Finish the retirement ending

**Size:** Small  
**Why first:** The six sector outcomes, their living and dead variants, and the ending screen already exist in `src/content/retirement.js`. Retirement currently skips that screen and goes directly from the personal story to career stats.

- Wire the ending screen into the retirement key flow and station overlay.
- Pick the matching living or dead coda after the personal retirement story is selected.
- Keep the chosen outcome stable through redraws and save restoration.
- Check text wrapping and ensure the career stats screen remains reachable.

**Done when:** Retiring shows the personal story, then one sector outcome, then career stats. Both living and fatal story endings show the right closing text.

## 2. Make the Artemis launcher usable

**Size:** Medium  
**Why next:** The weapon is listed in the hangar but marked as a placeholder because ammunition is not implemented.

- Add an ammunition supply and a way to buy it at the hangar.
- Show remaining ammunition where the player chooses weapons and in combat.
- Consume ammunition consistently in ship combat and direct attacks on ships or bases.
- Handle empty launchers clearly and preserve ammo when saving and loading.

**Done when:** A player can buy, carry, use, save and reload Artemis ammunition; firing without ammunition cannot cause damage or consume a turn.

## 3. Keep science contracts available

**Size:** Medium  
**Why:** The six current contract types can each be completed only once per sector, after which the Science Office has no more field work.

- Let completed contract types return to the board after a cooldown.
- Keep one active contract at a time and retain its target and reward across saves.
- Avoid assigning targets that are already exhausted or cannot be reached in the current run.
- Keep quest cargo reserved until the matching contract is completed.

**Done when:** Returning to the Science Office after a completed contract can lead to another valid job, and active jobs remain completable after saving and loading.

## 4. Add a field journal

**Size:** Medium  
**Why:** Scans, explored tiles, survey sales and discoveries already accumulate on planet data, but the player has no dedicated place to review that record.

- Add a journal view for visited systems and bodies.
- Show scan and exploration progress, unsold survey value, and discoveries recorded on each body.
- Keep the journal derived from saved game data where possible; add only the minimum persistent state needed for discovery entries.
- Make unknown bodies stay hidden until the player discovers them.

**Done when:** The player can review what they found and what survey work remains without relying on the scrolling event log.

## Working rules for each milestone

- Keep each feature in its own reviewable change.
- Edit `src/`, rebuild `index.html`, and run `npm test`.
- Exercise the changed gameplay in a browser; build checks alone do not verify game behavior.
- Preserve existing save compatibility, turn costs, input bindings and shared global execution order unless the feature explicitly changes them.
- Do not split shared globals into modules as part of an unrelated gameplay feature.
