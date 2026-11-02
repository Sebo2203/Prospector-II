# Prospector II

A sci-fi roguelike about exploring space, surveying planets, managing a crew, and trying to retire rich enough to survive the void.

## Active experiment

This is `experiment/expedition-legacy`, the consolidated modular development branch.
The current release version is defined in [package.json](package.json).
The [development changelog](CHANGELOG.md) records each meaningful change, its reason,
validation, save impact and remaining work. It is updated with the code.
Continuing on another computer or in a fresh chat? Start with the
[development handoff](docs/handoff.md).
The [scripted testing guide](qa/README.md) includes the portable playthrough
controllers and headless regression checks used during development.
The galaxy palette now shows matching casino, station and planetary previews.
For reusable testing, open **Shift+B → F2** (galaxy palette) or **F3** (surface
gallery). **F6** searches the samples; **F4** restores your career. See the
[debug playground guide](docs/debug-playground.md).
Ships now use clean original Prospector artwork, with distinct civilian silhouettes
and seamless rendering over nebulae. See the [art pass and credits](docs/art-direction.md).
Mercy of Dawn is placed once during galaxy generation, across eligible empty
sectors outside the opening station reveals. Exploration only reveals the existing
wreck; it never rolls to spawn one. Coordinates stay hidden until detection. Its galaxy palette sample remains available for
repeatable testing. See the [second retirement attempt](docs/retirement-attempt-2-2026-10-31.md).
Durable autosaves, recovery and failure/export controls remain available; see the
[autosave guide](docs/autosave.md).
Earlier expedition economy and repeat research work is detailed in
[career-loop polish](docs/development-pass.md).
Download **this branch's ZIP**, extract it and open `index.html` to play the experiment.
Open **I → LOG → RECORDS** for discoveries, survey progress and survivor records.
If you discover a Mercy of Dawn distress
signal, fly to its recorded coordinates and press **Enter** to board the ship. Explore
its rooms, repair life support, find and assist survivors, then physically bring them
back to your airlock. **T** treats a nearby survivor, **P** deploys an isolation pod,
and **L** departs only from your ship. Deliver passengers to a major station.
See [the experiment notes](docs/experiment.md)
for the implemented slice, design direction, testing and remaining work.

`main` remains the public release. The links below open that release, regardless of
which GitHub branch you are viewing. Old development branches are preserved as
archive tags; see [branch history](docs/branch-history.md).

## Play

- [Play in browser](https://sebo2203.github.io/Prospector-II/)
- [Download Windows desktop app](https://sebo2203.github.io/Prospector-II/downloads/Prospector-II-v0.26-portable.exe)

The desktop app is a standalone Windows executable. Download it, double-click it, and Prospector II launches fullscreen.

Note: Windows may show a SmartScreen warning because the app is not code-signed yet. Choose **More info** then **Run anyway** if you trust the download.

## Modular development

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
changes will naturally change that baseline. Experimental desktop builds use a
separate app identifier; the public download above remains the main release.
