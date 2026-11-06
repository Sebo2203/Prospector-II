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
    async function checkMainMenu(keys) {
      assert.deepEqual(await page.evaluate(() => MENU_STATE._opts.map(option => option.key)), keys);
      await page.keyboard.press('v');
      assert.equal(await page.evaluate(() => MENU_STATE.screen), 'main');
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => MENU_STATE.screen), 'credits');
      await page.keyboard.press('Escape');
      const optionsCenter = await page.evaluate(() => {
        const button = MENU_STATE._btnRects[MENU_STATE._opts.findIndex(option => option.key === 'O')];
        const bounds = canvas.getBoundingClientRect();
        return {
          x: bounds.left + (button.x + button.w / 2) * bounds.width / canvas.clientWidth,
          y: bounds.top + (button.y + button.h / 2) * bounds.height / canvas.clientHeight,
        };
      });
      await page.mouse.click(optionsCenter.x, optionsCenter.y);
      assert.equal(await page.evaluate(() => MENU_STATE.screen), 'options');
      await page.keyboard.press('Escape');
    }
    await page.waitForFunction(() => AUTOSAVE_STATE.ready && MENU_STATE.screen === 'main');
    await checkMainMenu(['N', 'L', 'O', 'X', 'Q']);
    await page.screenshot({ path: artifactPath('Main-menu.png') });
    await page.evaluate(() => initGame('LIGHT_SCOUT', 'Version QA', 'Version QA'));
    await page.waitForFunction(() => G?.galaxy && G.log.some(e => e.msg.includes('Ready for departure')));
    assert.equal(await page.locator('#version-tag span').last().textContent(), expected.label);
    assert.equal(await page.locator('#version-tag').isVisible(), true);
    const tools = page.locator('#persist-bar');
    const status = page.locator('#version-tag');
    for(const bar of [tools,status]){
      assert.equal(await bar.evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)');
    }
    for(const width of [1400,800]){
      const height=width===1400?720:600;
      await page.setViewportSize({width,height});
      await page.waitForFunction(width=>Math.abs(document.getElementById('root').getBoundingClientRect().width-width)<0.1,width);
      for(const alert of [false,true]){
        const layout=await page.evaluate(alert=>{
          if(alert) showMsg('FUEL CRITICAL — return to Starbase immediately!', '#ff3300');
          else hideMsg();
          const root=document.getElementById('root'), status=document.getElementById('version-tag');
          return {
            inset:(root.getBoundingClientRect().bottom-status.getBoundingClientRect().bottom)*root.offsetWidth/root.getBoundingClientRect().width,
            banner:document.getElementById('msg-bar').classList.contains('visible'),
          };
        },alert);
        assert.equal(layout.banner,alert);
        assert.ok(Math.abs(layout.inset-1)<0.1,'the status strip sits against the inner bottom edge');
      }
    }
    await page.setViewportSize({width:1400,height:720});
    await page.evaluate(()=>hideMsg());
    await page.screenshot({ path: artifactPath('Version-labels.png') });
    await page.evaluate(() => returnToMainMenuFromGame());
    await page.waitForFunction(() => MENU_STATE.screen === 'main' && MENU_STATE.hasAutosave);
    assert.equal(await page.locator('#game-escape').isVisible(),false);
    await checkMainMenu(['C', 'N', 'L', 'O', 'X', 'Q']);
    assert.deepEqual(errors, []);
    console.log('PASS: version labels and bottom footer, main menu keyboard and mouse routes with and without a save, and retired V shortcut.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
