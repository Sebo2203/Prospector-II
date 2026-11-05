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

    // Put a patrol in range, then use the real map controls and hail/reply keys.
    await page.evaluate(() => {
      G.neutralShips = [{ type: 'patrol', name: 'QA Station Patrol', x: G.ship.x + 1, y: G.ship.y }];
      renderAll();
    });
    const map = page.locator('#minimap-overlay');
    const mapButton = page.locator('#minimap-max-btn');
    async function askPatrolAboutThreats(key){
      await page.keyboard.press('h');
      assert.equal(await page.evaluate(() => G.dialogue?.id), 'galaxy_ship_patrol');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press(key);
      assert.equal(await page.evaluate(() => G.dialogue?.node), 'threats');
      assert.equal(await map.isVisible(), false, 'the dialogue reply must not reopen the galaxy map');
      await page.keyboard.press('Escape');
    }

    await mapButton.click();
    assert.equal(await map.isVisible(), true);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'minimap-overlay');
    await page.keyboard.press('Escape');
    assert.equal(await map.isVisible(), false);
    assert.equal(await page.evaluate(() => document.activeElement === document.body), true);
    await askPatrolAboutThreats('Enter');

    await mapButton.click();
    await map.click({position: {x: 8, y: 8}});
    assert.equal(await map.isVisible(), false);
    await askPatrolAboutThreats('Space');

    await page.keyboard.press('m');
    assert.equal(await map.isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await map.isVisible(), false);
    await askPatrolAboutThreats('Enter');

    await page.keyboard.press('m');
    assert.equal(await map.isVisible(), true);
    await page.keyboard.press('m');
    assert.equal(await map.isVisible(), false);
    await askPatrolAboutThreats('2');

    // Dialogue still owns Enter and Space if the player tabs to the map button.
    for(const key of ['Enter', 'Space']){
      await mapButton.focus();
      await askPatrolAboutThreats(key);
    }
    await mapButton.evaluate(button => button.blur());

    const crewList = page.locator('#crew-list');
    const badges = crewList.locator('.crew-badge');
    assert.equal(await badges.count(), 4);
    await page.evaluate(() => {
      window.qaStartingCrew = G.crew;
      G.crew = [
        ...G.crew.map(person => ({ ...person, statuses: {} })),
        randomCrewMember('medic'),
        ...Array.from({length: 6}, () => randomCrewMember('mercenary')),
        randomCrewMember('redshirt'),
      ];
      G.crew[5].name = 'Merc & "One"';
      G.crew[5].hp = 4;
      G.crew[6].hp = 12;
      applyCrewStatus(G.crew[5], 'bleeding', { amount: 2, silent: true });
      applyCrewStatus(G.crew[5], 'broken_arm', { silent: true });
      applyCrewStatus(G.crew[2], 'hallucination', { silent: true });
      applyCrewStatus(G.crew[4], 'stunned', { duration: 0, silent: true });
      renderAll();
    });
    assert.deepEqual(await badges.evaluateAll(items => items.map(item => item.firstElementChild.textContent)),
      ['C', 'N', 'E', 'S', '+', 'm', 'm', 'm', 'm', 'm', 'm', 'r']);
    assert.equal(await badges.nth(5).getAttribute('title'),
      'Merc & "One" · Mercenary · 4/28 HP (critical) · Bleeding (level 2) · Broken Arm');
    assert.match(await badges.nth(5).getAttribute('class'), /crew-badge-critical/);
    assert.match(await badges.nth(6).getAttribute('class'), /crew-badge-low/);
    assert.match(await badges.nth(7).getAttribute('class'), /crew-badge-good/);
    assert.ok(await badges.nth(5).evaluate(badge => {
      const meter = badge.querySelector('.crew-badge-meter');
      const fill = parseFloat(getComputedStyle(meter, '::before').width);
      return fill > 0 && fill < meter.clientWidth;
    }));
    const condition = crewList.locator('.crew-badge-status');
    assert.equal(await condition.count(), 1);
    assert.equal(await condition.evaluate(el => getComputedStyle(el).animationName), 'crew-status-pulse');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await condition.evaluate(el => getComputedStyle(el).animationName), 'none');
    assert.equal(await condition.isVisible(), true);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    for(const viewport of [{width: 1400, height: 720}, {width: 800, height: 600}]){
      await page.setViewportSize(viewport);
      assert.ok(await badges.evaluateAll(items => {
        const row = items[0].parentElement;
        const firstTop = items[0].getBoundingClientRect().top;
        return items.every(item => item.getBoundingClientRect().top === firstTop) && row.scrollWidth <= row.clientWidth;
      }), 'all twelve badges fit on one row');
    }
    await page.setViewportSize({width: 1400, height: 720});
    await page.locator('#sidebar').screenshot({path: artifactPath('Crew-sidebar.png')});
    await page.evaluate(() => {
      removeCrewStatus(G.crew[5], 'bleeding', true);
      removeCrewStatus(G.crew[5], 'broken_arm', true);
      renderAll();
    });
    assert.equal(await condition.count(), 0);
    assert.match(await badges.nth(5).getAttribute('class'), /crew-badge-critical/);
    await page.evaluate(() => {
      G.crew[5].hp = 0;
      renderAll();
    });
    assert.equal(await badges.count(), 11);
    await page.evaluate(() => {
      G.crew = [];
      renderSidebar();
    });
    assert.match(await crewList.textContent(), /All crew dead!/);
    await page.evaluate(() => {
      G.crew = window.qaStartingCrew;
      renderAll();
    });
    await page.keyboard.press('i');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('x');
    assert.match(await crewList.textContent(), /MORALE.*STATUS/s);
    assert.equal(await badges.count(), 0);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => G.mode), 'galaxy');
    assert.equal(await badges.count(), 4);

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
      await page.waitForFunction(({width,height})=>{
        const scale=Math.min(width/GAME_W,height/GAME_H);
        return Math.abs(document.getElementById('root').getBoundingClientRect().width-GAME_W*scale)<1;
      },viewport);
      const fits = await panel.evaluate(el=>{
        const bounds=el.getBoundingClientRect();
        const root=document.getElementById('root').getBoundingClientRect();
        return bounds.width>0 && bounds.height>0 && bounds.left>=root.left && bounds.top>=root.top &&
          bounds.right<=root.right && bounds.bottom<=root.bottom;
      });
      assert.ok(fits,'barter stays inside the scaled game at '+viewport.width+'×'+viewport.height);
      assert.equal(await panel.evaluate(el => el.scrollWidth > el.clientWidth), false);
    }
    await page.setViewportSize({width: 1400, height: 720});
    await page.screenshot({ path: artifactPath('Barter-bounds.png') });
    await page.keyboard.press('Tab');
    assert.equal(await panel.isVisible(), false);
    assert.equal(await page.evaluate(() => G.inventory.some(item => item.name.startsWith('Trade good 27 '))), true);
    await page.keyboard.press('Enter');
    assert.equal(await panel.isVisible(), true);
    await page.locator('#barter-player-list [data-barter-row="0"]').click();
    await page.locator('#barter-civ-list [data-barter-row="0"]').click();
    await page.locator('#barter-confirm-hint').click();
    assert.equal(await panel.isVisible(), false);
    assert.equal(await page.evaluate(() => G.inventory.some(item => item.name.startsWith('Trade good 0 '))), true);
    assert.equal(await banner.isVisible(), false);
    assert.deepEqual(errors, []);
    console.log('PASS: compact crew status, map focus and patrol replies, actionable banners, Mercy action hints and pump examine, and mouse and keyboard barter.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
