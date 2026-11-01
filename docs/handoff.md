# Continuing on another computer

Updated November 1, 2026. This is a practical starting point for a fresh development chat; it is not a transcript of the previous chat.

## Current checkout and playing

- Repository: [Sebo2203/Prospector-II](https://github.com/Sebo2203/Prospector-II).
- Active development branch: `experiment/expedition-legacy`. Game version: `0.28.0-experimental.11`.
- Latest gameplay commit at this handoff: `1bcf37ea7f520d7695e40bde77e70b3ed6b83bb3` (native galaxy-palette previews). Later documentation-only commits do not change that game version.
- `main` remains the previous public release, with its modular sources. Do not merge or replace it as part of resuming work. Old confusing development branches are archived; see [branch history](branch-history.md).
- To play without development tools, open the experimental branch on GitHub, download that branch through **Code → Download ZIP**, extract it and open `index.html`. The usual GitHub Pages Play link and public Windows download still serve main, not this experiment.
- The versioned experimental Windows executable produced on the original PC is a local deliverable, not a GitHub Release asset. Copy it separately if desired. The committed HTML is the same game and works without that executable. Windows executables require Windows; the HTML is the alternative on other operating systems.

For development, clone this exact branch and open the repository folder in the new chat:

```sh
git clone --branch experiment/expedition-legacy https://github.com/Sebo2203/Prospector-II.git
cd Prospector-II
npm run build
npm test
```

Use Node.js 22 or newer. The root build/tests require no npm dependency installation. Desktop compilation has separate Rust/Tauri/Windows prerequisites; it is unnecessary for playing the HTML or editing game logic.

## Transfer an existing career

Autosaves belong to the original browser profile or desktop app; GitHub does not contain or synchronize them. On the original PC, return from the debug palette with **F4**, then use **F5** to export the real career as JSON. Transfer that file and use the game's file-load option on the laptop. Wait for a confirmed saved status after loading. See [autosaves and recovery](autosave.md). No save transfer is needed for a fresh career.

## Read first

1. [AGENTS.md](../AGENTS.md): editing, testing, persistence and debug-catalog rules.
2. [Experiment notes](experiment.md) and [roadmap](roadmap.md): agreed direction, current mechanics and future scope.
3. [CHANGELOG.md](../CHANGELOG.md): what actually shipped, validation, reversals and remaining limits. Read recent entries before historical design comments.
4. [Architecture](architecture.md) and [source map](source-map.md): where to work. Edit `src/`, preserve classic-script assembly order, then rebuild the generated HTML.
5. [Foundation review](foundation-review-2026-10-31.md), [autosaves](autosave.md), [debug playground](debug-playground.md) and [art direction](art-direction.md): current system constraints and outstanding defects.

## Design decisions and user preferences

- Follow Matthias Mennel's original **Prospector**, retaining Prospector II's richer systems. It is a freelance exploration/crew/trade/science/salvage career with voluntary retirement. Deepen and balance existing systems before adding disconnected content.
- Encounters happen through actual movement, equipment, NPCs, hazards, transport and persistent consequences. Do not replace a playable situation with popup options that grant its outcomes. Mercy of Dawn is the reference implementation of that distinction.
- Mercy is an optional discovery when ordinary movement charts eligible empty space, not a guaranteed starting wreck or introductory coordinates message. Its explicit debug sample remains available. Preserve already-created encounters in old saves.
- The separate Expedition Journal and its buttons were removed. Use the existing **I → LOG → RECORDS** interface; do not restore another journal popup.
- Maintain modular sources and the single-file playable build. Player-facing text should explain the game, not development internals. Documentation belongs in repository guides.
- The galaxy and surface debug palettes must cover future catalog additions too. Use native interactions, support rebuilds and exact return to career, and keep debug state out of career saves. Controls: **Shift+B → F2/F3**, **F6** search, **Shift+F2** rebuild, **F7** simulation, **F4** career. Current spacing was tightened by about half at the user's request.
- Latest palette fix: casino/derelict samples use native cells and boarding paths; planetary/civilization samples preview their bodies instead of yellow-star wrappers. Ordinary galaxy systems still show their stars.
- Original ship art was recovered from a preserved GitHub mirror, not the defunct original website. Authentic source sheets, credits, reproducible import tooling and eight-way frames are in the repository. Preserve clean alpha compositing and distinct civilian silhouettes. The broader planetary art pass remains future work.
- Prefer fast scripted headless checks using real game actions. Browser-control gameplay is not the default. Fixtures are useful for regression scenarios, but must be distinguished from genuine careers. Do not grant resources, teleport or force outcomes in reported playthroughs, and do not rebalance the game to hide a testing pilot's mistakes.
- Keep the changelog and affected guides current with meaningful changes. Work on the experiment unless the user explicitly requests another branch or publication step.

## Open work and evidence limits

Autosave capacity, failure/recovery, shared file/storage compatibility repairs and invalid-import rollback were addressed in experimental.7. Remaining foundation findings include detached combat/dialogue object references after JSON reload, inconsistent action clocks, some naturally generated aquatic civilizations lacking water, and zero morale incorrectly defaulting to 55. The foundation review records reproductions and recommended priorities; these are not completed fixes.

Two long retirement-target attempts ended in death below 10,000 credits. The reports distinguish observed game behavior from pilot errors (late retreat, bleeding management, contact warnings and unsafe withdrawal). Read [first long career](long-career-2026-10-31.md) and [second attempt](retirement-attempt-2-2026-10-31.md) before making balance claims. Earlier short runs are in [playthroughs](playthroughs-2026-10-31.md).

At the last gameplay commit, all **45 repository tests** and GitHub CI passed. Additional local headless checks covered palette interactions/restoration/save isolation, all 67 galaxy samples and 80 unchanged orbital-render comparisons. Earlier art checks covered 384 ship-render combinations; autosave checks exercised actual IndexedDB failures and large saves. These are recorded results, not a claim that a fresh laptop has rerun them or that manual desktop playtesting occurred.

The extended Playwright harnesses, pilot controllers, raw traces, screenshots and packaged executables were local working files outside this Git repository. A clone includes the maintained tests, source assets, design guides and reports, but not those additional scripts/artifacts. If the original machine is unavailable, recreate focused headless checks from the documented cases and actual game functions before claiming equivalent new validation. No transfer ZIP was requested.

## Suggested opening message in the new chat

> Continue work on Sebo2203/Prospector-II, branch experiment/expedition-legacy. Read AGENTS.md, docs/handoff.md, the recent CHANGELOG entries, docs/experiment.md and docs/roadmap.md before making changes. Preserve the agreed design and use scripted testing against actual game actions. First tell me what you understand about the current state and outstanding priorities.
