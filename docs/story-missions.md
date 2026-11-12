# Story missions: the quarantine-rescue blueprint

The quarantine ship is the first working model for later authored story missions. **Mercy of Dawn is one possible vessel name**, alongside eleven others. The event's internal identity stays `quarantine`, so changing its displayed name does not disconnect saves, discoveries, passengers or outcomes.

## Current lifecycle

1. **Schedule once.** At galaxy generation, the career rolls 60% eligibility. An absent event remains absent. Eligible careers have a 35% initial-placement chance; otherwise their due turn is 80–600 career turns after scheduling. Plans are saved under `G.expedition.storySchedule`, independent of player wealth, equipment and training. Committed turns check deadlines; menus/rendering do not reroll them.
2. **Place without announcing.** The scheduler places one vessel in an uncharted empty interior sector clear of ships and loot. If there is no valid cell, it retries 25 turns later without rerolling eligibility. The actual name/position are persisted. This allows a later sector arrival without replacing something the player already charted.
3. **Discover through local evidence.** A charted marker alone does not trigger the distress message. The player's ship must be within the smaller of three tiles or its current working sensor range, with no intervening nebula. A remote drone can chart a marker but cannot send an unsolicited faraway rescue announcement. The named distress signal is recorded once. Its text does not reveal the survivor roster or hidden deck contents.
4. **Interact with a real place.** Boarding opens a persistent 32×20 deck with ordinary movement, sight, oxygen, supplies, shared ringworld hatches and authored equipment. Survivor facts become known through observation/records, not omniscient mission hints. People use the normal creature examine payload and two-tile detail gate, without entering the hostile enemy roster.
5. **Carry actual state between places.** Following, carried, isolated, waiting and onboard states determine transport. Berths and cargo slots constrain evacuation. A full hold does not teleport a pod aboard; departing does not teleport followers. Onboard medicine uses the same treatment implementation as adjacent field care.
6. **Resolve once and preserve the evidence.** Actual station delivery grants the existing reward once per passenger. All-terminal rescues close even when the final outcome is death or pod loss, without another station visit. Confirmed failure grants no rescue payment. Unknown remote deaths retain last-known information until observed; closing the internal simulation does not disclose them through a completion message or remove the unresolved lead. A resolved deck remains visitable, with its consumed supplies and outcomes intact.

This is a small reusable catalog/scheduling foundation, not a generic scripting language or a claim that other story missions have already been converted. New events should define their placement, knowledge, actor transitions, actions, ending conditions and persistence, then supply native scenario checks and an interactive debug factory.

## Shared controls and presentation

Ringworlds and the rescue use the same `rw_locked_door`/`rw_open_door` definitions, drawing and opening function. Rescue ward seals are metadata on that shared door, not a different door implementation. Enter beside a hatch and movement into it both open it. Successful openings use C12-A; the restored synthesized station-entry chime is separate.

Surface **U** toggles crew helmets, documented only in Shortcuts. The choice persists; open helmets allow ward exposure and cause direct suffocation/drowning in unbreathable air or underwater. Closed intact environmental suits protect; armor plates and punctures do not. See the [expedition controls](experiment.md#controls).

Normal rendering draws pixel consoles, medical cabinets, pod racks, pump, scrubber, crates, contamination, humans, remains and occupied pods. Glyphs remain available in ASCII mode. Art uses integer pixel coordinates and no rule RNG. Keyboard examination, pointer tile selection, fog and the common sidebar apply to survivors.

Open **I → SHIP → Passengers [P]**, select a passenger with arrows or pointer, and use **Give medical care [T]**. Antibiotics remove the passenger's infectious flag. A medikit stabilizes an injury; effective MED 3 permits the same three-step improvised splint used on the wreck. Each successful treatment/work step costs one turn and uses the required medicine, while refusals cost neither. The manifest may be browsed away from the ship, but treatment requires the crew aboard the ship or at its surface airlock. Ordinary inventory antibiotics continue to treat crew, not silently select passengers.

Manifest selection is disposable UI state outside `G`. The schedule, chosen vessel name, actor condition, medicine and treatment progress are career state. Current-format plan IDs, status/deadlines and present instance names are validated before a load replaces the career. Career schema six rejects earlier exports rather than accepting decks with obsolete door types. Start a new career; no scheduling, naming or tile migration is performed.

## Deliberately deferred

The air reserve still starts on first boarding, then continues through retreat/travel. This pass does not change that clock, add survivor conversations/backstory, make the patient's disease progressively deteriorate, or add richer consequences after delivery. Those are subsequent design tasks, rather than hidden changes to the rescue foundation.

**Future direction: station infection.** Delivering an infectious person could eventually introduce a persistent outbreak at a major station and cause serious problems. Design that as a real station state with origin, progression, discoverable warnings, containment/treatment choices and consequences recorded in the sector and career ending. Do not implement it as an unexplained random punishment, or pretend a station has become infected merely because a passenger was delivered. No station infection mechanic exists yet.

## Verification and limits

Experimental.104 adds root rules for optional/delayed plans, local/blocked/offline signals and known-versus-unknown casualty closure. The maintained `story-rescue` headless suite checks saved late appearance through a native turn, named discovery, shared hatch states, normal NPC examination, pixel rendering, keyboard/pointer onboard treatment, exact resource/action costs, persistence, failed closure and malformed deadline rejection. Existing `rescue` scenarios cover full walking rescues, small-hull ferry trips, actual supplies, casualties, pods, infection, salvage and station handoff. `encounters` checks seeded optional openings; `palette` checks real sample interaction/reset/career isolation. [Setup and full QA catalog](../qa/README.md).

These controlled fixtures do not establish natural encounter frequency, whole-career survival, subjective art/sound quality or future station-outbreak balance. The initial 60%/35%/80–600 scheduling values are tunable gameplay choices, not measured final balance.
