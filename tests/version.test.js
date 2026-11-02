const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { gameVersion, syncVersions } = require('../tools/version');
const { build } = require('../tools/build-single-file');

test('one version bump updates HTML/runtime and desktop metadata without changing dependencies or history', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'prospector-version-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (file, text) => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), text); };
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const json = file => JSON.parse(read(file));
  for (const file of ['desktop/package.json', 'desktop/package-lock.json', 'desktop/src-tauri/tauri.conf.json', 'desktop/src-tauri/Cargo.toml', 'desktop/src-tauri/Cargo.lock']) {
    write(file, fs.readFileSync(path.join(__dirname, '..', file), 'utf8'));
  }
  const lockDependencies = json('desktop/package-lock.json').packages;
  delete lockDependencies[''];
  const rustDependencies = read('desktop/src-tauri/Cargo.lock').replace(/(name = "prospector-ii-desktop"\r?\nversion = ")[^"]+/, '$1GAME_VERSION');
  write('package.json', JSON.stringify({ version: '1.4.2-experimental.99' }));
  write('CHANGELOG.md', 'Historical release: 0.28 experimental.12\n');
  write('src/index.template.html', '<span>__GAME_VERSION_LABEL__</span><script>{{GAME}}</script>');
  write('src/build-manifest.json', JSON.stringify({ GAME: ['src/game.js'] }));
  write('src/game.js', "const GAME_VERSION='__GAME_VERSION__'; const GAME_VERSION_LABEL='__GAME_VERSION_LABEL__';");
  assert.throws(() => syncVersions(root, true), /Stale release metadata/);
  assert.equal(syncVersions(root).length, 5);
  assert.deepEqual(syncVersions(root, true), []);
  assert.match(build(root), /<span>v1\.4\.2 experimental\.99<\/span>/);
  assert.match(build(root), /GAME_VERSION='1\.4\.2-experimental\.99'/);
  for (const file of ['desktop/package.json', 'desktop/package-lock.json', 'desktop/src-tauri/tauri.conf.json']) assert.equal(json(file).version, '1.4.2-experimental.99');
  assert.equal(json('desktop/package-lock.json').packages[''].version, '1.4.2-experimental.99');
  const afterDependencies = json('desktop/package-lock.json').packages;
  delete afterDependencies[''];
  assert.deepEqual(afterDependencies, lockDependencies);
  assert.equal(read('desktop/src-tauri/Cargo.lock').replace(/(name = "prospector-ii-desktop"\r?\nversion = ")[^"]+/, '$1GAME_VERSION').replace(/\r\n/g, '\n'), rustDependencies.replace(/\r\n/g, '\n'));
  assert.match(read('desktop/src-tauri/Cargo.toml'), /version = "1\.4\.2-experimental\.99"/);
  assert.equal(read('CHANGELOG.md'), 'Historical release: 0.28 experimental.12\n');
  write('package.json', JSON.stringify({ version: '2.0.0' }));
  assert.equal(gameVersion(root).label, 'v2.0');
  write('package.json', JSON.stringify({ version: '</script>' }));
  assert.throws(() => gameVersion(root), /Invalid game version/);
});
