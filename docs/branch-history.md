# Branches

After the October 31, 2026 cleanup:

| Branch | Purpose |
| --- | --- |
| `main` | Latest pre-experiment modular gameplay snapshot and GitHub Pages source |
| `experiment/expedition-legacy` | Active modular development and autonomous gameplay experiments |

Before cleanup, the public release was not modular. `modular-source-experiment` contained the source extraction and roadmap. `dev-build` carried that work plus the subsequent gameplay fixes, walkable casino and laptop/desktop build handoff. Its README's Play link still opened the public release, which explains why selecting the branch did not show its changes in the hosted game.

After cleanup, the exact archived `dev-build` files were promoted to `main` in commit `e9b6f36`, at the owner's request. Main now includes modular sources and all pre-experiment gameplay changes. The journal and quarantine development remain on the experiment branch.

The experiment starts from `dev-build` (`e3ffe10`) and retains the history of `main`. The old tips are preserved as annotated tags so the branch list can stay small without losing work:

| Removed development branch | Archive tag | Original tip |
| --- | --- | --- |
| `modular-source-experiment` | `archive/modular-source-experiment-2026-10-31` | `ef756f54e9285aa99d24467ae8389e7a5d6ea600` |
| `dev-build` | `archive/dev-build-2026-10-31` | `e3ffe10` |

The obsolete modular extraction draft PR is closed once the consolidated experimental branch is published. The old `Development handoff.txt` is historical; use this branch and the README for current instructions.

To inspect an archived version, create a local branch from its tag, for example:

```sh
git switch -c inspect-old-dev archive/dev-build-2026-10-31
```

Switching branches in GitHub does not switch GitHub Pages. To play this experiment, download this branch's ZIP, extract it, and open its `index.html`; or build its desktop source. The main-branch download remains the public release.
