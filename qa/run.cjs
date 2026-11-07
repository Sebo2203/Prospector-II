const { spawnSync } = require('node:child_process');
const path = require('node:path');
const suites = {
  interface: 'interface-scenarios.cjs',
  'menu-input': 'menu-input-scenarios.cjs',
  stations: 'station-art-scenarios.cjs',
  version: 'version-scenarios.cjs',
  palette: 'palette-scenarios.cjs',
  previews: 'palette-icons-scenarios.cjs',
  ships: 'ship-art-scenarios.cjs',
  'ship-combat': 'ship-combat-scenarios.cjs',
  'combat-ui': 'combat-ui-scenarios.cjs',
  'ship-systems': 'ship-systems-scenarios.cjs',
  turns: 'turn-scenarios.cjs',
  morale: 'morale-scenarios.cjs',
  worldgen: 'foundation-worldgen.cjs',
  'ship-previews': 'ship-art-previews.cjs',
  encounters: 'encounter-discovery.cjs',
  rescue: 'spatial-scenarios.cjs',
  career: 'career-scenarios.cjs',
  log: 'log-tests.cjs',
  missions: 'active-missions-scenarios.cjs',
  autosave: 'autosave-scenarios.cjs'
};
const names = process.argv.slice(2);
const selected = names.length ? names : Object.keys(suites);
for (const name of selected) {
  if (!suites[name]) throw Error(`Unknown suite ${name}; choose ${Object.keys(suites).join(', ')}`);
}
for (const name of selected) {
  console.log(`\nRunning ${name}`);
  const result = spawnSync(process.execPath, [path.join(__dirname, suites[name])], {
    cwd: __dirname, stdio: 'inherit', timeout: 300000
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`\nPassed ${selected.length} headless suites.`);
