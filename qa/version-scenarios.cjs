const { chromium, gameUrl, root, artifactPath } = require('./runtime.cjs');
const { gameVersion } = require('../tools/version');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route(/^https?:/, route => route.abort());
    await page.goto(gameUrl);
    await page.waitForFunction(() => typeof drawMenuScreen === 'function' && typeof GAME_VERSION === 'string');
    const expected = gameVersion(root);
    assert.deepEqual(await page.evaluate(() => ({ version: GAME_VERSION, label: GAME_VERSION_LABEL })), expected);
    const footer = await page.evaluate(() => {
      const drawn = [], original = ctx.fillText;
      ctx.fillText = function (text, ...args) { drawn.push(text); return original.call(this, text, ...args); };
      try { drawMenuScreen(); } finally { ctx.fillText = original; }
      return drawn;
    });
    assert.ok(footer.includes(expected.label + '  —  Made by Sebastian'));
    await page.evaluate(() => initGame('LIGHT_SCOUT', 'Version QA', 'Version QA'));
    await page.waitForFunction(() => G?.galaxy && G.log.some(e => e.msg.includes('Ready for departure')));
    assert.equal(await page.locator('#version-tag span').last().textContent(), expected.label);
    assert.equal(await page.locator('#version-tag').isVisible(), true);
    await page.screenshot({ path: artifactPath('Version-labels.png') });
    assert.deepEqual(errors, []);
    console.log('PASS: package version matches runtime constants, canvas menu and visible in-game label; no JS errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
