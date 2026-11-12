# Continue development on another computer

## Current Hal 3000 handoff — 2026-11-12

The latest development snapshot is **0.28.0-experimental.105**, career schema **6**, on **`codex/hal3000-handoff`**. Use this branch to continue the current work; the public `main` and older experimental branch do not contain this handoff.

```sh
git clone --branch codex/hal3000-handoff https://github.com/Sebo2203/Prospector-II.git
cd Prospector-II
npm run build
npm test
```

Open the root `index.html` to play. The handoff includes the integrated sounds and retained source/license manifests, equipment audit/fixes, Roman core details, first-result scan audio, optional named rescue, shared doors/pixel art/examination, passenger care/closure, and manual U helmets. QA setup remains in `qa/README.md`. Personal saves, generated previews/traces, local transfer archives/keys and private lore are excluded.

### Next requested work — not implemented yet

- Remove isolation pods entirely: folded item, rack, occupied-pod cargo/state, art, controls, transport and jettison handling. This event depicts an ordinary ship whose people became infected. It may have a sickbay used as an isolation ward, but it is not equipped to handle contagious infections.
- Trim the excessive instructional prose and hints aboard the rescue ship. Preserve truthful observations and necessary critical warnings, without teaching each solution in advance.
- Move medical/antibiotic interactions into actual buttons in the selected survivor's normal Examine panel, with matching keyboard handling and ordinary range/visibility/action checks. Remove those medical controls from the normal context bar. Enter-to-follow can remain normally available.
- Add a very inconspicuous persisted volume control: the user finds landing/liftoff loud. It must adjust both recorded samples and synthesized effects. No volume change/control has been implemented yet.

Further survivor story/background, developing patient illness, richer aftermath and reconsidering the first-boarding clock remain deferred. A future major-station infection consequence is documented in `docs/story-missions.md`; it is not implemented.

The handoff upload is explicitly authorized. Further publication is still at the user's direction. New local playable filenames must be **`experimental.NNN.html`**, with no extra words. Private lore stays out of GitHub.

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

For the current chat, deliver each experimental candidate as a uniquely versioned standalone HTML file in ignored `outputs/`, linked directly in the chat. Bump the version in root `package.json`, rebuild, run the relevant checks and copy generated `index.html` byte-for-byte to `outputs/experimental.NNN.html` (for example `experimental.105.html`). Never overwrite a previously delivered candidate. This gives each review a distinct file and visible version. Do not upload or publish to GitHub until the user explicitly requests it. When publishing, use the branch and scope the user requested.
