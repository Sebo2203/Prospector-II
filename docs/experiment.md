# Expedition guide

These rules apply to the active experimental build. [Download instructions](../README.md#play)

## Hull roles and refits

Hulls now derive upgrade ceilings from physical and layout stats, with a shared spare-space budget. Larger ships use more fuel, need more engine grade for comparable drive pace and suffer stronger rough-landing/nebula impacts. Hangar hull exchanges include condition-based trade-in, explicit review and station-local stores for retained equipment. See the [full hull rules and price tables](hull-framework.md). Career schema five requires a new career.

## Controls

The top HUD shows the ship's current hull type to the right of its vessel name. When the visible hull gauge loses HP, the newly lost section briefly highlights red and fades out over 650 ms. Numeric HP updates immediately; consecutive hits merge into the current damage band. Healing, hull replacement, capacity changes or loading another ship clear the effect. Reduced-motion preferences skip the flash.

Click the context bar actions or use their displayed shortcuts. During play, the top-left **ESC** button does the same thing as the Escape key. Use the compass to move or wait. In Examine and landing scans, click a tile or move the cursor with the compass or arrow keys. Confirm a landing with **Enter** or **Land at selected site**. Orbital scans remember the previous landing spot but show its underlying terrain rather than a player ship left on the surface. In ground firing mode, click a tile to aim and click that tile again to fire, or use **Enter**. Toggle **Shortcuts** to show or hide the gray keyboard reference.

Open Inventory with **I** or Options with **O**, or click their context buttons. Click menu choices or use their displayed keys. Select cargo and press **X**, or click its slot, to open the same details. Hover gives a quick preview. Use **On-screen keys** to enter names or feedback text, or to choose a common movement key while rebinding.

Open **Active Missions** below **Shortcuts** for a compact view of accepted contracts, known rescue work and package deliveries. It shows destination coordinates, collection counts and remaining objectives. General survey work stays in the log's Records view. The footer displays either Shortcuts or Active Missions at a time. Use the mouse wheel to scroll, or Tab into the mission panel and use the arrow keys, Page Up/Down or Home/End. Escape closes the panel.

Use **Shift+Z** to dive or surface, **Shift+O** to refill oxygen at the ship, and **Shift+X** to release a tow. These commands also appear as context actions when available.

Broken feet and legs add suit-oxygen exertion costs while moving in hostile air or underwater. Breathable surfaces, including intact ringworlds, supply breathing air instead; an injury does not continually empty and refill the oxygen reserve there. A depleted reserve still recovers normally and reports completion once.

## Tactical ship combat

Successful NPC escapes now leave at least one clear galaxy sector between you. An escaped contact may remain visible on sensors, but you must close to an adjacent sector before F can intercept it again. Waiting or reloading does not remove that requirement.

Nebula encounters use blue/pink gas-only or mixed gas/asteroid arenas. Dense gas can be flown through and reduces ordinary-fire accuracy by 15 percentage points for either side; guided missiles remain usable. Lightning strikes without advance warnings. Menus and saving/loading do not advance its internal schedule. See [environment rules](ship-combat-crew.md#nebula-combat).

Move toward an adjacent enemy to ram, or face it and Boost for a stronger impact. Both hulls take damage through shields, and your own ship can be destroyed even when the target dies. Boosting into an asteroid also damages the hull, with larger rocks causing larger impacts; boost fuel/heat and a turn are spent even on a crash. Normal movement into a rock remains blocked. A faster wraith can close and ram a moving player using its remaining movement credit. See [collision rules](ship-combat-crew.md#physical-collisions-and-ramming).

Ship encounters open a turn-based combat map. Nearby pirates or hostile patrols can fight as a group of up to four ships. An unarmed ship that reaches the arena edge escapes along two clear galaxy steps to a separated sector on its actual persistent ship object. The player stays in place. A cardinal sector is preferred; a diagonal can be used if those exits are blocked. A fully blocked galaxy exit keeps the ship in combat. Use movement keys or the compass to fly one tile. Tactical NPC movement now uses the same engine-ratio budget as galaxy pursuit: NPC drive pace / player drive pace (including blueprint size/geometry). Equal pace move one tile; faster opponents can take several checked steps and slower ones accumulate fractional movement. The target readout shows its engine/mobility and average movement ratio. The player's normal step remains one tile and Boost remains two. Asteroids block ordinary thrust and shots; a boost can crash into them. Amber exhaust is hazardous to any ship that crosses it. Stronger engines leave more damaging exhaust that lasts longer.

Click a target or press **Tab** to cycle contacts. Click a weapon or use its displayed number to select it, then press **F** or click **Fire**. A second click on the mouse-selected target also fires. If the current mount cannot fire, selection cycles to the next mount that is ready, powered, cool enough, in range and able to hit the current target. Only one weapon fires per action; a ready current mount stays selected. If none can fire, a reload attempt explains the named weapon, remaining turns and need to move or wait in the comms log, without consuming a turn. Weapon mounts sit in a horizontal strip below the combat map. Your ship status stays at the top of the right panel and selected enemy details grow upward from its bottom, leaving flexible space between them. The weapon panel shows damage, range, heat and action readiness, including reload, obstruction, heat and power limits. The selected shot also shows peak heat and any remaining reload as **Reload in 2t** (turns). Player hull stays on the left gauge; the selected target has hull and fitted-shield bars. Its ship name replaces the SELECTED TARGET heading, preserving the previous vertical gap. Successful player shots are green, player misses gray, enemy misses yellow and enemy hits red in sidebar messages and saved LOG history. Unavailable Fire, Boost and pre-edge Disengage buttons explain the blocking condition; keyboard attempts use the same guards. Moving and waiting both give weapons time to reload and let opponents act. The arena is continuous dark space with sparse stars, without grid lines or filled range tiles. The permanent dotted targeting line is removed. Firing shows a short travelling shot and brief hit flash; reduced-motion preferences use the impact without travel. The old lit tile area represented clear firing lanes for the selected weapon, not sensors. Sensor range is shown beside YOUR SHIP: 6 + 3 × effective sensor rating, or zero when offline. Weapon range remains on each mount. Live ships and exhaust require current sensor contact; charted asteroid positions are retained. Plasma uses separate fading original Prospector exhaust sprites, with no connecting lines. The nearby-plasma footer summary is removed; hover still describes individual visible trails. Unfitted shields have no combat charge/recharge display. Installed shields show full, delayed, recharging, damaged, failed, unpowered or heat-limited state as applicable. Reactor warnings and system failures appear in the readout. Natural entities show ram information, and unarmed ships are labelled explicitly.

Successful outgoing shots, incoming shield/hull impacts and incoming core damage have distinct synthesized cues. Short projectile/impact cues play sequentially in attack order; the critical cue is heavier and replaces the ordinary incoming hit cue. Combat rules still resolve on the same committed turn; presentation adds no turns, damage or reload time and is not saved. Leaving the career or loading another encounter clears pending feedback.

Each NPC substep checks cover, actors, plasma and escape, adds normal movement heat and leaves its normal exhaust. Incoming drive/sensor damage can stop the remaining steps. An approach stops at its chosen firing/range position without an extra attack; firing or holding to reload clears movement credit. Reloads, cooling and the career clock still tick once per committed action. Player pace is sampled once per NPC phase, so an early enemy hit does not retroactively change later opponents' movement allowance during that same phase. Natural entities use their authored mobility rating, keep ram cadence and leave no engine exhaust.

Normal thrust adds 2 heat and uses no extra fuel inside the arena. **B / Boost forward** moves two clear tiles along your current heading, costs 2 × hull size fuel and adds 18 + twice the effective engine rating in heat. Both tiles leave exhaust. Blocked boosts and unavailable shots consume no turn. Waiting provides an extra turn's cooling while opponents still act.

Press **Escape** or the top-left **ESC** button to save and return to the main menu; **Continue** resumes the same fight without advancing a turn. Fly to an edge and use **R** to attempt disengagement. Both player and NPC edge withdrawals have a 25% failure chance after an eligible escape attempt. A failure returns the player and all remaining opponents to their original arena positions, clears exhaust and movement credit, and ends the NPC phase. Destroyed or previously escaped opponents do not return. Damage, heat, shields, reload deadlines and galaxy positions are preserved apart from normal action ticks. Player attempts still cost one career turn; NPC attempts happen inside their existing response, without extra turns. NPCs with no safe galaxy exit cannot attempt the roll. Enemies with a clear shot and a ready weapon can fire once as you leave. Use **H** to offer surrender. Pirates may take cargo and credits, and patrols warn you before a second press confirms arrest. Each committed action also advances the career clock. Reload deadlines, heat, shields and component damage stay on the actual ship through retreat, re-engagement, saving and loading. Local rounds govern exhaust expiry; a new engagement creates a new arena. Armed NPC ships use the same mounts, heat, reloads, shields and core effects, firing one available mount per action. Gas entities retain their natural ram attack.

## Calendar and time totals

TURN still governs all gameplay. ELAPSED shows a separate reporting calendar; galaxy actions represent hours, surface exploration minutes and combat shorter intervals. LOCAL shows the existing planet daylight cycle as solar time. The career record and LOG → RECORDS total time in space, on planets, at stations and in artificial interiors. Reporting time does not change oxygen, enemies, injuries, reloads or deadlines. See [time rates and limits](time-reporting.md). Start a fresh career for complete time totals.

## Ship salvage and pirate bounties

Destroyed ships can leave no usable salvage, credits, crew equipment/supplies, or ordinary trading cargo. Equipment is drawn from existing shop catalogs; it does not include installed ship weapons or quest items. Each destruction is resolved once. In the galaxy view, **F** engages the nearest charted live ship within current sensor range; the context button names the same target. Examine a detected ship to select it instead, then press F or click its Fire control. Raiders engage immediately. Initiating an attack on a station patrol or unarmed civilian vessel opens an in-game confirmation with **Attack [Y]** and **Cancel [N]**; Escape also cancels. The prompt blocks movement and does not depend on browser pop-ups. Cancelling is free; raiders and forced hostile interceptions do not prompt. Civilian attacks retain their existing reputation consequences; station bans still apply.

| Ship role | Nothing / money / equipment / cargo | Typical finds |
| --- | --- | --- |
| Cargo freighter | 20% / 10% / 10% / 60% | Rations, machine parts, structural metal, fabric; up to 3 cargo units |
| Trader | 20% / 35% / 15% / 30% | Credits, trade goods, field equipment; up to 2 cargo units |
| Research ship | 25% / 10% / 35% / 30% | Survey instruments, drives, reagents, sensors and supplies; up to 2 cargo units |
| Patrol | 35% / 10% / 40% / 15% | Crew weapons, armor, repair kits and parts |
| Pirate guard | 35% / 10% / 40% / 15% | Crew weapons, armor, repair kits and supplies |
| Roaming raider | 25% / 20% / 25% / 30% | Stolen cargo, crew equipment and recovered assets; up to 2 cargo units |

Civilian money is recovered immediately. Every pirate kill records a 50–149 cr bounty; a pirate money salvage result adds recovered assets to that claim rather than paying instantly. Dock at any accessible major station to collect all pending claims automatically, before payroll. Repeated docking or save/load cannot collect a cleared claim again. Active Missions and LOG → RECORDS show pending totals. Casino stations do not pay bounties. Pirate-base destruction bonuses and gas-entity crystal drops are unchanged.

Salvaged equipment enters personal inventory. Cargo occupies real hold space; overflow stays at the encounter's galaxy coordinates, shown as a cargo marker. Return with hold space and move onto it or press Enter to recover one unit at a time. A full hold with drifting salvage on a major station tile does not prevent docking. Successful escape and surrender do not award kill salvage or bounties. “Nothing” means no physical salvage; pirate kills still have their station bounty.

## Nebula monsters

Nebula Wraiths and Void Devourers are rare living gas entities, not civilian ships. F and the attack context button can engage a detected monster immediately without a reputation confirmation; Examine can select a particular monster. Their manual detection/target range matches the existing large-entity marker: functioning sensors plus two sectors, on charted terrain.

A monster can pursue and engulf the player inside nebula terrain from the beginning of a career. The old invisible turn-300 AI gate is removed. It still stays within nebula terrain during pursuit, needs prey within six Manhattan sectors, respects disengagement grace and debug ship invisibility, and does not auto-engulf the ship in safe non-nebula space. Natural ram attacks and Nebula Crystal rewards remain unchanged; they do not grant pirate station bounties.

Fresh galaxy generation rolls once per connected nebula cluster: **12% massive**, **4% expansive**, **1% ordinary**, at most one entity per cluster. Massive nebulae no longer guarantee a monster. Existing saved galaxies retain their already-generated populations; the encounter fixes apply immediately, while reduced populations require a new galaxy. These are initial rarity settings, not a whole-career balance claim.

Charged nebula gas uses normal ship shields before hull. Its log reports incoming damage, shield absorption and actual hull loss separately; a recharged shield can absorb separated small hits without any hull HP loss. Infinite fuel prevents fuel expenditure only, while Infinite hull is a separate debug switch. Nebula interference reports when debug prevents extra fuel loss, and hull protection is identified when it prevents otherwise unshielded damage.

Larger hulls attract stronger discharges. When the existing charged-gas damage event occurs, **85%** are ordinary sparks and **15%** are major arcs, identified in the log. These percentages describe the severity of a damage event, not the chance per move. Raw damage ranges, before navigator mitigation and shields:

| Hull | Size multiplier | Ordinary spark | Major arc |
| --- | ---: | ---: | ---: |
| Light Scout | ×1 | 2–8 | 12–24 |
| Attack Corvette | ×1.5 | 3–12 | 18–36 |
| Bulk Freighter | ×2.5 | 5–20 | 30–60 |

Navigation retains its existing reduction to hazard occurrence and reduces severity by 5% per level (minimum multiplier 0.2), with damage rounded once after hull size and navigation. A starting NAV-3 navigator reduces maximum major arcs to 20 / 31 / 51 for Scout / Corvette / Freighter. A Corvette's starting twenty-point shield can therefore be overwhelmed by a strong arc. Physical size comes from the hull class, not current/max HP or cargo: plating upgrades provide extra durability without increasing the arc. **I → SHIP** shows the hull's nebula-discharge multiplier. Fuel interference, shield recharge, criticals and navigation XP retain their existing rules. This balance applies immediately to current-format careers; it does not regenerate their galaxies.

## Civilian flight and pursuit

Default Merchant Vessel / Free Trader and Survey Vessel / Research Ship engines are **2**; cargo vessels remain **1** and Station Patrol **3**. The same defaults are used by generation and neutral stat initialization.

Unarmed civilian ships near the player (within ten Manhattan sectors), and ships fleeing after an attack, use the same fractional engine-ratio movement bank as pursuing pirates: NPC drive pace / player drive pace. Equal pace moves one sector per player turn, slower ships accumulate fractional movement, and faster ships can move multiple sectors. Beyond interaction range ordinary travel uses the pirate roaming cap of two steps. Science ships no longer have a separate alternating-turn movement rule. Core engine damage affects this budget. Blueprint hull pace accounts for size and geometry; see the [hull framework](hull-framework.md).

Attacked unarmed ships flee instead of resuming their trade/science route, avoid dangerous/occupied escape sectors, and return to ordinary routing after opening a gap beyond ten sectors. Working sensors track the attacker; blind ships use the last known threat position. Fleeing victims do not volunteer to rescue their attacker. Existing patrol and active rescue movement remains unchanged. Movement banks, escape positions, damage and fleeing state survive saves. Tactical NPC movement uses the same ratio through a separate arena movement bank; fractional credit persists within a saved encounter.

Engine upgrades now support holding range, catching escapees and reaching cover as well as their existing evasion/exhaust effects. Slow hulls face more pressure from fast opponents and benefit from Boost, long-range mounts and terrain. Fast movement creates more exhaust tiles and spends more movement heat. It does not grant additional shots, faster reloads or extra shield/cooling ticks. These are intended tactical tradeoffs; whole-career balance still needs playtesting.

## Bridge crew and enemy tactics

Crew **CBT** now governs ship gunnery and **NAV** governs evasion, using the strongest capable living operator with Captain/other crew fallback. Engines retain propulsion and exhaust. The combat panel names both operators. Penetrating hull impacts can injure or kill personnel, including the last surviving crew member while the hull remains intact. Wounds/deaths affect the same crew who explore planets; shots and under-fire piloting train the actual participants.

Enemies now use close assault, skirmishing, long-range fire and guided-missile standoff, with bounded cover routing, deliberate cooling and return-fire cadence. Existing natural ram attacks and civilian flight remain. See [crew rules, original-game sources, tactics and measured tests](ship-combat-crew.md).

## Mounts, core systems and damage

Open **I → SHIP → Inspect / repair**, **Hangar → Core Systems**, or **F3** to inspect installed ratings, effective performance, integrity, usable tank capacity, heat, power and weapon status. The ship overview shows passive core conditions and effective values, with a blank slot when shields are not fitted. Use its static **Inspect / repair [F3]** button for the detailed board. The F3 context control appears during combat; ordinary galaxy, orbital and surface views use the shortcut or the ship menu. Explicit menu buttons suppress context buttons with the same shortcut, including cargo examination and Close. Essential hints remain on the primary controls and in the collapsed Shortcuts reference. Jettison stays in the ship menu and on **J**, without a duplicate context button. The detailed page uses the same canvas menu style as its parent: Hangar blue rows and station heading, or the ship menu's tabs and yellow selection. Click a core or use Up/Down to inspect it. Click a repair action or choose it with Left/Right (or Tab) and press Enter. Unavailable actions explain why below their button. Back / Escape returns to the exact parent page; ship tabs also remain clickable. Gameplay movement and firing are blocked while inspecting. Inspecting is free.

| Hull | Mounts available / maximum | Mount sizes in order | Base reactor | Cooling / turn | Heat capacity |
| --- | --- | --- | ---: | ---: | ---: |
| Light Scout | 1 / 2 | Light, Medium | 8 | 6 | 80 |
| Bulk Freighter | 0 / 2 | Light, Medium | 7 | 5 | 110 |
| Attack Corvette | 2 / 3 | Medium, Medium, Heavy | 12 | 8 | 90 |

The current hull roster supports at most **three weapon mounts** (the upgraded Corvette). All three have cards below the map and keyboard/mouse selection. The renderer divides that strip by the weapon count; arbitrary larger loadouts are not a tested layout. Future hulls with four or more mounts need a layout/readability pass.

Hangar → Armament shows mount labels and details on separate lines. Its weapon picker uses blue Hangar cards with aligned names, prices/ownership, stats and descriptions. The selected mount’s existing weapon is marked **FITTED HERE** and cannot be purchased or fitted onto itself again; refusal leaves credits, equipment and reloads unchanged. Other mounts may use the same weapon type.

A weapon must fit its mount size and the available reactor output. Core services reserve 2 power and shields reserve their installed grade. Installation checks the whole fitted loadout. If reactor damage reduces output, earlier mounts receive power first; later mounts can go offline while staying installed. Each reactor upgrade adds 3 output. Each cooling upgrade adds 2 cooling per turn and 10 heat capacity. Both upgrades cost credits and compete for shared refit space; Scout/Freighter stop at grade two and Corvette at grade three. Station upgrades, mount unlocks and module-slot additions do not require an onboard engineer. Existing utility equipment continues to use its separate module slots.

| Weapon | Mount | Power | Heat per shot | Range | Other actions to reload |
| --- | --- | ---: | ---: | ---: | ---: |
| Mass Driver | Light | 2 | 12 | 5 | 1 |
| Railgun | Medium | 4 | 22 | 8 | 2 |
| Laser Cannon | Medium | 5 | 28 | 6 | 2 |
| Pulse Laser | Light | 3 | 20 | 4 | 1 |
| Artemis Launcher | Medium | 4 | 10 | 8 | 3 |

**Artemis** costs 1,200 credits and deals 18–30 damage. Launch requires live sensor contact, range, reactor power, heat headroom and a ready mount. A launch spends ammunition/heat and starts reload, but deals no immediate damage. Visible guided missiles advance four tiles after each later committed combat turn's NPC response, choosing a route around asteroids and intervening ships. Stationary targets normally take one later turn within four tiles or two within eight. Moving targets and detours can extend travel. Four flight turns of motor fuel limit a chase; an unreachable or outrunning target can exhaust a missile. Browsing, targeting, refused actions and animation never advance flight.

Missiles home on the original target's current position, without retargeting when you select another ship. They remain autonomous after sensor loss or the launcher's destruction. Accuracy and damage are rolled on impact: launch gunnery CBT/range values combine with the defender's current piloting NAV, then the ordinary shields, hull and critical rules apply. Combat remains active after the last enemy ship dies while incoming missiles can still hit. Incoming/outgoing missile counts and estimated incoming travel appear in the readout; estimates can change as ships move. Missile icons and hover details show individual positions and remaining motor fuel.

Withdrawal advances existing missiles before its escape roll, so a nearby missile can hit first. A failed withdrawal keeps missiles at their current positions while ships reset. Successful withdrawal leaves the salvo behind; an escaped or destroyed target is not replaced by another ship. Accepted surrender calls off outstanding missiles. Pirate-base missiles take one additional career turn, survive save/load and can arrive while another encounter is underway; defense turrets still answer the launch immediately. Reload, ammunition prices and other weapons retain their existing timing. There is no point-defense/interception system.

Buy **Artemis missiles** in **Hangar → Armament**, at 60 credits each. You must own an Artemis launcher, either installed or kept in any station’s equipment stores. Without one the purchase is disabled; leftover missiles alone do not qualify. Selling your last launcher prevents further missile purchases without deleting missiles you already own. The ship has a dedicated twelve-missile magazine, shared by all launchers and separate from trade cargo and personal inventory. Installation includes no missiles. Every launch consumes one, including a miss and pirate-base bombardment. Blocked attempts consume neither ammunition nor a turn. Refitting, retreating, re-engaging or loading does not replenish stock; ammunition and reload deadlines remain on the actual ship. Trade cargo named Ammunition is not launcher ammunition.

About one in eight generated multi-weapon raiders carries Artemis in its last mount, with three missiles and ordinary weapons in its other mounts. Assignment is stable for that ship, rather than rerolled during inspection or re-engagement. They use the same power, lock, range, heat, reload and ammunition rules. Their guided weapon can attack you around cover; when empty they must use their remaining ordinary weapons. Sensor-visible enemy readouts show remaining Artemis stock.

Each mount reloads separately. Every career turn cools the ship; a tactical wait doubles cooling. Firing and boosting require enough heat headroom before the action is committed. Shield generators hold 20 damage points per installed grade, scaled by integrity. A hit delays recharge for three career turns. Recharge restores 3 per turn and adds 1 heat, subject to capacity. Upgrading a shield also reserves another reactor power point.

Hull damage can cause a component critical; hits fully absorbed by shields cannot. The chance is 14% + 0.5 percentage points per hull damage, capped at 40%; a critical deals 25 integrity damage. Engineer presence or skill no longer reduces chance or severity, for either side. Damage preserves the installed equipment and changes its effective performance:

| Core | Damage effect |
| --- | --- |
| Engines | Lose one effective rating per 25 integrity points lost. At zero, normal thrust and boosts fail; galaxy travel offers the existing stranded/SOS recovery. |
| Reactor | Output scales with integrity. Too little output also shuts down sensors, propulsion and shields. |
| Shield generator | Reduces shield capacity; charge above the reduced limit is lost. |
| Cooling | Reduces cooling rate, leaving a minimum of 1 radiative cooling per turn. |
| Sensors | Lose one effective rating per 25 integrity points lost. A rating-one sensor at 75% integrity is offline. Existing charts remain; new chart reveals, live ship markers, tactical target locks and paid scans stop. Unfamiliar orbital layouts require functioning sensors. |
| Fuel tank | At 50% integrity or below, usable capacity becomes half the installed capacity. Excess fuel leaks out. Repeated damage does not repeatedly halve capacity. The fuel gauge retains its installed-capacity scale: the unusable upper half is diagonally hatched and crossed out, and current fuel occupies only the usable lower half. Repair removes the restriction marking without creating fuel. |

A living engineer can spend a repair kit and one turn to restore **25 + 3 × engineering skill** integrity, up to 85%. The strongest living engineer performs field work. **Attempt improvised repair** replaces the former guaranteed bypass action; it uses no kit and costs one turn whether it succeeds, fails or worsens damage. Success chance is **25% + 7 percentage points per effective engineering skill**, capped at 95%. At skill 0 a roll in the top 25% botches the job; at skill 1 the top 15% does so. A botch inflicts 5–10 integrity damage to that core. Failed checks at skill 2 or higher do not add damage. Successful work earns 2 engineering XP; failed/botched work earns 1, after the check.

A successful improvised repair temporarily provides at least 75% effective integrity and basic engine/sensor operation for 15 career turns; physical damage remains. The installation action uses the first turn, leaving 14 immediately afterward. The action is available below 75% physical integrity, or at exactly 75% for an offline engine/sensor; active support cannot be extended. Fuel tanks have no improvised-repair button. No kit is consumed by this action. Low reactor output can still prevent a supported engine or sensor from working. The menu keeps the attempt label without the former bypass explanatory hint.

Field work is available aboard the ship in space/combat or while standing at its surface landing tile. Every committed combat attempt gives opponents their normal response. Station technicians offer full permanent restoration for 2 credits per missing integrity point without requiring an engineer. A ruptured tank requires a kit or station service; restoring it recovers capacity, not lost fuel. SOS offers explicitly name any needed engine/reactor repairs. Accepting restores only disabled propulsion cores to at least 80% physical integrity, without requiring your own engineer, and transfers only fuel that fits. The log reports the actual transfer; stranded state clears only when propulsion and fuel are available. A failed engine alone does not suffocate the crew while fuel and reactor power can run life support; the existing exposure drain applies to an empty tank or failed reactor.

Every positive fuel-tank critical has a **3% explosion chance**, at any integrity, including an already destroyed tank with fuel remaining. Internal blasts deal **20–50 hull HP**, bypass shields and cannot chain new criticals. Player blasts burn 25% of remaining fuel, rounded up, after capacity losses. Empty player tanks cannot explode; NPCs use implicit reserves unless explicitly empty. Explosions can kill either ship through normal combat death/reward handling. Debug infinite hull suppresses player blasts.

Start a new career for this equipment model. Earlier saves use a different schema.

Pirate surrender uses the highest demand among surviving enemies for the entire group; changing the firing target does not change those terms. Destroying or escaping an opponent removes its demand. An accepted offer still costs half your credits plus all cargo and satisfies every surviving pirate.

If your propulsion is unavailable and no opponent can move, combat checks whether either side still has a powered weapon, sensor lock, range and a clear firing line. Reloading and heat limits alone do not end a fight. If neither side can act, the encounter ends with your ship stranded at the same galaxy coordinates: damage, fuel and reload deadlines remain, with no kill rewards or free repairs. Use repair or **T** for SOS; keyboard waits, movement attempts and the compass all advance the normal stranded process. Empty fuel or a failed reactor still causes exposure, and other operational hostiles can engage. A disabled group cannot repeatedly reopen the same unfightable encounter and block rescue processing.

## Crew at a glance

Every hull starts with only Captain and Navigator; recruit other specialists at stations. Multiple engineers are allowed. The sidebar shows one badge per living crew member. **C** is Captain, **N** Navigator, **e** Engineer, **S** Scientist, **+** Medic, **m** Mercenary, and **r** Redshirt. The meter shows remaining HP in green, amber below 60%, and red below 30%. A pulsing **!** marks an active condition and stays still with reduced motion enabled. Hover for the crew member's name, exact HP, and known conditions. Open **I → CREW** for the full roster.

Talk to a crew member and choose **Check morale → Issue encouragement** to attempt a social check. Success gives +3 current morale for 30 career turns. Failure leaves morale alone. Either result starts a 40-turn cooldown for that crew member. The morale breakdown lists base morale, encouragement with its remaining turns, fading rewards, penalties and current morale separately. Unpaid visits are recorded as already included in base morale. See [crew progression](crew-progression.md) for the 25 × next-level XP curve, repeatable risky training, exact skill progress and morale rules. Saved careers preserve the time remaining.

## The captain’s log

Open **I → LOG**. The default **6 / RECORDS** view starts with active science contracts, known open rescue leads, and pending deliveries. Survey totals, known civilization relationships, closed incidents, and history follow. Major discoveries and rescue events also appear in ALL and MISSION. The log keeps known discoveries in the save. Repeated scans update the existing finding. Use **J** in the ship inventory tab to jettison cargo.

The sidebar log carries combat events, routine updates, NPC speech, and radio traffic. It fills the remaining sidebar height. Scroll upward to load older messages; new arrivals preserve your place while reading history. When already at the newest messages, the log follows incoming traffic. Combat has no separate log window or font controls; its events also stay in LOG history. The normal sidebar controls and +/− keys adjust log text during combat. The collapsed Shortcuts reference switches to combat controls during an encounter. The full-width banner is for immediate action, such as critical fuel or oxygen, a rescue decision, armed explosives, or an adjacent singularity.

## Scan reports

Detailed scan readings remain in orbital view. The selected planet or moon shows **Terrain scanned: N%**, updating from its scan mask; incomplete scans stay below 100%, and complete scans show 100%. Gas giants have no terrain percentage. Ordinary successful scans do not repeat them in comms. An unusual finding may prompt one restrained observation about surface patterns, biological returns, contours or a secondary return. These clues do not identify civilization species, technology, attitude, exact sites or special-world effects. Revealed scattered structures can also prompt a clue; concealed interiors and loot are not inspected for hints. A fully scanned gas giant may hint at an unusual companion without naming it. Partial gas-giant scans do not reveal that companion through comms.

Failed scans and unavailable actions still explain the problem. Scan fuel/turn costs, XP, coverage, orbital data and survey records work as before. Existing log history is retained.

## Science work and survey sales

The Science Office offers renewable contracts. Check **I → LOG → RECORDS** for the active job, reward, required specimens, last reported coordinates, and delivery destination. If you lose the delivery box or decide the job is impractical, relinquish it at the Science Office. The next job becomes available after the cooldown.

Survey income comes from planetary scans and exploration. The office counts their combined coverage and pays for new findings since the last sale. Civilization contracts pay separately from ordinary survey sales. The office reserves active contract specimens when buying samples.

## Mercy of Dawn

Ship sensors and sensor drones can reveal the wreck at its fixed location. A fresh galaxy places it once among eligible empty interior sectors, outside the opening station reveals and clear of ships, loot, and other objects. The distress signal records its coordinates in the log. Fly there and press **Enter** to board its persistent 32-by-20 deck. Existing careers keep their original wreck location and encounter history.

### Rescue details and spoilers

The bridge, medical stores, cargo hold, engineering compartment and sealed isolation ward connect through pressure hatches. Emergency lighting, fog of war and line of sight govern discovery. Survivors are visible individuals with positions, health and transport state. Their exact room positions vary within the authored layout.

### Interaction

Move normally. The context bar labels what Enter will do as you move between equipment, hatches, and survivors. X examines visible equipment and people. Examine the engineering pump to see the remaining air reserve. T gives medical care to an adjacent survivor. P deploys a recovered isolation pod. At the pump, R manually restores temporary pressure. L departs only from your own airlock.

### Survival

The wreck begins with 180 turns of reserve air when first boarded. Time continues during movement, work, waiting and travel after retreat. At zero reserve, crew suit oxygen matters and survivors left without a pod take progressive asphyxiation damage. The ordinary oxygen gauge reflects the actual atmosphere. Repairing life support stops depletion. The manual pump buys time. A recovered coupling or an ordinary repair kit fixes the pump, while engineering skill of at least 3 permits a three-turn bypass without consuming either item.

### People and equipment

Mira can walk, Rowan needs an injury stabilized or two crew to carry them, and Ilya is infectious. A medikit stabilizes the injury; a medic with skill 3 can improvise a splint over three turns. Antibiotics treat the infection. Those supplies are ordinary inventory items and can instead be spent on your crew. Two folded pods can be recovered from stores. Carrying one casualty or pod at a time requires two living crew. A set-down pod cannot move by itself.

### Exposure

Contaminated ward tiles expose crew whose suits are absent or punctured; intact flight suits protect against the air. Reconnecting the local scrubber removes that environmental exposure. An untreated passenger in shared ship quarters can infect the crew during travel. These exposures use the crew infection and disease system.

### Transport

Assisted survivors path through open, passable tiles one cardinal step per turn. Carried survivors remain with the away team. They enter your ship only at the airlock. Normal passenger capacity equals unused crew bunks plus one emergency berth, with a minimum of one. Pods occupy real cargo slots and protect occupants from shared-air exposure. Repair life support before making return trips with a small hull. Full holds or berths leave people physically aboard the wreck. Jettisoning an occupied pod records the passenger as lost. Departure leaves untransported followers and carried casualties at their actual deck positions.

### Aftermath

Docking at a major station transfers only actual onboard passengers to medical care, pays 100 cr per person and improves standing once per delivery. Loading a save or redocking cannot repeat a payment. Sell recovered instruments through the station market. The log records observed conditions and actions. Deaths out of sight remain unconfirmed until observed. The retirement record counts delivered and still-onboard survivors.

### Saves

All deck, door, supply, repair, survivor and passenger state persists in ordinary saves. A resolved incident retains its history and cannot be replayed for new rewards. A fresh career uses the current wreck placement rules. [Save format and recovery](autosave.md)

Use the Mercy sample in the [debug playground](debug-playground.md) to practice boarding and rescue. The maintained [encounter and rescue checks](../qa/README.md#regression-scenarios) cover detection, boarding, survivor movement, and save recovery.
