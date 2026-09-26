# Prospector II

A sci-fi roguelike about exploring space, surveying planets, managing a crew, and trying to retire rich enough to survive the void.

## Play

- [Play in browser](https://sebo2203.github.io/Prospector-II/)
- [Download Windows desktop app](https://sebo2203.github.io/Prospector-II/downloads/Prospector-II-v0.25-portable.exe)

The desktop app is a standalone Windows executable. Download it, double-click it, and Prospector II launches fullscreen.

Note: Windows may show a SmartScreen warning because the app is not code-signed yet. Choose **More info** then **Run anyway** if you trust the download.

## Experimental source layout

Development uses thematic files under `src/`; distribution remains a single `index.html`.
Use Node.js 22 or newer. No npm dependencies need to be installed.

```sh
npm run build
npm test
```

Edit `src/`, then rebuild and commit `index.html` with your source changes. The build
order is explicit in `src/build-manifest.json`. Start with the
[architecture guide](docs/architecture.md) and [source map](docs/source-map.md).
The proposed feature sequence is in the [feature roadmap](docs/roadmap.md).

The first extraction preserves the original HTML byte-for-byte. Run
`npm run verify:migration` to audit this initial equivalence; intentional future game
changes will naturally change that baseline. The existing Windows executable is
unchanged by this experiment.
