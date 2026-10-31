# Development guide

The root README is for players. Keep build instructions, source organization and
internal development notes in `docs/` and `AGENTS.md`.

Development uses thematic files under `src/`; distribution remains a single
`index.html`. Use Node.js 22 or newer. No npm dependencies need to be installed.

```sh
npm run build
npm test
```

Edit `src/`, then rebuild and commit `index.html` with your source changes. The
build order is explicit in `src/build-manifest.json`. Start with the
[architecture guide](architecture.md) and [source map](source-map.md). The proposed
feature sequence is in the [feature roadmap](roadmap.md).

The first extraction preserves the original HTML byte-for-byte. Run
`npm run verify:migration` to audit this initial equivalence; intentional later
game changes naturally change that baseline. The HTML build does not rebuild
the Windows executable.

Record meaningful changes and their validation in the
[development changelog](../CHANGELOG.md), in the same commit as the change.
Documentation-only edits do not require a game-version bump.
