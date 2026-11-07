# Expedition guide

These rules apply to the active experimental build. [Download instructions](../README.md#play)

## Controls

The top HUD shows the ship's current hull type to the right of its vessel name.

Click the context bar actions or use their displayed shortcuts. During play, the top-left **ESC** button does the same thing as the Escape key. Use the compass to move or wait. In Examine and landing scans, click a tile or move the cursor with the compass or arrow keys. Confirm a landing with **Enter** or **Land at selected site**. In ground firing mode, click a tile to aim and click that tile again to fire, or use **Enter**. Toggle **Shortcuts** to show or hide the gray keyboard reference.

Open Inventory with **I** or Options with **O**, or click their context buttons. Click menu choices or use their displayed keys. Select cargo and press **X**, or click its slot, to open the same details. Hover gives a quick preview. Use **On-screen keys** to enter names or feedback text, or to choose a common movement key while rebinding.

Open **Active Missions** below **Shortcuts** for a compact view of accepted contracts, known rescue work and package deliveries. It shows destination coordinates, collection counts and remaining objectives. General survey work stays in the log's Records view. The footer displays either Shortcuts or Active Missions at a time. Use the mouse wheel to scroll, or Tab into the mission panel and use the arrow keys, Page Up/Down or Home/End. Escape closes the panel.

Use **Shift+Z** to dive or surface, **Shift+O** to refill oxygen at the ship, and **Shift+X** to release a tow. These commands also appear as context actions when available.

## Tactical ship combat

Ship encounters open a turn-based combat map. Nearby pirates or hostile patrols can fight as a group of up to four ships. Use movement keys or the compass to fly one tile. Asteroids are optional cover and block both movement and shots. Amber exhaust is hazardous to any ship that crosses it. Stronger engines leave more damaging exhaust that lasts longer.

Click a target or press **Tab** to cycle contacts. Click a weapon or use its displayed number to select it, then press **F** or click **Fire**. A second click on the mouse-selected target also fires. The weapon panel shows damage, range, heat and action readiness, including reload, obstruction, heat and power limits. The selected shot also shows peak heat and its reload duration. Unavailable Fire, Boost and pre-edge Disengage buttons explain the blocking condition; keyboard attempts use the same guards. Moving and waiting both give weapons time to reload and let opponents act. Clear firing lanes are shaded; a green target line means the selected shot is ready, while amber means it is unavailable. Unfitted shields have no combat charge/recharge display. Installed shields show full, delayed, recharging, damaged, failed, unpowered or heat-limited state as applicable. Healthy reactor/sensor diagnostics stay quiet; failures appear in the readout. Natural entities show ram information, and unarmed ships are labelled explicitly.

Normal thrust adds 2 heat and uses no extra fuel inside the arena. **B / Boost forward** moves two clear tiles along your current heading, costs 2 fuel and adds 18 + twice the effective engine rating in heat. Both tiles leave exhaust. Blocked boosts and unavailable shots consume no turn. Waiting provides an extra turn's cooling while opponents still act.

Fly to an edge and use **R** to disengage. Enemies with a clear shot and a ready weapon can fire once as you leave. Use **H** to offer surrender. Pirates may take cargo and credits, and patrols warn you before a second press confirms arrest. Each committed action also advances the career clock. Reload deadlines, heat, shields and component damage stay on the actual ship through retreat, re-engagement, saving and loading. Local rounds govern exhaust expiry; a new engagement creates a new arena. Armed NPC ships use the same mounts, heat, reloads, shields and core effects, firing one available mount per action. Gas entities retain their natural ram attack.

## Mounts, core systems and damage

Open **I → SHIP → Inspect / repair**, **Hangar → Core Systems**, or **F3** to inspect installed ratings, effective performance, integrity, usable tank capacity, heat, power and weapon status. The ship overview shows passive core conditions and effective values, with a blank slot when shields are not fitted. Use its static **Inspect / repair [F3]** button for the detailed board. The F3 context control appears during combat; ordinary galaxy, orbital and surface views use the shortcut or the ship menu. Explicit menu buttons suppress context buttons with the same shortcut, including cargo examination and Close. Essential hints remain on the primary controls and in the collapsed Shortcuts reference. Jettison stays in the ship menu and on **J**, without a duplicate context button. The detailed page uses the same canvas menu style as its parent: Hangar blue rows and station heading, or the ship menu's tabs and yellow selection. Click a core or use Up/Down to inspect it. Click a repair action or choose it with Left/Right (or Tab) and press Enter. Unavailable actions explain why below their button. Back / Escape returns to the exact parent page; ship tabs also remain clickable. Gameplay movement and firing are blocked while inspecting. Inspecting is free.

| Hull | Mounts available / maximum | Mount sizes in order | Base reactor | Cooling / turn | Heat capacity |
| --- | --- | --- | ---: | ---: | ---: |
| Light Scout | 1 / 2 | Light, Medium | 6 | 6 | 80 |
| Bulk Freighter | 0 / 2 | Light, Medium | 8 | 5 | 120 |
| Attack Corvette | 2 / 3 | Medium, Medium, Heavy | 12 | 8 | 100 |

A weapon must fit its mount size and the available reactor output. Core services reserve 2 power and shields reserve their installed grade. Installation checks the whole fitted loadout. If reactor damage reduces output, earlier mounts receive power first; later mounts can go offline while staying installed. Each reactor upgrade adds 3 output. Each cooling upgrade adds 2 cooling per turn and 10 heat capacity. Both upgrades cost credits, require an engineer and stop at grade three. Existing utility equipment continues to use its separate module slots.

| Weapon | Mount | Power | Heat per shot | Range | Other actions to reload |
| --- | --- | ---: | ---: | ---: | ---: |
| Mass Driver | Light | 2 | 12 | 5 | 1 |
| Railgun | Medium | 4 | 22 | 8 | 2 |
| Laser Cannon | Medium | 5 | 28 | 6 | 2 |
| Pulse Laser | Light | 3 | 20 | 4 | 1 |

Each mount reloads separately. Every career turn cools the ship; a tactical wait doubles cooling. Firing and boosting require enough heat headroom before the action is committed. Shield generators hold 20 damage points per installed grade, scaled by integrity. A hit delays recharge for three career turns. Recharge restores 3 per turn and adds 1 heat, subject to capacity. Upgrading a shield also reserves another reactor power point.

Hull damage can cause a component critical; hits fully absorbed by shields cannot. A living engineer reduces both the chance and severity. Damage preserves the installed equipment and changes its effective performance:

| Core | Damage effect |
| --- | --- |
| Engines | Lose one effective rating per 25 integrity points lost. At zero, normal thrust and boosts fail; galaxy travel offers the existing stranded/SOS recovery. |
| Reactor | Output scales with integrity. Too little output also shuts down sensors, propulsion and shields. |
| Shield generator | Reduces shield capacity; charge above the reduced limit is lost. |
| Cooling | Reduces cooling rate, leaving a minimum of 1 radiative cooling per turn. |
| Sensors | Lose one effective rating per 25 integrity points lost. A rating-one sensor at 75% integrity is offline. Existing charts remain; new chart reveals, live ship markers, tactical target locks and paid scans stop. Unfamiliar orbital layouts require functioning sensors. |
| Fuel tank | At 50% integrity or below, usable capacity becomes half the installed capacity. Excess fuel leaks out. Repeated damage does not repeatedly halve capacity. |

A living engineer can spend a repair kit and one turn to restore **25 + 3 × engineering skill** integrity, up to 85%. A temporary bypass costs one turn and provides at least 75% effective integrity and basic engine/sensor operation for 15 career turns; the physical damage remains. A tank rupture needs a kit or station repair. Field work is available aboard the ship in space/combat or while standing at its surface landing tile. Combat repair gives opponents their normal response. Station technicians restore full integrity for 2 credits per missing percentage point without requiring an engineer. Repairing a tank restores space but does not replace leaked fuel. Emergency rescuers can restore a disabled drive to working order. A failed engine alone does not suffocate the crew while fuel and reactor power can run life support; the existing exposure drain applies to an empty tank or failed reactor.

Start a new career for this equipment model. Earlier saves use a different schema.

## Crew at a glance

The sidebar shows one badge per living crew member. **C** is Captain, **N** Navigator, **E** Engineer, **S** Scientist, **+** Medic, **m** Mercenary, and **r** Redshirt. The meter shows remaining HP in green, amber below 60%, and red below 30%. A pulsing **!** marks an active condition and stays still with reduced motion enabled. Hover for the crew member's name, exact HP, and known conditions. Open **I → CREW** for the full roster.

Talk to a crew member and choose **Check morale → Issue encouragement** to attempt a social check. Success gives +3 current morale for 30 career turns. Failure leaves morale alone. Either result starts a 40-turn cooldown for that crew member. The morale breakdown lists base outlook, the encouragement bonus with its remaining turns, and current morale separately. Saved careers preserve the time remaining.

## The captain’s log

Open **I → LOG**. The default **6 / RECORDS** view starts with active science contracts, known open rescue leads, and pending deliveries. Survey totals, known civilization relationships, closed incidents, and history follow. Major discoveries and rescue events also appear in ALL and MISSION. The log keeps known discoveries in the save. Repeated scans update the existing finding. Use **J** in the ship inventory tab to jettison cargo.

The sidebar log carries combat events, routine updates, NPC speech, and radio traffic. Combat has no separate log window or font controls; its events also stay in LOG history. The normal sidebar controls and +/− keys adjust log text during combat. The collapsed Shortcuts reference switches to combat controls during an encounter. The full-width banner is for immediate action, such as critical fuel or oxygen, a rescue decision, armed explosives, or an adjacent singularity.

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
