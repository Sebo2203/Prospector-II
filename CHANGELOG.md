# Development changelog

This is the ongoing record of meaningful changes to Prospector II. Newest work comes first. Entries distinguish implemented behavior from planned work and record the reason, validation, save impact and remaining limits. Git history contains the exact file changes.

Early experimental entries were backfilled on October 31, 2026 from commits and the existing development notes. Historical validation describes checks recorded for those changes; it does not imply every old version was rerun during the backfill. Earlier development remains in [the historical changelog](docs/archive/Changelog%20Prospector%20II.txt) and Git history.

## How we maintain this record

- Update this file in the same commit as every meaningful gameplay, balance, UI, debugging, architectural or development-workflow change. Group related fixes into one entry; routine generated-file updates belong with their source change.
- Record the date, branch and version when applicable; what changed and why; checks actually run and their limits; save compatibility or migration; and unresolved work. Include commit/PR references when available. Documentation-only work does not need a new game version.
- Record reversals and removals explicitly. Keep earlier entries as history and say which behavior superseded them.
- Keep detailed current behavior in the relevant system guide. Keep future intentions in the roadmap; update its status when work lands. Link those documents from the entry instead of maintaining competing histories.
- Before handoff, check that the changelog, README's current description and any affected guide agree with the implementation. Test results are evidence for the checked scenarios, not a claim of final balance or human playtesting.

Entry format for future work:

```text
## YYYY-MM-DD — Version or development-pass title
Branch: branch-name. Reference: commit/PR when available.
Changes and reason: implemented behavior, including removals and balance changes.
Validation: checks actually run; fixture use and human-playtesting limits.
Saves: compatibility, migration or reset requirements.
Remaining: known limitations or follow-up; link to the relevant guide/roadmap.
```

## 2026-11-12 — GitHub handoff of experimental.105 for Hal 3000

Branch: `codex/hal3000-handoff`; user-authorized source handoff, without changing the public main release or the older experimental branch.

