# Additional sound pitches — November 12, 2026

Status: **Accepted: C1–C6, C7-A boost, C8-D ramming, C10-B lightning, C11 scan and both C12-A/B doors. C9-B is only a tentative asteroid fallback.** C8-B improved but lacks a crash; C8-C/C9-C are rejected as boost-like. Original C7 is superseded by C7-A. Original C8–C10/C12 and standalone C8-A/C9-A are rejected; C10-A was close but too short. Experimental.98 now integrates these selections, using C9-B provisionally under the instruction to implement all sounds. The earlier sections below record audition history, not current installation status; see [the runtime audio guide](audio.md). The author reported hearing no difference in the preceding original-versus-96-kbit/s W5 comparison; that supports trying the same bitrate for these candidates, not assuming every recording is perceptually unchanged.

Use the original Prospector sounds in the roles already discussed, and fill the gaps with a small coherent set of recordings. Give individual weapons recognizable signatures, shield absorption an electronic identity, and physical crashes a mechanical identity. Keep routine interface feedback quiet. Short excerpts and small layers can provide character without constant or lengthy playback.

## First audition board

| Label | Proposed role | Construction / intended distinction |
| --- | --- | --- |
| C1 | Mass Driver firing | Low-frequency report plus mechanical impact; a single kinetic shot candidate. |
| C2 | Railgun firing | Brief rising tone, then a larger discharge; lead-in is audiovisual presentation, not an additional charging turn. |
| C3 | Laser Cannon firing | Larger energy recording, separate from the original ground-laser W1. |
| C4 | Pulse Laser firing | Shorter energy pulse, to distinguish the faster weapon. |
| C5 | Artemis launch | Brief thruster excerpt at launch; actual missile impact gets its own later cue. |
| C6 | Shield absorption | Force-field recording, keeping shield-only damage distinct from original W5 hull damage. |
| C7 | Boost | Bounded engine excerpt for the committed maneuver. |
| C8 | Ramming | Direct metal-impact recording for physical ship contact. |
| C9 | Asteroid collision | Mining/plate impacts layered as a different contact candidate. |
| C10 | Nebula lightning | Zap/force-field excerpt for the resolved strike, with no advance warning. |
| C11 | Successful scan | Short computer phrase plus confirmation for an actual successful scan. |
| C12 | Door closing / docking latch | Mechanical closing recording; could accompany on-foot doors or the latch portion of docking. |

These descriptions are design intentions and suggested uses; the author should judge the actual playback. A matching source filename alone does not establish that the candidate fits the game. The recorded source filenames, hashes, excerpts and delays are retained in [the candidate manifest](../art/source/audio-candidates/kenney-2026-11-12.json). All are Kenney CC0 recordings from the four linked libraries in [the source note](../art/source/audio-candidates/README.md); licenses were inspected in the downloaded packs.

Each candidate uses 96-kbit/s stereo MP3 and a 0.7 output gain, with no pitch changes. Cards identify excerpts and layers. Mixed clips use normalized mixing; excerpt endings have a short fade. Playback volume is adjustable and selecting another clip pauses/resets the preceding one. The initial twelve files total **107,415 bytes** before embedding, about 107 KB. They are stored in ignored outputs and do not enlarge the game download.

## Follow-up direction

### Author feedback and replacement audition

The author accepted C1–C6 and particularly liked C11's dial-up character for scans. C7 was weak but usable if no better boost emerges. C8 resembled gentle glass tapping, C9 a hammer/coin impact, C10 an electronic tune, and C12 electronics rather than a physical latch. These rejected directions should not become runtime assignments.

Initial selection used filenames, metadata and intended roles. Decoding/playback verification did not establish perceptual fit; no claim of having heard or judged the recordings is made. Human listening decides the assignments.

The replacement board uses public Freesound high-quality preview MP3s, **not original lossless downloads**. Individual source pages explicitly identify CC0; source pages, preview URLs, hashes and excerpts are pinned in [the replacement manifest](../art/source/audio-candidates/freesound-replacements-2026-11-12.json). These were initially unapproved alternatives; subsequent decisions are recorded below:

