# Continue development on another computer

Clone the active experimental branch and open the resulting folder. Use Node.js 22 or newer.

```sh
git clone --branch experiment/expedition-legacy https://github.com/Sebo2203/Prospector-II.git
cd Prospector-II
```

Follow the [build and release workflow](architecture.md#development) to rebuild the standalone game and run the repository tests. The [testing guide](../qa/README.md) covers browser installation, scripted careers, regression scenarios, and generated reports.

For a fresh career, open the experimental HTML from the [download instructions](../README.md#play). To carry over an existing career, use the JSON export and import steps in [Autosaves and recovery](autosave.md).

## Resume in a fresh chat

> Continue development on Sebo2203/Prospector-II on `experiment/expedition-legacy`. Read `AGENTS.md` and the recent `CHANGELOG.md` entries. Use `docs/README.md` to find the relevant guide and `docs/roadmap.md` for priorities. Exercise gameplay changes with the scripted tests in `qa/` and keep the public release on `main` separate.

The [archive](archive/README.md) holds dated playthroughs and the original foundation audit. Use the [roadmap](roadmap.md) for the current follow-up list.
