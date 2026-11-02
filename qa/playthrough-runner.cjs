const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium, gameUrl, artifactPath, fixtureFile, root } = require('./runtime.cjs');

const profiles = {
  short: [
    { id: 'scout', kind: 'survey', ship: 'LIGHT_SCOUT', captain: 'Mara Vale', name: 'Far Lantern', seed: 104729 },
    { id: 'freighter', kind: 'trade', ship: 'BULK_FREIGHTER', captain: 'Elias Voss', name: 'Quiet Profit', seed: 130363 },
    { id: 'corvette', kind: 'rescue', ship: 'ATTACK_CORVETTE', captain: 'Rin Calder', name: 'Second Chance', seed: 155921 }
  ],
  long: [{ id: 'long-scout', kind: 'survey', ship: 'LIGHT_SCOUT', captain: 'Mara Vale', name: 'Far Lantern II', seed: 104729, retirementTarget: 10000 }],
  retirement: [{ id: 'retirement-attempt-2', kind: 'survey', ship: 'LIGHT_SCOUT', captain: 'Mara Vale', name: 'Far Lantern III', seed: 104729, retirementTarget: 10000 }]
};

function argumentsFor(mode, args) {
  const options = { maxActions: mode === 'short' ? 1000 : mode === 'long' ? 20000 : 50000, maxMinutes: 15, seed: null, ship: null, resume: null };
  for (let i = 0; i < args.length; i++) {
    const flag = args[i], value = args[++i];
    if (!['--max-actions', '--max-minutes', '--seed', '--ship', '--resume'].includes(flag) || !value) throw Error(`Unknown or incomplete option ${flag}`);
    if (flag === '--ship') options.ship = value;
    else if (flag === '--resume') options.resume = path.resolve(value);
    else {
      const n = Number(value);
      if (!Number.isSafeInteger(n) || n < (flag === '--seed' ? 0 : 1) || (flag === '--seed' && n > 0xffffffff)) throw Error(`Invalid value for ${flag}`);
      options[{ '--max-actions': 'maxActions', '--max-minutes': 'maxMinutes', '--seed': 'seed' }[flag]] = n;
    }
  }
  if (options.resume && mode === 'short') throw Error('Resume a single long/retirement run, not the three-career suite.');
  return options;
}

