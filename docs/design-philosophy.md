# Design philosophy: the universe does not protect the captain

Prospector II is meant to be **hard**. It is a roguelike in which death is common, including early death. A run is an attempt to survive an indifferent, dangerous sector, not a promise that the captain will eventually win. This is the design direction for balance and future systems; it does not claim that a complete time-based escalation system is already implemented.

## Early survival is uncertain

Many new captains should die before their careers take shape. Freak accidents, unexpected monsters, pirates, hostile environments and pure bad luck are legitimate reasons for a run to end. Strong threats may exist from the beginning. An early encounter does not have to be matched to the starting ship or made survivable because the player has not found upgrades yet.

Preparation and knowledge should improve the odds, but they need not remove every lethal surprise. The game does not owe the player a safe opening, a successful escape, a rescue, a profitable expedition or a fair fight. Rare threats can remain extremely dangerous; making a monster rarer does not require making it harmless.

## Progress buys breathing room

Survivors can acquire a better ship, equipment, supplies, money, knowledge and an experienced crew. Those advantages should matter: familiar dangers may become easier and the captain may briefly feel less pressure. Progress is earned leverage, not permanent safety or an entitlement to complete the run.

Retreat, refusal, avoidance and timely retirement are meaningful decisions. The player does not have to fight everything or finish every story. Bringing a modest fortune home alive can be a successful career.

## Time keeps raising the stakes

The intended difficulty curve advances with the age of the run. More difficult enemies, events and sector pressures should arrive because time has passed, regardless of the player's wealth, ship, experience, discoveries or readiness. Staying weak must not hold the universe in an easy phase, and staying in a safe economic routine must not stop the sector from changing.

This is independent escalation, not level matching: opponents must not quietly become weaker to rescue a struggling player. Nor should every new upgrade be instantly cancelled by an enemy upgrade. The player can gain ground, but the rising pressure continues on its own schedule. Discovering a danger can reveal an existing clock; discovery need not start or pause that clock.

The player should only consistently outperform this difficulty–time curve through exceptional cunning: finding efficient routes, exploiting opportunities and the game's rules, understanding enemies, choosing risks carefully and knowing when to leave. Ordinary progress alone should not reliably outrun it. Exceptional play can create an advantage; even then, survival is not guaranteed.

## Judge changes against this intent

When changing encounters, economics or balance, ask whether the change preserves uncertain early survival and independently rising pressure. Do not automatically remove lethal randomness, guarantee recovery, delay all serious threats until an upgrade, or weaken a dangerous system just because players or automated pilots die. Evaluate survival rates and whole-career outcomes; a test pilot's death can be valid evidence about the world rather than a failed test.

Hardship should come from the game's rules, world and luck. Broken attack controls, unusable interfaces, corrupted saves, duplicated rewards or state contradictions are defects to fix, not substitutes for difficulty. Clear controls and truthful information help the player make choices without promising that those choices can avert every disaster.

## Current implementation boundary

The experimental game already has lethal encounters and turn-based timing rules. Its parallel hours/days reporting clock is currently cosmetic: it does not drive escalation, injuries, payroll, rescues or reloads. A complete run-age difficulty curve is a development goal, not a feature introduced by this document. Future escalation work must choose its gameplay clock deliberately and document the resulting behavior. The [roadmap](roadmap.md) records that work; the [time guide](time-reporting.md) describes the existing two-clock model.
