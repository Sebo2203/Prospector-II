# Prospector II

A sci-fi roguelike about exploring space, surveying planets, managing a crew, and trying to retire rich enough to survive the void.

## Play

- [Play in browser](https://sebo2203.github.io/Prospector-II/)
- [Download Windows desktop app](https://sebo2203.github.io/Prospector-II/downloads/Prospector-II-v0.25-portable.exe)

The desktop app is a standalone Windows executable. Download it, double-click it, and Prospector II launches fullscreen.

Note: Windows may show a SmartScreen warning because the app is not code-signed yet. Choose **More info** then **Run anyway** if you trust the download.

## Autonomous playtesting

An opt-in semantic playtester is available for balance and polish testing. It
reads the game's internal state and invokes game actions directly; it does not
use Playwright, screenshots, or visual browser automation. Production
`index.html` does not load the playtester.

1. Run `start-playtest.cmd`.
2. Open `http://127.0.0.1:4173`.
3. Click `START 5000` in the playtest controls at the bottom-right.

When the game is on its main menu, the agent starts a fresh run automatically,
chooses a ship class, and generates captain and ship names. Game sound effects
are muted while the agent is active and restored when the run stops.

Click `STOP` to end a run early and `SAVE REPORT` to write its full telemetry
trace into `playtest-reports`. The local development server injects
`playtest-agent.js` in memory, so there is only one game source file and no
playtest code in production.

Each saved report contains a compact `ledger` classification. Saving also
rebuilds these aggregate files from every report:

- `playtest-reports/playtest-ledger.csv` for spreadsheets and charts.
- `playtest-reports/playtest-ledger.json` for scripts and deeper analysis.
- `playtest-reports/playtest-summary.json` for outcome and death totals.

Automatic buckets deliberately separate `tester-gap`, `death-needs-review`,
`baseline`, and `partial-run`. The editable `ledger.review` fields can later
record whether a run was a tester problem, genuine balance evidence, or an
expected player death. Run `node tools/playtest-ledger.js` to backfill or
rebuild the ledger manually. Reviewed classifications can be recorded with:

`node tools/review-playtest.js <report-file> <bucket> "review notes"`