| Label | Role | Source basis |
| --- | --- | --- |
| C7-A | Boost | LimitSnap_Creations' rocket-thrust design, a 1.6-second excerpt starting at 2 seconds. Not claimed to be a field recording. |
| C8-A | Ramming | moxobna's recorded metal crash; complete 4.47-second preview. |
| C9-A | Asteroid collision | spookymodem's collapsing-rock-wall effect; complete 5.04-second preview. Its recording method is unspecified. |
| C10-A | Nebula discharge | BMacZero's recorded Tesla-generator spark; complete 0.34-second preview. |
| C10-B | Nebula discharge | BlueDelta's thunder recording with little rain; first 6 seconds of the public stereo preview, not the original four-channel file. |
| C12-A / C12-B | Door / docking latch | Sheyvan's two heavy-metal-door recordings by Philipp Grzemba; complete 2.60/4.11-second previews. |

The first replacement files total **295,594 bytes**, outside the game. All use 96-kbit/s stereo MP3, gain 0.7 except C7-A at 0.35. Only the two excerpts receive short edge fades; no layers, pitch changes or loudness normalization. These longer auditions expose source character; final event timing/trimming remains undecided. No conclusion about how convincing they sound follows from source descriptions.

```sh
python tools/preview-audio-replacements.py
node qa/check-audio-preview.cjs outputs/Prospector-II-sound-replacements-2026-11-12.html 7
```

Use the same optional encoder setup as below. The generator preserves earlier boards using a new suffix, caches public previews, checks pinned hashes and writes an offline board with source links and processing notes. Verified all seven browser decodes, unique labels, one-at-a-time playback and shared volume with HTTP(S) blocked, no page errors, and unchanged .97 game hashes. No gameplay tests or build were repeated for this preview/documentation-only change. Nothing published or installed; saves unchanged.

### Second feedback and layered collision auditions

The author accepted **C7-A for boost, C10-B for lightning and both C12-A/B for mechanical doors/latches**. Exact door-event assignments remain undecided. C8-A suggested people smashing a locker room rather than colliding ships; C9-A suggested billiards. Both standalone effects are rejected. C10-A was close but too brief; no extension is required now that C10-B is accepted. These decisions supersede the original C7 fallback and leave only the collision roles unresolved in this set.

Prepared four new **unapproved** collision mixes, with no oscillator synthesis. The low-frequency body is from the same Kenney family used in accepted C1. Rejected raw sources are only reused as short, lowered, quieter texture layers in two explicit comparisons, rather than silently reinstated as accepted effects.

| Label | Construction to audition |
| --- | --- |
| C8-B | Low-frequency impact plus a shortened, lowered metal-crash layer. |
| C8-C | Same low-frequency body with a lowered crunch effect instead of the metal-crash source. |
| C9-B | Low-frequency impact plus a shortened, lowered rock-effect tail. |
| C9-C | Low-frequency impact, a separate crunch attack and a quieter lowered rock tail. |

All layers are existing CC0 Kenney/Freesound sources. [The collision manifest](../art/source/audio-candidates/collision-layers-2026-11-12.json) pins hashes, excerpts, playback-rate/pitch factors, low-pass cutoffs, gains and delays. These intentionally processed effects aim for mass; source metadata and processing do not establish perceived fit. Tail fades and an additive mix with a 0.85 ceiling limiter (automatic gain disabled) precede 96-kbit/s stereo MP3 encoding. The four files total **85,438 bytes** outside the game. They do not alter accepted clips.

```sh
python tools/preview-collision-audio.py
node qa/check-audio-preview.cjs outputs/Prospector-II-collision-sounds-2026-11-12.html 4
```

Uses the same optional Python/FFmpeg setup and ignored caches as the earlier generators. New suffixes preserve prior listening pages. Verified all four offline browser decodes, unique labels, actual one-at-a-time playback, shared volume and no page errors; decoded sample peaks were below full scale. The .97 game hash remains unchanged. No build/gameplay tests were repeated; human listening is still required. Nothing installed or published; saves unchanged.

### Collision feedback and restored crash attack

