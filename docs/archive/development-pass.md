# Career-loop polish — experimental.4

The priority for this pass is a sustainable expedition career: prepare, travel, investigate, return, recover costs, improve the ship and crew, and choose the next expedition. Exploration, trade and combat should support that loop rather than feed an increasingly long sequence of isolated authored events. The original's open-ended captaincy remains the guide; the existing sequel systems supply its particular character.

No new worlds or encounters were added. Base prices, combat damage, starting hulls, crew wages and disease rates are unchanged in this pass: altering those broadly would need evidence from complete careers, not just successful short scenarios.

## Changes

- Science handovers sell valuables and samples, preserving usable equipment, medicine, quest items, live specimens and the active contract's reserved specimens. The office's displayed sale quote uses the same selection as the transaction.
- Planetary survey income excludes station interiors, casinos and the quarantine vessel. Planetary exploration and scans count their combined coverage; overlapping data is not counted twice. A survey's earned value and already-paid amount govern incremental sales.
- Civilization contracts pay for documentation of a civilization once per run. They no longer consume the world's normal survey earnings, and ordinary survey sales do not make a civilization contract impossible to complete.
- Research work renews after the existing cooldown. The available pool respects cargo space and the existence of an ancient world for artifact leads. The last completed or relinquished type is avoided when alternatives exist. Resource requirements and rewards remain unchanged; repeat work still consumes specimens or requires a fresh expedition.
- New research-ship contracts own their specific data. Old data cannot complete a newly issued job. New search areas lie 8–30 Manhattan steps away, additionally bounded by one third of maximum fuel capacity. This is a range constraint, not a promise that the route is safe. Reported coordinates agree with the HUD's one-based coordinates.
- The Science Office can relinquish an active contract without a reward, returning its delivery box if present and applying the normal cooldown. This prevents a lost box or an impractical expedition from permanently blocking work. Other cargo is preserved.
- Completed and relinquished research ships become ordinary boarded derelicts and expire through the existing world ticks. Loading a save restores the shared marker references so expired ships do not leave ghost contacts.
- Sample, survey and bulk-market sales now contribute consistently to career earnings. They remain gross earnings, not trading profit.
- LOG → RECORDS shows the active job, reward, specimen counts, recorded lead or delivery destination, and cooldown. Contract acceptance, completion and relinquishment join the existing history. No standalone tracking screen or new global shortcut is introduced.

## Validation and limits

Dependency-free tests cover the financial boundaries, equipment retention, artificial interiors, survey accounting, civilization reports, renewable offers, cargo eligibility, research data ownership, cancellation and search ranges. Existing world, rescue and visibility checks also run.

A local headless harness exercises actual station transactions and 54 contract completions across all three hulls, with production save/load between jobs. Specimens are supplied as controlled fixtures in those cycle tests: they validate accounting and persistence, not 54 fully played expeditions. Separate spatial rescue scenarios exercise physical movement, cargo, treatment, station return and log interaction. These are rule and regression checks; they do not establish that a whole career is enjoyable or that its economy is finally balanced.

Next assessment: complete career trajectories and how discoveries pay for fuel, repairs, wages and upgrades; combat readiness and escape; crew recovery and the readability of worsening conditions. Further authored content should follow that work.
