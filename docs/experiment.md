# Expedition guide

These rules apply to the active experimental build. [Download instructions](../README.md#play)

## Controls

Click the context bar actions or use their displayed shortcuts. During play, the top-left **ESC** button does the same thing as the Escape key. Use the compass to move or wait. In Examine and landing scans, click a tile or move the cursor with the compass or arrow keys. Confirm a landing with **Enter** or **Land at selected site**. In ground firing mode, click a tile to aim and click that tile again to fire, or use **Enter**. Toggle **Shortcuts** to show or hide the gray keyboard reference.

Open Inventory with **I** or Options with **O**, or click their context buttons. Click menu choices or use their displayed keys. Select cargo and press **X**, or click its slot, to open the same details. Hover gives a quick preview. Use **On-screen keys** to enter names or feedback text, or to choose a common movement key while rebinding.

Open **Active Missions** below **Shortcuts** for a compact view of accepted contracts, known rescue work and package deliveries. It shows destination coordinates, collection counts and remaining objectives. General survey work stays in the log's Records view. The footer displays either Shortcuts or Active Missions at a time. Use the mouse wheel to scroll, or Tab into the mission panel and use the arrow keys, Page Up/Down or Home/End. Escape closes the panel.

Use **Shift+Z** to dive or surface, **Shift+O** to refill oxygen at the ship, and **Shift+X** to release a tow. These commands also appear as context actions when available.

## Tactical ship combat

Ship encounters open a turn-based combat map. Nearby pirates or hostile patrols can fight as a group of up to four ships. Use movement keys or the compass to fly one tile. Asteroids are optional cover and block both movement and shots. Amber exhaust is hazardous to any ship that crosses it. Stronger engines leave more damaging exhaust that lasts longer.

Click a target or press **Tab** to cycle contacts. Click a weapon or use its displayed number to select it, then press **F** or click **Fire**. A second click on the mouse-selected target also fires. The weapon panel shows its range, whether cover blocks the shot, and the remaining cooldown. Moving and waiting both give weapons time to reload and let opponents act.

Fly to an edge and use **R** to disengage. Enemies with a clear shot and a ready weapon can fire once as you leave. Use **H** to offer surrender. Pirates may take cargo and credits, and patrols warn you before a second press confirms arrest. The encounter uses local rounds and resumes galaxy travel when it ends.

## Crew at a glance

The sidebar shows one badge per living crew member. **C** is Captain, **N** Navigator, **E** Engineer, **S** Scientist, **+** Medic, **m** Mercenary, and **r** Redshirt. The meter shows remaining HP in green, amber below 60%, and red below 30%. A pulsing **!** marks an active condition and stays still with reduced motion enabled. Hover for the crew member's name, exact HP, and known conditions. Open **I → CREW** for the full roster.

Talk to a crew member and choose **Check morale → Issue encouragement** to attempt a social check. Success gives +3 current morale for 30 career turns. Failure leaves morale alone. Either result starts a 40-turn cooldown for that crew member. The morale breakdown lists base outlook, the encouragement bonus with its remaining turns, and current morale separately. Saved careers preserve the time remaining.

## The captain’s log

Open **I → LOG**. The default **6 / RECORDS** view starts with active science contracts, known open rescue leads, and pending deliveries. Survey totals, known civilization relationships, closed incidents, and history follow. Major discoveries and rescue events also appear in ALL and MISSION. The log keeps known discoveries in the save. Repeated scans update the existing finding. Use **J** in the ship inventory tab to jettison cargo.

The sidebar log carries routine updates, NPC speech, and radio traffic. The full-width banner is for immediate action, such as critical fuel or oxygen, a rescue decision, armed explosives, or an adjacent singularity.

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
