# Crew, morale and training

Every starting hull carries a Captain and Navigator. The Scout no longer receives a free scientist, and no hull receives a free engineer. Hull capacities are unchanged. Recruit specialists at stations; multiple engineers are allowed, with lowercase **e** badges and ordinary surnames. Captain **C** and Navigator **N** remain the core bridge roles. Hiring retains its existing cost and half-role-training skills.

## Morale

Current morale is base morale + encouragement + drinks + chemicals + recent events − grief/stress − time-away penalty, clamped to 0–135. Base morale begins at 55. Lasting losses from deaths, neglected injuries, disease and unpaid wages still change the base. Each rescued quarantine-ship survivor delivered once to station medical staff still earns a lasting +1 base morale; this finite rescue reward is distinct from repeatable leisure/aid boosts. The unpaid-visits row records a penalty already applied to base morale, not another subtraction. Paying a later payroll clears the unpaid-visit counter; it does not erase past base losses.

Short-lived rewards do not permanently improve the base:

| Source | Effect | Fade |
| --- | --- | --- |
| Drinks | +6 drink glow, cap 16; grief −2 | −1 each sixth career turn |
| Contraband morale drugs | +48 chemical lift, cap 60; grief −4 | −1 each third career turn |
| Mild antidepressants | +16 chemical lift, cap 28; grief −6; never reduce a stronger existing lift | −1 each third career turn |
| Casino outcomes and primitive/tribal aid | Existing reward/penalty amounts, pooled within −12 to +12 | One point toward zero each fifth career turn |
| Successful encouragement | +3 for 30 turns, existing 40-turn attempt cooldown | Expires at its deadline |

These intervals use the existing global career-turn cadence, not a new private timer per dose. Rendering and menu navigation do not fade morale. Docking retains its existing small drink/chemical/grief reductions. Grief relief is distinct from temporary lift and can outlast it. The sidebar identifies fading contributions and uses the same morale calculation as gameplay.

Previously drinks, drugs, aid and casino outcomes could permanently increase base morale, and chemical/drink lift did not fade during ordinary travel. That behavior is removed. Existing saved base values are not reconstructed or reset.

## Training

The XP cost to gain level **L** is **25 × L**, paid from the current skill's XP pool. Examples: 0→1 costs 25, 1→2 costs 50, 3→4 costs 100, and 9→10 costs 250. A starting NAV-3 Navigator needs 750 earned XP to reach eight; a hired level-two specialist needs 825. This replaces experimental.74's overly steep 20 × L² curve, while retaining thresholds 2.5 times the older 10 × L curve. The crew screen shows exact XP beside the existing skill meter. Grants carry surplus through levels and stop at ten; dead crew and invalid grants cannot train.

Repeatable work can award repeatable XP when each attempt really costs resources or carries danger. Do not impose a once-per-location cap merely because an action is repeated. The risk may become manageable through preparation and skill; that is earned progress.

- **Landings:** every planetary approach earns the best living navigator 1 XP for a clean landing or 3 for a rough one. The crash roll repeats, and launching again costs fuel. Internal maps without an approach check do not grant landing XP. The previous first-approach-only flag is no longer read or written.
- **Scans:** every successful paid scan earns 2 navigation XP, including an attempt that completes an already-covered mask. Paid scans still spend one fuel and one turn. Opening a completed scan remains free and gives no XP; it is viewing existing information, not performing another scan.
- **Pulsar observations:** each completed measurement gives every living scientist 2 science XP. Repetition is allowed. Each measurement now spends one galaxy turn (one reported hour), the normal size-dependent wait fuel (0.5 for a Scout), ordinary crew/system ticks and the NPC response. The existing pulsar hazard now applies while waiting or stranded as well as moving: direct exposure adds radiation dose 4 and a 20–34 damage pulse through normal shields/hull rules, within two sectors adds dose 2, and sectors three/four retain a 65% dose-1 chance. Five or more sectors remain safe. Fatal measurements grant no XP. There is no observation counter or artificial cap.
- **Field repairs, ground combat and contests:** retain their existing repeatable XP and resource/harm risks. Ship shots/launches now give the actual gunner one CBT XP; enemy shots/rams and arriving incoming missile rolls give the surviving active pilot one NAV XP with working propulsion. There is no direct kill bonus, harmless-movement XP or XP for refused shots/viewing. See the [bridge combat guide](ship-combat-crew.md) for crew selection, injuries/death and the gunnery/evasion formula. Buying a station repair or upgrade still grants no engineering XP: the station technicians do the work, and buying their service is not crew practice.

The [experimental.74 audit](skill-progression-audit.md) records the previous curve and the zero-time pulsar loophole. Experimental.75 adopts the gentler curve and charges actual repeated exposure rather than banning repeated study. Automated scenarios verify resource/risk/XP coupling; whole-career survival and progression remain balance questions. Independent run-age escalation remains future work; see the [design philosophy](design-philosophy.md).
