# Hulls, refits and exchanges

Implemented in experimental.83 on `experiment/expedition-legacy`. Start a new career: current careers use save schema **5**; see [crew combat](ship-combat-crew.md). The original Scout, Freighter and Corvette remain the only three starting choices. The Hangar reads a separate, paged purchase catalog; no additional hulls have been added yet.

## Physical roles

Size provides room but increases operating costs and environmental exposure. Structure supports armor and weapons. Engineering supports engines, reactors, cooling and shields. Precision limits sensors; geometry affects drive performance; hardpoint density and cargo allocation describe the factory's intended role. These are hull properties, unaffected by damage or purchased plating.

| Factory hull | List price | Size | Structure | Engineering | Spare refit space | Frame support |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Light Scout | 3,000 | 1 | 1 | 2 | 12 | 4 |
| Bulk Freighter | 4,500 | 2.5 | 1 | 1.5 | 23 | 9 |
| Attack Corvette | 6,000 | 1.5 | 2 | 3 | 18 | 10 |

| Factory → individual ceiling | Scout | Freighter | Corvette |
| --- | --- | --- | --- |
| Hull HP | 100 → 120 | 120 → 160 | 110 → 170 |
| Fuel capacity | 100 → 180 | 180 → 320 | 90 → 210 |
| Cargo | 0 → 1 | 5 → 15 | 0 → 1 |
| Crew berths | 4 → 5 | 8 → 12 | 4 → 7 |
| Sensor grade | 3 → 6 | 1 → 2 | 2 → 3 |
| Engine grade | 2 → 4 | 1 → 3 | 3 → 6 |
| Shield grade | 0 → 3 | 0 → 2 | 1 → 5 |
| Weapon mounts | 1 → 2 | 0 → 2 | 2 → 3 |
| Utility bays | 0 → 1 | 1 → 3 | 2 → 2 |
| Reactor / cooling grade | 1 → 2 | 1 → 2 | 1 → 3 |

These ceilings cannot all be fitted simultaneously. Factory equipment is already allocated; upgrades compete for **spare refit space**. Every +20 HP, +20 fuel, sensor grade or cargo slot costs one space. An engine/shield/reactor/cooling grade, crew berth or utility bay costs two. A weapon mount costs three. Mount dimensions and reactor demand still constrain the actual weapons fitted. Structural load is mounted weapon sizes plus added plating HP / 40; it must fit frame support.

Hangar → Upgrades shows the shared budget and the reason an upgrade is unavailable. **Refit layout** removes additional refits to reclaim space, recovering 25% of their documented purchase price. Factory allocations cannot be stripped. Store weapons/utilities before removing occupied bays; unload cargo or reduce crew before removing needed capacity. Removing tanks explicitly reports surplus fuel that will be vented. No engineer is required.

## Travel and risk

| Stock hull | Drive pace | Fuel / sector | Fuel / space wait | Fuel / launch | Fuel / combat boost |
| --- | ---: | ---: | ---: | ---: | ---: |
| Scout | 2 | 0.8 | 0.5 | 1 | 2 |
| Freighter | 0.54 | 2 | 1.25 | 2.5 | 5 |
| Corvette | 2.69 | 1.3 | 0.75 | 1.5 | 3 |

Drive pace is effective engine grade × geometry / √size, rounded to two decimals. It controls relative NPC movement in pursuit and the combat arena. A larger hull needs more engine grade to achieve comparable pace. Engine grade controls exhaust effects; crew CBT/NAV now control accuracy/evasion (see [bridge combat](ship-combat-crew.md)); this is not a full mass/acceleration simulation. NPCs without a hull blueprint retain their authored engine pace.

Travel fuel is size × (0.8 + 0.1 × installed engine grade) / (1 + 0.1 × engineering), rounded to one decimal. Stronger drives improve pace but cost more fuel per sector. Space waiting costs 0.5 × size, launch costs size, and a two-tile combat boost costs 2 × size. Normal arena thrust retains its existing heat cost without extra fuel. Scans, fuel scooping and special hazards retain their separate costs. Fractional fuel and expenditure are preserved. Debug Infinite fuel applies independently of hull protection.

Movement requires a working drive and enough fuel for a whole sector; a small positive remainder cannot buy a free move. Existing SOS/rescue handles this condition. Positive reserves keep life support stable while awaiting help; actual exhaustion or reactor failure still causes exposure.

