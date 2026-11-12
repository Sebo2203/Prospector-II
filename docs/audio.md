# Sound effects and auditions

Experimental.98 integrates the selected recordings into existing game actions, fully offline in the single-file HTML. The chosen ramming sound is **C8-D**; **C9-B** is used as the provisional asteroid-collision sound under the author's instruction to implement the complete selection. Original crew pain remains strictly planetside. No new travel, combat, weapon or save mechanics are introduced.

## Current routing

| Recording / choice | Actual event |
| --- | --- |
| C1 / C2 / C3 / C4 | Mass Driver / Railgun / Laser Cannon / Pulse Laser committed shots, including misses, for player and visible enemy fire. |
| C5 | Artemis launch for player or visible enemy, including base bombardment. One cue per launch; later impact uses the ordinary resolved hull/shield cue. |
| C6 | Shield-only weapon impacts in combat; shield-absorbed turret/pulsar/galaxy-nebula impacts. |
| C7-A | Successful committed combat boost; refused boosts have no engine cue. |
| C8-D | Normal and boosted physical ship rams, incoming and outgoing. One dedicated crash replaces the generic hull-hit cue for that collision. |
| C9-B (provisional) | Committed boost/asteroid collision, using the dedicated impact rather than an additional generic hull hit. |
| C10-B | Actual tactical nebula discharge, including an empty struck pocket, and galaxy charged-gas damage. Never an advance warning or a harmless nebula move. |
| C11 | First successful/partial paid orbital scan of a previously unscanned planet or moon. Further scans of that body stay quiet, including after save/load. Failed attempts remain silent; a later first scan that returns data can sound once. Free completed-scan browsing stays silent. |
| Synthesized station chime | Successful station/casino docking: the restored original three-note C5/G5/C4 cue. |
| C12-A | Successful ringworld hatch opening and Mercy of Dawn pressure/ward hatch opening. This was the station-entry recording before experimental.103. |
| C12-B | Ancient door successfully unlocked. Refused locks, already-open doors and ordinary floor movement stay silent. |
| Original W1 | Ground energy fire: Plasma Pistol and NPC energy pulses, including committed misses and adjacent crew attacks with that weapon. |
| Original W2 | Actual C4 blast on the ground or in inventory, plus existing damaging meteor impacts. No new explosive item is added. |
| Original W3 | Nebula Wraith/Devourer incoming contact attack, whose existing mechanic is a ram. This replaces the ordinary ship-ram cue for that creature attack. |
| Original W4 | Ground Burst Carbine/Assault Carbine and NPC Spitter Carbine fire. Not assigned to single-shot handguns, sniper rifles, shotguns, darts or melee tools. |
| Original W5 | Resolved weapon hull impacts, including criticals and outgoing hits, base bombardment and existing rough-landing/environmental ship impacts. No longer used for the old ground-crew meteor/energy-node callers. |
| Original A1 / A2 | Existing warning / critical oxygen and fuel thresholds; existing latches prevent repeated alarms. |
| Original LAND / START | Existing successful landing/boarding and liftoff cues. Failed liftoff has no launch sound. |
| Original PAIN | Physical ground crew damage, including existing hazard/combat callers and the corrected ancient energy-node caller. Never shipboard casualties. |
| Original WORM | Embedded and available through `SFX.wormhole()`, reserved for future wormhole travel. **There is no wormhole-travel action in the current game**, so no unrelated action triggers it. |

Existing refueling, repair and suffocation/breathing effects remain synthesized because no replacement recordings were selected for them. No music, continuous engine loop, spoken dialogue, additional warning banner or sound-settings UI was added.

Ship fire/impact presentation remains in the existing ordered feedback queue; shot identity, actual hull loss and collision type are disposable event metadata outside the career. Player and visible enemy launches sound at presentation start. Shield-only impacts use C6; hull/critical impacts use W5. Missiles sound when launched, not again when their saved flight advances, and ordinary impact feedback occurs only when they arrive and hit. Unknown/offscreen enemy launches are not announced by audio; damage to the player still receives impact feedback.

The existing handoff of final combat feedback into galaxy mode is retained, including fatal impacts. A new encounter, another mode/location or another career invalidates stale queued sample requests. Crew pain has a stricter planet-mode and planet-identity guard. Successful ordinary actions may still trigger existing resource alarms during rendering; a refused boost with an empty tank has no boost cue, but the existing fuel alarm can sound.

## Runtime and build

