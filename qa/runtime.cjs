const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const playwright = require('playwright');

const root = path.resolve(__dirname, '..');
const output = path.resolve(process.env.PROSPECTOR_QA_OUTPUT || path.join(__dirname, 'artifacts'));
fs.mkdirSync(output, { recursive: true });

// Default to Playwright's installed Chromium on Windows, macOS and Linux.
// Optional channels (e.g. msedge) use a browser installed on this machine.
const chromium = {
  launch(options = {}) {
    const channel = process.env.PROSPECTOR_QA_CHANNEL;
    return playwright.chromium.launch({ ...options, ...(channel ? { channel } : {}) });
  }
};

module.exports = {
  chromium,
  root,
  gameUrl: pathToFileURL(path.join(root, 'index.html')).href,
  artifactPath: filename => path.join(output, filename),
  fixtureFile: filename => path.join(__dirname, 'fixtures', filename)
};
