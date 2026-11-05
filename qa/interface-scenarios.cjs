const { chromium, gameUrl, artifactPath } = require('./runtime.cjs');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 720 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route(/^https?:/, route => route.abort());
    await page.goto(gameUrl);
    await page.evaluate(() => initGame('LIGHT_SCOUT', 'Interface QA', 'Interface QA'));
    await page.waitForFunction(() => G?.galaxy && G.log.some(entry => entry.msg.includes('Ready for departure')));

    const banner = page.locator('#msg-bar');
    const actions = page.locator('#ctx-bar');
    await page.evaluate(() => {
      addLog('[Radio] Routine traffic report.', 'li');
      addLog('Crew member fell during the fight.', 'lc');
      G.fuel = Math.floor(G.maxFuel * 0.4);
      renderAll();
    });
    assert.equal(await banner.isVisible(), false);
    assert.match(await page.locator('#log-list').textContent(), /Routine traffic report/);
    await page.evaluate(() => { G.fuel = Math.floor(G.maxFuel * 0.2); renderAll(); });
    assert.match(await banner.textContent(), /FUEL CRITICAL/);
    assert.equal(await banner.isVisible(), true);
    await page.evaluate(() => {
      G.fuel = G.maxFuel;
      G.stranded = { rescuePhase: 'offer' };
      renderCriticalBanner();
    });
    assert.match(await banner.textContent(), /RESCUE OFFERED/);
    await page.evaluate(() => { G.stranded = null; renderAll(); });
    assert.equal(await banner.isVisible(), false);

    await page.evaluate(() => { debugEnterPalette('galaxy'); debugPaletteVisit('galaxy:QUARANTINE'); });
    assert.match(await actions.textContent(), /\[Enter\] Board Mercy of Dawn/);
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => quarantineInterior()), true);
    assert.match(await actions.textContent(), /\[Enter\] Transfer passengers/);

    // Isolate each normal interaction while keeping the real Mercy deck and input handler.
    await page.evaluate(() => {
      G.player = { x: 6, y: 9 };
      renderAll();
    });
    assert.match(await actions.textContent(), /\[Enter\] Open pressure hatch/);
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => G.planets[G.curPlanet].grid[8][6].type), 'q_open_door');
    assert.doesNotMatch(await actions.textContent(), /\[Enter\] Open pressure hatch/);
    await page.evaluate(() => {
      G.player = { x: 5, y: 4 };
      renderAll();
    });
    assert.match(await actions.textContent(), /\[Enter\] Read bridge terminal/);
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => G.expedition.quarantine.rosterKnown), true);
    assert.doesNotMatch(await actions.textContent(), /reserve|air|lift off/i);
    await page.evaluate(() => {
      G.player = { x: 7, y: 15 };
      revealPlanet(G.curPlanet, 7, 15);
      G.inventory.push({ usable: 'repair_kit', name: 'Repair Kit' });
      renderAll();
    });
    assert.match(await actions.textContent(), /\[Enter\] Repair life support/);
    assert.match(await page.evaluate(() => quarantineExamine(7, 15).desc), /Reserve: \d+ turns/);
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => G.expedition.quarantine.repaired), true);
    await page.evaluate(() => {
      G.player = { x: 8, y: 4 };
      const survivor = G.expedition.quarantine.survivors.find(person => person.id === 'mira');
      Object.assign(survivor, { x: 8, y: 5, status: 'waiting' });
      renderAll();
    });
    assert.match(await actions.textContent(), /\[Enter\] Ask Mira Vale to follow/);
    await page.keyboard.press('Enter');
    assert.match(await actions.textContent(), /\[Enter\] Ask Mira Vale to wait/);

    await page.evaluate(() => {
      G.inventory.push({ name: 'Armed charge', usable: 'c4', _armed: true, _c4Timer: 1 });
      renderAll();
    });
    assert.match(await banner.textContent(), /C4 ARMED/);
    await page.evaluate(() => {
      G.inventory = G.inventory.filter(item => item.usable !== 'c4');
      G.expedition.quarantine.air = 0;
      G.expedition.quarantine.repaired = false;
      G.oxygen = 20;
      DEBUG.infiniteOxy = false;
      renderAll();
    });
    assert.match(await banner.textContent(), /OXYGEN CRITICAL/);
    await page.evaluate(() => debugReturnFromPalette());
    assert.equal(await banner.isVisible(), false);

    await page.evaluate(() => {
      debugEnterPalette('galaxy');
      const entry = G.debugPalette.entries.find(entry => entry.kind === 'civilization' && entry.aggression === 'Passive' && entry.tier === 'information');
      if(!entry) throw Error('No passive civilization fixture');
      debugPaletteVisit(entry.id);
      const pdata = G.planets[G.curPlanet];
      const civ = pdata.civilization;
      ensureCivilizationState(pdata).relation = 25;
      civ.species = 'Test' + 'CivilizationName'.repeat(22);
      G.inventory = Array.from({length: 28}, (_, i) => ({
        name: 'Offer ' + i + ' ' + 'UnbrokenItemName'.repeat(13),
        value: 10000,
      }));
      G.cargo = [];
      civ._barterStock = Array.from({length: 28}, (_, i) => ({
        name: 'Trade good ' + i + ' ' + 'LongStockName'.repeat(14),
        value: 1,
        qty: 1,
      }));
      startCivilizationDialogue({ pdata }, 'trade');
    });
    assert.match(await actions.textContent(), /\[Enter\] Open barter screen/);
    await page.keyboard.press('Enter');
    const panel = page.locator('#barter-panel');
    assert.equal(await panel.isVisible(), true);
    assert.match(await actions.textContent(), /\[Enter\] Offer selected item/);
    await page.keyboard.press('ArrowUp');
    assert.equal(await page.evaluate(() => BARTER.playerSel), 27);
    assert.ok(await page.locator('#barter-player-list').evaluate(el => el.scrollTop) > 0);
    await page.keyboard.press('Enter');
    assert.match(await actions.textContent(), /\[Enter\] Remove from offer/);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    assert.match(await actions.textContent(), /\[Enter\] Remove from request/);
    for(const id of ['#barter-player-list', '#barter-civ-list']){
      assert.ok(await page.locator(id).evaluate(list => {
        const row = list.lastElementChild;
        return row.offsetTop >= list.scrollTop &&
          row.offsetTop + row.offsetHeight <= list.scrollTop + list.clientHeight + 1;
      }), 'the selected row fits after both summaries grow');
    }

    for(const viewport of [{width: 800, height: 600}, {width: 1400, height: 720}, {width: 2560, height: 1440}]){
      await page.setViewportSize(viewport);
      const bounds = await panel.boundingBox();
      const root = await page.locator('#root').boundingBox();
      assert.ok(bounds && bounds.x >= root.x && bounds.y >= root.y &&
        bounds.x + bounds.width <= root.x + root.width && bounds.y + bounds.height <= root.y + root.height,
      'barter stays inside the scaled game at '+viewport.width+'×'+viewport.height);
      assert.equal(await panel.evaluate(el => el.scrollWidth > el.clientWidth), false);
    }
    await page.setViewportSize({width: 1400, height: 720});
    await page.screenshot({ path: artifactPath('Barter-bounds.png') });
    await page.keyboard.press('Tab');
    assert.equal(await panel.isVisible(), false);
    assert.equal(await page.evaluate(() => G.inventory.some(item => item.name.startsWith('Trade good 27 '))), true);
    assert.equal(await banner.isVisible(), false);
    assert.deepEqual(errors, []);
    console.log('PASS: actionable banners, Mercy action hints and pump examine, and native barter with long lists at three viewport sizes.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