The author found all four layers insufficiently dramatic: C8-B was improved but lacked a crash, C8-C/C9-C resembled boost sounds and were rejected, and C9-B was weak but could serve as a tentative fallback. It is not a final accepted asteroid assignment.

A concrete construction error explains part of C8-B: its metal layer kept only source seconds 0–0.48, while the main impact begins around 0.5 seconds. Coarse decoded RMS measurements confirmed a steep increase in the 0.5–0.6-second window. The crop omitted the intended crash, independent of the subjective tonal feedback.

Two new **unapproved** comparisons preserve a 0.48–1.38-second crash excerpt at normal pitch with no low-pass filter on that layer:

- **C8-D:** restored metal attack over the earlier low-frequency body.
- **C8-E:** restored metal attack plus the original W5 impact/debris recording, with neither layer pitch-lowered or low-pass filtered.

[The comparison manifest](../art/source/audio-candidates/crash-comparisons-2026-11-12.json) pins source bytes, original W5 Git blob/commit, excerpts and processing. Original Prospector W5 is not claimed as CC0; its existing provenance/credit limitations remain in [the source note](../art/source/prospector/audio/README.md). This local audition adds no public release or runtime assignment. The old rejected sounds are not silently installed.

```sh
python tools/preview-collision-audio.py --set crash
node qa/check-audio-preview.cjs outputs/Prospector-II-crash-comparisons-2026-11-12-2.html 2
```

The generator chooses a fresh suffix; use its printed path. Final two clips total **54,631 bytes**. Additive mixing uses the existing ceiling limiter, then gain 0.7 for MP3 headroom. An initial encode overshot full scale after decoding and was superseded by the headroom-adjusted board; final stereo sample peaks were about 0.706/0.683. The final offline browser audition check passed decoding, unique IDs, one-at-a-time playback, shared volume and no page errors. Game HTML remains byte-identical to .97. No game build/gameplay tests repeated; save state unchanged. Human listening still decides fit.

### Ramming selection

The author chose **C8-D as the ramming sound** from the final headroom-adjusted comparison board. Keep its restored 0.48–1.38-second metal-crash excerpt and low-frequency body, including the documented post-limiter gain of 0.7. The exact construction is pinned in `crash-comparisons-2026-11-12.json`; do not substitute C8-E or the superseded initial encode. C9-B remains only a tentative asteroid fallback. This records approval of the sound, not an installed runtime cue; game version, game HTML, saves and publication state are unchanged. No new audio processing or playback checks were needed for this decision-only update.

After choosing the primary combat cues, consider quiet refueling valves/pumps, repair tools and short menu confirmations. A distinct single-shot ground firearm cue is still needed alongside original W4's automatic-fire character. Footsteps and ambient loops should be considered separately for repetition, comfort and size; they are not part of these twelve pitches. No music, spoken radio dialogue or new warnings are proposed by this board.

Fire and impact need separate routing: committed shots can sound even when they miss, and guided missiles should sound at launch and then at their real later impact. Free refused actions should not produce a firing cue. These are requirements for any later implementation, not new behavior in this pass.

## Reproduction and validation

Use Python 3.10+ and FFmpeg on PATH, or supply `--ffmpeg /path/to/ffmpeg`. Alternatively install the optional encoder helper with `python -m pip install --target .tmp-tests/audio-encoder imageio-ffmpeg==0.6.0`. It is a development-only dependency and is never bundled into the game.

```sh
python tools/preview-audio-candidates.py
node qa/check-audio-preview.cjs outputs/Prospector-II-sound-pitches-2026-11-12.html 12
```

The generator uses the execution machine's current date and adds a numeric suffix if that page already exists; substitute the printed path in the check. The download step needs network access, while the generated page and the check work offline. Node browser dependencies/setup are documented in [qa/README.md](../qa/README.md).

Validated all twelve real browser decodes, unique labels, one-at-a-time native playback, shared volume and absence of runtime errors/HTTP dependencies during audition. Verified the game still matches the delivered .97 HTML byte-for-byte. Playback checks do not establish subjective fit, equal perceived loudness or quality across devices. No game build, gameplay tests, public upload, save change or runtime assignment was part of this proposal-only pass.
