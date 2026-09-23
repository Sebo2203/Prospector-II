const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { assemble, build } = require('../tools/build-single-file');

test('preserves source order, shared globals, Unicode and literal replacement tokens', () => {
  const files = { 'src/a.js': 'const shared = "€ $& {{SECOND}}";\n', 'src/b.js': 'function readShared() { return shared; }\n' };
  const result = assemble('<script>{{GAME}}</script>', { GAME: Object.keys(files) }, file => files[file]);
  assert.equal(result, `<script>${Object.values(files).join('')}</script>`);
});

test('rejects omitted, unknown and duplicate placeholders', () => {
  assert.throws(() => assemble('{{MISSING}}', {}, () => ''), /must match/);
  assert.throws(() => assemble('', { EXTRA: ['src/a.js'] }, () => ''), /must match/);
  assert.throws(() => assemble('{{GAME}}{{GAME}}', { GAME: ['src/a.js'] }, () => ''), /Duplicate template/);
});

test('rejects duplicate sources, unsafe paths and empty sections', () => {
  for (const files of [['src/a.js', 'src/a.js'], ['src/../outside.js'], []]) {
    assert.throws(() => assemble('{{GAME}}', { GAME: files }, () => ''));
  }
});

test('rejects syntax errors and collisions across otherwise valid files', () => {
  assert.throws(() => assemble('<script>{{GAME}}</script>', { GAME: ['src/a.js'] }, () => 'const = ;'), SyntaxError);
  assert.throws(() => assemble('<script>{{GAME}}</script>', { GAME: ['src/a.js', 'src/b.js'] }, () => 'const duplicate = 1;\n'), SyntaxError);
});

test('rejects script-closing text that would break inline HTML', () => {
  assert.throws(() => assemble('<script>{{GAME}}</script>', { GAME: ['src/a.js'] }, () => 'const html = "</script>";'), /closing tag/);
});

test('normalizes Windows source line endings', () => {
  assert.equal(assemble('{{GAME}}', { GAME: ['src/a.js'] }, () => '// hello\r\n'), '// hello\n');
});

test('detects source files missing from the manifest', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'prospector-build-'));
  try {
    fs.mkdirSync(path.join(temporary, 'src'));
    fs.writeFileSync(path.join(temporary, 'src/index.template.html'), '{{GAME}}');
    fs.writeFileSync(path.join(temporary, 'src/build-manifest.json'), '{"GAME":["src/a.js"]}');
    fs.writeFileSync(path.join(temporary, 'src/a.js'), '// included\n');
    fs.writeFileSync(path.join(temporary, 'src/forgotten.js'), '// omitted\n');
    assert.throws(() => build(temporary), /missing from build manifest/);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
