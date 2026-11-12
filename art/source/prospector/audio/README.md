# Original Prospector audio

`pain.wav` is retained byte-for-byte from Matthias Mennel's Prospector R197 data snapshot, [commit 1b928c0](https://github.com/roguelikes/prospector/blob/1b928c0bb95643302b9dc4ece55fd1fba6e5ba1e/data/pain.wav). The author listened to this exact clip and selected it on November 12, 2026 for planetside crew damage, explicitly excluding ship combat.

- Git blob SHA-1: `d626fdc0deeb65ec66fc6155ce3e2bd2dd7dedd8`.
- File SHA-256: `5161536e60a37fabbc71e92c3d1cb9d60d43052c7466cb5a91438ea9c32dccb3`.
- Format: 44,100 Hz, mono, 16-bit PCM WAV; 0.84 seconds.

The retained [original copyright notice](../README.txt) and [upstream README](https://github.com/roguelikes/prospector/blob/1b928c0bb95643302b9dc4ece55fd1fba6e5ba1e/README.txt) give the project's permissive software terms. The original README supplies no separate creator credit for this recording. Its distribution with Prospector is verified; no claim is made that Minecraft created or licensed it. The recording is unaltered; in-game playback uses a gain of 0.65. Original audio-specific attribution/provenance remains a research question before any later public asset publication.

All eleven original audition WAVs are now retained byte-for-byte in this directory: W1–W5, A1/A2, LAND, START, WORM and PAIN. Their pinned Git blob hashes are listed in `tools/import-prospector-audio.js`; runtime playback hashes and upstream commit metadata are in `art/source/audio/catalog.json`. Labels follow original filenames, not invented ship-weapon assignments. The same upstream distribution/credit boundary applies to these recordings.

Experimental.98 integrates compressed playback copies for the selected ground weapons, C4/meteor explosions, Wraith/Devourer contact attacks, hull impacts, alarms, landing and liftoff, while preserving the original pain WAV. WORM is embedded/reserved because no wormhole action exists yet. See [the audio guide](../../../../docs/audio.md) for actual event mappings. Pain remains exclusive to planetside physical crew damage, not shipboard casualties.

`npm run art:audio` recreates the embedded catalog from retained files without network or encoder dependencies. `node tools/preview-prospector-audio.cjs` remains an optional pinned-source audition generator; its pages/download caches stay ignored. Other than pain, playback files are 96-kbit/s MP3 copies stored under `art/source/audio/`, distinct from these original WAVs. Normalization/pitch edits are not applied to the original playback copies. This is local integration; no public upload is authorized by this document.
