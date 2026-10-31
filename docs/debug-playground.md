# Debug playground

Open the existing debug menu with **Shift+B** during a run.

| Key | Action |
| --- | --- |
| F2 | Enter the galaxy palette, or return to its arrival station |
| F3 | Enter the surface gallery |
| F6 | Open the searchable directory; type a name/category, use arrows and Enter to visit |
| Shift+F2 | Rebuild both palettes from the current content catalogs |
| F7 | Toggle live NPC movement while the debug menu or directory is open |
| F4 | Leave the playground and restore the career, including its previous debug settings |

F4 also works during dialogue, combat, item search and after death. F2/F3 and rebuilding refill the test ship and restore the test crew. The ordinary debug switches remain available. Default test settings grant fuel, hull, oxygen and crew protection, full vision, ample credits, cargo space and crew roles. These belong only to the disposable test session.

## Galaxy

The map lays out labeled samples of every registered galaxy object, each star type, every biome, civilization tiers and aggression states, and every civilization species. Stations, pirates, traders, cargo/science/patrol ships, derelicts, stranded and research ships, both nebula colors, gas entities, drifting cargo and Mercy of Dawn are included. Use normal approach, hail, scan, land, boarding, combat, trade and surface controls. The directory places you at the selected galaxy position; Enter interacts or enters orbit. Gas giants include a rocky moon and ancient station. Trader, cargo, science and patrol samples use their distinct original hulls from experimental.10; the research-ship sample uses the science silhouette. Mercy of Dawn is always available here, even though normal careers now discover it only through an optional exploration event.

Civilization examples are actual generated inhabited maps, including an underwater map for aquatic contact. Creatures, locals and galaxy ships stay still while simulation is off, making them easy to inspect. Turning simulation on allows their normal movement and behavior. Terrain hazards and deliberate combat/interaction still use the existing game rules.

From experimental.11, biome and civilization exhibits show body previews rather than the yellow stars of their underlying test systems. Previews reuse orbital-view artwork, including planet colors/continents, gas-giant bands, asteroid shapes and intact/broken ringworlds. Ancient-station and cave exhibits use existing station/entrance drawings. The star-type exhibits still show stars. This applies only to the test palette; ordinary galaxy systems keep their star icons.

The Void Royale and Derelict Station biome entries are native casino/derelict objects with their normal artwork and boarding behavior. Void Royale no longer appears as a sun, and Enter boards its walkable deck directly. Both its galaxy-object and biome entries remain available in the directory. Other planetary biomes retain their normal orbit and landing controls; civilization directory entries still enter the prepared contact map. ASCII mode has matching body symbols and casino/derelict glyphs.

If a test palette is already open from an older build, use **Shift+B → Shift+F2** to rebuild it, or return to the career with F4 and enter it again. Rebuilding resets only the disposable test worlds.

## Surface

The large walkable gallery contains each terrain/building tile, debug/store equipment, implants, commodities, creature body archetypes, hostile body archetypes and a gunner alien. Samples are labeled; X gives the existing examination view. Gear is real dropped inventory: step onto it to collect it and equip/use it normally. Commodity stations load a real cargo unit on Enter. Creature samples use actual combat and communication rules. Procedural names, randomized stat rolls and every possible trait combination are not separate exhibits.

Galaxy samples are spaced five tiles horizontally and four vertically. Surface samples are three tiles apart, leaving two clear tiles between them. Long map labels are abbreviated to fit; the directory keeps their full names.

Raw building tiles are useful for visual and collision inspection; some require a world-specific state machine to function. Use the matching casino, civilization, biome or quarantine scenario in the same directory for their full interaction. For example, use Mercy of Dawn for its pump, treatment and survivor transport rather than expecting an isolated pump tile to create an entire rescue incident.

## Career isolation

Entry saves and retains the original career, then constructs an independent test world. Playground actions do not write the career autosave, export a game save, load another save over the test session or emit gameplay analytics. F4 restores the retained run exactly. Going to the main menu or quitting discards the playground; Continue uses the career autosave. Rebuilding removes test-world changes and re-reads the catalogs. It does not modify the retained career.

## Keeping it complete

`DEBUG_GALAXY_OBJ_TYPES` is the common galaxy spawn registry. A new object or authored galaxy incident must have a working factory there; the ordinary object spawner and palette then share it. New generator tile types without a registered representative fail the coverage test. Special objects need their associated state arrays and normal interaction data, not just a display tile.

The surface generator reads `TILE`, `BIOMES`, `DEBUG_ITEM_CATALOG`, `CORP_ITEM_POOLS`, `PAWN_ITEM_POOL`, `MEDBAY_ITEM_POOL`, `IMPLANT_CATALOG`, `COMMODITIES`, `CREATURE_BODY_TYPES` and `HOSTILE_BODY_TYPES` at rebuild time. Civilization maps read `CIV_TIERS`, `CIV_AGGRESSION` and `CIV_SPECIES_TYPES`. Add content to its owning catalog; do not maintain a second hand-written list of gallery tiles/items. Context-dependent NPCs/buildings need a scenario adapter in `src/debug/playground.js`.

The source rules in AGENTS.md require maintaining this behavior for future additions. Tests inject new terrain, gear and galaxy definitions and verify that rebuilding includes them. Catalog coverage does not replace testing the new object's actual interaction.
