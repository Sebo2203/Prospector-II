# Continue development on another computer

To reproduce the newest published browser game and its source/tests, clone `main`. Use Node.js 22 or newer.

```sh
git clone --branch main https://github.com/Sebo2203/Prospector-II.git
cd Prospector-II
```

Ongoing development normally uses `experiment/expedition-legacy`. Publication is explicit: its remote head can differ from the latest local work or the version most recently promoted to `main`. Check root `package.json` on the branch you intend to use. Do not assume the experimental branch is newer simply from its name.

Follow the [build and release workflow](architecture.md#development) to rebuild the standalone game and run the repository tests. The [testing guide](../qa/README.md) covers browser installation, scripted careers, regression scenarios, and generated reports.

For a fresh career, open the HTML from the [download instructions](../README.md#play). To carry over an existing current-format career, use the JSON export and import steps in [Autosaves and recovery](autosave.md). The independently distributed Windows executable may be an older build; its download label identifies that version.

## Resume in a fresh chat

> Continue development on Sebo2203/Prospector-II. Confirm the branch and version first; `main` contains the published browser snapshot and `experiment/expedition-legacy` is the normal development branch. Read `AGENTS.md` and the recent `CHANGELOG.md` entries. Use `docs/README.md` to find the relevant guide and `docs/roadmap.md` for priorities. Exercise gameplay changes with the scripted tests in `qa/`. Publishing to either remote branch requires the user's instruction.

The [archive](archive/README.md) holds dated playthroughs and the original foundation audit. Use the [roadmap](roadmap.md) for the current follow-up list.

## Local review builds

For the current chat, deliver each experimental candidate as a uniquely versioned standalone HTML file in ignored `outputs/`, linked directly in the chat. Bump the version in root `package.json`, rebuild, run the relevant checks and copy generated `index.html` byte-for-byte to `outputs/Prospector-II-v<VERSION>.html`. Never overwrite a previously delivered candidate. This gives each review a distinct file and visible version. Do not upload or publish to GitHub until the user explicitly requests it. When publishing, use the branch and scope the user requested.
