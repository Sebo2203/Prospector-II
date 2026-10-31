const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const baseline = require('../docs/migration-baseline.json');
const { build } = require('./build-single-file');

const output = build();
assert.equal(Buffer.byteLength(output), baseline.bytes, 'The migration changed the HTML size');
assert.equal(crypto.createHash('sha256').update(output).digest('hex'), baseline.sha256,
  'Output differs from the original HTML. This audit is only expected to pass before intentional game changes.');
console.log(`Byte-identical to index.html at ${baseline.commit}; ${baseline.bytes} bytes.`);