async function run(mode, args = process.argv.slice(2)) {
  if (!profiles[mode]) throw Error(`Unknown playthrough mode ${mode}`);
  const options = argumentsFor(mode, args);
  let selected = profiles[mode].filter(p => !options.ship || p.ship === options.ship);
  if (!selected.length) throw Error('No profile matches --ship; use LIGHT_SCOUT, BULK_FREIGHTER or ATTACK_CORVETTE (short suite).');
  selected = selected.map(p => ({ ...p, ...(options.seed === null ? {} : { seed: options.seed }) }));
  const resumed = options.resume ? JSON.parse(fs.readFileSync(options.resume, 'utf8')) : null;
  if (resumed && (resumed.game?.dead || resumed.game?.retired)) throw Error('Cannot resume a finished career. Start fresh; outcomes are not reversed.');
  if (resumed && (!resumed.game?.galaxy || !resumed.pilot?.profile || !Number.isSafeInteger(resumed.randomState))) throw Error('Invalid simulation checkpoint.');
  if (resumed) selected = [resumed.pilot.profile];
  const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
  let commit = null;
  try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch {}
  const pilotFile = mode === 'long' ? fixtureFile('pilot-experimental8.js') : path.join(__dirname, 'playthrough-pilot.js');
  const browser = await chromium.launch({ headless: true }), reports = [];
  try {
    for (const config of selected) {
      const context = await browser.newContext({ viewport: { width: 1400, height: 720 } });
      try {
        const page = await context.newPage(), errors = [];
        await context.route(/^https?:/, route => route.abort());
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error' && message.text().includes('Prospector input error')) errors.push(message.text()); });
        page.on('dialog', dialog => dialog.accept());
        await page.goto(gameUrl);
        await page.waitForFunction(() => typeof MENU_STATE !== 'undefined' && MENU_STATE.screen === 'main');
        if (resumed) {
          await page.evaluate(async c => {
            beginAutosaveCareer(); installSaveSnapshot(parseSaveSnapshot(JSON.stringify(c.game)));
            await loadSprites(); restoreGameUI(); renderAll();
          }, resumed);
        } else {
          await page.evaluate(c => {
            window.careerRngState = c.seed;
            Math.random = () => { careerRngState = (Math.imul(careerRngState, 1664525) + 1013904223) >>> 0; return careerRngState / 4294967296; };
            initGame(c.ship, c.captain, c.name);
          }, config);
          // Mercy is optional; never wait for or inject a starting encounter.
          await page.waitForFunction(() => G?.galaxy && G.log.some(e => e.msg.includes('Ready for departure')));
        }
        await page.addScriptTag({ content: fs.readFileSync(pilotFile, 'utf8') });
        await page.evaluate(c => installPlaythroughPilot(c), config);
        if (resumed) await page.evaluate(c => {
          Object.assign(PILOT, c.pilot); PILOT.resumeCount = (PILOT.resumeCount || 0) + 1;
          window.careerRngState = c.randomState;
          Math.random = () => { careerRngState = (Math.imul(careerRngState, 1664525) + 1013904223) >>> 0; return careerRngState / 4294967296; };
        }, resumed);
        assert.equal(await page.evaluate(() => !!DEBUG.on || !!G.debugPalette), false);
        console.log('START', config.id, JSON.stringify(await page.evaluate(() => ({ turn: G.turn, credits: G.credits, mercy: G.expedition?.quarantine && G.expedition.quarantine.discovered !== false ? 'discovered' : null, actions: PILOT.actions }))));
        let lastActions = -1, stalled = 0, nextReport = 0, reason = 'action limit';
        const deadline = Date.now() + options.maxMinutes * 60000;
        while (Date.now() < deadline) {
          const status = await page.evaluate(max => {
            for (let i = 0; i < 12 && !G.dead && !G.retired && !PILOT.stop && PILOT.actions < max; i++) playthroughStep();
            return { actions: PILOT.actions, turn: G.turn, mode: G.mode, credits: G.credits, fuel: G.fuel, hull: G.ship.hp, crew: G.crew.length, dead: !!G.dead, retired: !!G.retired, stop: PILOT.stop, forced: !!G.forcedMove?.active };
          }, options.maxActions);
          if (status.actions >= nextReport || status.dead || status.retired || status.stop || status.actions >= options.maxActions) {
            console.log('PROGRESS', config.id, JSON.stringify(status)); nextReport = status.actions + 250;
            fs.writeFileSync(artifactPath(`${config.id}-progress.json`), JSON.stringify(status, null, 2));
            // Checkpoints are generated test artifacts; no personal saves are bundled.
            fs.writeFileSync(artifactPath(`${config.id}-checkpoint.json`), await page.evaluate(() => JSON.stringify({ game: G, pilot: PILOT, randomState: careerRngState })));
          }
          if (errors.length) { reason = 'JavaScript error'; break; }
          if (status.dead || status.retired || status.stop || status.actions >= options.maxActions) { reason = status.dead ? 'death' : status.retired ? 'retirement' : status.stop || 'action limit'; break; }
          stalled = status.actions === lastActions && !status.forced ? stalled + 1 : 0;
          if (stalled >= 3) { reason = 'Pilot could not select a productive action'; await page.evaluate(reason => { PILOT.stop = reason; }, reason); break; }
          lastActions = status.actions;
          if (status.forced) await page.waitForTimeout(30);
        }
        if (Date.now() >= deadline) reason = 'wall-clock limit';
        const report = await page.evaluate(() => ({ ...playthroughSummary(), randomState: careerRngState, resumeCount: PILOT.resumeCount || 0 }));
        Object.assign(report, { version, commit, mode, pilot: path.basename(pilotFile), errors, stopReason: reason, limits: options });
        await page.evaluate(() => autoSave());
        await page.screenshot({ path: artifactPath(`${config.id}-ending.png`) });
        fs.writeFileSync(artifactPath(`${config.id}-trace.json`), JSON.stringify(report, null, 2) + '\n');
        reports.push(report);
        console.log('RESULT', config.id, JSON.stringify({ ending: report.ending, turn: report.turn, actions: report.actions, credits: report.credits, stopReason: reason, errors }));
        assert.deepEqual(errors, [], 'JavaScript errors during simulation');
        assert.ok(report.actions > 0, 'Pilot must make actual native actions');
        assert.ok(report.turn > 0, 'Fresh simulation must advance the game clock');
      } finally { await context.close(); }
    }
    fs.writeFileSync(artifactPath(`${mode}-summary.json`), JSON.stringify({ version, commit, method: 'Seeded native-action careers in isolated browser profiles; debug off; no resource/world fixtures; explicit bounds; no outcome rerolls. Current game/policy may differ from historical reports.', reports }, null, 2) + '\n');
    return reports;
  } finally { await browser.close(); }
}

module.exports = { run, argumentsFor };