Changes and reason: published the accumulated local experimental.97–105 source/build/assets/tests/guides so development can continue on another computer. Added a branch-specific clone/start guide and the exact unfinished next request in [development handoff](docs/handoff.md#current-hal-3000-handoff--2026-11-12). The pending isolation-pod removal, ordinary-ship framing, reduced hints, Examine-only medical controls and inconspicuous volume control are not implemented in this snapshot. Corrected local review filename guidance to `experimental.NNN.html`.

Validation: root `npm test`/generated-version checks run for handoff; prior gameplay/browser validation is recorded in the entries below and was not repeated for a documentation-only handoff. No new game-version bump. Career schema six and the built experimental.105 gameplay remain unchanged. Generated transfer files, temporary SSH keys, caches, personal saves and private lore are excluded. No executable repackaging or GitHub Pages promotion.

## 2026-11-12 — experimental.105: manual helmets and truthful airborne exposure

Branch: `codex/original-prospector-audio`; local experimental build, not published.

Changes and reason: reproduced an open-looking visor in the contaminated ward despite the rules treating an intact suit as sealed. Added a real surface **U** open/close toggle for all crew, as requested; O remains Options and off-surface U retains fuel scooping. New careers begin with automatic hazard-appropriate visor selection; the first toggle makes an explicit open/closed choice that persists across travel and saves. The control is documented only as a muted static Shortcuts entry, remains collapsed by default, and has no context-bar button. Held key repeats do not toggle repeatedly. Each toggle commits one normal surface turn without confirmation.

Open helmets in unbreathable air or underwater now cause immediate 5-HP suffocation/drowning per living crew member per action, even with full stored oxygen. Closing permits ordinary suit oxygen use again; it neither heals nor creates oxygen. The own-ship airlock is breathable. Existing infinite-oxygen/crew-health debug protections remain effective. Correctly records open-helmet deaths without also applying empty-tank suffocation a second time. Crew without environmental suits, including armor-plate wearers, retain unprotected-atmosphere damage rather than treating any armor as a sealed suit.

Ward infection now uses the actual sealed-helmet predicate: full flight/reinforced/exosuit/diving gear with closed, intact seals protects; open helmets, absent suits, armor plates and punctures do not. Retained the existing three exposed turns per infection dose and scrubber/clean-tile protection. The player pawn follows the leading living crew member's equipment and actual visor state, including manually open helmets in vacuum. [Controls/exposure](docs/experiment.md#controls) and [implementation](docs/architecture.md#helmet-state-and-respiratory-exposure).

Validation: built the HTML and passed `npm test` (118 root checks plus generated/version synchronization). Maintained headless `helmets` scenarios cover native lower/uppercase U, repeats, exact turn/HP effects with full oxygen, closing protection, safe air/airlock, plate exclusion, underwater exposure, debug oxygen protection, actual ward infection, saved/invalid/fatal states, unchanged O and absence of a context control. `quarantine-air` covers ten suit/unprotected/filtered/clean/save scenarios. Oxygen, equipment, rescue and story-rescue regressions passed during the change; the last oxygen/gear pass follows the shared suit classification adjustment. Replaced the oxygen fixture's nonexistent `armor_vac` with real catalog Flight Suits, retaining its exact oxygen expectations. Visually inspected the visor/Shortcuts presentation. Fixtures isolate hazards and force bounded rolls; no natural-career balance, human sound audition, or unrelated ship-combat audit was performed.

Saves: schema six unchanged; present `helmetMode` values are validated as auto/open/closed, and exposure progress retains ordinary transactional save/load behavior. No migrations or compatibility layer; no new station infection or other deferred story features. No GitHub upload, executable packaging or private-lore changes. Release filename: `experimental.105.html`.

## 2026-11-12 — experimental.104: named, optional story-rescue foundation

Branch: `codex/original-prospector-audio`; local experimental build, not published.

Changes and reason: made the quarantine rescue a blueprint for later story events. A career saves one 60% eligibility roll; eligible events have a 35% initial-placement chance, otherwise appear 80–600 career turns later, independently of player progress. Placement uses an uncharted empty sector and can retry if none is available. The ship receives one of twelve saved names, including Mercy of Dawn; HUD, boarding, comms, records, mission titles, item provenance and endings use that instance name. A drone/chart-history reveal no longer sends a remote distress message: the player ship needs working sensors within the smaller of three tiles or sensor range, with no intervening nebula. The signal occurs once.

Replaced the three separate rescue door types with actual ringworld closed/open door tiles and shared opening logic/art/collision/sound; both movement and adjacent Enter can open rescue hatches. Ward seals remain metadata. Replaced ordinary-mode letter fixtures and rudimentary people with integer-pixel equipment, humans, remains and pods; ASCII mode retains glyphs. Survivors now use the normal creature examine payload, keyboard/pointer selection, two-tile detail gate and common sidebar without becoming combat enemies. Renamed the fixed Mercy Pump Coupling to Pump Coupling.

Fixed the two reviewed gaps: I → SHIP → Passengers [P] now supplies keyboard/pointer passenger treatment through the same medical action as field care, using actual medicine and one turn per successful treatment/work step, with free refusals and a return-to-ship guard. Terminal survivor outcomes close the rescue without a station visit or failure payout; unknown remote deaths retain last-known mission information until observed, and completion is recorded once. [Story-mission blueprint and future station-infection direction](docs/story-missions.md), [player controls](docs/experiment.md#mercy-of-dawn).

Validation: `npm run build` and `npm test` passed (118 root checks plus generated/version checks). Root scenarios cover optional/delayed schedules, local/blocked/offline signals and casualty closure. Added maintained `story-rescue` headless scenarios for saved late spawning through a native turn, name/range, shared hatches, native keyboard/pointer NPC examination, glyph/RNG/save-free pixel drawing, onboard treatment/costs/refusal/persistence, failed closure and malformed deadlines. Existing rescue, encounters, audio, interface, palette, missions, equipment, autosave, log and turns suites passed during this pass; story-rescue/encounters/autosave were rerun after the format bump. The full existing rescue controller walked 872 surface steps across fifteen scenarios; seeded opening checks observed absent, initial and delayed plans. Equipment retained 160 passing checks across fifty entries. Visually inspected the interior art, common examine sidebar, passenger page and three-passenger page at 800×600. Fixtures control placement/resources/outcomes; these are not natural-career frequency/balance measurements or a substitute for human expedition playtesting. Generated evidence remains ignored under `qa/artifacts/`.

Saves: career schema **six**, replacing five because old rescue decks contain removed door types. Earlier exports fail clearly before replacing the active career; start a new career. No tile/name/schedule migration or compatibility shim. Present plans validate catalog IDs, status/deadlines and names; transactional autosave/recovery remains intact. Palette retains a canonical interactive Mercy sample, includes the changed runtime catalogs, resets and restores the actual career without sharing event state.

Deferred: survivor dialogue/backstory, developing patient illness, richer delivery aftermath and reconsidering the first-boarding air-clock policy. Station outbreaks are a documented future direction, not implemented or triggered by current deliveries. No GitHub upload, executable packaging or private-lore changes. Release filename: `experimental.104.html`.

## 2026-11-12 — experimental.103: restore station chime, move recording to hatches

Branch: `codex/original-prospector-audio`; local experimental build, not published.

Changes and reason: restored the original synthesized station/casino entry chime (523/784/261 Hz with the original timing). Reassigned the former station-entry C12-A recording to successful ringworld maintenance-hatch and Mercy of Dawn pressure/ward-hatch openings; added the missing Mercy cue at the actual opening action. Ancient door unlocking retains C12-B. Refused locks and already-open hatches stay silent. All recording bytes and other audio/gameplay behavior remain unchanged. Download filenames now use only the experimental label, starting with `experimental.103.html`. [Current audio routing](docs/audio.md).

Validation: `npm run build` and `npm test` passed (115 root checks plus generated/version synchronization). Headless Edge audio scenarios passed, including original scheduled oscillator notes/timing, no station-entry recording, native ringworld opening, native Enter opening both Mercy hatch types, silent repeats, retained ancient unlock/refusal and the surrounding offline audio routing/cache/cancellation checks. Corrected the scenario observer to read scheduled frequency events rather than the oscillator's not-yet-active default value. Controlled fixtures verify routing and scheduling; subjective listening remains the author's check. No unrelated equipment or full-career scenarios repeated.

Saves: schema five unchanged; no saved state, migration or gameplay rule changes. No GitHub upload, executable packaging or private-lore changes.

## 2026-11-12 — experimental.102: equipment functionality audit

Branch: `codex/original-prospector-audio`; local experimental build, not published.

Changes and reason: audited equipment acquisition/use/equip/return and persistence against actual actions. Fixed radio purchases delivering nothing, corporate Jetpacks missing charges, shop/barter mining metadata loss, and Repair Kits being immediately spent on purchase instead of delivered. Activated implant effective-skill/oxygen/ranged modifiers; retained trained skill and XP display separately. Removed unsupported HUD creature-reveal, pain-efficiency immunity and passive-biosense claims while retaining their numeric implant bonuses. Fixed duplicate-name clinic removal, equipped darts also consuming spares, lethal adjacent/stray darts, lethal baton chip damage, shots bypassing walls/intervening creatures, inconsistent handgun/diving-suit feedback and the extra Combat Stim turn. Equipped gear now retains its complete owned object through swaps/save/load. Mining chooses the strongest carried tool and binds progress to its planet. Full item coverage, implementation details and limitations: [equipment audit](docs/equipment-audit-2026-11-12.md).

Validation: built the HTML and passed `npm test` (115 root tests plus generated/version checks). Added maintained `equipment` QA controller: 50 named inventory catalog entries/44 usable types, five ship weapons, two working utility modules and the disabled drill placeholder; 160 strict scenario checks passed with no uncovered types/browser errors. Sixteen related headless suites also passed, including crew equipment, armament, cores/hulls, missiles, oxygen/crew/morale, turns, interface/Mercy, missions, stations, palette, transactional autosaves, bridge and audio. The final inventory-label adjustment was rebuilt/root-tested and rerun through equipment. Visually checked the modified skill table and corrected label overlap. Generated traces/screenshots/synthetic saves remain ignored. These are fixture-assisted functional checks, not natural careers, availability/economy balance or exhaustive procedural playtesting.

Saves: schema five unchanged; retained equipped objects are validated against actor name/type/value before load installation. No migrations/shims; previously discarded gear metadata is not recoverable. Existing transactional save/load recovery and career isolation passed. Ship Mining Drill remains explicitly disabled/Coming soon; the three removed secondary implant abilities remain unimplemented. No GitHub upload, executable packaging or private-lore changes.

## 2026-11-12 — experimental.101: quiet repeat planet scans

Branch: `codex/original-prospector-audio`; local experimental build, not published.

Changes and reason: C11 now sounds only when a previously unscanned planet/moon first produces successful or partial scan results. Repeated paid scans of a partially scanned body stay quiet, including after save/load; a different planet or moon has its own first cue. Failed attempts and free completed-scan browsing remain silent. Reused the authoritative saved scan state instead of adding a separate sound-history field. Scan rolls, fuel/turn costs, terrain coverage, hints, training and payouts are unchanged. See [audio routing](docs/audio.md).

Validation: built the HTML and passed `npm test` (115 root checks plus generated/version checks). Headless Edge audio, scan-comms and turns passed. The existing offline audio scenario now verifies first results after a failed attempt, quiet partial rescans with the normal one-fuel/one-turn charge, confirmed transactional save/load retaining silence, and an independently new moon's cue. The scan suite retains terrain-progress/hint checks. Corrected the audio fixture to use normal procedural RNG after its forced outcome roll, retain legal stock sensors for save validation, and await initial career-ID persistence before checking decoder-failure state. These are fixture corrections, not game rule changes. Controlled scenarios are not human listening or unassisted careers; no unrelated combat/whole-career audit repeated.

Saves: schema five unchanged; no new fields, migrations or compatibility handling. Existing current-format scan progress supplies the cue gate. All other selected sounds and Roman core details retained. No GitHub upload, executable packaging or private-lore changes.

## 2026-11-12 — experimental.100: Roman core values inside F3 details

Branch: `codex/original-prospector-audio`; local experimental build, not published.

Changes and reason: removed experimental.99's engine number from the F3 list. All core rows again show plain names and existing integrity/offline status. Each selected rated core now shows its installed Roman numeral in the detail heading: Engines IV, Reactor I, Shield generator I, Cooling I, Sensors III, etc. Removed the visible “rating” word, including the engine's installed/effective readout; engine effective grades and hull ceiling also use Roman numerals, with OFFLINE at zero. Fuel tanks have no separate grade, so their selected heading uses installed numeric capacity instead of inventing a level. Effective output, range, drive pace, charge, fuel and integrity remain numeric quantities. See [core/refit readouts](docs/hull-framework.md). Rules, purchases, repair costs and power allocation are unchanged.

Validation: `npm run build` and `npm test` passed (115 root checks plus generated/version checks). Headless Edge hangar-systems and ship-systems passed. Extended the maintained Hangar scenario to inspect all six selected cores after a real paid shield installation, assert every list row remains a plain name, check Roman headings and absence of the “rating” label, preserve installed tank capacity after a controlled rupture, and retain paid engine upgrades, integrity/damage/power explanations, confirmed save/load, read-only rendering, keyboard/mouse navigation and two-theme/two-viewport fit. Visually inspected the generated core detail page. Fixtures grant credits/controlled damage; no new mechanics or unassisted-career claim. No unrelated audio/career audit repeated for this UI-only change.

Saves: schema five unchanged; no new fields or migration. All selected sounds retained. No GitHub upload, executable packaging or private-lore changes.

## 2026-11-12 — experimental.99: clearer engine rating in F3

Branch: `codex/original-prospector-audio`; local experimental build, not published.

Changes and reason: the reported Scout upgrade mismatch did not reproduce: paid native 2→3→4 refits updated both the installed and effective F3 values. The author subsequently confirmed the ship had only the 2→3 refit; being able to refund that refit did not establish a second purchase. Clarified the F3 engine row and heading with its installed rating, retained separate integrity, and added drive pace/hull ceiling plus explicit engine-damage or reactor-power reasons for reduced effective performance. Purchase, refund, damage, power, travel and combat rules are unchanged. See [engine/refit readouts](docs/hull-framework.md).

Validation: built the HTML and passed `npm test` (115 root checks and generated/version checks). Three headless Edge suites passed: hangar-systems, ship-systems and hulls. Extended the existing Hangar scenario with actual paid Scout refits, F3 rating 3 and 4 while integrity stays 100%, exact normal charges, damage/power readouts, read-only rendering and confirmed transactional save/load retaining rating 4. Existing checks cover keyboard/mouse entry, repairs, both UI styles, 1400×720 and 800×600 viewport fit, hull transactions and travel rules. Visually inspected the upgraded F3 page. Fixtures grant credits and controlled damage; no claim of reproducing the author's career/save or a purchase defect. No need to rerun unrelated audio/combat career audits for this readout-only change.

Saves: schema five unchanged; no new fields or migration. All experimental.98 sounds retained. No GitHub upload, executable packaging or private-lore change.

## 2026-11-12 — experimental.98: selected sounds integrated offline

Branch: `codex/original-prospector-audio`; local experimental build, not published.

Changes and reason: integrated the author's selected C1–C6 ship weapons/shield, C7-A boost, C8-D ram, C10-B nebula lightning, C11 scan and C12-A/B dock/door recordings, with C9-B used as the provisional asteroid cue under the instruction to implement the complete set. Added original W1 ground energy fire, W4 automatic carbines, W2 placed/inventory C4 and damaging meteor explosions, W3 Wraith/Devourer contact attack, W5 actual weapon hull impacts, original warning/critical alarms, LAND and START. Original pain stays exclusive to planetside physical crew damage. Corrected the former ground meteor/energy-node hull-hit callers; they no longer play the ship hull recording. Refueling, repair and breathing remain synthesized because no replacement was selected. Original WORM is embedded/reserved: the game has no wormhole-travel action, and none was invented for a sound cue.

Firing follows committed direct shots, including misses, in the existing ordered presentation; shield-only results use the shield cue rather than a hull sound. Artemis launches once and receives real later impact feedback. Dedicated ram/asteroid/creature cues replace generic collision hits; only committed boosts, resolved lightning, successful/partial paid scans, successful doors and docking sound. Existing alarm latches remain. Refused actions produce no firing/engine/success cue, though existing resource alarms may still sound. No damage, fuel, turn, difficulty or encounter rules changed.

Retained all eleven original WAVs with verified upstream Git blob hashes and added a pinned 24-recording playback catalog, source/license notes and 23 compressed MP3s. The exact selected audition bytes are retained, including the final C8-D encode. `art:audio` regenerates the embedded catalog offline without an encoder or network. All samples total 666,651 bytes before Base64; built HTML is 3,196,970 bytes (about 3.20 MB), replacing .97's 2,405,602-byte artifact. Rejected alternatives, raw extra WAVs, preview pages and encoder binaries are not added to the playable HTML download. Original recording-specific credit research remains separate from the verified original distribution; no CC0/Minecraft claim is made for those files.

The sound engine caches each decode, primes on real input, bounds/coalesces voices, reduces overlapping peaks with a shared compressor and cancels stale pending/active sounds by career/location/encounter identity. All audio state stays outside the career and gameplay RNG. A failed decoder leaves gameplay playable. Added explicit weapon/hull/collision metadata to disposable feedback, not saves. See [routing, sources and limits](docs/audio.md); [audition decisions](docs/audio-candidates-2026-11-12.md) remain historical evidence rather than uninstalled current plans.

Validation: `npm run build` and `npm test` passed (115 root checks plus generated/version checks); extended the existing asset check to verify catalog hashes, exact selected choices, unchanged pain bytes and all retained original WAV identities. Final headless Edge run passed 12 native-action suites: audio, combat-feedback, ramming, missile-flight, nebula-combat, nebula-damage, scan-comms, landing-impact, turns, oxygen, palette and autosave. The audio suite blocks HTTP(S), decodes all 24 clips once, observes actual native-action playback, checks miss/refusal/launch-versus-impact timing, shield/collision routing, ground-only pain, alarm latches, stale/retrigger cancellation, unchanged serialized state/RNG and harmless decoder failure. Controlled fixtures grant equipment/positions and force outcomes; they are not unassisted careers or subjective listening. A test fixture's initial fixed-RNG generation stall and MP3-header-only identity ambiguity were corrected; source generation uses ordinary RNG and sample observations compare full bytes. Optional audition-page checking now uses the separate preview checker rather than the former audio-scenario `--preview` path.

Saves: schema five unchanged; no audio data or new rule fields enter saves. No migration or compatibility shim. Transactional save/load and playground return-to-career checks passed; sandbox persistence remains isolated. Remaining: human listening across devices/sustained play, final asteroid choice, future wormhole action and any further unassigned sounds. No GitHub upload, PR, executable build or private-lore changes.

## 2026-11-12 — Ramming sound selected

Branch: `codex/original-prospector-audio`; local audio-choice documentation. Game remains experimental.97.

Changes and reason: author selected C8-D for ramming from the final headroom-adjusted comparison board. Recorded the choice in the audio guide, source notes, proposal and future audition-page labels, preserving the existing pinned construction and gain. C8-E remains unselected; C9-B is still only a tentative asteroid fallback. See [the selection](docs/audio-candidates-2026-11-12.md#ramming-selection).

Validation: reviewed choice/status wording and diff whitespace; no sound bytes, processing, runtime, generated game HTML or saves changed. Existing audition playback checks remain the evidence for the selected clip; no build, game tests or new playback checks repeated for this decision-only update. Remaining: runtime integration and asteroid final choice. Nothing published.

## 2026-11-12 — Collision feedback and corrected crash excerpt

Branch: `codex/original-prospector-audio`; local previews/documentation. Game remains experimental.97.

Changes and reason: recorded C8-B as improved but lacking a crash, rejected C8-C/C9-C as boost-like, and retained C9-B only as a tentative asteroid fallback. Found the C8-B metal crop stopped at 0.48 seconds before its main impact around 0.5 seconds. Prepared unapproved C8-D with the restored crash attack/earlier low body, and C8-E with the restored crash/original W5. Normal pitch and no low-pass on the crash preserve its attack; source hashes, excerpts and W5 provenance are pinned. Extended the existing optional collision generator with `--set crash`; earlier boards are preserved. See [current decisions and comparisons](docs/audio-candidates-2026-11-12.md#collision-feedback-and-restored-crash-attack).

Validation: inspected decoded energy windows to identify the missing onset; final two clips passed offline headless Edge decoding, distinct IDs, actual one-at-a-time playback, shared volume and no page errors. Initial encoded overshoot was corrected with post-limiter headroom; final stereo sample peaks about 0.706/0.683. Clips total 54,631 bytes outside the game. Game .97 SHA-256 unchanged; no build/gameplay tests repeated for preview-only work. Saves/runtime unchanged. Remaining: human collision listening and later routing/integration. Nothing published or packaged as an executable.

## 2026-11-12 — Accepted replacement sounds and layered collision auditions

Branch: `codex/original-prospector-audio`; local preview/documentation work. Game remains experimental.97.

Changes and reason: accepted C7-A boost, C10-B lightning and both C12-A/B mechanical doors after author listening. C1–C6/C11 remain accepted; original C7 fallback is superseded. Rejected standalone C8-A (locker-room smashing) and C9-A (billiards); C10-A was close but too short and is not selected. Exact door-event routing remains open. Recorded these decisions in the [audio proposal](docs/audio-candidates-2026-11-12.md#second-feedback-and-layered-collision-auditions), audio guide and source notes.

Prepared four unapproved layered collision alternatives with pinned CC0 source hashes and a reproducible optional generator. Use low-frequency impact bodies, shortened/lowered/filtered metal, crunch or rock textures, explicit gains/delays, tail fades and a ceiling limiter; no synthesis or runtime assignments. Earlier boards and accepted clips are preserved. Generated files remain ignored and total 85,438 bytes outside the game.

Validation: all four clips decoded in headless Edge with HTTP(S) blocked; unique labels, one-at-a-time playback, shared volume and no page errors passed. Decoded sample peaks stayed below full scale; .97 game SHA-256 unchanged. No build/gameplay tests repeated for preview-only work. Saves unchanged. Remaining: human listening for collisions, exact event routing and later integration. Nothing uploaded or packaged as an executable.

## 2026-11-12 — Sound feedback and replacement auditions

Branch: `codex/original-prospector-audio`; local preview/documentation work. Game remains experimental.97.

Changes and reason: recorded acceptance of C1–C6 and C11, kept original C7 as a boost fallback, and rejected C8–C10/C12 after author listening. Prepared seven alternatives for boost, ramming, rock collision, discharge and doors using individual CC0 Freesound public preview MP3s. Explicitly distinguish recorded sources from designed/unspecified effects and public previews from original files. Source metadata/roles are shortlisting evidence, not a claim of perceptual assessment. Added pinned source hashes, a reproducible optional generator and source/treatment notes; previous boards are preserved. See [the updated proposal](docs/audio-candidates-2026-11-12.md#author-feedback-and-replacement-audition).

Validation: all seven clips decoded in headless Edge; offline one-at-a-time playback, shared volume, unique labels and no page errors passed. Game HTML still matches the delivered .97 SHA-256; no build/gameplay tests repeated for audition-only changes. Clips total 295,594 bytes outside the game. Saves/runtime unchanged. Remaining: author listening, final trimming/routing and later integration. No public upload or executable packaging.

## 2026-11-12 — Additional CC0 sound pitches and audition tools

Branch: `codex/original-prospector-audio`; local proposals/development tools. Game version remains experimental.97.

Changes and reason: prepared a twelve-candidate listening board for the remaining ship weapons, missile launch, shields, boost, physical collisions, nebula strikes, scanning and mechanical latches. Used Kenney's CC0 Sci-fi, Impact, Interface and Digital Audio packs, inspecting the actual downloaded license notices. Recorded the author's positive W5 compression comparison as a starting point for 96-kbit/s auditions. Candidates remain proposals; original Prospector assignments and the game's single installed pain recording are unchanged.

Added a reusable optional preview generator, pinned source/hash/construction manifest, retained source-credit notes and a browser audition checker. Compressed candidates total 107,415 bytes before HTML embedding; excerpts, normalized layers and gain are identified on the cards. Downloaded packs, audio previews and standalone listening pages stay in ignored caches/outputs. Updated [the audio proposal](docs/audio-candidates-2026-11-12.md), audio guide and QA documentation. No runtime, game assets, package version, generated game HTML, mechanics or save state changed.

Validation: inspected source notices and hashes; decoded all twelve compressed clips in a browser, tested actual one-at-a-time playback and the shared volume control, and verified unique labels/no page errors. The listening check blocks HTTP(S), and the game remains byte-identical to the delivered .97 artifact. Build/gameplay tests were not repeated for preview-only work. Remaining: human acceptance or rejection, exact event mappings, single-shot ground firearm/tool/pump candidates, later integration and device listening. Nothing published; no executable packaged for the game.

## 2026-11-12 — Audio directions and download budget (documentation only)

Branch: `codex/original-prospector-audio`; local documentation. Game version remains experimental.97.

Changes and reason: recorded the author's descriptions and intended uses for W1–W5 and the other original clips in the [audio guide](docs/audio.md). Distinguished reserved ground laser/explosion roles, tentative C4/natural-entity/incoming-hull uses and the automatic-fire description from installed sounds. Retained PAIN as the only installed recording. Added measured current HTML/raw-audio sizes and a clearly labeled compressed-audio bitrate estimate to guide the next integration without assuming that every source WAV must be embedded unchanged.

Validation: read actual file sizes and WAV headers for all eleven preview clips; calculated Base64 overhead and an illustrative 96-kbit/s budget. No audio was re-encoded, no quality comparison was claimed and no game behavior, build artifact or saved format changed. Build/gameplay tests not rerun for documentation only. Remaining: exact event assignments, compressed-candidate auditions and integration. Nothing published.

## 2026-11-12 — experimental.97 Original ground pain and sound auditions

Branch: `codex/original-prospector-audio`; local chat build, not published.

Changes and reason: replaced the synthesized `SFX.crewHit()` grunt with the exact original Prospector `data/pain.wav` the author auditioned and approved. The cue is restricted to the game's planet/ground mode; existing ground combat and physical surface-hazard callers remain. Ship combat, galaxy, inventory and menu calls cannot start the recording. Ship hull/shield/core cues and the separate synthesized breathing/suffocation sound remain unchanged. The original 0.84-second mono WAV is retained unedited with pinned hashes and source attribution notes; playback gain is 0.65.

Added a generated embedded audio catalog and dependency-free `art:audio` importer. The ordinary source build stays offline and single-file. Web Audio decodes the sample once; repeated hits replace the active voice, pending requests coalesce, and career/location/mode checks prevent delayed audio crossing into another context. Rendering cancels stale/active ground playback when leaving that context, including entry to ship combat, without creating audio contexts or changing career state. Playback remains outside saves and gameplay RNG; decode failure is harmless. Removed the former synthesized physical hurt approximation, retaining its public function name.

Added an optional original-sound audition tool and standalone listening page: W1–W5 are the five original weapon filenames, A1/A2 the alarms, plus landing, start, wormhole and the approved pain clip. All eleven downloads are pinned and hash-verified; recordings and the self-contained preview page stay in ignored outputs. Only pain is installed in the game. Other labels deliberately do not assert a mapping to II weapons; the author will assign them after listening. Updated the [audio guide](docs/audio.md), build/source/QA documentation and roadmap status.

Validation: rebuilt HTML; all 115 root tests and generated-source/version checks passed. The new asset test verifies the exact approved WAV and embedded bytes, and that no other original sound is bundled. Passed the new headless `audio` scenario plus six regression suites: `combat-feedback`, `bridge`, `turns`, `oxygen`, `palette` and `autosave`. Native surface damage plays a real decoded mono 0.84-second buffer; native ship crew injuries and firing do not. Checked one decode, non-overlapping retriggers, delayed-decode cancellation, unchanged serialized state/RNG, harmless decode failure, debug reset/career isolation and save integrity. All eleven audition clips decoded, and actual preview playback pauses/resets the preceding clip. These are functional playback/routing checks; final loudness, comfort and tone need human listening. No whole-career or balance audit was repeated for this audio-only change.

Saves: schema five unchanged, with no migration or reset. No new galaxy/debug content or gameplay costs/damage were added. Remaining: the author's assignments for other original clips, audio-specific provenance/creator research before a later public asset publication, and listening across devices. No GitHub upload or Windows executable was produced.

## 2026-11-12 — Await initial save before hull-exchange QA

Branch: `main`; test-only follow-up to experimental.96 publication. Game version and HTML unchanged.

Changes and reason: GitHub's Linux headless run exposed a timing race in the hull scenario after the same checks passed locally. The reviewed quote includes crew identity; an unconfirmed initial autosave can assign those IDs between review and confirmation, correctly making the old quote stale. The scenario now awaits its first successful transactional save before reviewing hull exchanges. Purchase, cost, equipment, cooldown, save/load and input assertions are unchanged; no game guard was weakened.

Validation: the focused `hulls` suite passed locally with the awaited startup save. The preceding publication records the 114 root tests, all 49 distinct local browser suites and three-hull smoke results. GitHub Actions supplies the Linux recheck for this follow-up. Saves/schema and runtime behavior unchanged; no executable changes. The publication's exclusions remain in effect.

## 2026-11-12 — Publish experimental.96 to main

Branch: `main`. Version remains `0.28.0-experimental.96`; this publishes the existing experimental game without relabeling it as a stable release.

Changes and reason: promoted the latest experimental source, generated standalone HTML, reproducible art inputs, system guides and maintained QA scenarios to the public branch at the author's request. This includes the current hull/refit framework, crew progression, Artemis missile flight, crew-aware combat and casualties, varied nebula arenas, multi-tile asteroid cover, mutual ramming/boost crashes, pursuit after escape and the failed-withdrawal nebula scheduling fix. Retained the main branch's player-focused introduction and development guide, and updated source checkout instructions to distinguish the published snapshot from ongoing experimental development. The existing v0.26 Windows download is unchanged and explicitly labeled as an older build; no executable was rebuilt or packaged. Corrected three outdated QA fixture assumptions: salvage now controls accuracy separately from loot and retains legal factory shields; the rescue sample is placed near its station with strict paid-movement checks; the mission tracker grants a legal one-slot Scout cargo refit instead of twelve slots. Native actions, valid snapshots and actual save/load assertions remain intact. These are test corrections, with no change to the published game HTML.

Validation: built in an isolated main-based checkout; all 114 root tests and generated-source/version checks passed. All 49 distinct headless regression suites passed, including focused reruns of the three corrected fixtures, plus the three-hull 80-selection smoke runs. The HTML SHA-256 remains 2d3ab7bfdb3d43e6975f36c30699d4143ead8fb3678ea82914666119baa48fdf, byte-identical to the previously reviewed experimental.96 game. Checked the publication file set and preserved the existing Windows binary. The experimental.96 entry and integration report below record the earlier 912-fight measurements and their limits; promotion does not turn those fixture-assisted encounters into whole-career balance evidence.

Saves: current career schema five is retained. Earlier schema formats are rejected rather than migrated; current-format validation and transactional autosave behavior remain unchanged. Remaining: human combat and whole-career playtesting, wider fitting/pilot coverage and the roadmap's unimplemented escalation/story work.


## 2026-11-11 — experimental.96 Combined combat audit and withdrawal storm/save fix

Branch: `experiment/expedition-legacy`; local chat build, not published.

Changes and reason: fixed `doShipRetreat` omitting nebula environment advancement after spending a combat turn. A failed withdrawal with pending lightning could leave an expired discharge deadline and make the continuing career fail current-format save validation. Withdrawal now advances the native storm after missiles, before encounter completion or position reset. This also removes the unintended storm-free withdrawal action. The validator remains strict; no balance thresholds or damage formulas were changed.

Added a maintained fixture-assisted combat integration runner/pilot covering three hulls, starting/trained crew, seeded ordinary-space/gas-only/mixed arenas, four armed ship roles, two natural threats, ranged/selective-ram policies, two-ship fleets, consecutive encounters carrying damage/crew/ammo forward, and exact save/import continuation. Capped cases receive separate 200-action investigations and native edge-withdrawal probes. Version/build hash, policies, grants, bounds, traces, resource/actor invariants, validation counts and event totals are recorded in ignored QA artifacts. Updated the combat, autosave, QA, documentation index and roadmap guides. Full methods, outcomes and limits are in the [November 11 combat integration report](docs/combat-integration-audit-2026-11-11.md).

Validation: built HTML; all 114 root tests and generated-source/version checks passed. Passed fifteen headless suites against .96: `ramming`, `nebula-combat`, `combat-cover`, `combat-ui`, `combat-speed`, `ship-combat`, `bridge`, `combat-resolution`, `missile-flight`, `artemis`, `disengagement`, `ship-systems`, `ship-pursuit`, `palette` and `autosave`. The new pending-lightning/failed-withdrawal regression was observed failing against .95 before the fix. The final integration matrix committed 19,935 turns across **912 standalone fights**: 530 victories, 134 player withdrawals, 231 deaths, three enemy escapes and 14 90-action caps. It exercised 277 player rams (69 boosted), 1,888 natural incoming rams, 982 missile launches and 602 lightning discharges, with zero recorded runtime/invariant/sampled-save failures. All 24 paired imported/uninterrupted continuations matched exactly. Eight of 24 three-fight attrition chains cleared all encounters, reaching 67 encounters in total. Twelve of fourteen extended caps resolved by 200 actions; two blind-pilot loops retained functional failed-withdrawal/reset actions and valid saves. The final pilot guards offline engines before choosing rams; that correction is QA-only. Intermediate/smoke runs are excluded from these sample totals.

Limits and remaining: equipment/skills and encounter selection are fixture grants, not economic progression or natural encounter distributions. Deliberate asteroid crashes and input/rendering paths are established by focused scenarios; the cautious matrix pilots avoided crashes. The findings do not establish final balance, expert tactics, human enjoyment or whole-career survival. No mortality-driven tuning was made. Early Wraith escape, slow-hull sniper fights, sensor-loss decisions and wider fitting/crew/controller coverage remain human/automated follow-up; independent run-age escalation and pulsar/wormhole arenas remain planned.

Saves: schema five unchanged, no migrations or reset required. Continuing failed withdrawals now retain a valid advanced nebula schedule. No gameplay features were removed, no GitHub publication occurred and no Windows executable was produced.

## 2026-11-11 — experimental.95 Approved pixel-art nebula

Branch: `experiment/expedition-legacy`; local chat build, not published.

Changes and reason: promoted the exact nebula texture the user approved in the side-by-side preview. The smoother painted cloud is replaced by deliberate pixel clusters, stepped edges, simpler banded shading and restrained color transitions. The same asset supplies the backdrop and dense pockets in both blue and pink environments. No further image generation or artistic alteration was performed after approval. The earlier smooth source remains retained under `nebula-cloud-v1`; the selected generated original, prepared PNG and exact prompt are now versioned under [nebula-cloud-v2](art/source/generated/nebula-cloud-v2/README.md), so the runtime no longer depends on ignored preview files.

Updated the optional preparation script to the approved 384×192 bound with proportional nearest-neighbor sampling and preserved alpha, and pointed the existing combat-art importer at the new input. The normal source build still needs no browser or image-generation service. Updated current art/source-map documentation. Rendering code, layout and gameplay rules were not changed.

Validation: verified that optional preparation reproduces the approved preview PNG byte-for-byte and that the embedded runtime PNG equals that approved file. Rebuilt combat assets and HTML; all 114 root tests and generated-source/version checks passed. Passed `nebula-combat` and `combat-space` headless suites against the built HTML, including blue/pink/ASCII presentation, unchanged gas/strike/collision rules, rendering without career/RNG changes, save integrity and debug isolation. Inspected blue and pink in-game screenshots. This is the approved visual update and its integration check, not a new combat balance study.

Saves: schema five unchanged; current encounters use the approved texture immediately without a reset. No migrations or removed gameplay features. No GitHub publication or Windows executable was produced.

## 2026-11-11 — experimental.94 Physical ramming, asteroid crashes and moving-target wraith contact

Branch: `experiment/expedition-legacy`; local chat build, not published.

Changes and reason: normal thrust into an enemy now rams it, and Boost can ram either the first or second occupied ship cell or crash into any cell of an asteroid footprint. A collision stops before the obstacle; ships do not overlap or pass through a killed target. Ship rams damage both hulls directly, bypass shields and use existing critical/tank/personnel/death handling. One 6–10 impact roll scales by attacker/defender physical size, with the reciprocal ratio for recoil; Boost multiplies it by 2.5. Player blueprint size is independent of upgrades/damage. NPCs use available blueprint size, documented civilian/natural-entity body profiles, or a stable factory-HP size proxy. A larger target can therefore destroy the attacker. One-/two-/four-tile asteroid boost crashes deal 15–25/21–35/30–50 hull damage. Normal thrust into rocks remains blocked. Engine/fuel/heat/edge guards remain; boost obstruction is now a collision, not a free refusal.

Every ram/crash commits one turn and its ordinary maneuver cost, including a first-cell or fatal impact. Target destruction cannot cancel recoil; both ships can die. Weapon reloads/ammunition remain unchanged. Surviving active helmsmen receive risk-coupled NAV practice on contact. Shield charge/recharge is untouched by the collision itself, while a generator critical can still reduce capacity. Debug hull/personnel protection retains its existing separation. Factored direct hull resolution through the existing damage/critical rules and added `ship-collisions.js` to the assembly manifest.

Fixed the reported wraith chase loop: ram attackers previously spent their response reaching adjacency and needed another response to attack, so a continually moving player postponed contact. They can now spend a remaining movement substep on physical contact, without occupying the player cell, exceeding fractional movement credit, adding a gun shot or bypassing their existing two-turn ram cadence. Faster wraiths can catch moving targets; equal mobility does not manufacture catch-up and boost can create separation.

Removed advance lightning warnings as requested: no yellow outline, predictive glow/ASCII marker, readout, log announcement, hover hint or banner. NPC positioning no longer sees pending strikes. The internal saved schedule and actual strike arc/damage remain, with no migration required. Updated current combat, environment, save, architecture, art, roadmap and QA guides. The existing BRIDGE DRILL/NEBULA COMBAT and wraith samples expose the changed native interactions without adding a separate content catalog.

Validation: built HTML; all 114 root tests and generated-source/version checks passed. Two new rule tests cover reciprocal ram scaling/boost strength and stable physical-size selection; save checks now reject malformed ram deadlines. Passed fifteen distinct headless suites: `ramming`, `combat-cover`, `combat-ui`, `nebula-combat`, `nebula-encounters`, `combat-speed`, `ship-combat`, `bridge`, `combat-resolution`, `missile-flight`, `artemis`, `disengagement`, `ship-systems`, `palette` and `autosave`. New native keyboard/context-mouse cases check ordinary/boosted mutual damage through full shields, first/second/non-anchor crashes, all footprint sizes, fuel/heat/turn/reload accounting, fatal and mutual destruction with saved endings, critical/crew injuries and debug protection. A twelve-move chase confirms a mobility-three wraith rams a continuously moving mobility-two Scout; equal mobility does not catch it, boost opens separation, and saved cadence/banks resume. Pending and ordinary gas render pixel-identically with no warning/AI tell. Inspected the warning-free nebula screenshot. Updated old boost-blocking assertions to paid collisions and one stale escape-distance fixture to the already implemented separated escape. Palette coverage and transactional failure/corruption/stale-window protections passed. These are controlled rule/input scenarios, not whole-career or final ram balance measurements; the earlier 192-matchup audit was not rerun.

Saves: schema five unchanged; collisions derive from current ships/terrain and add no saved state. The existing NPC ram deadline remains persistent and gains integer validation. Existing pending lightning events resolve silently. Removals/reversals: free Boost cancellation at occupied tiles and all advance lightning telegraphs are removed. No GitHub publication or Windows executable was produced. Remaining: human testing of collision severity, size advantages and physical combat tactics; independent difficulty escalation and pulsar/wormhole arenas remain future work.

## 2026-11-11 — experimental.93 Pursuit after escape and nebula combat environments

Branch: `experiment/expedition-legacy`; local chat build, not published.

Changes and reason: successful NPC arena escapes now traverse two legal galaxy steps and end at least two sectors from the player in Chebyshev distance, leaving a clear gap. Intermediate/destination sectors exclude ships, pulsars and black holes; cardinal routes have a diagonal fallback, and blocked routes do not roll escape. The existing 25% failure/reset rule remains. Escaped contacts remain chart-visible but retain a saved adjacency requirement for player interception. F, grace expiry, load, full-vision debug, direct entry and pulling a nearby escaped actor into a fleet cannot bypass it. Closing the gap spends normal travel time/fuel; a faster fleeing ship can keep opening it. Identity, damage, weapons, ammunition and reloads remain authoritative.

New nebula arenas derive their blue/pink theme from the player or primary target's sector and vary between gas-only and mixed gas/asteroid layouts. Seeded traversable 2×2/2×3/3×2 gas pockets reduce ordinary shots crossing/starting inside them by 15 percentage points for either side, retaining the 15% accuracy floor; guided fire and rams keep their existing rules. After the opening two actions, eligible turns have a 10% charge chance. Readout/map/log warnings precede a strike by one committed action, with an urgent banner when the player occupies the charged pocket. Lightning resolves after both sides' actions, has a four-turn scheduling cooldown and deals 4–10 × physical hull size through ordinary shields/criticals/personnel damage; NPCs use blueprint size if available and one otherwise. Capable enemies try to leave charged gas. Menus/rendering/save/load cannot advance the hazard. Environment state and pending warnings are validated and saved; unsupported geometry/deadlines are rejected before installation.

The first glowing rectangular-pocket presentation was rejected during development and removed. The final version uses a built-in-image-tool-generated transparent cloud texture for an organic backdrop and dense pockets, with proportional sizing, blue/pink hue treatment and a seeded branched lightning arc. Only charged hazard boundaries use dashed rectangles. Source art, exact prompt and optional preparation script are versioned; normal builds consume the checked-in texture without a new dependency. Added the registered interactive NEBULA COMBAT factory/adapter with ordinary four-role combat, repeat reset, restored flags/outfit and retained-career isolation. Updated current guides and recorded distinct pulsar/wormhole arenas plus further environmental variation as **future work**, not implemented maps.

Validation: built embedded art and HTML; all 112 root tests and generated-source/version checks passed. Four added rule tests cover seeded nebula layout families/clearance, traversable symmetric soft cover/guidance, separated two-step escape routes and environment/pursuit save validation. Passed fifteen distinct headless suites: `nebula-combat`, `ship-pursuit`, `disengagement`, `ship-combat`, `combat-space`, `combat-cover`, `bridge`, `artemis`, `missile-flight`, `nebula-encounters`, `nebula-damage`, `attack-confirmation`, `combat-resolution`, `palette` and `autosave`. New scenarios exercise real dodging, enemy strikes/evasion, both sides' hit penalties, size/shield/debug/fatal impacts, exactly-once warning resolution, pending-warning reload/menu stability, invalid-import preservation, render state/RNG stability, paid pursuit/interception and direct/fleet/full-vision loopholes. Inspected the revised blue nebula screenshot; blue/pink/ASCII captures are available. Palette coverage includes the new factory and its real reset/return behavior; storage failure/corruption/stale-window protections passed. Tests use controlled fixtures/rolls and do not establish natural-career balance or user visual preference. The earlier 192-matchup audit was not rerun.

Saves: schema five unchanged; added optional encounter environment and NPC pursuit data, with no migration/compatibility shim. Existing active encounters keep their saved terrain; fights without an environment remain ordinary space, and newly started fights use the new context rules. Removals/reversals: replaced adjacent-sector NPC escape and immediate sensor-range re-engagement, removed the rectangular gradient-gas prototype. No GitHub publication or Windows executable was produced. Remaining: human assessment of storm frequency/visibility and environmental combat balance; distinct pulsar/wormhole maps and broader variation remain planned.

## 2026-11-11 — experimental.92 Dedicated generated asteroid sprites

Branch: `experiment/expedition-legacy`; local chat build, not published.

Changes and reason: replaced stretched larger-asteroid art with three dedicated generated sprites for 2×1, 1×2 and 2×2 footprints. The user rejected the elongated atlas scaling and the subsequent unreleased assembly of overlapping small rocks. That composite experiment was discarded. Each final sprite is a single cohesive stone body with an irregular silhouette, crater detail and consistent upper-left lighting, drawn at its native 48×24, 24×48 or 48×48 resolution. One-tile atlas sprites, rarity, occupied cells, cover budget and combat rules are unchanged.

Used the built-in image-generation tool for the three transparent assets. Retained all selected originals, native sprites and exact prompts under [art/source/generated/combat-asteroids-v1](art/source/generated/combat-asteroids-v1/README.md). Added a portable optional headless-browser preparation script to alpha-crop and proportionally downsample the originals with nearest-neighbor sampling. The existing combat-art importer embeds the checked-in small PNGs, so normal builds add no dependency or generation step. Updated art, combat, architecture and source-map guides. No sprite-composition cache remains in the runtime.

Validation: rebuilt embedded art and HTML; all 108 root tests and generated-source/version checks passed, including existing art reproduction checks extended to confirm native dimensions for all three new assets. Passed `combat-cover` and `combat-space` headless suites. Updated cover rendering checks confirm one native-resolution sprite draw, correct partial-chart clipping and ASCII parity; collision, guided impact, saved dimensions and isolated debug reset/return continue to pass. Inspected the final generated assets and in-game sprite screenshot. These checks establish rendering/integration behavior; visual preference remains for the user to judge.

Saves: schema five unchanged; active encounters immediately use the new art with their saved footprints. No migration, gameplay/balance changes, GitHub publication or Windows executable. Removals/reversals: multi-tile sprite stretching is removed; the rejected overlapping-rock experiment is absent from the final build.

## 2026-11-11 — experimental.91 Rare larger combat asteroids

Branch: `experiment/expedition-legacy`; local chat build, not published.

Changes and reason: combat arenas can now contain rare 1×2 and 2×1 elongated asteroids and 2×2 rocks alongside the usual one-tile rocks. Each footprint is one continuous enlargement of an existing native asteroid sprite; no replacement art or new bitmap assets were added. Every occupied cell blocks movement/boost and ordinary fire for both sides, with enemy and Artemis routing using the same rectangle query. Seeing part of a rock renders only its charted cells, including when the anchor is unknown; ASCII marks the same known cells. Existing empty-arena/natural-entity rules remain, seeded placement consumes no gameplay RNG, starts retain one-tile clearance, and large rocks share the existing maximum of sixteen occupied cover tiles. Failed disengagement resets retain cover.

Larger cover exposed a close-assault routing defect: a brawler could reach its preferred distance while still blocked and stop seeking a firing angle. Its position scoring now penalizes blocked direct fire, allowing it to flank; ram, guided-standoff and other role rules retain their existing scoring. The existing interactive BRIDGE DRILL now includes every asteroid shape and restores them on sample reset. Updated current combat, art, architecture, roadmap and QA guides.

Validation: built HTML; all 108 root tests and generated-source/version checks passed. Three new root tests cover complete-footprint collision/direct fire/guided paths, 1,024 repeatable seeded arenas with rare shapes/clearance/bounds/budget checks, and valid/invalid saved rectangles. Passed nine distinct headless suites: new `combat-cover`, plus `ship-combat`, `combat-space`, `bridge`, `artemis`, `missile-flight`, `disengagement`, `palette` and `autosave`. New native-action checks exercise non-anchor movement/boost/fire refusal without spending resources or turns, close-assault flanking, delayed guided impact around a square rock, awaited save/load, transactional malformed-footprint rejection, clipped sprite/ASCII parity without rendering RNG and debug sample reset/autosave/return isolation. Inspected sprite and ASCII presentation at normal and smaller viewport sizes. Existing palette coverage and storage corruption/failure/stale-window protections passed. Controlled fixtures establish these rules; rarity, combat pacing and player preferences still need human playtesting. The earlier 192-fight audit was not rerun for this change.

Saves: schema five unchanged. Asteroid records can carry optional integer `width,height` from one to two; omitted dimensions describe the existing one-tile shape. No migration or compatibility shim was added. Validation now rejects malformed, overlapping or off-map footprints while preserving the active career on import failure. Existing active encounters retain their saved cover; new encounters use the larger-rock generation. Removals/reversals: cover is no longer restricted to one-cell objects. No GitHub publication or Windows executable was produced. Remaining: subjective rarity/cover-density tuning through play.

## 2026-11-11 — experimental.90 Landing impacts bypass shields; Assault Carbine equipment fix

Branch: `experiment/expedition-legacy`; local chat build, not published.

Changes and reason: rough landings now call the existing direct-hull damage path, replacing shield absorption. The impact itself neither consumes shield charge nor resets its recharge deadline, and the comms message explicitly says shields were bypassed. Existing size-scaled 3–10 × size damage, component criticals, fatal crash handling, navigation XP and debug hull protection remain. A shield-generator critical can still reduce shield capacity normally. Accident probability is unchanged: NAV 8 retains a 1% rough-landing chance and NAV 9 eliminates it, as requested. Updated the [hull guide](docs/hull-framework.md).

The Assault Carbine already had its +4 ATK/range-four combat profile, but duplicated inventory/context weapon lists omitted its `gun_breacher` identifier. Inventory equipment classification now reads the existing ground-weapon catalog, and context equip controls share that classification. Carbine acquisition, stats and price are unchanged; existing owned Carbines can now be equipped with the same keyboard and mouse actions as other weapons. The primary canvas control still suppresses duplicate context controls.

Validation: built HTML; all 105 root tests and generated-source/version checks passed. Added versioned `landing-impact` and `crew-equipment` scenarios; both exposed failures against experimental.89 before the change. Passed six headless suites: `landing-impact`, `crew-equipment`, `hulls`, `repeat-training`, `menu-input` and `scan-landing`. Landing checks cover minimum/maximum impacts for all starter hulls, full shields and retained recharge deadlines, NAV 8/9, actual component damage, death despite full shields, debug protection and unchanged turns/XP. Equipment checks use the real shop catalog/acquisition helper, keyboard selection/cancellation/equipping, canvas mouse controls, a context fallback, replacement/unequip/re-equip without duplication, awaited autosave/load, every ground-weapon identifier and an actual +4 ATK/range-four shot. Context fallback coverage clears only transient canvas hit areas to expose the normally deduplicated button. Fixtures control terrain/rolls or target state; these are rule/input/persistence checks, not natural-career economics or human balance validation.

Saves: schema five unchanged; current-format careers need no reset or migration. Removals/reversals: landing accidents no longer spend shields, and separate weapon recognition lists were removed from inventory/context controls. No GitHub publication or Windows executable was produced. Remaining: whole-career repair-cost and landing-risk balance playtesting.

## 2026-11-11 — experimental.89 Ringworld oxygen recovery spam

Branch: `experiment/expedition-legacy`; local chat build, not published.

Changes and reason: broken-foot/leg movement exertion now consumes suit oxygen only in hostile air or while submerged. Previously, injured crew consumed 0.2 oxygen each even on breathable surfaces; the next movement recovered that tiny deficit and announced "Oxygen fully recovered" again. An intact ringworld reproduction produced eleven recovery announcements in twelve moves with two injured crew. The fix removes the artificial drain rather than muting genuine recovery. Pain, untreated-injury morale effects, ordinary hostile-atmosphere drain, underwater consumption and infinite-oxygen debug protection retain their behavior. Updated the current player and QA guides.

Validation: built HTML; all 105 root tests and generated-source/version checks passed. Added the versioned `oxygen` headless scenario and confirmed it failed against experimental.88 before the fix. Passed `oxygen`, `turns`, `calendar` and `crew-balance` against the built experimental.89. Native movement on a generated ringworld now keeps a full reserve without recovery announcements, a 75% reserve recovers to full with one announcement, current-format export/import retains the behavior, and hostile-air/submerged injury costs remain. The scenario uses a controlled corridor, fixed rolls and no enemies; it does not establish the state of the reported personal career or whole-expedition balance.

Saves: schema five unchanged; existing current-format careers need no reset. The newest personal export found in accessible Downloads/synced folders was `prospector_save(5).json` dated November 9, an older schema-three nebula career with no ringworld. Inspected it read-only; no newer ringworld export was located, and no personal save was modified or migrated. No GitHub publication or Windows executable was produced. Remaining: verify the specific reported career if its newer save becomes available.

## 2026-11-11 — experimental.88 Lost-hull damage flash

Branch: `experiment/expedition-legacy`; local chat build, not published.

Changes and reason: added the requested red damage-tail effect to the player hull gauge. Only recently lost hull is highlighted, holding red briefly and fading away over 650 ms while numeric HP and the remaining hull fill update immediately. Consecutive hits combine into the active band and restart its fade. Cockpit segmentation and classic bar width match their existing gauges. Repairs, hull/max-HP changes, loading another ship, hidden surface gauges and reduced-motion preferences clear/skip the effect. It uses one disposable DOM animation outside saved game state, with no input lock, delayed damage, gameplay ticks or additional randomness. Current HP fill now uses its exact fraction so the red band meets it without rounding gaps. Updated the [HUD guide](docs/experiment.md#controls) and architecture/QA notes.

Validation: built HTML; all 105 root tests and generated-source/version checks passed. Extended and passed the existing `interface` headless scenario using actual hull damage: checked immediate HP/fill values, precise lost-HP span, merged consecutive hits, completion without serialized gameplay changes, cancellation on real station repair and lower-HP import, and reduced-motion suppression. Inspected red-band screenshots in cockpit/classic themes. Existing `combat-feedback` passed, including gameplay-free playback and menu cancellation. This is presentation validation, not a whole-career or subjective animation-timing study.

Saves: schema five unchanged; animation is never serialized. Removals/reversals: adds explicit lost-hull feedback instead of relying only on the ordinary shrinking fill. No GitHub publication or Windows executable was produced. Remaining: human feedback on the chosen flash/fade duration.

## 2026-11-11 — experimental.87 Visible ruptured-tank capacity

Branch: `experiment/expedition-legacy`; local chat build, not published.

Changes and reason: the fuel gauge now uses installed capacity as its full-height scale. When a ruptured tank halves usable capacity, the unusable upper half is marked with copper diagonal hatching, an × and a capacity boundary; a full damaged tank fills only its usable lower half. The restriction remains visible at partial/zero fuel and disappears when capacity is restored. Hover/accessibility text states current fuel, usable/installed capacities and the unavailable percentage. Existing fuel-warning/color thresholds still use usable reserves. No fuel, rupture, repair, layout or other gameplay rules changed. Updated the [tank guide](docs/experiment.md#mounts-core-systems-and-damage).

Validation: built HTML; all 105 root tests and generated-source/version checks passed. Extended and passed the existing `interface` headless scenario using real tank damage and station repair: checked 50/50 usable out of 100 installed, original-scale partial/empty fills, persistent restriction, descriptive accessible text and repair restoring capacity without generating fuel. Verified screenshots in cockpit/classic themes at 1400×720 and 800×600; visually inspected normal-size cockpit and reduced-size classic results. This is UI validation, not a balance or whole-career playtest.

Saves: schema five unchanged; no new saved state or migration. Removals/reversals: the gauge no longer rescales a ruptured tank to look undamaged/full-height. No GitHub publication or Windows executable was produced. Remaining: no known issue for this cosmetic change.

## 2026-11-09 — experimental.86 Bridge competence, crew casualties and enemy tactics

Branch: `experiment/expedition-legacy`; local chat build, not published.

Changes and reason: reviewed the original R197 `spacecom.bas` snapshot and manual: weapon checks use gunner skill opposed by pilot skill, engines supply movement, escape uses the pilot, and criticals can hit crew quarters/bridge. Adapted that separation to the existing crew roster rather than importing the original dice system or requiring new officer slots. Effective CBT now supplies gunnery and NAV evasion; engines retain physical drive/exhaust but lose their direct accuracy/evasion bonuses. The strongest capable living operator serves each duty, with specialist/Captain tie preferences and fallback after death or incapacitation. Existing injury modifiers apply. Failed propulsion/fuel removes piloting contribution; zero-skill beginners can still learn. The readout names operators and effective skills. [Rules, formulas and original sources](docs/ship-combat-crew.md).

Valid player shots/launches train the actual gunner by one CBT XP. Incoming shots/rams and arriving missile impact rolls train the surviving active pilot by one NAV XP when propulsion works. There is no movement/wait/menu/refused-action or direct kill XP. Existing 25 × next-level thresholds remain. Artemis now snapshots launch CBT and opposes current defender NAV on impact, retaining finite ammunition, homing, delayed/posthumous impacts and its other guards. NPC bridge profiles derive from their vessel/type or explicit ratings, independently of player progress. Prices, rewards and other economics were not rebalanced.

Actual tactical hull loss can now cause a shipboard impact injuring one living crew member, with damage-dependent probability and possible bleeding/concussion/burns/stun. Full shield absorption prevents this roll. Injuries persist, death applies ordinary grief/morale and removes the operator immediately, and losing the last crew member can end a career with positive hull HP. Later fatal bleeding also retains a space-combat cause. Hull/crew debug protection remain separate. Fatal impacts now name the actual attacker rather than whichever fleet target was selected. A saved recorded-death count replaces the ending’s hard-coded three-person subtraction.

Added close-assault, skirmisher, long-range and guided-missile roles, explicit pirate spawning metadata, role-aware available-weapon selection and bounded weighted cover/range routing. NPCs use checked movement budgets and last-known sensor positions, avoid plasma, and choose a maneuver, shot or cooling response without free attacks or extra world/reload ticks. Reload downtime can reposition a skirmisher or seek cover; empty/unpowered outfits flee under existing withdrawal rules. Return-fire cadence prevents an approaching target from forcing endless retreat, and deliberate cooling prevents movement heat from permanently suppressing weapons. Both defects were exposed by the matchup audit and fixed with explicit regressions. Failed-withdrawal resets clear maneuver cadence while preserving the existing 25% failure rule. Natural ram cadence and civilian flight remain intact.

New runtime modules `ship-crew.js` and `ship-ai.js` are registered in the assembly manifest. Added the interactive BRIDGE DRILL debug factory/adapter: a disposable four-role fight with ordinary Corvette/crew stats and real injury risk, repeat reset, restored flags/loadout and exact retained-career isolation. Updated current combat, crew, hull, save, architecture, source-map, debug, roadmap and QA guides; the earlier combat review remains identified as historical.

Validation: built HTML; all **105 root tests** and generated-source/version checks passed, including four new crew-selection/status/formula/profile tests. Passed **18 distinct headless suites**: `bridge`, `ship-combat`, `combat-speed`, `missile-flight`, `artemis`, `combat-resolution`, `combat-ui`, `ship-systems`, `crew-balance`, `palette`, `disengagement`, `autosave`, `combat-feedback`, `ship-pursuit`, `calendar`, `repeat-training`, `morale`, `hulls`. New bridge cases cover real shield/debug-safe personnel impacts, officer death/fallback/grief and saved counts, crew-only and delayed-bleeding defeat, risk-coupled XP, saved missile launch skill, malformed profiles/accuracy/cadence, role positioning, wall flanking, counterfire/cooling regressions and repeatable isolated debug interaction. Existing reload-holding fixture now explicitly uses a holding brawler, distinguishing it from deliberately maneuvering roles. Inspected bridge readout/drill and crew-defeat screenshots. Transaction failure/recovery/stale-window protections continue to pass.

Ran **192 seeded native-action combat matchups**: three player hulls × starting/trained crews × four role/loadout pairs × eight seeds, half with authored cover, at most eighty selections each. Presentation was suppressed; actual turns, aiming, weapons, heat, criticals, personnel injuries/deaths, XP and withdrawal ran normally with debug off. Starting crews won 39/96 and died 26/96; trained crews won 49/96 and died 16/96. Other outcomes were withdrawal, enemy escape and one capped trained-Freighter fight with damaged sensors. Personnel deaths before ship destruction occurred in fifteen starting-crew fights and ten trained-crew fights. No JavaScript/input errors occurred. Deaths were retained. These are fixed-fitting/controlled-crew matchup measurements with a simple policy, not economic affordability, natural-career survival or final human balance claims. The versioned shared fixture and runner are in `qa/`; generated results remain ignored.

Saves: career schema is now **5**; earlier formats require a new career and are rejected without migration. Current saves validate launch CBT instead of engine accuracy, optional NPC crew/tactic metadata, the last-maneuver turn and recorded crew deaths. Existing roster identity, transactional installation and storage keys remain. Removals/reversals: replaces engine-based hit/evasion modifiers, purely generic armed pursuit/holding, the missile engine snapshot and fabricated ending crew-loss arithmetic. Remaining: human tactical/crew-loss playtesting, broader fittings/policies, richer individual NPC crews (NPC personnel currently remain skill profiles) and independently escalating run-age pressure. No GitHub publication or Windows executable was produced.

## 2026-11-09 — experimental.85 Armament fitting/layout and failed-launch ending

Branch: `experiment/expedition-legacy`; local chat build, not published.

Changes and reason: blocked fitting a weapon type onto a mount already holding that same type. The shared installation guard drives the transaction, picker explanation and disabled context action, without changing operational fit/power diagnostics for existing weapons. Refusal spends no credits, moves no stored equipment, resets no reload and records no service time, including when a spare identical weapon is owned. Separate mounts may still fit identical weapons; normal replacements retain the old weapon and its deadline in station stores.

Reworked the Hangar weapon picker into blue Hangar cards with an explicit selected-mount header, aligned name/price-or-ownership row, stats row and bounded description row. The current mount’s weapon is marked FITTED HERE. Corrected inherited right alignment that misplaced weapon specifications, and removed competing description/damage text on one baseline. The parent Armament list uses separate label/detail lines, bounded widths and adjusted row/scroll spacing. Other station action lists keep compact rows. Keyboard, mouse and explicit fitting controls share the same installation action. [Equipment guide](docs/experiment.md#mounts-core-systems-and-damage).

Attempting liftoff from the ship without the full launch fuel now ends the career through the normal mission-failed screen, explaining that the stranded crew exhausted their supplies and never returned. Keyboard and mouse both commit this outcome; the launch control is no longer disabled by low fuel. Landing alone remains allowed and nonterminal. Enough fuel launches normally; being away from the ship only refuses launch, and debug Infinite fuel retains its exemption. The ending uses existing death/save state, consumes no extra fuel or world turns, clears targeting overlays and prevents subsequent launch actions. Passenger transfer occurs only after the launch-fuel check. The narrative does not simulate additional elapsed survival time. [Hull/launch rules](docs/hull-framework.md).

Validation: built HTML; all 101 root tests and generated-source/version checks passed. Passed six distinct headless suites: `armament`, `hulls`, `artemis`, `hangar-systems`, `interface`, `repeat-training`. The new maintained Armament scenario reproduces same-mount refusal through keyboard/direct action with and without owned spares, checks unchanged resources/reload/time, fits identical guns to separate mounts, verifies a real replacement preserves the old gun/deadline, and measures text bounds/alignment. Inspected weapon-picker, parent-list and low-fuel game-over screenshots; armament controls fit both UI themes at 1400×720 and 900×650. Hull scenarios verify keyboard/mouse fatal launches, exact-fuel success, off-ship refusal, Infinite fuel, ended-career save/load and main-menu return. These are controlled scenarios and visual inspection, not whole-career balance or a human playtest.

Saves: career schema four unchanged; no new saved fields or migrations. Removals/reversals: removes paid/reload-resetting same-type replacement, overlapping/right-aligned picker text and the nonterminal low-fuel launch refusal from experimental.84. No GitHub publication or Windows executable was produced. Remaining: human readability feedback and existing broader hull/operating-cost balance work.

## 2026-11-09 — experimental.84 Missile purchase ownership guard

Branch: `experiment/expedition-legacy`; local chat build, not published.

Changes and reason: Hangar Artemis missile purchases now require ownership of an Artemis launcher, either fitted or retained in any station’s equipment stores. The shop disables the ammunition row with a clear requirement, and the purchase action independently rejects attempts without charging credits, adding missiles, advancing turns or recording service time. Existing missiles do not count as launcher ownership and are not deleted if the last launcher is sold. Installed/damaged/unpowered launchers still qualify as owned. No changes to firing, missile prices, magazine limits or NPC ammunition.

Investigated the launch-fuel question and documented the existing surface-stranding risk in the [hull rules](docs/hull-framework.md): landing does not reserve fuel or require a launch reserve. Liftoff requires the full size-dependent amount. SOS is available in space, not on planetary surfaces; an ordinary planet may offer no recovery. This release adds no landing block, automatic rescue or free fuel.

Validation: built HTML; all 101 root tests and generated-source/version checks passed. Passed `artemis` and `hulls` headless suites. Native shop keyboard and direct action refusals preserve credits/ammunition/turns/time; an owned launcher stored at another station enables purchase, and removing the last owned launcher disables it despite remaining missiles. Existing installed-launcher purchase/cap, combat, persistence and debug checks still pass. Reproduced a Freighter landing with one fuel: it reaches the surface, displays a disabled 2.5-fuel launch control and refuses keyboard liftoff without spending fuel or time. Existing hull exchange/save/workshop checks also pass. Controlled scenarios, not a human playtest or whole-career balance run.

Saves: schema four unchanged; no migrations or new saved fields. Removals/reversals: removes unconditional ammunition purchase without a launcher. Remaining: planetary SOS/recovery and a pre-landing low-fuel warning are not implemented. No GitHub publication or executable was produced.

## 2026-11-09 — experimental.83 Physical hulls, refits and shipyard exchanges

Branch: `experiment/expedition-legacy`; local chat build, not published.

Changes and reason: implemented the accepted first [hull framework](docs/hull-framework.md). Hull size, structure, engineering, precision and layout now derive upgrade ceilings, mount dimensions, reactor/thermal profiles, spare refit space and frame support. Factory allocations preserve the three distinct roles; purchased tanks, armor, sensors, cargo, berths, engines, shields, bays, reactors and cooling compete for spare space. Hangar actions share one fitting/transaction calculation. Refits can be removed for 25% recovery of documented expenditure, with occupied-bay/cargo/crew guards and explicit surplus-fuel venting. Individual ceilings no longer imply that every upgrade can be fitted together.

Physical size now affects drive pace (effective engine grade × geometry / square root of size), sector fuel expenditure, space waiting, launch and combat-boost fuel, and failed-landing severity. Stock Scout / Corvette / Freighter consume 0.8 / 1.3 / 2 fuel per sector, 1 / 1.5 / 2.5 per launch and 2 / 3 / 5 per boost. Stronger engines improve pace but use more travel fuel. Nebula severity retains the same size multipliers and common/major rolls introduced in experimental.82. Shields still absorb landing impacts; navigation chance/training, turn progression and separate scan costs are retained. Fractional fuel is preserved, travel requires a full sector's cost, and positive low reserves use existing SOS handling without premature life-support depletion. The maintained pilot now budgets return fuel using actual sector cost. NPCs without blueprint classes retain authored engine pace. Derived base reactor/cooling/heat are Scout 8/6/80, Freighter 7/5/110 and Corvette 12/8/90, replacing the separate static profiles.

Replaced the flat 3,000-credit hull switch with a paged registry-driven shipyard and reviewed quotes: Scout 3,000, Freighter 4,500, Corvette 6,000 list prices, plus 500 service, less condition-adjusted bare-hull trade-in (50%) and documented refit recovery (25%). Condition weights hull HP 60% and six-core integrity 40%. Necessary crew/cargo additions are quoted and constrained before payment; impossible transfers, unresolved tows, stale quotes or full stores block commitment. Replacement hull/cores are healthy; fuel is retained only up to capacity, without creating a tankful. Equipped weapons/utilities move to station-local stores and can be refitted free or sold for half catalog value; replacing a weapon also retains the old one. Reload deadlines and finite missile stocks survive storage, exchange and loading. Starting packages are distinct from bare purchases, preventing free replacement guns. The original three starters are unchanged; later catalog entries need not become starters, but no new hulls ship in this version.

Added the resettable HULL WORKSHOP debug scenario with real Hangar actions and normal fitting constraints, plus current rules, source-map, save, QA and roadmap documentation. General galleries retain deliberate sandbox overrides; workshop state and stores cannot overwrite the retained career.

Validation: built HTML; all **101 root tests** and generated-source/version checks passed. Eight new focused tests cover derived envelopes/catalog separation, shared-space refusal/removal, protected capacity, all six healthy price quotes, condition/refit valuation, stale/blocked/round-trip transactions, gear/deadline retention, physical travel rules and corrupt hull/store rejection. Passed **18 distinct headless suites**: `hulls`, `nebula-damage`, `combat-speed`, `hangar-systems`, `palette`, `crew-balance`, `ship-combat`, `artemis`, `missile-flight`, `combat-resolution`, `combat-ui`, `ship-systems`, `calendar`, `autosave`, `disengagement`, `ship-pursuit`, `repeat-training`, `interface`. Hull scenarios exercise real keyboard/mouse review/confirmation, stores and free owned fitting, save/load, later catalog pages, native movement/wait/landing/liftoff, low fractional fuel and workshop reset/career isolation. Inspected the shipyard screenshot and checked controls at 1400×720 and 900×650. Related fixtures were updated for actual mass-adjusted pace, operating costs, legal damaged-shield cores and the derived reactor profile rather than retaining obsolete numerical assumptions.

Three fresh seeded native-action careers ran with debug off and 200-action / two-minute bounds each: Scout stopped at turn 169 with 1,063 credits; Corvette stopped at turn 183 with 330 credits; Freighter died at turn 114 after 135 actions, destroyed by a Raider Heavy Cruiser with 191 credits. No JavaScript/input errors occurred. The death was retained, not treated as a defect or rerolled. These short runs establish integration, not affordability, long-career balance or human playability; generated reports/screenshots/checkpoints remain ignored.

Saves: career schema is now **4**. Earlier formats are rejected with a new-career message; no migration is added. Current snapshots validate physical envelopes/shared fitting, installed equipment, refit investment and station-local stored gear/deadlines. Storage keys, IndexedDB records and transactional recovery/stale-window protections are unchanged. Removals/reversals: replaces unrelated hand-coded station caps, the old static system-profile table, fixed travel/launch/boost fuel costs and the flat-price/incompletely validated hull swap. Remaining: price/operating-reserve balance across complete careers, more hulls and availability progression, four-plus-mount combat layouts, cargo-mass simulation and human playtesting. No Windows executable or GitHub publication was produced.

## 2026-11-09 — Hull framework and purchase-economy proposal

Branch: `experiment/expedition-legacy`; documentation-only review of local experimental.82. No game-version bump or publication.

Changes and reason: recorded the [hull framework proposal](docs/hull-framework-proposal.md) after reviewing current caps, starting selection, fitting systems and the flat 3,000-credit hull-change action. Proposes physical/fitting constraints, distinct hull specialties with limited refit overlap, a full purchase/trade-in quote, tentative 3,000/4,500/6,000-credit factory hull values, and a larger Hangar registry separate from the fixed three starters. Notes current upgrade loss, incomplete equipment/capacity transfer and the Scout/Corvette engine-role mismatch. Added documentation index and roadmap links; all future behavior/prices are labeled proposals.

Validation: targeted read-only source review, comparison with current purchase/upgrade costs and gross science rewards, and arithmetic for illustrative healthy-hull swaps. No runtime code was changed, and no build/tests or new career-income simulation were run for this documentation pass. Saves: unchanged. Removals/reversals: none. Remaining: agree/tune the physical budgets, transaction rules and economic targets before implementing; later hulls and the proposed mechanics remain unimplemented.

## 2026-11-09 — experimental.82 variable nebula arcs by physical hull size

Branch: `experiment/expedition-legacy`; local chat build, not published.

Changes and reason: charged nebula gas now varies between ordinary sparks (85% of damage events, raw strength 2–8) and major arcs (15%, raw strength 12–24). Hull-class physical signatures multiply strength: Light Scout ×1, Attack Corvette ×1.5, Bulk Freighter ×2.5. Existing navigator severity mitigation applies before a single final rounding; current/max HP, plating upgrades and cargo do not increase the physical signature. The existing event/fuel probabilities, shield-first absorption, critical rules, debug independence and navigation XP remain. Major discharges are identified in the truthful damage log. The keyboard/mouse-accessible SHIP tab shows the hull multiplier. Added catalog-owned signatures and the shared severity roll, with [current ranges and examples](docs/experiment.md).

Validation: built HTML and passed all 93 root tests plus generated-source/version checks. New deterministic rule checks cover common/major boundaries and extrema for all hulls, navigation mitigation, and a seeded 10,000-discharge sample confirming a minority of large arcs. `nebula-damage` and `nebula-encounters` headless suites passed. Native movement checks observed NAV-3 common sample hits of 3/4/6 and maximum major arcs of 20/31/51 for Scout/Corvette/Freighter, a 31-damage arc overflowing a twenty-point Corvette shield by eleven hull HP, unchanged Freighter severity after plating increased hull to 180, and a lethal low-hull arc. Verified the displayed ship multiplier and inspected both UI screenshots. The same damage suite passed after a read-only import of the supplied current-format career; no personal save was modified or bundled. Forced scenarios establish rules and limits, not natural career survival rates or final balance.

Saves: schema three unchanged; current careers use their class's new signature immediately, with no migration or persisted size field. Removals/reversals: replaces the former narrow 2–6 strength roll shared by every hull. Remaining: whole-career exposure/repair economy and human feedback on major-arc frequency/severity, particularly for large unshielded Freighters.

## 2026-11-09 — experimental.81 truthful nebula damage and fuel reports

Branch: `experiment/expedition-legacy`; local chat build, not published.

Changes and reason: a reported full-hull Corvette had a working twenty-point shield and several small nebula hits logged as direct HP loss. Charged gas already used shield absorption; the message ignored the actual hull-damage result. Nebula logs now distinguish incoming damage, shield absorption and actual hull loss, with explicit debug hull protection where relevant. Shield-only hits use warning severity. Corrected the damage source from the copied turret description to charged nebula gas. Fuel interference now reports actual extra expenditure or debug prevention instead of claiming a loss that Infinite fuel suppressed. Damage chances, amounts, shielding, debug flags, action costs and navigation XP remain unchanged.

Added the portable `nebula-damage` headless scenario and updated the [nebula guide](docs/experiment.md). Validation: built HTML and passed all 90 root tests and generated-source/version checks. Imported the supplied career read-only into an isolated browser, enabled Infinite fuel with the real checkbox and verified Infinite hull stayed off: a forced three-damage hit left 110 hull and reduced twenty shields to seventeen; with empty shields the same hit reduced hull to 107. Scenario checks also cover recharge, partial/no shields, the HUD value, independent hull protection, both fuel modes and save/load. `nebula-encounters` passed. No personal save was changed or added to the repository; forced hazard rolls/controlled surroundings establish rule behavior rather than reconstruct every past move.

The same new scenario also passed from a fresh game without the supplied save, and its shield/hull log screenshot was inspected.

Saves: schema three unchanged; the reported current-format career loads. Removals/reversals: replaced misleading direct-HP/fuel-loss claims, without changing game balance. Remaining: no unresolved damage defect found in this report; the historical log cannot reconstruct every prior shield value or debug toggle.

## 2026-11-09 — experimental.80 Artemis travel time and persistent salvos

Branch: `experiment/expedition-legacy`; local chat build, not published.

Changes and reason: Artemis now launches a real saved projectile without immediate damage. Each later committed combat turn advances older missiles four tiles after the NPC response; normal short/long stationary engagements take one/two later turns. Bounded routing follows the original moving target around cover and bystanders, using up to four motor ticks before self-destruction. Inspection, refused actions and audiovisual playback do not advance flight. Impact rolls combine launch engine/range with current target engines and use normal shields, hull, criticals and death handling. Ammunition, launcher cost, heat, reload and other weapon timing remain unchanged.

Missiles remain autonomous after sensor loss or firing-ship destruction. Live incoming salvos keep combat open after the last enemy dies, with guarded firing/surrender controls and correct missile-source death attribution. Destroyed/escaped targets are not retargeted. Withdrawal advances old missiles before rolling; failed resets keep their actual positions, successful withdrawal leaves the salvo behind, and accepted surrender calls it off. A queued hit that finishes the last enemy resolves victory before an unnecessary withdrawal roll. Readouts show visible incoming/outgoing missiles and approximate impact time, with map markers and hover fuel/range details. Pirate-base missiles also delay impact by one additional career turn; turrets respond to launch once, pending bombardments can arrive during another encounter, and destruction rewards remain one-time. The debug encounter resets flying ordnance and retains career isolation.

Added `src/combat/ship-missiles.js` in the explicit assembly manifest, the portable `missile-flight` scenarios and current missile/save documentation. [Combat/equipment rules](docs/experiment.md) · [Architecture](docs/architecture.md) · [Autosaves](docs/autosave.md).

Validation: built the HTML and passed all 90 root tests plus generated-source/version checks. Passed twelve distinct headless suites: `missile-flight`, `artemis`, `ship-combat`, `combat-resolution`, `disengagement`, `ship-systems`, `combat-feedback`, `combat-ui`, `palette`, `turns`, `calendar`, `autosave`. Flight cases check near/far impact, impact-time rolls, tracking, sensor loss, save/load after actor reordering/target changes, last-enemy/posthumous retaliation, lethal impacts, expiry, target loss, withdrawal outcomes, accepted surrender, saved base impact during combat and duplicate reward prevention. Core tests reject malformed projectile state. Autosave integration checks preserve active careers on malformed/older imports and stale-window/transaction failure safeguards. Inspected the incoming-missile screenshot. These are controlled scenarios, not a whole-career balance survey or human playtest.

Saves: career schema is now **3**; earlier save formats are clearly rejected and require a new career. No migration was added. Current snapshots validate missile participants, positions, launch values, flight ages and base deadlines; actor IDs preserve target identity. Storage keys and IndexedDB record format remain unchanged. Removals/reversals: replaces experimental.79's immediate guided damage and purely cosmetic missile flight, including base bombardment. Remaining: long-career ammunition/loadout balance, human readability feedback and possible future interception/point defense; those defenses are not implemented.

## 2026-11-09 — experimental.79 Artemis guided launcher and finite ammunition

Branch: `experiment/expedition-legacy`; local chat build, not published.

Changes and reason: replaced the Artemis placeholder with a working medium-mount guided launcher: 1,200 cr, 18–30 damage, range eight, four reactor power, ten heat and three intervening actions to reload. Guided reach bypasses planar asteroid/ship cover for both player and NPC shots, while preserving sensor, range, power, heat, accuracy, shield and critical rules. Added curved disposable missile playback. Shared weapon reach/supply checks also drive enemy mount selection/status, escape danger and stalemate detection, so empty missiles cannot create a false firing opportunity or hold an NPC behind cover forever.

Added a dedicated twelve-missile ship magazine, shared across launchers. Hangar → Armament sells Artemis missiles for 60 cr each; installation includes none. Each valid launch consumes one on hit or miss, including base bombardment; rejected attempts remain free. About one in eight multi-weapon raiders receives a launcher in its last mount with three missiles, assigned once without new UI RNG. Other weapons remain usable when its magazine empties. Player mounts, inspection/inventory and sensor-visible enemy readouts show stock. Retreat, refitting and save/load do not restock missiles. Added a registered ARTEMIS RAIDER debug encounter with working cover fire, reset and isolated return-to-career behavior. Updated [equipment rules](docs/experiment.md), architecture, debug guide, QA guide and roadmap status.

Validation: built HTML and passed all 89 root tests and generated-version/source checks. Passed ten distinct headless suites: `artemis`, `ship-combat`, `ship-systems`, `combat-resolution`, `combat-feedback`, `palette`, `previews`, `combat-speed`, `ship-pursuit`, `combat-space`. New scenarios cover actual purchases/cap/failure, hits/misses, keyboard/mouse cover fire, ordinary weapon blockage, sensor/range/heat/power guards, NPC selection/depletion/fallback, retreat/save identity/deadlines, stalemates, base fire and sandbox reset/save isolation. Palette coverage checks and shop/player/enemy screenshots were inspected. A first diagnostic run stalled because its constant combat RNG was left active during world generation; the harness now restores ordinary generation randomness, and its completed reruns passed. No whole-career missile economy survey or human playtest was performed.

Saves: no schema/storage-key change; ammunition is persistent on authoritative ship actors. Malformed, fractional, negative, unknown and over-capacity magazine contents are rejected for players and NPCs, including NPCs without initialized cores; normal load-failure preservation remains in place. Removals/reversals: Artemis is no longer an unavailable placeholder. Remaining: sustained economy/loadout balance and human feedback on guided combat; no in-flight interception, separate missile travel turns or wider bridge-skill changes were added.

## 2026-11-09 — experimental.78 combat stalemates and fleet surrender

Branch: `experiment/expedition-legacy`; local chat build, not published.

Changes and reason: permanently immobile tactical sides with no usable powered firing line now end combat in the existing stranded/SOS state at the same galaxy location. Detection considers every living opponent and every fitted player weapon, ignoring temporary heat/reload delays. It runs after a committed action, a failed player withdrawal/reset, or a deliberately initiated unfightable encounter. Automatic encounters are checked before entry so the same disabled group cannot repeatedly block rescue. No rewards, repairs, relocation or extra turn are granted by the transition; ordinary action ticks still apply. Stranded processing retains exposure, rescue costs and fresh hostile encounters. Keyboard waits now use the same stranded handling as movement and compass input, including pending rescue offers; world-triggered combat correctly clears stranded state.

Pirate group surrender now uses the highest demand among living, unescaped opponents, shared by the action and context UI. Selecting a weaker firing target cannot lower that demand. Destroyed/escaped ships stop contributing; single-enemy terms, half-credit/all-cargo payment and the existing patrol/natural-entity rules remain. Added the portable `combat-resolution` regression suite and updated the [equipment guide](docs/experiment.md), [review status](docs/combat-review-2026-11-09.md) and roadmap.

Validation: built the HTML, passed all 86 root tests and generated-source/version checks, and passed 11 distinct headless suites: `combat-resolution`, `ship-combat`, `disengagement`, `ship-systems`, `ship-pursuit`, `combat-speed`, `crew-balance`, `turns`, `calendar`, `repeat-training`, `improvised-repair`. New fixtures exercise actual save/load, keyboard and pointer actions, stranded rescue/exposure, fresh enemies, blocked shots, temporary delays and fleet refusal/acceptance. Re-ran the review diagnostic on the fixed build and visually inspected its rescue-screen evidence. These are controlled scenarios, not a whole-career balance survey or human playtest.

Saves: no schema or storage changes; damage and readiness stay on authoritative ships. Removals/reversals: replaces indefinitely waiting in the demonstrated immobile combat state and selected-target surrender pricing. Remaining: engine/loadout balance, bridge skills, enemy tactics and the existing powerless edge-withdrawal rule remain outside this fix; see the review. No promise of rescue or survival was added.

## 2026-11-09 — Ship combat review and diagnostic fixtures

Branch: `experiment/expedition-legacy`; reviewed local experimental.77, not published. No game-version bump.

Changes and reason: added the [combat review](docs/combat-review-2026-11-09.md) and portable `qa/review-ship-combat.cjs` diagnostic. Reproduced a disabled-engine/blind-enemy stalemate and target-dependent whole-fleet surrender. Recorded engine stacking, limited bridge-skill participation, basic enemy tactics and powerless edge escape as balance/design questions. Clarified that existing combat XP grants are for ground combat. No gameplay rules, generated release, or historical behavior were changed.

Validation: all 86 root tests and generated-source check passed; five headless suites passed (`ship-combat`, `ship-systems`, `combat-speed`, `disengagement`, `ship-pursuit`). The diagnostic ran against built HTML with constructed fixtures and fixed randomness, without runtime exceptions. This was not a natural-career survival survey or human playtest.

Saves: unchanged. Removals/reversals: none. Remaining: both confirmed rule problems and the balance/integration questions remain open; see the review for proposed order and evidence limits.

## 2026-11-08 — experimental.77 orbital scan progress

Branch: `experiment/expedition-legacy`; local chat build, not published.

- Added **Terrain scanned: N%** to the selected planet/moon orbital panel so progress remains visible after detailed scan comms were removed. Partial scans read the actual selected body's mask and round down, staying below 100%; complete scans show 100%. Gas giants omit terrain percentage and describe partial readings without implying surface terrain.
- Validation: build and all 86 repository tests pass, plus `scan-comms`, `crew-balance` and `scan-landing` browser suites. The extended scan scenario verifies a moon's 37%, 99% and 100% coverage independently of its fully scanned parent, no gas-giant terrain label, and no render-time change to turns/fuel/log. Reviewed the orbital progress screenshot. No new standalone tests for this small presentation change.
- Saves: no schema, mask, scan-cost, XP or turn-rule changes. Comms retain subtle anomaly hints. Remaining: no known issue from this change; human playtesting remains separate from scripted checks.

## 2026-11-08 — experimental.76 restrained scan comms

Branch: `experiment/expedition-legacy`; local chat build, not published.

- Removed duplicated orbital-readout data from scan comms, including scan-status/coverage chatter, biome and physical readings, mineral/life/biodata/hazard summaries, explicit civilization identity/attitude and gas-giant moon lists. Ordinary successful scans now remain quiet; orbital details, survey records, scan state/coverage, costs and XP are retained.
- Successful or partial scans of unusual bodies can give one understated clue about regular surface patterns, an odd biological rhythm or unfamiliar contours. Civilizations are not named or classified. A fully scanned gas giant can suggest an unusual secondary return without identifying it; partial scans do not leak the companion. Scattered structures only qualify when a surface footprint is revealed, without inspecting hidden loot/interiors. Hint choice is deterministic and read-only, with no new RNG or save counters. Failed/resource/offline/completed-scan refusals retain their existing feedback.
- Validation: build and all 86 repository tests passed, along with six targeted browser suites (`scan-comms`, `crew-balance`, `scan-landing`, `turns`, `calendar`, `repeat-training`). They cover quiet ordinary worlds, civilization/special hints without identities, selected moons/companions, retained orbital details, scan fuel/turn/XP behavior and failures. Rule checks also cover visible-versus-hidden scattered structures. Reviewed the special-world screenshot for the brief comms presentation. Fixtures control world types; no human assessment of how easily players interpret the clues has been performed.
- Saves: no schema or gameplay-state changes; older detailed comms entries remain historical log entries. Remaining: tune clue wording through player feedback; future special-world content must opt into appropriate restrained scan hints.

## 2026-11-08 — experimental.75 repeatable risky training and linear XP

Branch: `experiment/expedition-legacy`; local chat build, not published.

- Adopted the user's chosen **25 × next-level** XP curve. NAV 3→8 now costs 750 earned XP instead of 3,800. Kept surplus handling, mastery cap and exact UI progress; no retroactive level rewrite.
- Reversed experimental.74's once-per-body landing training rule. Every real approach again earns 1 NAV XP for clean landings or 3 for rough landings; the damage roll repeats and each launch retains its fuel cost. Removed reads/writes of the training flag without save migration. Successful paid scans again earn XP regardless of coverage growth; free viewing of a completed scan still grants none.
- Kept pulsar study repeatable and corrected its actual exploit: observation previously advanced no turns and applied no new exposure. Each measurement now uses the ordinary galaxy-wait process with scan activity, costing one turn/one reported hour and 0.5 fuel, ticking systems/crew and allowing the normal NPC response before surviving scientists receive 2 SCI XP. No artificial observation limit added.
- Extracted the unchanged pulsar range/dose/pulse rules from movement into a shared hazard helper and applied them during galaxy waits, field-work waits and SOS waits too. Staying still no longer freezes radiation. Direct pulses can kill through ordinary damage handling; fatal observations give no XP. Documented repeatable training with real cost/risk as a design principle; station purchases still do not train the crew doing no work.
- Validation: build and all 83 repository tests pass. Seven targeted headless suites passed (`repeat-training`, `crew-balance`, `scan-landing`, `turns`, `calendar`, `ship-systems`, `palette`). They cover exact repeat-action XP/fuel/turn/damage/radiation coupling, fatal observations stopping rewards, proximity boundaries and stranded exposure. One fresh extended Scout career (seed 155921) reached NAV 6 with 455 earned XP before crew death at turn 2,409 / 2,673 selections, with no JavaScript errors. This is not a guarantee of level eight or a human balance assessment; the earlier .74 audit remains historical evidence.
- Saves: schema unchanged; existing skill levels and stored XP remain, with subsequent grants using the new costs. Old landing-training flags are inert. No backwards compatibility work, new save counters or automatic upgrades. Remaining: measure the revised curve in longer human careers and continue independent difficulty escalation work from the roadmap.

## 2026-11-08 — experimental.74 automated skill progression audit

Branch: `experiment/expedition-legacy`; QA/documentation only, no game-version bump or publication.

- Added reusable native-career XP telemetry and bounded ordinary, extended survey and deliberate training profiles, plus explicit fixture-assisted source probes. Records initial/final skills, XP by source, milestone turns, deaths/departures and controller limits. Seeds before startup as well as generation; generated results remain ignored.
- Ran 21 career profiles over three seed choices; six fresh final reruns replace obsolete blocked-controller results. None reached level eight. Nine ordinary profiles gained no levels; best Navigator earned 826 NAV XP and reached five at turn 5,669, with its still-playable run bounded at turn 5,789. Reused seeds/policies and early retirements do not establish a human success probability. See `docs/skill-progression-audit.md` for every result, limits and fixed-XP curve comparisons.
- Found and corrected automation's stale bypass call and attempts to move/escape on a disabled drive; native surrender/fire/wait remains available. Added no-progress bounds rather than treating thousands of refused actions as a long career. A remaining focused controller stop is disclosed, not attributed to balance. Game rules and failed outcomes were not rewritten.
- Confirmed a separate pulsar XP loophole: native recruitment followed by a disclosed positional fixture reaches Science 8 from 2 after 1,990 repeated observations, spending no career turns. This is not an unassisted career. A normal-money casino source probe ran out of funds at Social 4. No gameplay fixes applied in this audit; gentler progression, meaningful-work rewards and repeat-source limits remain proposed follow-up.
- Validation: all new/edited QA JavaScript parses. An observer-on/off comparison gave identical gameplay, RNG and input selection over 301 native actions after controlling startup randomness/timestamps and excluding only interpolated sprite animation state. Completed career reports and source probes contain no JavaScript gameplay errors. The built HTML hash still matches the delivered experimental.74 artifact; source gameplay and saves are unchanged. No full regression rerun was needed for this QA-only work.

## 2026-11-08 — experimental.74 crew, progression, rescue and scan pass

Branch: `experiment/expedition-legacy`; local chat build, not published.

- Every hull now starts with Captain and Navigator only; removed free engineers and the Scout's free scientist. Engineers have ordinary lowercase **e** badges and can be hired in multiples. Station upgrades, weapon unlocks and module-slot additions no longer require an onboard engineer; field core repairs still do.
- Removed engineer mitigation of component critical chance and severity for player and NPC ships. Every fuel-tank critical at any integrity has a 3% chance of a 20–50 HP internal explosion, bypassing shields without recursive criticals. Player blasts burn a quarter of remaining fuel after capacity losses; empty player tanks and debug infinite hull suppress explosions. NPCs use implicit reserves unless explicitly empty. Lethal arena blasts use normal kill/reward handling.
- SOS offers now advertise engine/reactor repairs when needed, retain existing fees, restore only disabled propulsion cores to at least 80% physical integrity and report actual fuel delivered. Revalidate pending rescuer identity/range; clear stranded state only with working propulsion and fuel. Existing repair logic was hidden by fuel-only offer text; this makes its scope explicit and prevents stale/duplicate acceptance.
- Replaced permanent base-morale rewards from drinks, chemicals, casino outcomes and primitive/tribal aid with fading boosts/events. Added ordinary-turn decay (drinks each sixth turn, chemicals each third, events toward zero each fifth), event cap ±12, and truthful morale breakdown. Unpaid visits are shown as already included in base, fixing the apparent double subtraction. Mild antidepressants cannot lower an existing stronger chemical lift. Lasting losses, finite survivor-delivery base rewards and grief relief remain; see `docs/crew-progression.md`.
- Skill costs now grow as 20 × next-level² instead of 10 × next-level; added exact XP readouts, safe grants and multi-level carry/cap. Removed XP for purchased station services, limited landing XP to a body's first approach, and award scan XP only for new terrain data/full gas cataloguing. This slows progression and closes low-risk repetition loops without changing turn costs.
- Orbital panels and full/partial scan comms reports share one reading function for temperature, gravity, atmosphere, radius, oxygen, mineral grades, lifeforms, biodata and hazards. Generated population overrides estimates, including zero; gas giants are no longer labelled breathable. Current hull maximum remains three mounts; documented the tested UI scope rather than promising arbitrary loadouts.
- Validation: final build and all 82 repository tests pass. All 34 headless browser suites passed across the initial/resumed runs after updating obsolete starting-crew/capacity fixtures and separating corrected scan text from the historical artwork comparison. Three bounded fresh-career runs completed without JavaScript errors (scout 82 actions, freighter/corvette 80 each). Reviewed XP, morale breakdown, SOS and orbital screenshots; shortened morale labels to keep the base-penalty explanation visible and separated the SOS arrival line from crew HP. Rebuilt and reran crew-balance, morale and ship-systems after that final UI polish; all passed. Automated fixtures and short careers do not establish whole-career balance or replace human playtesting.
- Saves: schema unchanged; new careers get the smaller roster. Existing crews/base morale/skill levels are not rewritten, stored XP uses the new thresholds, and new per-body landing-training flags and temporary event morale persist normally. Older saves do not reconstruct past approaches. Remaining: tune survival/progression distributions through whole-career play; full independent time escalation remains on the roadmap.

## 2026-11-08 — difficulty philosophy and experimental.73 publication

Branch: `experiment/expedition-legacy`; publication requested by the user.

- Added `docs/design-philosophy.md` as the governing difficulty direction: hard roguelike, common early death from accidents/monsters/pirates/environments/bad luck, temporary relief from earned progress, and intended escalation with run age regardless of player readiness. Consistently outrunning the curve should require exceptional cunning. Distinguished legitimate lethal outcomes from broken controls, save corruption and state defects.
- Linked the philosophy from contributor instructions, the documentation index, player introduction and roadmap. Revised the planned Titan's discovery-gated clock so future crisis design agrees with independent run-age pressure. Clearly marked full escalation as future work; the reporting calendar remains cosmetic.
- Publishes the accumulated experimental.63–73 source, generated standalone HTML, guides and portable QA from this chat to the active experimental branch. Main/public release and Windows executable are outside this publication. Local review copies, generated QA artifacts and dependencies remain ignored.
- Updated the combat-feedback regression check to assert the requested bottom-anchored enemy details instead of their obsolete top position; gameplay rendering is unchanged by that test correction.
- Validation: `npm run build` and all 77 repository tests passed; all 33 headless browser suites passed across the initial run and resumed remaining suites after correcting that stale layout assertion. Three bounded smoke careers (scout, freighter, corvette; 80 actions each) completed without JavaScript errors. These are automated scenario checks, not whole-career human playtesting or evidence of final difficulty balance. Prior per-change evidence and limits remain below. Documentation-only philosophy changes do not bump the game version, which remains experimental.73.
- Saves: no additional schema or gameplay change from the philosophy document. Remaining: implement and balance the complete run-age escalation curve through the roadmap; human whole-career playtesting remains outstanding.

## 2026-11-08 — 0.28 experimental.73 restore rare nebula encounters

Branch: `experiment/expedition-legacy`; local review candidate only.

- Fixed manual initiation: gas entities were omitted from the shared F-target roster. They now use the same natural-entity detection radius as their marker (sensors + 2), enter combat directly and do not invoke civilian confirmation/reputation penalties. Nearest/Examine selection and context controls share that target.
- Fixed automatic early encounters: visible monsters previously had all AI disabled until turn 300. Removed that gate so living threats can pursue/engulf immediately. Kept nebula confinement, six-sector prey detection, disengagement grace and safe-space exclusions, and made debug ship invisibility suppress pursuit/engulf as intended. Natural ram behavior, tactical mobility and crystal rewards are unchanged.
- Greatly reduced fresh-generation spawn rates per connected cluster: massive 100% → 12%, expansive 35% → 4%, ordinary 8% → 1%. Removed the guaranteed massive-nebula spawn; at most one entity per cluster. Existing saved populations are not silently deleted or rerolled.
- Validation: rebuilt HTML and all 77 repository tests passed, with new early pursuit, manual targeting, guard and rarity coverage. Four headless Edge suites passed: nebula encounters, attack confirmation, combat UI and palette. The tactical monster screenshot was inspected. Actual gameplay scenarios verified manual and early automatic encounters, natural ram damage, no exhaust, safe-space/grace/blind-player behavior and crystal reward without pirate bounty. Reproducible generation over the same 40 seeds produced 23 entities under new rates versus 216 under old rates (fixture-assisted sample, not a universal density guarantee). Human full-career balance remains unverified.
- Saves: no schema change or migration. Encounter fixes apply to existing entities; rarer generation requires a fresh galaxy. Existing interactive gas playground factories are retained and exercised. Unique standalone HTML delivered in chat; no GitHub upload or Windows executable build.

## 2026-11-08 — 0.28 experimental.72 restore manual galaxy attacks

Branch: `experiment/expedition-legacy`; local review candidate only.

- Replaced experimental.69's native browser confirmation with an in-game canvas prompt. Embedded browsers can suppress native dialogs, silently cancelling civilian attacks. Explicit Attack [Y], Cancel [N] and Escape now work without browser dialogs. Opening/cancelling is free and blocks movement, inspection and world cursor controls; acceptance revalidates the current career and target.
- Unified F/context targeting: manually engage the nearest detected, charted live ship within sensor range, or the ship selected in Examine. This replaces same-tile-only pirates and the one-tile civilian limit. Raiders remain immediate; forced interceptions are unchanged. Fire is handled before movement remaps/Examine; repeated galaxy keydown cannot approve or fire an attack. Unavailable locks report why no target can be engaged.
- Preserved pirate-base Fire fallback and removed stale context references. Existing pursuit fixtures now explicitly approve their intended civilian attack.
- Validation: all 73 repository tests passed and the rebuilt HTML check passed. New headless confirmation/targeting scenarios pass with window.confirm deliberately disabled, including cancel invariance, pointer/keyboard acceptance, nearby pirates/civilians, examined targets, binding conflicts, sensor limits, dead/stale targets, compass blocking and base controls. Five headless Edge suites passed: attack confirmation, ship pursuit, ship combat, interface and combat UI. Inspected the in-game prompt screenshot. Human testing in the user's embedded browser remains outstanding.
- Saves: no schema change; confirmation state is transient and never saved. Unique standalone HTML delivered in chat; no GitHub upload or Windows executable build.

## 2026-11-08 — 0.28 experimental.71 orbital landing-site presentation

Branch: `experiment/expedition-legacy`; local review candidate only.

- Orbital scans now draw only the underlying terrain at the saved landing site, including on previously visited planets. Removed the visit-dependent player-ship sprite/ASCII marker, which incorrectly made the ship appear left behind after liftoff. Landing coordinates and stored surface tiles remain unchanged.
- Validation: rebuilt HTML and all 73 repository tests passed. Two headless Edge suites passed: new scan-landing scenarios and existing station/terrain rendering checks. Covered initial scan, land/liftoff/revisit, sprite and ASCII modes, render state invariance, save/reload, landing at the remembered spot and moving to a new one. Inspected the returning-scan screenshot. Human playtesting remains outstanding.
- Saves: no schema or gameplay change. Unique standalone HTML delivered in chat; no GitHub upload or Windows executable build.

## 2026-11-07 — 0.28 experimental.70 parallel calendar reporting

Branch: `experiment/expedition-legacy`; local review candidate only.

- Added a saved reporting calendar alongside the unchanged turn simulation. Galaxy turns record 1 hour, surface/interior exploration 5 minutes, orbital actions 10 minutes, combat actions 1 minute, field repair attempts 15 minutes and casino events 30 minutes. Explicit station docking/transit/services record time without adding gameplay turns. Menus, inspection and failed checks remain free. See the current [rates and limits](docs/time-reporting.md).
- HUD retains TURN and adds ELAPSED. Planet LOCAL time maps the existing daylight cycle to a 24-hour solar dial rather than changing lighting progression. Fixed-light/interior environments retain appropriate existing indicators. No gameplay reads the reporting clock: resource costs, NPC responses, statuses, rescue/mission timers, reloads and daylight remain turn-based.
- Added elapsed/location totals to records and endings, plus combat/field-repair totals to retirement. Standard days are 24 hours and reporting months 30 days. Saved location/activity sums are validated before loading. Existing careers do not receive invented historical durations; use a new career for full-career totals.
- Validation: rebuilt HTML and all 73 repository tests passed, including four new calendar rules tests. Nine affected headless Edge suites passed: calendar, turns, combat speed, improvised repair, interface, LOG, autosave, ship systems and hangar systems. Final calendar and persistence/repair checks include tactical waiting in combat totals. Deterministic off/on comparison confirmed identical serialized gameplay state apart from the reporting clock. HUD at two sizes and retirement/death screenshots were inspected. Human pacing/readability playtesting remains outstanding.
- Saves: schema 2 unchanged, new optional validated reporting state. No migration or timer conversion. No GitHub upload or Windows executable build; unique standalone HTML delivered in chat.

## 2026-11-07 — 0.28 experimental.69 confirm civilian attacks

Branch: `experiment/expedition-legacy`; local review candidate only.

- Player-initiated attacks on station patrols and unarmed civilian vessels now ask “Do you REALLY want to attack” and name the target/reputation risk. Cancelling does not spend a turn, harm reputation or change hostility/flight state. Keyboard and pointer fire share the same guard. Raiders, other armed civilians and automatic hostile interception retain existing behavior.
- Recorded a proposed elapsed-calendar/activity-time design in the roadmap for discussion. Time rules, turn costs, timers and retirement reports are unchanged in this build; the proposal is not described as implemented.
- Validation: rebuilt HTML and all 69 repository tests passed. Three headless Edge suites passed: attack confirmation, ship pursuit and interface, covering free cancellation, pointer/keyboard acceptance, raiders and forced defense; human playtesting remains outstanding.
- Saves: no schema or state change; confirmation is a transient native browser dialog. Unique standalone HTML delivered in chat; no GitHub upload or Windows executable build.

## 2026-11-07 — 0.28 experimental.68 full-height comms history

Branch: `experiment/expedition-legacy`; local review candidate only.

- Removed the fixed 18-message sidebar and 12-message crew-dialogue limits. Comms fills the remaining sidebar height; wrapped rows retain their natural height rather than shrinking into overlapping/clipped lines.
- Uses an initial 80-message rendering window with older pages loaded on upward scrolling. Saved messages are not discarded. New traffic follows the bottom only when already viewing the newest messages; otherwise a scaled visual entry anchor preserves the reader's place. History paging does not advance time or save UI state, and a fresh career resets it. Archive-only entries remain in the dedicated LOG tab.
- Validation: rebuilt HTML, all 69 repository tests and four headless Edge suites passed (comms log, interface, LOG and combat UI), including both themes at 1400×720 and 1000×620, all 240 historical messages, multiline rows, reading position during new messages, latest following and career reset. Screenshots were inspected. Human playtesting remains outstanding.
- Saves: no schema change or migration; existing log history retained. Unique standalone review HTML delivered in chat; no GitHub upload or Windows executable build.

## 2026-11-07 — 0.28 experimental.67 ship salvage and station bounties

Branch: `experiment/expedition-legacy`; local review candidate only.

- Replaced money-only pirate salvage and empty civilian wreck rewards with role-weighted nothing/credits/equipment/cargo tables. Freighters favor bulk goods, researchers instruments/supplies, traders money/trade goods, patrols and guards crew equipment, and roamers stolen cargo. Reuses runtime shop and commodity catalogs, excluding quest items and installed ship weapons. Civilian reputation consequences remain.
- Pirate kills retain their 50–149 cr bounty but now defer it to accessible major BASE docking; pirate cash salvage joins the claim. Docking settles once before payroll. Pending claims appear in Active Missions and LOG records and survive saves. Civilian cash is immediate. Pirate-base bonuses and gas-entity rewards are unchanged.
- Overflow cargo remains at encounter coordinates using existing persistent cargo drops, with generic item labels, cargo markers and one-unit recovery. Full holds no longer block docking at a station under a drop. Dead civilian markers no longer hide salvage from Examine. Per-ship resolution guards prevent repeat rewards; replacement patrols receive fresh eligibility.
- Validation: build and all 69 repository tests passed; deterministic tables cover each role/outcome, real catalog items, duplicate prevention, deferred cash and overflow recovery. Seven headless Edge suites passed: ship rewards, ship combat, combat UI, missions, pursuit, autosave and career. Scenarios verify actual kills, pending records, saved claims/drops, single settlement, malformed-claim rejection, full-hold docking and patrol replacement; final rewards/autosave/career checks include payment before payroll. Human economic/career balance remains unverified; weights and amounts are initial choices.
- Saves: schema 2 unchanged; new pending-claim totals are validated when present. No migration or retroactive bounties. Existing roster/drop serialization preserves flags and cargo. New uniquely named standalone HTML delivered in chat; no GitHub upload or Windows executable build.

## 2026-11-07 — 0.28 experimental.66 shorter repair label

Branch: `experiment/expedition-legacy`; local review candidate only.

- Shortened the ship-system action to “Attempt improvised repair” and updated its existing browser scenarios and current guide. Skill checks, costs, repair outcomes and reactor power rules are unchanged.
- Validation: rebuilt HTML, all 65 repository tests and the headless Edge improvised-repair scenario passed. Reactor explanation checked against actual output, core thresholds, shield capacity, mount allocation, cooling and stranded life-support code. Human playtesting remains outstanding.
- Saves: no schema or gameplay change. Deliver a new standalone HTML in chat; no GitHub upload or Windows executable build.

## 2026-11-07 — 0.28 experimental.65 improvised repair checks

Branch: `experiment/expedition-legacy`; local review candidate only.

- Removed the impossible fuel-tank improvised action and the explanatory bypass hint. Replaced ship-system bypass labels, countdown text and relevant flight warnings with improvised repair terminology. The action is now “Try to do an improvised repair.” Quarantine life-support rewiring is a separate mechanic and is unchanged.
- Replaced guaranteed temporary support with an engineering check by the strongest living engineer: success 25% + 7 points per effective skill, capped at 95%. Skill 0 has a 25% botch band and skill 1 a 15% band, causing 5–10 additional core damage; other failed rolls leave integrity unchanged. Skill 2+ failures cannot worsen damage. Each valid outcome costs one turn, no kit, and gives the normal combat/NPC response. Success earns 2 XP; failed/botched work earns 1 after the check.
- Success retains 15-career-turn temporary support without healing physical integrity (14 turns after installation). Kit/station repair limits and prices are unchanged. Added deterministic boundary/guard/performer tests and portable browser coverage for real outcomes, controls, persistence and menu fit.
- Validation: root build and all 65 repository tests passed. Five headless Edge suites passed: improvised repair, ship systems, hangar systems, disengagement and combat UI. Checked mouse/keyboard success, failure and botched work, exact combat action costs, saved temporary support, omitted fuel-tank action and hint, and screenshots at 1400×720 and 1000×620. Human balance/playtesting remains outstanding. The skill probabilities are an initial balance choice.
- Saves: schema unchanged; the existing internal temporary-support deadline field is retained. No migration. Deliver a unique standalone HTML in chat; no GitHub upload or Windows executable build.

## 2026-11-07 — 0.28 experimental.64 failed disengagement

Branch: `experiment/expedition-legacy`; local review candidate only.

- Player and NPC edge escape attempts now share a 25% failure chance. Failed attempts reposition the player and all remaining opponents to their original arena starts, clear exhaust and movement credit, and preserve damage, equipment, resources, deadlines and galaxy identities/positions. Dead and escaped ships stay out. This replaces guaranteed escape on an otherwise eligible attempt.
- Failed player attempts retain normal return fire and cost one career turn/local round. Failed NPC attempts stop the NPC phase without extra actions or clock ticks. No-safe-route NPCs cannot roll. Existing successful escape consequences remain.
- The Disengage button shows the failure chance. Bypass help now explains the damage threshold and temporary integrity support; bypass rules are unchanged. Updated current guides and portable QA registration.
- Validation: root build, all 62 repository tests and seven headless Edge suites passed (disengagement, ship combat, pursuit, tactical speed, combat UI, hangar systems and ship systems); deterministic headless checks cover both failure paths, success boundary, resource/deadline preservation, save/load, blocked exits, no revival and bypass guards. Human combat balance/playtesting remains outstanding; 25% is an initial balance choice.
- Saves: no schema change or migration; existing encounter spawn positions are deterministic. Deliver a new versioned standalone HTML in chat; no GitHub upload or Windows executable build.

## 2026-11-07 — 0.28 experimental.63 local review candidate

Branch: `experiment/expedition-legacy`; delivered locally, not published.

- Packages this chat's combat presentation changes: mounts below the arena, player status at the top-right and enemy details anchored to the bottom-right with flexible space between them. The intermediate mounts-under-player layout is superseded.
- Changed delivery to a unique, versioned standalone HTML file linked in chat, matching the previous chat's file delivery. Added ignored `outputs/` and recorded the workflow in the handoff guide. No GitHub upload or Windows executable build.
- Validation: rebuilt HTML, all 62 repository tests passed and the delivered file SHA-256 matches generated `index.html`. The UI/space scenarios and two-size screenshot inspection passed before this version-only packaging step. Opening the delivered file in the user's browser remains to be confirmed.
- Saves: schema and gameplay unchanged.

## 2026-11-07 — Place combat mounts below the arena

Branch: `experiment/expedition-legacy`; version unchanged (presentation only).

- Replaced the preceding vertical mount arrangement with horizontal selectable cards in the empty strip below the combat map. Mount readiness, damage/range/heat and selected-mount peak heat/reload remain visible.
- Kept player status at the top of the right panel and anchored enemy details to its bottom. Wrapped names, shields and weapon details expand upward into the flexible middle gap.
- Saves: no format or gameplay changes.
- Validation: rebuilt the HTML; all 62 repository tests and headless Edge combat UI/space scenarios passed. Checked bottom anchoring, the flexible gap, three selectable mount cards, ASCII and scaled rendering; inspected screenshots at 1400×720 and 1000×620. Human playtesting remains outstanding.

## 2026-11-07 — Group player mounts under the player ship

Branch: `experiment/expedition-legacy`; version unchanged (presentation only).

- Moved the weapon-mount list and selected-mount heat/reload detail directly below YOUR SHIP status. Selected enemy information follows the complete player section so it no longer separates the ship from its weapons.
- Saves: no format or gameplay changes.
- Validation: rebuilt the HTML; all 62 repository tests and the headless Edge combat UI suite passed, including section order and the damaged three-mount layout at 1400×720 and 1000×620. Inspected the crowded-layout screenshot. Human playtesting remains outstanding.

## 2026-11-07 — 0.28 experimental.62 applies engine pace to tactical movement

Released on `experiment/expedition-legacy`.

- Merchant Vessel / Free Trader and Survey Vessel / Research Ship default engines are now rating 2. Cargo remains 1 and Station Patrol 3. Centralized these defaults so fresh generation and neutral initialization agree; explicit individual fittings remain authoritative.
- Applied the galaxy pursuit engine ratio to tactical NPC movement through one shared budget kernel and separate arena fractions. Equal engines move one tile per player action; faster opponents can move several tiles and slower ones bank fractional movement. Normal player movement remains one tile and Boost two. The readout exposes player engine and target engine/mobility plus its movement ratio. Natural entities use authored mobility and retain their ram cadence and lack of exhaust.
- Each NPC substep checks collision, cover, plasma, core damage and escape, adds movement heat and lays exhaust. Actors stop on reaching clear firing range and do not receive a free attack. Drive/sensor damage can interrupt remaining steps. Firing or holding range clears movement credit, preventing stockpiled bursts. The player's engine reference is captured once per NPC phase; an early enemy critical changes the next phase's pace rather than giving later actors inconsistent allowances.
- Kept one global turn, reload/cooling/shield/status tick and at most one NPC attack per committed action. Fractional movement survives save/load and invalid saved banks are rejected transactionally. Fixed near-integer floating-point loss in the shared ratio, including the 3/5 cycle.
- Consequences: engine investment now affects interception, disengagement and range control alongside existing evasion and exhaust effects. Slow hulls are under more pressure from fast ships; Boost, weapon reach and cover become more valuable. More movement creates more exhaust and movement heat. These are intended tradeoffs, not a claim of completed balance.
- Validation: all 62 repository tests and 25 headless Edge suites passed. New deterministic/native coverage checks role defaults, 1:3/3:1/equal/3:5 movement, separate banks, exact fractions, save continuity/rejection, per-step cover/exhaust/heat/criticals, no extra shots or clock ticks, no reload stockpile and consistent player pace across a multi-enemy phase. A waiting-player test measured a rating-2 trader escaping seven tiles in 4, 7, 11 and 18 turns against player engines 1, 2, 3 and 5. Existing combat, repairs, pursuit, save, rescue and career checks passed; crowded readouts were inspected. Whole-career balance and human tactical playtesting remain necessary.
- Saves: schema 2 unchanged; no migration added. New arena actors record a movement fraction. Existing instantiated ships retain their fitted engine ratings; new/default traders and scientists receive rating 2. Damage, reload duration, weapon rate of fire, ordinary action costs and galaxy patrol/rescue step rates are unchanged. [Tactical movement and tradeoffs](docs/experiment.md#tactical-ship-combat), [shared movement boundary](docs/architecture.md#galaxy-ship-movement-and-tactical-exits)

## 2026-11-07 — 0.28 experimental.61 connects civilian escape and weapon readiness

Released on `experiment/expedition-legacy`.

- Unarmed tactical escape now moves the authoritative NPC ship one adjacent safe galaxy sector before marking it escaped. The player is not displaced. Exits prefer cardinal neighbours, fall back to a safe diagonal at obstructed corners, avoid the player, black holes, pulsars and occupied sectors, and refuse escape if every adjacent sector is blocked. Damage, identity and the existing disengagement grace remain on the ship.
- Shared the pirate fractional engine-ratio movement budget with unarmed civilian ships near the player and during flight. Equal engines trade one step for one; slow ships bank fractional movement and fast ships can open a gap. Distant roaming retains the two-step cap, and damaged engines affect movement. Removed science ships' alternating-turn movement gate. Attacked unarmed ships flee using current or last known threat position until clear of the ten-sector interaction radius, and cannot volunteer to rescue their attacker. Existing patrol and active rescue step rates are preserved; tactical movement allowances are unchanged.
- Added cyclic weapon fallback using complete target readiness: reload, heat, power, sensor lock, range and cover. An already-ready current mount stays selected; otherwise the next genuinely fireable mount is selected at engagement, target/selection changes, turn synchronization and fire attempts. One action still fires one mount, and existing reload deadlines remain unchanged.
- Failed reload attempts now name the weapon and explain that it is still reloading, how many turns remain, and that moving or waiting advances it. Multiple-mount refusals also explain that no alternate can fire at the target. Compact readouts retain Reload in 2t. Refusal and auto-selection consume no turn.
- Validation: all 60 repository tests and 24 headless Edge suites passed. New rule coverage checks fractional/equal/faster/disabled engine budgets, ordinary and fleeing science movement, and safe escape candidates. The new native pursuit scenario covers actual escape/catch-up, identity and save/load continuity, fractional-bank persistence, safe corner exits, sequential alternate-mount firing, unchanged reload deadlines, explicit no-cost refusal and rejected out-of-range/unpowered fallback. Existing combat scenarios were adjusted to test blocked fire only when no alternate can fire. Full rescue, trade, career and persistence checks passed. These checks do not establish whole-career balance.
- Saves: schema 2 unchanged; no migration added. NPC coordinates, movement bank and fleeing/last-threat data use the existing career snapshot. Weapon damage, heat costs, reload durations, shot sounds and tactical NPC speed are unchanged. [Civilian flight](docs/experiment.md#civilian-flight-and-pursuit), [combat controls](docs/experiment.md#tactical-ship-combat)

## 2026-11-07 — 0.28 experimental.60 adds distinct combat shot feedback

Released on `experiment/expedition-legacy`.

- Removed the nearby-plasma footer and SELECTED TARGET heading at the user's request. Target names retain their previous vertical spacing below the player section. Remaining reloads read Reload in 2t across combat status/context text; the redundant static duration footer now shows an actual countdown only while reloading.
- Replaced rectangle asteroids with four shaded original Prospector rock/debris sprites from the retained space atlas. Existing matte cleanup gives them clean transparent edges; native pixel scale and ASCII rock symbols remain. Position-based variants consume no random rolls.
- Removed the permanent dotted hit/aim line. Shots show a fast 110ms travelling projectile and short impact flash, with impact-only feedback for natural rams and reduced-motion preferences. Plasma remains separate original sprites.
- Added distinct synthesized outgoing-hit confirmation and incoming shield/hull/core cues. Actual core integrity changes select the heavier critical cue. An ephemeral queue separates projectile/impact feedback in attack order, including multiple attackers, and cancels on career/menu/encounter changes. Rules and logs resolve on the original turn; playback adds no time or damage and is not serialized. Rapid repeated input bounds pending presentation to twelve events.
- Validation: all 57 repository tests and 23 headless Edge suites passed. New coverage verifies real outgoing/hull/core outcomes and ordered cue timing, animation strokes, no idle dotted line/footer/target heading, preserved spacing, reload labels, reduced-motion behavior, menu cancellation and unchanged turn/damage state. Asset checks verify four distinct asteroid imports with clean edges and reproducibility. Existing combat, controls, repairs, log, save/load and world scenarios passed; screenshots were inspected. Cue scheduling and synthesis calls were tested; subjective sound balance and aesthetic approval require human playtesting.
- Saves: schema 2 unchanged, no migration added. Heat, reload deadlines, sensors, exhaust strength/lifetime, core damage rolls, action costs and NPC speed are unchanged. [Combat presentation and controls](docs/experiment.md#tactical-ship-combat), [feedback boundary](docs/architecture.md#tactical-audiovisual-feedback)

## 2026-11-07 — 0.28 experimental.59 simplifies combat readouts and menu access

Released on `experiment/expedition-legacy`.

- Removed the duplicate player hull row/bar from the combat panel; the left hull gauge remains its display. Selected targets now have proportional hull and fitted-shield bars with numeric values and shield state. Unfitted shields remain absent and crowded three-mount layouts still fit.
- Escape and the top-left ESC button now use the normal transactional save-and-return-to-main-menu action during combat. Continue restores the same encounter without advancing time, disengaging or triggering enemy actions. This replaces combat's Escape-only movement/disengagement hint; actual withdrawal remains R at the arena edge.
- Player weapon hits are green and player misses muted gray. Enemy hits are red and enemy misses yellow, including natural ram results. The same classes persist into saved LOG history; player hits on pirate bases also use green. Added a neutral gray log class without changing unrelated messages.
- Reversed experimental.58's connecting exhaust glow. Original plasma sprites, fading, hazard information, strength and expiry remain; new segments no longer store unused direction fields.
- Validation: all 56 repository tests and six affected headless Edge suites passed. Scenarios verify actual sidebar colors after real hit/miss actions, accurate half-full target bars, omitted player hull duplication, keyboard and HUD Escape/menu/Continue preserving encounter state and result classes, sprite-only exhaust, scaled/ASCII presentation, crowded readouts, combat rules, shared menu routing, log and autosave behavior. Screenshots were inspected; aesthetic preference still needs the user's playtest.
- Saves: schema 2 unchanged; no migration added. Damage, shields, heat, reloads, trail damage/lifetime, movement and NPC speed are unchanged. [Combat controls and presentation](docs/experiment.md#tactical-ship-combat)

## 2026-11-07 — 0.28 experimental.58 gives tactical combat an empty-space presentation

Released on `experiment/expedition-legacy`.

- Removed the combat grid, tiled weapon-range shading, rectangular fog fills and colored ship-cell backgrounds. The arena now uses continuous dark space with sparse fixed stars and selected-target corner brackets. Targeting readiness and the arena's disengagement boundary remain visible.
- Clarified the reported range discrepancy: the former lit area was selected-weapon reach with clear firing lanes, not sensors. The readout now states actual sensor range separately from mount range. Ships and live exhaust use one shared current-sensor predicate; charted asteroid positions remain known. Sensor formulas, weapon reach and target rules are unchanged.
- Replaced numeric exhaust cells with the original Prospector R197 plasma sprites, imported from its retained unmodified space atlas with original credits/notice. Exact magenta becomes alpha; other source pixels are preserved. Existing damage and expiry determine the fade sprite; movement direction supports connecting glow. Nearby damage/lifetime values remain available without hover in a directional summary, including the boost destination. ASCII uses warm exhaust symbols.
- Validation: all 56 repository tests and 22 headless Edge suites passed. The new source-asset test verifies atlas hash, pixel identity/transparency and reproducibility. The combat-space scenario covers absence of tiled fills, contact/exhaust culling after sensor damage despite chart history, original fade sprites, hazard information, no rendering RNG or state changes, and sprite/ASCII presentation at two window sizes. Existing combat, core, repair, save/load and gameplay scenarios passed; screenshots were inspected. Human aesthetic approval and combat balance remain playtest work.
- Saves: schema 2 unchanged. New trail segments record direction for presentation; no migration was added. Hull/core damage, exhaust strength/lifetime, heat, reloads, turn costs and NPC speed are unchanged. [Original art and reproduction](docs/art-direction.md#tactical-space-and-original-plasma-art)

## 2026-11-07 — 0.28 experimental.57 integrates Ship Systems into its parent menus

Released on `experiment/expedition-legacy`.

- Replaced the separate browser Ship Systems dialog with an in-canvas page. Hangar inspection uses its blue station heading, dark action rows, selection marker and Back control. I → SHIP inspection retains the actual inventory tabs and yellow selection; Back returns to the ship overview. F3 from flight/combat opens the same detail content without changing gameplay mode.
- Select a core to see integrity, effective performance, active bypass duration and applicable repairs. Repairs have visible costs or unavailability reasons. Heat, power, repair kits, mounts and utility equipment remain on the page. Unfitted shields remain absent, and ship-overview core cards remain passive. Removed the old native dialog markup and its separate CSS.
- Mouse and keyboard share the existing repair action. Up/Down selects a core; Left/Right or Tab selects a repair; Enter applies it; Escape goes back. Held activation cannot repeat a repair. The compass and gameplay keys cannot advance the world while inspecting. Focused context controls and other overlays retain their own input handling.
- Validation: all 55 repository tests and all 21 headless Edge suites passed. Affected scenarios cover both UI themes and multiple window sizes, parent navigation, held keys, mouse/context/F3 entry, field and station repairs, combat continuity and blocked world controls. The supplied Hangar save also passed through real file import without modification. Screenshots were inspected; human readability preference still needs the user's playtest.
- Saves: no schema change; menu selection is not persisted. Repair amounts, credit/kit/turn costs, combat rules and equipment fitting are unchanged. [Equipment and controls](docs/experiment.md#mounts-core-systems-and-damage)

## 2026-11-07 — 0.28 experimental.56 fixes Hangar keyboard activation

Released on `experiment/expedition-legacy`.

- Reproduced the reported Core Systems failure using the supplied save and a fresh career. Pressing Enter on the Hangar action opened the native modal, then the same key's browser default action clicked its newly focused Close button. Station activation now consumes Enter/Space before dispatch, so the board remains open. Repeated activation keys cannot repeatedly trigger its native buttons; separate intentional button presses, Tab and Escape still work.
- Recorded the user's standing policy in `AGENTS.md`, the architecture guide and autosave guide: backward save compatibility is not a requirement, and migrations/compatibility shims must not be added unless explicitly requested. Removed the conflicting instructions to preserve save shape and legacy-read compatibility. Current-format validation, transactional integrity and preserving an active career on failed load remain required.
- Validation: all 55 repository tests and five affected headless Edge suites passed. The new Hangar scenario uses real keyboard, held-key, canvas click, context-button and F3 paths, verifies deliberate modal activation and paid repair, and optionally imports a supplied save through the real file picker. The supplied save passed without modification. Personal saves and generated screenshots are excluded from commits.
- This fix changes keyboard handling, not the save format or game rules. [Save compatibility policy](docs/architecture.md#save-compatibility-policy)

## 2026-11-07 — 0.28 experimental.55 unifies combat information and controls

Released on `experiment/expedition-legacy`.

- Deleted the separate combat log panel and its font controls. Engagements, attacks, component damage, surrender warnings and results now use the normal sidebar and saved LOG history; combat history is categorized explicitly. Attack messages precede their damage/kill outcomes, and victory messages are recorded once. The normal sidebar size controls and +/− keys also work during combat.
- Reorganized the combat readout around hull, fitted shields, heat, selected target and weapon readiness. Unfitted generators have no shield/recharge display, including in the detailed inspector. Installed shields distinguish full, delayed, recharging, damaged, failed, unpowered and heat-limited conditions. Healthy reactor/sensor data is quieter; failures remain visible. Unarmed ships and natural ram attackers have appropriate descriptions.
- Replaced abbreviated heat/range labels with readable damage/range/heat information and selected-shot peak heat/reload duration. Fire, Boost and pre-edge Disengage controls show unavailability before the player tries them; Fire/Boost reuse actual action guards. Clear firing lanes are shaded, and the target line agrees with full shot readiness rather than range/cover alone.
- Removed duplicate context controls when an explicit menu button already carries the same shortcut, including cargo examination and Close. Core readouts remain passive and inspection stays on its static button. The generic F3 context button is now combat-only, including removal planetside and in orbit. Keyboard shortcuts remain available.
- Removed the top TACTICAL COMBAT title, top hint strip and repeated bottom control hints. The arena and readout move up into that space; the HUD identifies the view and the collapsed Shortcuts panel provides combat-specific reference using the configured wait key.
- Validation: all 55 repository tests and 20 headless Edge suites passed, with affected scenarios rerun after the final header removal. The new combat UI scenario covers shield states/absence, matching action/aim readiness, shared history and save/load, old local-log recovery, single victory recording, natural/unarmed targets, static-menu deduplication, shortcut reference and crowded three-mount layouts at two window sizes. These validate rules and presentation, not human readability approval or combat balance.
- Saves: career schema 2 stays compatible with experimental.52–54. Matching old combat log entries retain their original turns when made visible in the sidebar. Movement allowance, NPC speed, engine effects, reloads and combat costs are unchanged; speed design remains a separate task.

## 2026-11-07 — 0.28 experimental.54 removes redundant ship controls

Released on `experiment/expedition-legacy`.

- Unfitted shields leave a blank core slot in the ship overview. Fitted generators continue to show their actual integrity and charge.
- Core overview cards are passive readouts with no click action, hover tooltip or pointer cursor. The static **Inspect / repair [F3]** button opens the existing board; the global F3 shortcut still works.
- Removed the duplicate F3 context button from galaxy and inventory views, and removed Jettison/Confirm jettison from the context bar. The ship menu retains its static jettison/confirmation control and the J shortcut. Other context views retain their systems access.
- Validation: all 55 repository tests and affected browser scenarios passed, including blank/fitted shield rendering, passive card clicks/cursor, static inspection and F3, context cleanup, stranded inventory repair, layout and existing menu/combat behavior. Equipment rules and career schema 2 are unchanged; experimental.52–53 saves remain supported.

## 2026-11-07 — 0.28 experimental.53 exposes ship systems throughout play

Released on `experiment/expedition-legacy`.

- Fixed incomplete equipment UI integration from experimental.52: the F3 shortcut already worked outside combat, but the context button appeared only during combat/stranding. Ordinary play now shows the same muted **Ship systems [F3]** control, including the ship inventory tab.
- Added all six core integrity/effective readouts directly to **I → SHIP**, alongside weapon mounts and utility slots. Click a core or **Inspect / repair [F3]** to open the existing board; F3 and keyboard activation of the context button invoke the same action. Inspection stays free, and closing the board preserves the inventory tab.
- Fixed the stranded overlay covering inventory and clearing its pointer hit areas. An engineer can now use the actual ship-inventory core controls to bypass a disabled drive while stranded. Shortened the ellipsis limit on long context labels to keep the extra action within the existing wrapped layout; full action text remains available in the button title.
- Validation: all **55 repository tests** and the affected headless Edge scenarios passed, including native galaxy/orbit access, I → SHIP mouse and keyboard paths, all six core cards at two window sizes, free inspection, actual repair while stranded, and existing context wrapping/menu input. This is a UI/access correction; equipment rules and career schema 2 are unchanged, so experimental.52 saves remain supported.

## 2026-11-07 — 0.28 experimental.52 gives tactical ships persistent equipment

Released on `experiment/expedition-legacy`.

- Expanded the existing weapon slots into hull-specific light/medium/heavy mounts and a reactor fitting budget. Core services and shields reserve power; damaged reactors leave later mounts offline without deleting equipment. Existing utility module slots remain separate. Added purchasable reactor and cooling grades and explicit fitting failures before credits are charged.
- Gave engines, reactor, shield generator, cooling, sensors and fuel tank independent persistent integrity. Installed ratings stay separate from effective performance. Hull hits can cause component criticals; a living engineer reduces their probability and severity. Shields absorb damage before a critical can occur.
- A rating-one sensor can fail at 75% integrity. Failed sensors preserve known charts while blocking new galaxy reveals, live markers, paid scans, unfamiliar orbital layouts and tactical target locks. NPC sensor failure also stops tracking and firing. At 50% tank integrity, usable capacity becomes half of the installed tank and excess fuel leaks out. Repairs restore capacity without producing fuel.
- Replaced encounter-local shields/reloads and raw multi-gun NPC volleys with shared ship rules: independent absolute reload deadlines, common weapon heat, passive cooling, 20 shield points per grade, a three-turn recharge delay and 3 recharge per turn. Waiting doubles cooling. Boost moves two clear tiles along the ship's heading for 2 fuel and heat. Base attacks also use ready, powered mounts and shield absorption. Heat, shields, reloads and damage survive retreat, re-engagement and saving; each successful action advances one career turn.
- Added the **F3 / Core systems** board, available through ship inventory and the hangar, with direct combat/stranding controls. Engineers spend a kit and one turn to restore up to 85%, or one turn for a 15-turn bypass. Station technicians restore full integrity for credits. Emergency rescue can recover failed propulsion. A disabled engine alone leaves life support stable when fuel and reactor power remain; empty fuel or insufficient reactor power retains the stranded exposure hazard.
- Added real core-damage/rupture/restore debug buttons. The disposable palette uses an explicit 1,000-unit tank and resets test core/readiness state on gallery return. Updated the maintained pilot to read the visible component status, use native repair actions and estimate actual mounted enemy weapons.
- Validation: all **55 repository tests** and **19 headless Edge suites** passed, with affected combat/system scenarios rerun after final display and recovery adjustments. Coverage includes repair/bypass boundaries and expiry, engineer mitigation, blind chart/scan/target behavior, boost costs, fitting, heat/reloads/shields, authoritative NPC state across storage reload, retreat, SOS recovery, debug controls and storage failure recovery. Three bounded native-action careers reached retirement without JavaScript errors: Scout 313 turns / 357 selections / 568 credits; Freighter 402 / 458 / 758; Corvette 416 / 466 / 1,096. These are automated scenarios and short careers, not human combat-balance approval.
- Saves: career schema **2**, requiring a new career; earlier formats are rejected before replacing an active run. No save migration is supplied, as requested. The IndexedDB envelope/storage schema stays unchanged. Artemis ammunition, richer enemy equipment generation, aimed component shots, additional utility combat modules and long-career combat balance remain future work. [Current equipment rules](docs/experiment.md#mounts-core-systems-and-damage)

## 2026-11-07 — 0.28 experimental.51 adds hull type to the HUD

Released on `experiment/expedition-legacy`.

- Added a Hull Type readout immediately to the right of the vessel name. It uses the current ship class and refreshes with the HUD.
- All 47 repository tests and three headless Edge suites passed. The header check covered all three hulls and a long vessel name, alongside the existing menu, scaling and footer checks. The save schema supports experimental.46–50 careers.

## 2026-11-07 — 0.28 experimental.50 adds the Active Missions dropdown

Released on `experiment/expedition-legacy`.

- Added a collapsed Active Missions button below Shortcuts. Its footer panel shows accepted science contracts, discovered Mercy of Dawn rescue work and the mysterious package delivery. General survey records and completed work are excluded.
- Objectives show destination coordinates, specimen totals and remaining counts, recovered data, missing delivery cargo and known passenger progress. Research searches use the reported fix, preserving the hidden ship location. Hidden rescue details stay concealed.
- Progress refreshes during ordinary play. The scrollable panel supports keyboard focus, navigation and Escape. It shares its space with Shortcuts, and the compass, minimap and version remain clear.
- All 47 repository tests and five headless Edge suites passed. The new scenario covers six contract types, updates and completion, knowledge boundaries, keyboard scrolling, actual save/load and footer placement in both UI styles at two window sizes. The save schema supports experimental.46–49 careers.

## 2026-11-07 — 0.28 experimental.49 rearranges the footer and sidebar

Released on `experiment/expedition-legacy`.

- Moved the save indicator above the version in the bottom-left corner. The save text is 10px and the version is 13px. The compass and minimap occupy the bottom-right of the play area.
- Extended the crew and Comms Log sidebar from the HUD to the bottom edge. Context actions, alerts and footer controls fit beside it. Long action labels use an ellipsis, with their complete text retained in the button and available on hover.
- All 47 repository tests and four headless Edge suites passed. Both UI styles were checked at two window sizes, with save failure labels and alerts. The interface checks also covered wrapped actions, a stable orbital map, compass placement, menu navigation and minimap fit. The save schema supports experimental.46–48 careers.

## 2026-11-07 — 0.28 experimental.48 gives encouragement a temporary effect

Released on `experiment/expedition-legacy`.

- Successful encouragement adds +3 to current morale for 30 career turns. The crew's base outlook is preserved. Failed encouragement has no morale effect, and either result starts the existing 40-turn cooldown.
- Dialogue choices show the boost duration and cooldown. The crew morale breakdown shows encouragement as a separate contribution with its remaining turns. Saving and loading preserve the expiry time.
- Eligible later attempts now work within the same conversation, while revisiting a result during cooldown cannot award another boost.
- All 47 repository tests and four headless Edge suites passed. The morale check exercised actual dialogue rolls, cooldown enforcement, save/load, exact expiry, repeat attempts and zero base morale. Earlier permanent gains are already part of saved base outlook. The new rule applies to subsequent attempts and supports experimental.46–47 careers.

## 2026-11-07 — 0.28 experimental.47 toggles the debug menu

Released on `experiment/expedition-legacy`.

- Pressing Shift+B while the debug menu is open now closes it through the normal dismiss action, including from a focused search field. Holding the shortcut does not close the menu immediately after opening.
- All 47 repository tests and three headless Edge suites passed. The regression checks opening, closing, reopening, key repeat, search focus and career preservation. The save schema supports experimental.46 careers.

## 2026-11-07 — 0.28 experimental.46 stabilizes saves, turns and generation

Development on `experiment/expedition-legacy`.

### Career playtests

- All 47 repository tests and all 16 headless Edge suites passed on the final build.
- Three seeded, unassisted short careers reached retirement with no JavaScript errors. The scout retired at turn 313 with 568 credits, the freighter at turn 361 with 476, and the corvette at turn 419 with 896. The same freighter seed had previously ended in destruction.
- A longer scout run targeting 10,000 credits ended in a Dreadnought encounter at turn 3,153 with 1,856 credits. The short retirements establish that all three paths can reach an ending. Profitability, threat pacing and human combat balance remain open.

### Tactical withdrawal

- A successful retreat stops surviving opponents from pursuing or automatically restarting combat for the next five career turns. They keep their hostility and damage, and the player can choose to attack again. This addresses a freighter playtest where a Raider Frigate re-engaged after 13 withdrawals.
- All 47 repository tests and the Edge combat suite passed, including a reload during the pursuit break.

### World generation and morale

- Aquatic civilizations now have a connected basin next to the default landing site. Settlements and locals spawn inside it, and seabed obstacles stay outside that footprint. Surface and underwater views share the civilization's diplomacy state after a reload. Hostile primitive locals now initialize with their own description.
- A base morale of zero remains zero until a real modifier applies. The crew screen uses the same value as the morale rules.
- All 47 repository tests passed. The seeded Edge regression verified reachable inhabitants across 100 native aquatic worlds and all five technology tiers. It also checked diplomacy after reload and morale moving from 0 to 3 and back to 0. Freshly generated planets use the new terrain rules.

### Action timing

- Committed tactical movement, firing, waiting and withdrawal each advance the career clock and crew conditions. Movement and weapon reloads still use tactical rounds, and the arena keeps its own positions.
- Surface fire, gear use, drilling, diving, and waiting use the same daylight, oxygen, crew and hazard rules. A paid orbital scan or casino buy-in ticks crew conditions once. Menu selections and blocked actions are free.
- All 47 repository tests and five headless Edge suites passed. The timing check measured oxygen, daylight, crew status, and scan costs. Tactical, rescue, career, and autosave scenarios also passed. Saves from the first experimental.46 checkpoint use the same schema.

### Career saves

- Career saves use a versioned schema and store IDs for combat opponents, radio merchants, rescuers, crew dialogue actors and active casino contestants. Buying fuel after a reload now updates the merchant's real stock. Crew conversations stay with the selected person when names collide, and combat references survive roster reordering.
- Autosaves and imports share schema and reference validation. Malformed imports leave the active run in place. Start a new career for this version.
- All 47 repository tests and four headless Edge suites passed. They covered the new identity cases, large-world reload, interrupted writes, debug isolation, and Mercy of Dawn persistence.

## 2026-11-07 — 0.28 experimental.45 adds tactical ship combat

Released on `experiment/expedition-legacy`.

- Replaced the ship-to-ship volley screen with a turn-based arena. Fly with the compass or movement keys, select an enemy and a weapon, and manage range and reloads. Optional asteroids block movement and fire. Engine exhaust harms any ship that crosses it. Stronger engines leave more damaging, longer-lived trails.
- Nearby pirates or hostile patrols can join the same fight, up to four opponents. Disengage at an edge. Enemies with a ready weapon and clear shot can fire once as you leave. Surrender uses **H**, leaving **S** available for movement. Added the **PIRATE WING** Debug Palette sample.
- Encounters resume from saves with their positions, cooldowns, and hazards. Older combat saves start the tactical map with their existing opponent, hull, and shields. The first balance pass needs human playtesting.
- All 47 repository tests and seven headless Edge suites passed. Checked a wing encounter with cover and an unarmed freighter disengagement in installed Firefox.

## 2026-11-07 — 0.28 experimental.44 removes scan seams and repeating terrain grain

Released on `experiment/expedition-legacy`.

- Applied the same device-pixel tile alignment to walking and landing scans in every biome. Fog, smoke, and terrain share those edges in both Sprites and ASCII.
- Varied the sampling of the existing sand and snow textures by world position so their repeating grain no longer forms bands at fractional window scales.
- Reproduced the frozen scan seams and sand bands in experimental.43. Verified the fixes in installed Firefox at multiple window sizes and display densities, and with all 47 repository tests and five headless Edge suites. Existing saves require no migration.

## 2026-11-07 — 0.28 experimental.43 fixes Firefox minimap layout and surface seams

Released on `experiment/expedition-legacy`.

- Set explicit HUD minimap dimensions so Firefox keeps the canvas inside its panel beside the compass and map button at fitted window scales.
- Aligned surface terrain, fog, and lighting to shared device-pixel edges to remove the thin grid at fractional scales in Sprites and ASCII.
- Reproduced both issues on experimental.42. Checked minimap layout and shaded surfaces in installed Firefox at multiple viewport sizes and display densities. All 47 repository tests and five headless Edge suites passed. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.42 spawns debug star systems beside the ship

Released on `experiment/expedition-legacy`.

- **Spawn System** now uses the same empty neighboring sectors as **Spawn Galaxy Object**. Both controls report when all neighboring sectors are blocked.
- All 47 repository tests and three headless Edge suites passed. The debug menu check covered both spawners, an occupied neighbor, a free diagonal at the map edge, and the generated planet map. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.41 fixes the save label and spawns objects beside the ship

Released on `experiment/expedition-legacy`.

- Sized the top-right save and version rows to fit their text, fixing the clipped save label. The block stays right-aligned in both HUD styles.
- **Spawn Galaxy Object** uses an empty neighboring sector, including diagonals and map edges. It skips existing contacts and reports when every neighboring sector is blocked. **Spawn System** still places systems near Starbase Alpha.
- All 47 repository tests and five headless Edge suites passed. Reproduced the clipping on experimental.40 and checked both HUD styles at two window sizes. Verified adjacent spawning at a map edge, occupied sectors, and palette rebuilds. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.40 stabilizes orbit and groups debug catalogs

Released on `experiment/expedition-legacy`.

- Moved the version and save status to the top-right HUD. Orbit reserves room for wrapped context actions and alerts, so the system map keeps the same scale. The compass and map controls stay anchored below.
- Restored gear and cargo category headings and added a category filter to both the spawner and sample directory. Categories follow the runtime catalogs. New commodities appear even before a specific category is assigned. The sandbox controls use **Debug Palette** again.
- All 47 repository tests and six headless Edge suites passed. Reproduced the orbital resize on experimental.39 and verified fixed bounds at 1400×720 and 800×600. Verified category filtering and future catalog additions in both menus. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.39 makes the debug tools clickable

Released on `experiment/expedition-legacy`.

- Replaced the debug hotkeys with clickable toggles, spawn controls, civilization tools, reports, and searchable gear and sample lists. Shift+B still opens the tools during a career. A Playground button opens them inside the sandbox.
- Added click confirmations for surface regeneration, civilization replacement, and playground rebuilds. The sandbox keeps its own state and **Return to Career** restores the retained run.
- All 47 repository tests and seven headless Edge suites passed, including the debug click-through at 800×600, footer layout, autosave, and exact career restoration. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.38 separates the controls and status strip

Released on `experiment/expedition-legacy`.

- Gave the save and version strip its own footer row and added space below the compass, minimap, and map button. The controls stay anchored when context actions wrap or a critical alert appears.
- All 47 repository tests and four headless Edge suites passed. The new spacing check failed on experimental.37 and passed at 1400×720, 800×600, and 640×480 on experimental.38. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.37 anchors the compass

Released on `experiment/expedition-legacy`.

- Anchored the compass, minimap, and map button above the save and version strip. The footer absorbs the remaining height as context actions wrap and alerts appear.
- All 47 repository tests and four headless Edge suites passed. The anchor check reproduced the movement on experimental.36 and verified the controls stay in place at 1400×720 and 800×600. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.36 wraps context actions and removes repeated hints

Released on `experiment/expedition-legacy`.

- Context actions wrap onto a second row. Longer lists scroll vertically. When a critical banner and the second row share the screen, the playfield fits the available height and the footer controls stay visible.
- Removed repeated keyboard hints from dialogue, radio trade, stations, inventory, landing scans, and in-game Options. Screen-specific instructions and clickable Back and Close controls remain available.
- All 47 repository tests and six headless Edge suites passed. Verified both context rows, alert and footer fit, and second-row input at 1400×720 and 800×600. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.35 quiets routine actions and removes galaxy seams

Released on `experiment/expedition-legacy`.

- The general Examine, Inventory, and Options buttons use the same muted gray as the shortcut legend in both UI styles. Context-specific actions retain their accents and existing input routes.
- Fixed the faint grid in the galaxy view caused by drawing neighboring tile backgrounds on fractional device pixels. Empty space and fog now use an opaque base and pixel-aligned edges.
- All 47 repository tests and five headless Edge suites passed. Reproduced the seams on experimental.34 and verified uniform pixels across tile boundaries in Sprites and ASCII at a fractional scale. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.34 sharpens in-game text

Released on `experiment/expedition-legacy`.

- The shared game canvas and full galaxy map now draw at the displayed pixel density, including text in station menus, inventory, dialogue, combat, scan views, and map markers. Sprite images retain nearest-neighbor sampling. The HUD, sidebar, and HTML overlays use layout scaling where supported.
- Kept the save and version strip at the bottom under fractional scaling, removed seams from the chart's fog, and removed the overlapping hints at the foot of in-game Options.
- All 47 repository tests and all 13 headless Edge suites passed across runs. The first full run timed out in the ship-art suite, which passed on rerun. Checked fractional viewports, pointer targets, and an open chart during an emulated display-density change. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.33 adds a Classic UI setting

Released on `experiment/expedition-legacy`.

- Added **UI Style** to both Options screens. **Classic** brings back the experimental.27 look, and **Cockpit** remains the default. The selected style is saved with browser options. Both styles use the current bottom footer and controls.
- Put the Render Mode hint inside its row with more contrast. Title menus draw at the displayed pixel density, and in-game Options uses smoother sampling. The playfield retains its pixel-art presentation.
- All 47 repository tests and five headless Edge suites passed. Checked style switching by mouse and keyboard, persistence after reload, fractional-scale menu hit targets, the footer, and save/load. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.32 anchors the status strip at the bottom

Released on `experiment/expedition-legacy`.

- Pinned the save and version strip to the bottom of the play area. The shortcut area and status strip share the game background, removing the color seam left by the unused alert space.
- All 47 repository tests and four headless Edge suites passed. Checked the bottom edge with the alert visible and hidden at 1400×720 and 800×600. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.31 restores cockpit instruments on dark panels

Released on `experiment/expedition-legacy`.

- Restored the segmented gauges, vessel plate, status readouts, crew and comms console, and raised compass and map controls from experimental.29. The broad surfaces around them use the original dark palette.
- All 47 repository tests and four headless Edge suites passed. Checked the cockpit at 1400×720 and 800×600 and reran the day-night wait regression. The feedback keyboard test now waits for the dialog's initial focus. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.30 restores dark panels and updates sight while waiting

Released on `experiment/expedition-legacy`.

- Waiting on the surface now refreshes the sight mask after advancing the planet clock. Visibility contracts as daylight fades and expands as it returns, even on the ship tile. Previously explored terrain remains charted.
- Restored the original dark HUD, gauges, and controls from before the cockpit trial. Kept the display mode names and the Crew Status and Comms Log panels, with darker sidebar framing. See [Flight interface](docs/art-direction.md#flight-interface).
- All 47 repository tests and six headless Edge suites passed. The wait regression reproduced on experimental.29 and passed at dusk and dawn using both the compass and keyboard. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.29 finishes the cockpit styling

Released on `experiment/expedition-legacy`.

- Extended the steel bezel and instrument finish to the status rail, crew and comms console, and map housing. The top rail now shows the vessel name and the current display, including navigation, orbital view, orbital scan, and surface.
- Styled the compass, context actions, and other cockpit buttons as raised keys with hover, focus, and pressed states. Normal gauges use cool colors, with warm colors for warnings. Reduced-motion mode keeps critical gauge labels steady.
- All 47 repository tests and six headless Edge suites passed. Checked the native and 800×600 layouts, 12 crew badges, pointer and keyboard controls, display labels, alerts, maps, and save/load. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.28 tries a cockpit bezel and instruments

Released on `experiment/expedition-legacy`.

- Set the main display in a dark steel bezel using the existing canvas margin. Restyled the fuel, hull, and oxygen gauges as recessed instruments with segmented fills, quarter marks, and numeric readouts. Gauge values, warning thresholds, and map input are unchanged.
- All 47 repository tests and four headless Edge suites passed across runs. Checked the full canvas and instrument fit at 1400×720 and 800×600, plus critical fuel and oxygen states. The feedback keyboard check failed once and passed on rerun. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.27 trims the map controls

Released on `experiment/expedition-legacy`.

- Removed the duplicate Escape button below the full map. The top-left Escape control, Escape and M keys, and click outside the map still close it. The sidebar minimap panel is 128 pixels wide instead of 220 and fits the whole galaxy at the same scale.
- All 47 repository tests and four headless Edge suites passed. Checked the compact map at native and scaled window sizes, whole-galaxy coverage, and keyboard and pointer dismissal. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.26 clarifies the sidebar minimap

Released on `experiment/expedition-legacy`.

- Increased the contrast between explored space and fog. Stations, wrecks, and hazards use brighter markers, and a green cross marks the player. The sidebar keeps the whole galaxy in view. See [Full galaxy map](docs/art-direction.md#full-galaxy-map).
- All 47 repository tests and three headless Edge suites passed. The map fixture checked landmarks at opposite ends of the galaxy, hidden wrecks, fog contrast, and the player marker. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.25 draws artwork on the full galaxy map

Released on `experiment/expedition-legacy`.

- The full galaxy map now uses compact versions of the galaxy artwork for charted landmarks and visible ships, with an illustrated key and a green ring around the player. It uses artwork in ASCII mode. Fog and sensor limits still apply, with a yellow question mark for unknown radio contacts. The small HUD minimap keeps its color-coded tiles. See [Full galaxy map](docs/art-direction.md#full-galaxy-map).
- All 47 repository tests and five headless Edge suites passed. A controlled map fixture checked ten landmark types, hidden wrecks, ship contacts, and identical HUD minimap pixels. The overlay fit at 1400×720 and 800×600. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.24 adds map targeting by mouse

Released on `experiment/expedition-legacy`.

- Moved **Shortcuts** up to the footer divider. Map clicks now select tiles in galaxy and planet Examine views and in landing scans. Landing still requires confirmation. In ground firing mode, a click aims and a second click on the same tile fires through the existing ranged action.
- All 47 repository tests and five headless Edge suites passed. Tested scaled map coordinates, idle map clicks, landing at the selected site, and the two-click firing sequence. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.23 collapses the shortcut legend

Released on `experiment/expedition-legacy`.

- Hid the gray shortcut legend by default. The **Shortcuts** button opens or closes the reference by mouse or keyboard. The top-left **ESC** button appears during play. The title and setup screens use their own navigation.
- All 47 repository tests and three headless Edge suites passed. Checked the toggle, the scaled footer, and Escape visibility at startup, during setup and play, and after returning to the main menu. Existing saves require no migration.

## 2026-11-06 — 0.28 experimental.22 makes context actions clickable

Released on `experiment/expedition-legacy`.

- Made context actions and the top-left ESC button use the existing shortcut routing. Added mouse entry points for Inventory and Options in the context bar, item-use actions, and clickable selection arrows. The gray shortcut legend remains a reference.
- Gave the compass Wait tile a pointer cursor and hover highlight. Compass directions now also control the examine, aim, and landing cursors. World tiles remain passive.
- Added on-screen keys for vessel registration, feedback text, and common movement bindings. Added Shift+Z for diving or surfacing, Shift+O for shipboard oxygen refill, and Shift+X to release a tow. Escape cancels void and rescue prompts through either input method.
- All 47 repository tests and 13 headless Edge suites passed. The input scenarios covered on-screen naming, station and patrol actions, map and feedback dismissal, item use, scan and landing controls, and firing. Existing saves require no migration.

## 2026-11-05 — 0.28 experimental.21 restores the gray shortcut legend

Released on `experiment/expedition-legacy`.

- Returned the bottom shortcut legend to muted static text and removed the Inventory and Options buttons added there in experimental.19. Open these menus with **I** and **O**. Menu choices support mouse and keyboard.
- The build, all 47 repository tests, and the menu-input, interface, and version browser suites passed. Verified that the legend retains its color on hover and clicks leave gameplay state alone. The barter resize check now waits for the scale update and measures both bounds together. Existing saves require no migration.

## 2026-11-05 — 0.28 experimental.20 polishes ship registration

Released on `experiment/expedition-legacy`.

- Spaced the captain and ship name fields, gave the instructions a separate line above the buttons, and increased their contrast. Ship selection now highlights the card under the pointer using the same selection as the arrow keys.
- The build, all 47 repository tests, and four headless Edge suites passed. Verified the ship highlight and mixed mouse and keyboard input, and inspected the registration screen at a scaled viewport. Existing saves require no migration.

## 2026-11-05 — 0.28 experimental.19 adds mouse and keyboard menu controls

Released on `experiment/expedition-legacy`.

- Added click targets to main menu setup, options and keybindings, station services, dialogue, inventory and crew selection, cargo inspection, radio trade, barter, casino menus, and the debug palette directory. Mouse and keyboard use the same actions. Long crew lists scroll to the selected person.
- Added mouse buttons for Inventory and Options, keyboard activation for HUD and save-notice buttons, and keyboard log text sizing. Cargo hover is a preview, with details accessible by click or **X**.
- The HUD compass remains the pointer movement and wait control with normal step effects. Menus block compass movement while open. Direct tile interaction, pickup commands, and combat firing use gameplay keys.
- The build, all 47 repository tests, and all 13 headless Edge suites passed. The input scenarios cover scaled canvas clicks, station refueling, patrol replies, mouse and keyboard barter, crew and cargo, and the compass exception. Existing saves require no migration.

## 2026-11-05 — 0.28 experimental.18 compacts the crew sidebar

Released on `experiment/expedition-legacy`.

- Replaced the vertical crew summary with one role badge and health meter per living crew member. All 12 supported crew fit on one line, with individual health colors for repeated roles. A pulsing exclamation mark shows an active known condition. Reduced motion keeps the marker steady. Hover shows the person's name, exact HP, and known conditions. The detailed Crew view still carries the full roster.
- The build, all 47 repository tests, and five headless Edge suites passed. The interface check covered a full 12-person row at 800×600 and 1400×720, low and critical HP, condition visibility and recovery, reduced motion, crew loss, and the detailed Crew view. Existing saves require no migration.

## 2026-11-05 — 0.28 experimental.17 fixes map reopening during dialogue

Released on `experiment/expedition-legacy`.

- Clicking the galaxy map button could leave it focused after the map closed. Enter or Space then chose a dialogue reply and also clicked the focused button. The full map now takes focus when it opens and releases it on close. Dialogue consumes Enter and Space even when a HUD button has focus.
- Reproduced the issue in experimental.16 with the station patrol's threat reply. Verified mouse and keyboard map controls, Enter/Space and numbered replies, and the focused button case in headless Edge. All 47 repository tests and the four affected browser suites passed. Existing saves require no migration.

## 2026-11-05 — 0.28 experimental.16 improves interface priorities

Released on `experiment/expedition-legacy`.

- Centered civilization barter inside the scaled game area. Trade lists scroll independently, long names wrap, and the current keyboard selection stays visible as the offer changes.
- Made Enter hints describe the selected action in orbit, at stations, in dialogue and barter, and aboard Mercy of Dawn. Removed the persistent wreck-air readout from Mercy's context bar. Examine the engineering pump to read the remaining reserve.
- Made Records the default LOG view, with active contracts, known open rescue leads, and pending deliveries above survey records, contacts, and history.
- Reserved the full-width banner for immediate actions such as a rescue decision, critically low fuel or oxygen, an armed explosive, or an adjacent singularity. Routine updates, radio traffic, and NPC speech go to the sidebar log.
- The build, all 47 repository tests, and all 12 headless Edge suites passed across test runs. The interface checks exercised keyboard barter with long lists at 800×600, 1400×720, and 2560×1440, Mercy actions and pump examination, and routine versus critical messages. The rescue fixture now waits for file import to finish before sending keys. Existing saves open without migration.

## 2026-11-05 — Reorganize the project documentation

Documentation update on `experiment/expedition-legacy` for experimental.15.

- Shortened the README to downloads and navigation. The [documentation index](docs/README.md) groups player, development, testing, and planning guides. The handoff links to the maintained build and testing instructions. The expedition guide covers current log, survey, research, and rescue mechanics.
- Moved seven dated reports and older handoff or release records to the [archive](docs/archive/README.md). Updated references and pinned the foundation review’s source links to the commit it reviewed. Corrected the roadmap and debug guide to describe fixed Mercy placement, and directed readers to the checked-in browser suites.
- Verified local links, heading anchors, and historical source references. The generated build check and `git diff --check` passed. The HTML, source, package metadata, and save behavior match experimental.15.

## 2026-11-05 — 0.28 experimental.15 removes the in-game changelog

Released on `experiment/expedition-legacy`.

- Removed the main menu Change Log button, its V shortcut, the embedded release notes screen and its scroll handlers. Release history lives in the repository documentation. The v0.25 and v0.2 summaries from the menu are now in the [historical changelog](docs/archive/Changelog%20Prospector%20II.txt).
- Rebuilt the standalone HTML with the experimental.15 version and synchronized desktop metadata. All 47 repository tests, the generated build check, and the Edge menu/version and autosave suites passed. Browser checks covered keyboard and mouse navigation with and without a save, the retired shortcut, and saved-game Continue. Inspected the main menu screenshot and checked the runtime sources and generated HTML for remaining changelog references. Packaged desktop builds were outside the scope of this check.
- Existing saves open without migration. This change only removes the release notes screen and its controls.

## 2026-11-02 — 0.28 experimental.14: transparent stations and derelict wreck art

Branch: `experiment/expedition-legacy`; main/public build unchanged.

- Verified the original starbase sprite already has genuine transparency (308 of 576 pixels). Removed the solid-color loading fallback and render it over normal space so the cleared canvas cannot show a differently colored square. Removed tile-sized matte fills from casino/pirate artwork and the destroyed pirate-base marker; station object art now composites over the ordinary galaxy background.
- Replaced graphical derelicts' boxed dagger placeholder with original code-authored 24px wreck artwork: broken orbital ring, severed spokes/docking arm, breached core, rusty plates and debris. It is cached once on an alpha canvas and shared by native derelict stations, their palette biome sample and Mercy. Updated the maintained preview generator to use the actual renderer. Existing ASCII symbols, placement, names, docking/boarding, interiors, salvage and rescue rules remain unchanged. No new object or catalog type was introduced. [Art guidance](docs/art-direction.md).
- Bumped the canonical package version to `0.28.0-experimental.14`; rebuilt HTML and automatically synchronized desktop metadata. Validation: all 47 repository tests and generated-source/version checks passed, plus four Edge browser suites (`stations`, `previews`, `palette`, `version`) without JavaScript errors. The new station suite verifies true alpha/corner transparency and 3,243 preserved background pixel positions across space/blue/pink nebulae, actual derelict/Mercy render and boarding paths, ASCII and exact career restoration. Preview checks retained all 80 orbital comparisons, 67 galaxy sample renders and native biome entry paths. Inspected native-size and enlarged station/wreck artwork. `git diff --check` passed. No packaged desktop executable or manual whole-career playtest is claimed.
- Saves: no schema, keys or migration changes; existing worlds use the art immediately. Remaining: human feedback on tiny wreck recognition and broader planetary artwork.

## 2026-11-02 — 0.28 experimental.13: subtle radio contacts

Branch: `experiment/expedition-legacy`; main/public build unchanged.

- Replaced the filled blue radio-contact panels and outlined boxes with a small muted-yellow `?` on a transparent background. Pirates and civilians share the same centered glyph, preserving unknown identity. A shared renderer restores canvas drawing state. Identified ships, detection/radio ranges, fog rules and gameplay are unchanged. Updated [art guidance](docs/art-direction.md).
- Bumped only the canonical root package version; the build automatically synchronized game labels and desktop packaging metadata to `0.28.0-experimental.13` and rebuilt the single-file HTML. Packaged executables were not rebuilt.
- Validation: `npm run build`, all 47 repository tests and generated-source/version checks passed. Edge headless `ships` and `version` suites passed without JavaScript errors: 384 ship compositing cases, unchanged sensor concealment/identified artwork, and the version labels. Extended the existing art scenarios to verify the question mark's yellow color and unchanged background pixels outside the small glyph over space and both nebula colors. Inspected the actual galaxy radio-contact screenshot. `git diff --check` passed; no manual desktop or whole-career playtest is claimed.
- Saves: no state, schema, keys or migration changes. Existing careers use the new presentation immediately. Remaining: visual feedback at native tile size.

## 2026-11-02 — One source for the release version

Branch: `experiment/expedition-legacy`; build/workflow change, game remains `0.28.0-experimental.12`. Main/public build unchanged.

- Root `package.json` is now the only manually maintained current version. The source build supplies `GAME_VERSION` / `GAME_VERSION_LABEL` to the HTML and canvas menu, and synchronizes desktop package/lock metadata, Tauri config and the game package's Cargo manifest/lock version. Dependency versions remain unchanged. Desktop sync/dev/build runs this same build first. Stale metadata or HTML fails `npm run check` / `npm test`.
- Removed independently maintained current-version strings from the HUD/menu and changed current guides to link to the canonical version. Historical release notes, chronology and changelog numbers are preserved. Added contributor guidance and [release workflow documentation](docs/architecture.md).
- Validation: `npm run build`, all 47 root tests plus generated-source/metadata checks and the new Edge browser version suite passed. A simulated version bump verifies HTML/runtime values, all five desktop files, stable/prerelease labels, stale-file detection, rejected unsafe values, unchanged dependency versions and unchanged historical notes. Browser checks verified actual canvas-menu text and the visible in-game label against the canonical version, with no JavaScript errors; inspected the screenshot. `npm --prefix desktop run sync` rebuilt and copied the HTML successfully. No Rust compilation, packaged executable or whole-career playtest is claimed. `git diff --check` passed.
- Saves/gameplay: unchanged; no keys, schema or migrations. The game remains a self-contained offline HTML file. Remaining: desktop executable packaging is outside this workflow change.

## 2026-11-02 — 0.28 experimental.12: fixed Mercy placement at galaxy generation

Branch: `fix/experimental-save-indicator`, targeting `experiment/expedition-legacy`; PR #4. Main/public build unchanged.

- Corrected release numbering to `0.28.0-experimental.12` across the game, package and desktop metadata. The previous unnumbered save-indicator download is superseded by this build, which retains the state-only `Saved` indicator.
- Removed experimental.9–11's 1-in-1,000 exploration spawn rolls. Galaxy generation now selects Mercy once, uniformly across eligible interior VOID cells, excluding opening station reveals, the player, other ships, loot and existing objects. A full galaxy safely omits it. There is no forced nearby placement or narrow starting-distance band, and no additional minimum travel distance beyond opening visibility.
- The wreck exists before exploration and remains hidden until ordinary nebula-aware sensors reach its saved sector. Detection (including a remote drone reveal) records one signal and coordinates; it never spawns or relocates the wreck. No initial marker, signal or LOG records leak the location. Air and survivor clocks still start on first boarding. Debug boarding and save protection remain intact. Updated both testing pilots and their startup report to distinguish a generated hidden wreck from a known encounter.
- Validation: rebuilt HTML; all 46 repository tests and generated-source checks passed; five Edge headless suites (`encounters`, `rescue`, `log`, `palette`, `autosave`) passed with no JavaScript errors. Coverage includes 100 seeded placement cases, blocked/occupied/full galaxies, zero RNG during reveal, nebula occlusion, 12 real generated openings with seeded repeatability, hidden/known save-load stability, no spawn in old incident-free worlds, 15 spatial rescues / 862 surface steps, hidden LOG records, palette interactions/restoration and IndexedDB recovery/stale-window/large-save checks (8,077,073 characters / 175 maps). Three-hull smoke careers completed 80 selections each without JavaScript errors. These are scripted checks, not human whole-career playtesting or a distance-balance study. Desktop executable packaging was not run.
- Saves: optional `discovered:false` marks only newly generated hidden incidents; old records without this field stay known and retain their exact position/progress. Existing worlds without Mercy are not backfilled. Start a fresh career to use the new generation rule. No storage keys or root save schema changed. Remaining: broader encounter-distance feedback and existing foundation findings; see [current experiment rules](docs/experiment.md).

## 2026-11-02 — Save indicator cleanup and Mercy discovery investigation

Branch: `fix/experimental-save-indicator`, targeting `experiment/expedition-legacy`; follow-up to `0.28.0-experimental.11`, no new release or public build.

- Removed the redundant turn counter from the bottom saved indicator: it now reads `Saved`. `Saving…`, `AUTOSAVE FAILED`, the debug protection message, failure/retry/export controls and saved turn metadata are unchanged. Rebuilt the single-file HTML from source and updated [the autosave guide](docs/autosave.md).
- Investigated Mercy against experimental tip `3e80186`. Experimental.9 (`8b236ff`) replaced experimental.8's galaxy-wide random placement with a 1-in-1,000 roll per newly charted eligible empty sector in actual movement sensor reveals. A successful roll creates the wreck nearby; no minimum distance or turn delay exists. Early nearby discovery is permitted, not a placement bug. Opening reveals do not roll; existing saves retain old incidents. The exact observed player's encounter cannot be diagnosed without its save. [Current rules](docs/experiment.md#mercy-of-dawn) explain the distinction. No encounter generation, reveal, probability, turn, combat or rescue behavior changed.
- Validation: `npm run build`, all 45 `npm test` tests and generated-source checks passed; `git diff --check` passed. Headless `encounters` and `autosave` suites passed using installed Edge after the bundled Chromium download failed. Added assertions for exact Saved/Saving/failure badge text during real commits, pending saves, transaction failure and retry. Encounter checks covered 12 clean openings, winning/losing rolls, native movement, no rerolls, uniqueness, save/load and debug boarding. Actual IndexedDB checks retained recovery, stale-window protection, export and a 7,207,008-character / 155-map reload with no JavaScript errors. These are controlled scenarios, not a human desktop playthrough or encounter-frequency balance study.
- Saves: no format, keys, migration or reset changes. Existing locations and rescue progress remain intact. Main, published releases and packaged executables are untouched. Remaining: wider discovery-frequency playtesting and the existing foundation findings.

## 2026-11-01 — Preserve playthrough automation in the repository

Branch: `experiment/expedition-legacy`; testing workflow only, game remains `0.28.0-experimental.11`.

- Moved the reusable native-action playthrough controllers and headless regression scenarios into [qa/](qa/README.md), with pinned Playwright dependencies, Chromium setup, repository-relative paths and ignored generated outputs. The earlier and current pilot policies and pre-extraction orbital renderer are preserved from the local harnesses.
- Consolidated the three playthrough entry points into a shared runner with fresh isolated careers, seed/action/time controls, actual-version reports, explicit checkpoint continuation and rejection of finished-career resumes. Removed obsolete startup waits for guaranteed Mercy encounters. The older policy remains available for historical comparison; pilot limitations are documented rather than hidden by game changes.
- Added nine portable regression suites covering palettes/art, native encounters/rescues, station/contract rules, the integrated log and real IndexedDB persistence. Added Linux headless checks to the GitHub Source build workflow. The aquatic-generation diagnostic reports the existing defect separately from passing tests.
- Corrected [the handoff](docs/handoff.md) and contributor instructions: the user needs the automation tools available from a fresh checkout, not personal saves transferred. No personal saves, old raw playthrough traces, generated checkpoints, browser profiles, dependency folders, packaged executables or transfer ZIP are included.
- Local validation: all 45 root tests/build checks and all nine suites passed using a newly installed Playwright Chromium on Windows. The three-hull smoke runs each made 80 selections; both long policies made 120, and native checkpoint continuation advanced the current policy from 120 to 144 without a reset. A separately exported checkout with a path containing spaces, its own clean dependency installation and an unrelated working directory passed a 24-selection career and all 80 orbital comparisons. Both policy files match the originals exactly; the renderer baseline matches commit `826210e`. The separate diagnostic still reports 7 dry aquatic worlds among 40 selected generators. No complete new retirement career or manual desktop playthrough is claimed.
- Saves/gameplay: no production code, generated HTML, game version or save format changed. Test careers and evidence are generated afresh into ignored artifacts. Remaining: known pilot weaknesses and the previously documented game foundation defects; do not interpret a controller's poor decisions as balance proof.

## 2026-11-01 — Laptop development handoff

Branch: `experiment/expedition-legacy`; documentation only, game remains `0.28.0-experimental.11`.

- Added [a fresh-chat/computer handoff](docs/handoff.md), linked from the experimental README, with the exact branch/version, setup and playing instructions, agreed design decisions, remaining foundation findings and relevant reports. This preserves the development context independently of chat access.
- Clarified that public Play/download links serve main, careers need JSON export/import between devices, and extended headless harnesses and packaged Windows builds are local artifacts rather than files supplied by a clone. No transfer ZIP was created, at the user's request.
- Validation: verified the remote experimental tip matches gameplay commit `1bcf37e`, checked instructions against source/current guides and checked local Markdown link targets. No game code, generated HTML, version or save format changed; gameplay tests were not rerun for this documentation-only update.

## 2026-11-01 — 0.28 experimental.11: correct galaxy palette object previews

Branch: `experiment/expedition-legacy`; main unchanged.

- Fixed the biome palette creating The Void Royale and Derelict Station as yellow-star systems. They now use native CASINO/DERELICT cells, their existing galaxy artwork and the same boarding-map keys as normal play. Both casino entries board their actual walkable decks.
- Planetary and civilization samples now show previews of their bodies instead of the yellow-star wrapper. The ordinary orbital view and palette share the existing body colors and drawing routines: habitable continents, banded gas giants, asteroids, intact and broken ringworlds. Ancient-station and cave samples use existing station/entrance art. Dedicated star samples retain their real star artwork, and catalog-derived future biome samples receive body previews automatically.
- Added missing casino/derelict ASCII glyphs; palette body previews also support ASCII. Regular graphical galaxy systems still use star icons. No new art assets, object types, encounter probabilities or gameplay balance changes were introduced.
- Validation: all 45 repository tests/build checks passed. Headless checks rendered all 67 galaxy samples (including 20 biomes and 21 civilization scenarios), exercised native biome boarding/orbit/landing, confirmed both casino render/boarding paths and ASCII previews, and restored the career exactly. All 80 biome/scan-state orbital comparisons matched the previous renderer pixel-for-pixel. Full palette interaction, rebuild, future-catalog injection and save-isolation regressions passed without JavaScript errors. Screenshots were inspected; no manual desktop playthrough is claimed.
- Saves: no career-format changes. Rebuild an already-open test palette with Shift+B then Shift+F2 to replace its old wrapper cells; re-entering from the career also creates the corrected palette. Existing career worlds are unaffected. Remaining: broader art polish and human feedback on tiny previews. See [debug playground](docs/debug-playground.md).

## 2026-11-01 — 0.28 experimental.10: original ship art and seamless compositing

Branch: `experiment/expedition-legacy`; main unchanged.

- Reimported eight hulls and their original eight-way frames from Prospector R197's ship sheets, credited to David Gervais and Deon. Preserved the original BMPs and notice with a reproducible Node importer. Removed the magenta matte, corrected contaminated boundary pixels and isolated tiny atlas spill. Native frames replace rotating the player sprite. [Art direction, provenance and maintenance](docs/art-direction.md).
- Trader, cargo, science and patrol vessels now have separate silhouettes and restrained role colors. Stranded research vessels and neutral-target combat use the matching role art. Player ship selection, hull-change cards and combat portraits share the refreshed hull images. Selection cards now reserve space for taller hulls and wrap descriptions; hangar statistics clear the larger freighter's exhaust. ASCII civilian keys use T/C/S/P.
- Fixed tinted sprites replacing the background with an opaque dark tile. Tinting now preserves source alpha on a cached offscreen image; original shading and engine colors remain legible. Existing opacity arguments now work. Unknown radio contacts still hide their silhouette outside sensors.
- Validation: 44 tests/build checks passed. Headless checks covered 384 hull/direction/background/opacity cases and 152064 unchanged background pixel positions, partial alpha, black hull details and drawing-state restoration. Native galaxy, civilian combat, sensor concealment, ASCII and full palette interaction/reset/save-isolation/return checks passed without JavaScript errors. Inspected the rendered previews and screenshots. No manual desktop playthrough is claimed.
- Saves: no changes or migration. This pass changes presentation and asset tooling, not ship statistics or gameplay rules. Remaining: human feedback on recognition at native scale; planetary art, terrain transitions, creatures, buildings and other galaxy assets need later consistency passes.

## 2026-10-31 — 0.28 experimental.9: optional Mercy discovery, no opening signal

Branch: `experiment/expedition-legacy`; main unchanged.

- Removed the guaranteed galaxy-generation placement and startup coordinates/marker from experimental.8. Normal movement now rolls a 1-in-1,000 encounter chance for each newly charted eligible empty sector in the actual sensor reveal. A hit creates one nearby wreck and records its distress signal. There is no guaranteed travel/turn threshold; known sectors cannot be farmed by backtracking. Initial station reveal, remote drones and debug worlds do not roll. The palette retains its explicit, boardable Mercy sample.
- Kept occupied cells, objects and borders protected, the first-boarding air clock unchanged and existing incidents unique. No other gameplay balance, combat or dialogue changes were made for testing.
- Completed a [second retirement attempt](docs/archive/retirement-attempt-2-2026-10-31.md): Mercy was first discovered on turn 290; the Scout reached turn 5067 and 3842 credits before its remaining crew died on a territorial world. It did not retire. The private pilot used earlier ship retreats, but mishandled surface warnings, bleeding and crew replacement. One checkpoint continuation corrected a repeated dialogue-selection loop without reversing losses; inflated input counts and the test limits are disclosed.
- Validation: all 40 tests and build checks passed. Headless checks covered 12 clean openings, losing/winning discovery rolls, actual movement/sensor range, repeat-visit suppression, one signal and durable save/load. Palette coverage, interactions and restoration passed; 15 rescue regressions traversed 869 real steps. Neither these scenarios nor the career captured JavaScript errors. No manual desktop playthrough is claimed.
- Saves: schema unchanged; already-created incidents and historical messages remain in older saves. Fresh careers have no startup Mercy encounter. Previously charted areas are not rerolled. Remaining: wider encounter-frequency playtesting, a more competent full-game pilot and the existing foundation findings; successful wealthy retirement remains unproven.

## 2026-10-31 — 0.28 experimental.8: random Mercy location and a long career

Branch: `experiment/expedition-legacy`; main unchanged.

- Removed Mercy of Dawn's four-to-seven-tile starting-distance band. Fresh encounters choose uniformly among eligible interior VOID cells across the galaxy, excluding the player and existing ships or loot. No object is overwritten; a full galaxy safely omits the incident. Initial distress coordinates, the marker and the first-boarding air clock remain. Repeatable testing stays in the debug galaxy palette.
- Recorded a [long retirement attempt](docs/archive/long-career-2026-10-31.md): one normal seeded Scout career, 3,752 native actions / 3,354 turns, 20 expeditions, one completed science contract, one survivor delivery and 3,719 ending credits. A Dreadnought destroyed the ship before the chosen 10,000-credit target. The report separates the pilot's late retreat from balance conclusions; it does not claim successful retirement.
- Validation: 39 tests/build checks passed, including 100 seeded locations, occupied positions, saved-location stability and a full galaxy. Headless palette factories/interactions, reset, save isolation and exact career restoration passed. Fifteen rescue scenarios passed with 866 actual surface steps and no JavaScript errors; the long career also had no JavaScript errors. No manual native playthrough is claimed.
- Saves: no schema changes; existing position/progress is preserved. New careers use random placement. No balance or combat mechanics were changed for the simulation.
- Remaining: enemy-strength-aware retreat in the private pilot; inconsistent action clocks and other foundation findings. The run additionally exposed negative crew-loss reporting on the death screen. Other survivors' postmortem state is separated from player knowledge in the report.

## 2026-10-31 — Three observation-limited career playthroughs

Branch: `experiment/expedition-legacy`; played `692bcf5`, experimental.7. Documentation only.

- Recorded three fresh native-action careers in [the playthrough report](docs/archive/playthroughs-2026-10-31.md): Scout early retirement on turn 325 with 993 credits and one survivor delivered; Freighter destruction on turn 194 after repeated escapes, fuel exhaustion and refused surrender; Corvette early retirement on turn 260 with 462 credits, repaired life support and two deliveries.
- Used revealed information, normal resources and real actions with debug off. Corrected pilot-control mistakes during calibration and replayed the same predetermined seeds; did not reverse final outcomes through reloads. The report distinguishes early-retirement policy, incomplete objectives and pilot mistakes from game defects and balance evidence.
- Validation: all three final runs ended through native retirement/death paths, below their safety action ceiling, with no captured JavaScript/input errors. Retained action/event traces, screenshots and final save files locally. This is not a statistical hull comparison or proof of full 10,000-credit careers. No gameplay code, save format or version changed.

## 2026-10-31 — 0.28 experimental.7: durable autosaves and recovery

Branch: `experiment/expedition-legacy`.

- Replaced quota-limited localStorage autosave writes with an asynchronous IndexedDB store. Current and previous valid snapshots commit atomically; integrity checks recover a damaged primary without overwriting a valid backup. Existing localStorage saves remain readable and are retained after migration.
- Added visible saving/saved/failed status, persistent failure notices, retry and export of current unsaved progress. Menu/quit transitions wait for commit and preserve the active game on failure. Pending/failed browser closes request an unsaved-progress warning.
- Captured snapshots before queueing; serialized writes, coalesced pending work and skipped identical snapshots. Render-triggered writes use a bounded 200 ms schedule. Cross-window conflict checks stop stale careers from overwriting a newer save and offer an explicit load/export choice.
- Unified compatibility repairs for file and stored saves, added structural/integrity validation and rollback on failed preparation, and guarded asynchronous transitions/loads. Debug worlds remain excluded. Exported JSON retains the existing game-state shape.
- Validation: 36 repository tests passed. Actual browser storage checks covered aborted transactions, retained backups, failure/export/retry, corruption recovery, legacy import, matching file/storage repairs, invalid-file rollback, stale windows and save-before-menu/quit. A full reload restored a 10,124,288-character snapshot with 210 generated maps, beyond the old localStorage quota. Existing gameplay regressions were also exercised; native quit invocation was mocked, and no manual native playtest is claimed.
- Saves: legacy reads preserved; database envelope format/schema version 1. Continue and save operations are asynchronous. Remaining: full snapshot serialization and the render scheduling hook await broader action-boundary work; combat/dialogue identity and other audited gameplay defects remain open. Details: [autosave guide](docs/autosave.md).

## 2026-10-31 — Foundation and roadmap review

Branch: `experiment/expedition-legacy`. Reviewed gameplay commit `616d819`; game version remains `0.28.0-experimental.6`.

- Added a [foundation review](docs/archive/foundation-review-2026-10-31.md) distinguishing current strengths, reproduced defects, architectural risks, feature readiness and recommended work order. Findings are open; this pass does not fix gameplay.
- Reproduced silent autosave quota failure during generated-world growth, detached combat/dialogue entities after reload, divergent file/storage migrations, an invalid import replacing the active state, inconsistent action/oxygen/status clocks, dry aquatic civilizations and zero-morale defaulting to 55.
- Validation: all 31 repository tests/build checks passed. Existing headless palette/log scenarios, 54 fixture-assisted contract completions and 15 rescue scenarios with 858 surface steps passed. New controlled review scenarios and a seeded 40-world aquatic generation matrix supplied the defect evidence. Human whole-career balance and native desktop playtesting were not performed.
- Recommended persistence/identity repairs, shared turn progression and ordinary generation invariants before more connected content. Added a roadmap reference to the review; recommendations are not completed milestones.
- Saves: no format or gameplay changes in this documentation-only pass. The review records existing save defects that require subsequent fixes.

## 2026-10-31 — Establish the development record

Branch: `experiment/expedition-legacy`. Game version remains `0.28.0-experimental.6`.

- Added this central changelog and backfilled the experimental releases and branch cleanup so development is traceable beyond individual chats.
- Linked it from the README and historical changelog. Added a repository instruction requiring future work to update the record in the same commit.
- Corrected stale current-status descriptions of the latest debug work and renewable science contracts. Existing system guides remain the detailed references.
- Validation: checked backfilled entries against Git history and system notes; checked relative document links and the documentation diff. This pass changes documentation only; local gameplay checks were not rerun.
- Saves: no effect. Remaining: older pre-experiment work has a partial historical changelog and Git history, not a reconstructed release-by-release narrative.

## 2026-10-31 — 0.28 experimental.6: tighter debug palettes

Branch: `experiment/expedition-legacy`. [Commit 490a6d1](https://github.com/Sebo2203/Prospector-II/commit/490a6d1).

- Halved galaxy sample spacing from 10 by 8 tiles to 5 by 4. Surface spacing changed from five to three tiles, halving the clear gap from four to two tiles. The surface gallery dimensions shrink with the layout.
- Abbreviated long map labels to avoid overlaps; the searchable directory retains full names. This makes more samples visible together without placing them directly adjacent.
- Validation: 31 tests and build-freshness checks passed; headless palette interaction, simulation toggle, rebuild and exact-career-restoration checks passed. Inspected galaxy and surface screenshots; GitHub CI passed.
- Saves: career format unchanged. Rebuilding a test palette discards its temporary changes; F4 restores the retained career.
- Remaining: human feedback on label readability and layout. Details: [debug playground](docs/debug-playground.md).

## 2026-10-31 — 0.28 experimental.5: reusable debug playgrounds

Branch: `experiment/expedition-legacy`. [Commit c307228](https://github.com/Sebo2203/Prospector-II/commit/c307228).

- Added disposable galaxy and surface test worlds through Shift+B: F2 galaxy, F3 surface, F6 searchable directory, F7 live NPC simulation, Shift+F2 rebuild, and F4 return. At introduction they contain 340 samples/scenarios, including 22 registered galaxy object definitions.
- Included galaxy objects, star types, biomes, civilization tiers/aggression/species, terrain/building tiles, equipment, implants, commodities, creature body archetypes and a gunner. Items, cargo and creatures use ordinary pickup, equipment, communication and combat rules.
- Paused NPC movement by default for inspection. Added full scenarios for fixtures whose interaction depends on a casino, civilization or rescue incident; isolated raw tiles remain visual/collision samples.
- Retained the original career outside the sandbox; blocked sandbox autosaves, save exports/imports and gameplay analytics. Return, menu and quit paths dispose of test state safely. Re-entry/reset restores test resources and permits recovery after death.
- Read surface samples from runtime catalogs and used a shared galaxy spawn registry. Added coverage checks and maintenance instructions so future additions must remain represented.
- Fixed research objectives/defenders spawning in isolated hull-damage pockets by selecting reachable deck tiles. Aquatic contact scenarios provide an actual sea, use the normal underwater key and find a valid landing tile when coordinates are absent. Added isolation pods and the pump coupling to debug gear.
- Validation: 31 tests passed; headless checks visited the factories, generated biomes/civilizations and surface samples, then exercised real pickup, cargo loading, equipping and combat. Checked simulation, search, death recovery, future catalog injection, save isolation and exact restoration. Existing rescue/log checks and 54 fixture-assisted contract completions across three hulls passed; GitHub CI passed. Contract fixtures are not 54 fully played expeditions.
- Saves: no career-format migration; sandbox state is deliberately not saved. Remaining: human playtesting of usability; arbitrary procedural stat/trait combinations are not separate exhibits. Details: [debug playground](docs/debug-playground.md).

## 2026-10-31 — 0.28 experimental.4: expedition economy and renewable work

Branch: `experiment/expedition-legacy`. [Commit 0fbbc0e](https://github.com/Sebo2203/Prospector-II/commit/0fbbc0e).

- Science sales preserve usable gear, medicine, quest items, live creatures and reserved contract specimens. Sale quotes and transactions use the same eligibility rules.
- Excluded artificial interiors from planetary survey pay; combined scan/exploration coverage without double counting. Civilization documentation and ordinary survey sales no longer consume each other's rewards.
- Made science work renewable after cooldown, with cargo eligibility, target/range constraints and contract-specific research data. Added relinquishing blocked/lost jobs without reward, preserving unrelated cargo.
- Retired completed research ships through normal world ticks and restored shared contact-marker references after loading. Counted sample, survey and bulk-market proceeds consistently as gross career earnings.
- Added active job details and contract history to LOG → RECORDS. Kept rewards, prices and general combat/resource balance unchanged while repairing the existing career loop.
- Validation: 26 tests passed, plus real station transactions and 54 fixture-assisted contract completions across all three hulls with save/load between jobs; physical research-console recovery and rescue/log regressions were also checked. This establishes tested accounting and persistence, not whole-career balance.
- Saves: older research data retains legacy compatibility; new contracts require matching provenance. Remaining: full career costs, recovery, combat readiness and pacing. Details: [career-loop polish](docs/archive/development-pass.md).

## 2026-10-31 — 0.28 experimental.3: integrate records into the existing log

Branch: `experiment/expedition-legacy`. [Commit 633e808](https://github.com/Sebo2203/Prospector-II/commit/633e808).

- Removed the standalone Expedition Journal screen, J shortcut, menu/context buttons and popup styles. Moved discovery, survey, civilization and survivor records into the existing I → LOG screen, with the sixth RECORDS filter.
- Kept normal keyboard/mouse filtering and scrolling, wrapped long records, and preserved the existing ship-inventory jettison action. This follows the decision that expedition history belongs in the built-in log.
- Validation: scripted log checks covered removed entry points, keyboard/mouse filters, hidden discoveries, event deduplication, chronological wrapping, migration and exit; spatial rescue regressions were checked.
- Saves: retained expedition history and removed the obsolete popup UI flag on load. Remaining: human assessment of log readability. Details: [current experiment](docs/experiment.md).

## 2026-10-31 — 0.28 experimental.2: replace menu outcomes with a physical rescue

Branch: `experiment/expedition-legacy`. [Commit fd7572a](https://github.com/Sebo2203/Prospector-II/commit/fd7572a).

- Replaced the quarantine choice menu with the walkable Mercy of Dawn: rooms, operable hatches, fog of war, visible survivors, medical supplies, contaminated areas, life support, salvage and an airlock. Player decisions now follow movement and work in the world.
- Added individual treatment, escort/carrying, physical isolation pods, repairs/manual pumping, real reserve-air depletion and crew infection. Passenger berths and cargo slots govern transport; small hulls can make return trips.
- Station delivery accepts actual onboard passengers and pays once. Salvage sells through the ordinary commodity market; no remote incident option grants a resolved rescue.
- Corrected planet waiting failing to advance time, cardinal line-of-sight drift and an undefined casino-departure variable found during testing.
- Validation: generated-deck reachability, hatches, survivor movement, atmosphere persistence, transport limits and once-only delivery checks; headless spatial scenarios exercised real movement, medical/repair work, pods, cargo, retreat and station delivery across the three hulls. Controlled setup isolated the rescue from unrelated pirate interception.
- Saves: deck and survivor state persists; older resolved menu incidents retain their history without becoming repeatable rewards. A fresh run is required for the new incident when the older save lacks it.
- Remaining: human assessment of pressure, visibility, action clarity and medical/transport tradeoffs. Details: [current experiment](docs/experiment.md).

## 2026-10-31 — 0.28 experimental.1: initial experiment, later superseded

Branch: `experiment/expedition-legacy`. [Commit d38db07](https://github.com/Sebo2203/Prospector-II/commit/d38db07); [history reconciliation 13b9d56](https://github.com/Sebo2203/Prospector-II/commit/13b9d56).

- Established the experimental branch, a persistent expedition discovery/event register, an initial journal UI and a menu-based quarantine rescue. The experimental desktop wrapper uses its own app identifier.
- Recorded the original Prospector reference, the sequel's direction and the plan to connect existing systems into a captain's career.
- The menu-based encounter missed the intended world interaction and was replaced in experimental.2. The separate journal UI was removed in experimental.3. The persistent history foundation remains.
- Validation: targeted expedition/history and build checks were introduced; see the original commit for that version's implementation. Saves: history initializes for legacy saves without inventing discoveries. Do not use this entry as a description of the current interface.

## 2026-10-31 — Branch cleanup and pre-experiment main baseline

[Main promotion e9b6f36](https://github.com/Sebo2203/Prospector-II/commit/e9b6f36). Details: [branch history](docs/branch-history.md).

- Preserved the old `dev-build` and `modular-source-experiment` tips under archive tags and removed the redundant branches. Closed the obsolete modular-extraction draft PR.
- Promoted the exact pre-experiment development snapshot to main at the owner's request: modular sources, walkable casinos, repair/refuel sounds and the preceding gameplay fixes. Experimental gameplay remains on `experiment/expedition-legacy`.
- Validation: recorded original tips and compared the promoted snapshot with the archived development files. Saves: the promotion itself does not introduce an experimental save migration.
- Earlier changes: [historical changelog](docs/archive/Changelog%20Prospector%20II.txt), [branch history](docs/branch-history.md) and Git history. GitHub Pages follows main; selecting another GitHub branch does not change the hosted game.
