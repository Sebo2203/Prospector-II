# Equipment audit — November 12, 2026

Build: **0.28.0-experimental.102**, branch `codex/original-prospector-audio`. Local experimental artifact; no GitHub publication. This audit found functional defects, fixed them and added reusable native-action scenarios. It does not establish final equipment balance or guarantee every procedural combination.

## Findings and changes

- **Paid deliveries:** radio merchants could charge for items their receiving function never added. All pawn equipment now uses the shared stock-to-inventory factory. Station/corporate shops and civilization barter also preserve functional metadata. Corporate Jetpacks receive their advertised 15 charges; Mining Lasers retain their 2.5 extraction multiplier. Shop bookkeeping is stripped from delivered gear.
- **Repair Kits:** purchases now deliver a carried kit. Previously the supply-shop branch immediately applied a hull patch, potentially wasting a purchase on a full hull. Kits can be kept for existing inventory hull repairs or F3 core repairs.
- **Implants:** skill bonuses now participate in effective checks, Lung Filters reduce oxygen consumption, Reflex Coil accuracy changes actual ranged outcomes, and Adrenal Amplifier ATK reaches ranged damage. Learned skill/XP remains separate from effective skill; the crew table shows an effective value when modified. Clinic removal targets the selected roster member even when two crew share a name.
- **Honest implant descriptions:** removed three unsupported secondary promises: Subdermal HUD's special creature-health reveal, Pain Suppressor's full efficiency until zero HP, and Biosense Skin Graft's passive alien detector. They retain their working **+1 SCI**, **+10 maximum HP**, and **+2 MED/+1 SCI**, respectively. No new detector or injury immunity was invented.
- **Nonlethal weapons:** equipped darts no longer also consume a spare kit from inventory. Adjacent and stray darts stun without lethal damage. Stun Baton damage alone cannot kill a creature. Other squad members carrying lethal weapons can still kill it.
- **Line of fire:** successful ranged rolls no longer bypass walls or intervening creatures. Physical tracing determines what the shot reaches; targeting percentages and actual accuracy share a calculation.
- **Consistent weapon stats:** equipped/readout/returned gear uses the same attack bonuses as combat, including the handgun's actual +2. Diving Suit equip feedback correctly reports zero armor DEF; its underwater benefit is separate.
- **Owned gear:** equip/swap/unequip/save/load retains the full item object, including value, description and metadata. Previously reconstruction could discard those fields. Retained equipped objects are validated against their actor before a load is installed.
- **Mining:** carrying the old drill before a Mining Laser no longer selects the slower tool. Both extraction input paths and the context estimate use the best tool/effective ENG. Partial extraction is tied to the planet as well as its coordinate.
- **Combat Stim:** +3 ATK expires at its eight-turn deadline, rather than lasting a ninth turn. Refused stacking does not consume another dose.

## Catalog coverage

The dedicated audit discovers **50 named inventory entries covering 44 usable types** from debug, pawn, corporate, medbay and generated civilization stock. Regional names sharing one usable type use the same action implementation. Mercy's emergency medicine variants use the ordinary medical actions; their encounter interactions have separate interface/mission coverage. Commodities, research samples, valuables and quest records are not treated as equippable gear.