Landing does not reserve launch fuel or prevent an approach with insufficient fuel to leave. **Attempting liftoff from the ship without the full launch cost ends the career.** The mission-failed screen explains that the stranded crew exhausted their supplies. The low-fuel launch control remains clickable, and keyboard/mouse use the same outcome. The ending spends no extra fuel or gameplay turns; its final narrative does not simulate additional survival days. Exact launch fuel succeeds, and debug Infinite fuel bypasses expenditure and this failure. Trying to launch while away from the ship still only tells you to return. SOS/rescue remains available in space.

Rough-landing chance and navigation training are unchanged. A failed approach rolls 3–10 × size damage, rounded once, directly against the hull: **landing impacts bypass shields**, retaining ordinary component criticals, possible death and debug hull protection. The impact does not spend shield charge or delay its recharge; damage to the shield generator can still reduce its capacity normally. Rough-landing probability is max(0, 25% − 3% × best living crew NAV); NAV 9 and above guarantee a smooth approach. Thus a Freighter's larger tank and hold come with a larger crash exposure. Nebula sparks/arcs also use the same physical size, retaining their severity rolls and navigation mitigation; see the [nebula rules](experiment.md#nebula-monsters).

## Buying another hull

The shipyard shows a complete quote. Select a hull, **Review exchange**, then **Confirm exchange**. Selection, review and cancellation do not spend credits or advance turns. Payment revalidates the quote against the current ship, equipment, credits and station.

```text
condition = 60% hull HP fraction + 40% average six-core integrity
bare-hull trade-in = floor(old list price × 50% × condition)
refit trade-in = floor(documented permanent refit investment × 25% × condition)
net = new list price + 500 transfer + required cargo/crew refits − both trade-ins
```

Healthy unmodified exchange charges, with no additional cargo/berth refits, are Scout→Freighter 3,500; Scout→Corvette 5,000; Freighter→Scout 1,250; Freighter→Corvette 4,250; Corvette→Scout 500; Corvette→Freighter 2,000 credits. Damage reduces trade-in value. Round trips lose money. These are initial prices; whole-career affordability and operating reserves still need balance playtesting.

The replacement has factory HP and healthy cores, retaining current fuel only up to its tank capacity. The quote reports any surplus to be vented. It includes no free fuel, weapons, utilities or missiles. The starting Corvette's railgun belongs to its initial package, not every Corvette purchase.

Every fitted weapon and utility goes into **that station's equipment stores** during exchange, including incompatible items. Cargo, living crew and missile stock remain aboard. Required crew/cargo refits are priced and checked against shared space and physical ceilings; if they cannot fit, exchange is blocked. A tow must be resolved first. The quote states that weapons/utilities need refitting before departure.

Armament can store a weapon and install an owned local weapon for free. Modules can store/refit utilities. Replacing a weapon stores the old one rather than deleting it. Fitting the same weapon type to its already-equipped mount is refused without charging or changing stock/reload timing, including when a spare copy is stored. Identical weapon types on different mounts remain legal. The armament list and weapon picker use aligned blue Hangar rows with separate text lines. Stores preserve reload deadlines; storing/refitting cannot bypass reload or create missiles. Stores are local to the named station and survive save/load. Stored items can be sold for half catalog value; capacity is 256 weapons and 256 utilities per station. An occupied tractor beam cannot be stored while towing.

## Development

`ships/hull-framework.js` owns registration, derived limits, fitting budgets, refit transactions, travel costs and exchange quotes/commits. Definitions live in `ships/classes.js`; registration validates factory stats against the physical envelope. Limits are derived from size, structure, engineering, precision and layout rather than repeated station-specific caps. `hullSystemProfile` derives mount dimensions and base power/thermal profiles. `ui/hull-yard.js` draws the catalog and quote. Starter IDs/packages are explicitly separate from later availability.

The **HULL WORKSHOP** debug-palette scenario opens the real Hangar with a factory Corvette, two crew and 10,000 credits, enforcing normal fitting constraints. Revisiting resets it; returning restores the retained career. General galleries keep their deliberate sandbox overrides. No playground saves or stores replace career state.

Run `npm run build`, `npm test`, and `node qa/run.cjs hulls` after changing these rules; related combat, systems, palette and persistence suites are documented in [QA](../qa/README.md). These scenarios establish transactions and rules, not whole-career balance. More hulls, four-plus-mount combat layout, station stock/progression restrictions, cargo-mass simulation and a revised time-based difficulty curve remain future work.
