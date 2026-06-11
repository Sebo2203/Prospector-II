const fs = require('node:fs');
const path = require('node:path');
const { rebuildLedger } = require('./playtest-ledger');

const [filename, bucket, ...noteParts] = process.argv.slice(2);
if (!filename || !bucket) {
  console.error('Usage: node tools/review-playtest.js <report-file> <bucket> [notes]');
  process.exit(1);
}

const root = path.resolve(__dirname, '..');
const reportPath = path.resolve(root, 'playtest-reports', path.basename(filename));
if (!fs.existsSync(reportPath)) {
  console.error('Report not found: ' + reportPath);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
report.ledger = report.ledger || {};
report.ledger.review = {
  status: 'reviewed',
  bucket,
  notes: noteParts.join(' '),
};
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
rebuildLedger();
console.log(path.basename(reportPath) + ' classified as ' + bucket + '.');
