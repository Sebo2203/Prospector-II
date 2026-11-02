// package.json is the only manually maintained current release version.
const fs = require('node:fs');
const path = require('node:path');

function gameVersion(root) {
  const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z]+(?:\.[0-9A-Za-z]+)*))?$/.exec(version);
  if (!match) throw new Error('Invalid game version in package.json');
  const [, major, minor, patch, prerelease] = match;
  const label = `v${major}.${minor}${patch === '0' ? '' : '.' + patch}${prerelease ? ' ' + prerelease : ''}`;
  return { version, label };
}

function versionSource(text, { version, label }) {
  return text.replaceAll('__GAME_VERSION_LABEL__', label).replaceAll('__GAME_VERSION__', version);
}

function syncVersions(root, check = false) {
  const { version } = gameVersion(root);
  const updates = [];
  for (const file of ['desktop/package.json', 'desktop/package-lock.json', 'desktop/src-tauri/tauri.conf.json']) {
    const before = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
    const data = JSON.parse(before);
    data.version = version;
    if (file.endsWith('package-lock.json')) data.packages[''].version = version;
    updates.push([file, before, JSON.stringify(data, null, 2) + '\n']);
  }
  for (const [file, pattern] of [
    ['desktop/src-tauri/Cargo.toml', /(\[package\][\s\S]*?\nversion = ")[^"]+("[,\r\n])/],
    ['desktop/src-tauri/Cargo.lock', /(\[\[package\]\]\nname = "prospector-ii-desktop"\nversion = ")[^"]+("[,\r\n])/],
  ]) {
    const before = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
    if (!pattern.test(before)) throw new Error(`Cannot find game package version in ${file}`);
    updates.push([file, before, before.replace(pattern, (_, prefix, suffix) => prefix + version + suffix)]);
  }
  const stale = updates.filter(([, before, after]) => before !== after);
  if (check && stale.length) throw new Error('Stale release metadata: ' + stale.map(([file]) => file).join(', ') + '. Run npm run build.');
  for (const [file, , after] of stale) fs.writeFileSync(path.join(root, file), after, 'utf8');
  return stale.map(([file]) => file);
}

module.exports = { gameVersion, versionSource, syncVersions };