`art/source/audio/catalog.json` is the authoritative runtime selection, with IDs, retained playback paths, byte counts, SHA-256 hashes, audition choices and source metadata. The 23 compressed playback files live alongside it; unchanged original `pain.wav` remains under `art/source/prospector/audio/`. All eleven original WAVs are retained there with their original Git blob hashes, separate from compressed playback copies. Kenney license notices and individual Freesound source links are retained in [the source note](../art/source/audio/README.md). Original Prospector provenance has its separate [notice and remaining credit research](../art/source/prospector/audio/README.md); it is not claimed as CC0 or licensed by Minecraft.

Run `npm run art:audio` to regenerate `src/assets/audio-samples.js`, then `npm run build` and `npm test`. Regeneration verifies retained playback hashes and embeds each shared clip once. Normal generation/build/play needs no network, FFmpeg or downloaded previews. An asset-integrity test rejects stale generated audio, changed hashes and unexpected audition choices.

`src/audio/sound-effects.js` owns a single lazily created Web Audio context and the cache. Genuine keyboard/pointer interaction primes all 24 recordings; individual effect calls also work through the same loader. Each buffer decodes once, with a fresh source/gain per playback. Pending requests for the same sample coalesce; pain, alarms and travel additionally coalesce as exclusive groups. One pain/alarm/travel voice or up to three voices per other group can play, with an overall eight-voice bound. A shared compressor reduces peaks from overlapping recordings; it does not change the retained clip bytes. Normal sample gain is 0.65, warnings 0.35 and critical alarms 0.45. No pitch randomization is used.

Pending requests capture career, location/mode or encounter identity and expire after 1.5 seconds. `renderAll()` calls `SFX.syncContext()` to cancel stale requests/voices. Synchronization itself creates no context or decode work. All buffers/promises/nodes live outside `G`; audio neither enters saves nor uses gameplay RNG, applies damage or advances turns. Failed/unavailable decoding leaves gameplay intact. Browser playback still requires ordinary user interaction and an enabled output device.

## Size and encoding

The experimental.98 standalone HTML is **3,196,970 bytes** (about 3.20 decimal MB), compared with .97's 2,405,602 bytes. The 24 embedded recordings total **666,651 bytes before Base64**, with 23 96-kbit/s stereo MP3s and the unchanged 74,132-byte mono pain WAV. Exact selected audition MP3s were retained, including C8-D's final headroom-adjusted file; rejected alternatives are not embedded.

The original eleven WAVs total 3,935,764 bytes and would have produced an estimated 7.55 MB .97 HTML if all embedded raw. Source WAVs, licenses, tools, alternate auditions and encoder binaries are not extra downloads required to play the game. The optional development encoder remains outside the game.

## Auditions and decisions

The [dated proposal](audio-candidates-2026-11-12.md) records all author feedback, rejected/superseded alternatives, exact construction manifests and reproduction commands. `node tools/preview-prospector-audio.cjs` recreates the eleven-original listening board. The three optional Python tools recreate the Kenney board, Freesound replacements and processed collision comparisons; they need the documented optional FFmpeg setup and network for uncached sources. Generated boards/cache files remain ignored, and prior boards are preserved with unique filenames.

Current selections are integrated. Recreating an old board does not change the runtime catalog. Original WORM remains reserved; the asteroid choice remains provisional and can be replaced after later listening/playtesting.

## Checks and limits

`node qa/run.cjs audio` opens the built HTML with HTTP(S) blocked, decodes all 24 embedded recordings and observes actual buffer-source playback from native actions. It covers committed/missed and refused shots, enemy fire, delayed Artemis impacts, shield-only hits, boosts, ship/asteroid/wraith collisions, tactical/galaxy nebula damage, scan success/failure/browsing, ringworld/Mercy pressure and ward hatches with silent already-open repeats, ancient doors/refused locks, the scheduled notes of the synthesized docking chime, ground weapons/NPC energy fire, placed/inventory C4, landing/liftoff/docking, resource-alarm latches, ground-only pain, pending/retrigger cancellation, one decode per sample, unchanged serialized career/RNG and harmless decode failure. Fixtures grant controlled legal combat equipment/positions and force outcomes; they are not unassisted careers or human listening.

Related combat feedback, ramming, missile-flight, nebula-combat/damage, scan-comms, landing-impact, turn, oxygen, palette and transactional-autosave suites validate surrounding behavior. No new save schema or debug object is required. Tests verify routing, decoded files and presentation calls; loudness, comfort and timing during sustained play still need human listening across devices.
