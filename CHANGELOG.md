# Development changelog — main

This file records changes made to the public release branch. Earlier release
notes remain in [the historical changelog](Changelog%20Prospector%20II.txt) and
Git history. Experimental gameplay has its own changelog on
[`experiment/expedition-legacy`](https://github.com/Sebo2203/Prospector-II/blob/experiment/expedition-legacy/CHANGELOG.md).

## 2026-10-31 — Keep the README focused on players

- Removed “Experimental source layout” and all following development instructions
  from the root README. The introduction, play/download links and Windows launch
  information remain.
- Moved build, source-layout, architecture, roadmap and migration-audit guidance
  into [docs/development.md](docs/development.md), keeping technical information
  available separately from the player introduction.
- Added repository instructions to preserve that separation and record future
  meaningful changes alongside their implementation.
- Validation: checked document links, the documentation diff and that the playable
  HTML, source files and Windows download are unchanged. No local gameplay tests
  were rerun for this documentation-only change.
- Save compatibility: no effect. Game version unchanged.