| Group | Items inspected | Native behavior checked |
| --- | --- | --- |
| Firearms | Simple Handgun, Shotgun, Burst Carbine, Sniper Rifle, Plasma Pistol, Assault Carbine | Acquisition, equip/return, committed firing, damage/bonuses, line of fire; shared metadata and persistence |
| Melee/nonlethal | Combat Knife, Vibroblade, Stun Baton, Tranq Dart Kit | Adjacent damage, nonlethal limits, ranged dart use/strays and exact equipped-kit consumption |
| Armor | Flight Suit, Reinforced Suit, Combat Exosuit, Armour Plate, Diving Suit | Equip/strip, actual incoming protection, truthful equip text and submerged oxygen benefit |
| Medical | Medikit, Medikit (local), Field Medkit, Advanced Trauma Kit, Field Rations, Rad-Flush Tablet, Iodine Pills, Antibiotics | Healing/condition treatment, consumption, no-treatment refusals; Mercy Emergency Medikit/Antibiotics share these actions |
| Temporary support | Mild Anti-depressants, Joy Dust, Fermented Brew, Combat Stim | Morale/attack effects, duration and stacking refusal; broader morale expiration/base rules covered by root/morale scenarios |
| Supplies | Oxygen Tank, Oxygen Canister, Repair Kit | Actual refill/repair, invalid location/full-resource refusals; F3 repair also covered by ship-systems scenarios |
| Passive tools | Floodlight, Ore Scanner | Actual +2 sight and ore marks within eight tiles |
| Mining | Handheld Drill, Mining Laser | Bought tool metadata; real Enter extraction at ENG zero takes ten/four actions; best-tool choice and planet-specific progress |
| Movement/recon | Grappling Hook, Jetpack, Sensor Drone | Real keyboard leap, blocked grapple, charges/cancellation/final charge; drone launch/movement/reveal/expiry and invalid-location refusal |
| Capture | Capture Net, Containment Crate | Net/crate sequence, live specimen creation, station bounty redemption and repeat-payment refusal |
| Explosives | C4 Charge | Arm, drop, saved five-turn fuse, actual movement until structural blast; additional audio checks cover explosion routing |
| Mercy equipment | Folded Isolation Pod, Mercy Pump Coupling | Actual authored encounter use in interface/mission scenarios, survivor treatment/transport rules and transactional saves; not substituted with generic inventory consumption |
| Implants | Neural Accelerator, Adrenal Amplifier, Bone Lace, Lung Filter Implant, Subdermal HUD, Pain Suppressor, Reflex Coil, Biosense Skin Graft | Install/duplicate refusal, two-slot cap, numeric modifiers, actual ranged/oxygen outcomes, removal and saved state |

Ship equipment also received actual-function checks:

| Equipment | Result |
| --- | --- |
| Mass Driver, Railgun, Laser Cannon, Pulse Laser | Native committed firing, actual damage, repeat-fire refusal and valid saved deadlines; armament/ship-systems suites cover fitting and power |
| Artemis launcher | Native launch consumes ammunition and creates a delayed missile; missile-flight scenarios verify eventual impacts, target identity and persistence |
| Fuel Scoop | Paid installation and actual nebula scooping/fuel/turn effects |
| Tractor Beam | Paid installation, native tow and station sale |
| Ship Mining Drill | **Unfinished:** disabled `Coming soon` Hangar entry. No ship-mining gameplay exists; audit asserts it cannot be bought |
| Core systems/refits | Existing ship-systems/hulls scenarios passed, including installation, damage, repairs, power and retained state; this pass did not redesign core balance |

## Validation performed

- `npm run build`, then `npm test`: **115 root tests passed**, with source/generated HTML and version synchronization checks passing.
- Strict `node qa/run.cjs equipment`: **160 scenario checks passed**, no uncovered usable types and no browser errors. Counts represent scenario groups; some contain several assertions.
- Related headless Edge suites passed: `crew-equipment`, `armament`, `ship-systems`, `hulls`, `missile-flight`, `oxygen`, `crew-balance`, `morale`, `turns`, `interface`, `missions`, `stations`, `palette`, `autosave`, `bridge`, `audio`. Together with equipment this is seventeen distinct suites. The last inventory-label adjustment was followed by another build/root run and the equipment suite, rather than repeating unrelated suites.
- Visually inspected the generated crew-page screenshot with trained SCI 3/effective 5 and trained ENG 2/effective 3. Fixed an overlap with the existing skill label during that inspection.
- Palette coverage/interaction/reset/career-isolation checks passed. No new content or separate catalog was added. Test output, screenshots and synthetic saves remain ignored under `qa/artifacts/`.

These are fixture-assisted checks against actual functions and native inputs in the built HTML, using isolated test careers, granted equipment/credits and bounded forced outcomes. The radio audit exercises its receiving function; actual barter and station purchases exercise their transaction actions. They do not prove natural item availability, every terrain combination, all multi-crew effects, prices, long-run usefulness or human enjoyment. Natural expedition/loadout playtesting remains necessary. No personal saved career was needed or modified.

## Saves and remaining work

Career schema **five** remains unchanged. Full retained equipment is saved as ordinary crew data; malformed retained metadata is rejected before replacing the active career. No migration or compatibility layer was added. Values already discarded by older equip actions cannot be reconstructed retrospectively. Existing current-format careers with only factory-style equipment names remain valid without inventing metadata.

Finish Ship Mining Drill only as a separate gameplay design task. The three removed implant abilities remain unimplemented; revisit their design deliberately if wanted. No economy rebalance, new equipment tiers, automated natural careers, executable packaging, public upload or private-lore edits were part of this audit.

Reproduction/setup and controller limits: [QA guide](../qa/README.md). Implementation map: [architecture](architecture.md#crew-and-field-equipment).
