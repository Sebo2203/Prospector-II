const assert = require('node:assert/strict');
const { chromium, gameUrl, artifactPath } = require('./runtime.cjs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 720 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.text().startsWith('Prospector input error:')) errors.push(message.text()); });
    await page.route(/^https?:/, route => route.abort());
    await page.goto(gameUrl);
    await page.evaluate(() => initGame('LIGHT_SCOUT', 'Resolution QA', 'Resolution QA'));
    await page.waitForFunction(() => G?.galaxy && G.log.some(entry => entry.msg.includes('Ready for departure')));
    await page.evaluate(() => {
      window.resolutionBase = serializeCareer(G);
      window.resolutionSetup = () => {
        clearShipCombatFeedback();
        installSaveSnapshot(parseSaveSnapshot(window.resolutionBase));
        G.ship.x = 10; G.ship.y = 10;
        for (let y = 8; y <= 12; y++) for (let x = 8; x <= 12; x++) G.galaxy[y][x] = { type: 'VOID' };
        G.pirates = []; G.neutralShips = []; G.gasEntities = [];
        G.pirateBases = []; G._pirateRoamerTarget = 0;
        G.credits = 0; G.cargo = []; G.installedWeapons = ['mass_driver'];
        Math.random = () => 0.5;
        const ship = { name: 'Disabled raider', x: 10, y: 10, homeX: 10, homeY: 10,
          hp: 80, maxHp: 80, atk: 6, guns: 1, engineRating: 2,
          shields: 0, maxShields: 0, alive: true, pirateType: 'guard' };
        G.pirates = [ship];
        startShipCombat(ship, true);
        G.shipCombat.asteroids = [];
        return G.shipCombat;
      };
      window.resolutionDisable = combat => {
        G.ship.systems.engine.condition = 0;
        combat.enemies[0].ship.systems.sensors.condition = 0;
        combat.enemies[0].ship.systems.engine.condition = 0;
      };
    });

    // A saved active stalemate resolves through normal keyboard wait, with one turn and no reward/reset.
    const before = await page.evaluate(async () => {
      const combat = window.resolutionSetup();
      window.resolutionDisable(combat);
      G.ship.hp -= 17; combat.enemies[0].ship.hp -= 11;
      G.ship.weaponReadyAt = [G.turn + 10];
      combat.weaponReady = G.ship.weaponReadyAt;
      if (!await autoSave() || !await loadFromStorage()) throw Error('Active combat save/load failed');
      return [G.turn, G.ship.hp, G.fuel, G.pirates[0].hp, G.ship.weaponReadyAt[0]];
    });
    await page.keyboard.press('Space');
    assert.deepEqual(await page.evaluate(() => [G.mode, G.turn, G.ship.hp, G.fuel, G.pirates[0].hp,
      G.ship.weaponReadyAt[0], G.ship.x, G.ship.y, G.credits, G.cargo.length, !!G.shipCombat, !!G.stranded]),
    ['galaxy', before[0] + 1, ...before.slice(1), 10, 10, 0, 0, false, true]);
    assert.ok(await page.evaluate(() => !G.pirates[0].combatRewardsResolved && G.pirates[0].alive &&
      G.ship.systems.engine.condition === 0 && G.pirates[0].systems.sensors.condition === 0));
    await page.keyboard.press('t');
    assert.ok(await page.evaluate(() => G.stranded.sos));
    await page.keyboard.press('Space');
    assert.ok(await page.evaluate(() => G.mode === 'galaxy' && G.stranded && !G.shipCombat && G.stranded.turnsStranded === 1),
      'the same disabled enemy cannot trap SOS processing in repeated encounters');
    assert.ok(await page.evaluate(async () => await autoSave() && await loadFromStorage() && G.stranded.sos));

    // A real adjacent NPC offers existing rescue services; acceptance repairs without creating fuel.
    await page.evaluate(() => {
      G.neutralShips = [{ name: 'Rescuer', type: 'cargo', x: 10, y: 11, hp: 60, maxHp: 60,
        engineRating: 1, speed: 1, guns: 0, shields: 0, alive: true, rescuing: true,
        fuelGift: 0, rescueCost: 0 }];
    });
    await page.locator('.cmp-center').click();
    assert.ok(await page.evaluate(() => G.stranded?.rescuePhase === 'offer'));
    const offerTurn = await page.evaluate(() => G.turn);
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(() => G.turn), offerTurn, 'keyboard wait preserves a pending rescue offer');
    await page.screenshot({ path: artifactPath('Combat-stalemate-SOS.png') });
    await page.keyboard.press('y');
    assert.ok(await page.evaluate(() => !G.stranded && effectiveEngineRating() > 0 && G.mode === 'galaxy'));

    // No fuel still means lethal life-support exposure, not a free recovery.
    const crewBefore = await page.evaluate(() => {
      const combat = window.resolutionSetup(); window.resolutionDisable(combat); G.fuel = 0;
      advanceShipCombat();
      return G.crew.map(crew => crew.hp);
    });
    await page.keyboard.press('Space');
    assert.deepEqual(await page.evaluate(() => G.crew.map(crew => crew.hp)), crewBefore.map(hp => Math.max(0, hp - 3)));

    // A newly arrived operational enemy can still engage a stranded player.
    assert.ok(await page.evaluate(() => {
      G.pirates.push({ name: 'Fresh raider', x: 10, y: 10, homeX: 10, homeY: 10, hp: 50, maxHp: 50,
        atk: 6, guns: 1, engineRating: 3, alive: true, pirateType: 'guard' });
      doStrandedWait();
      return G.mode === 'shipcombat' && !G.stranded && G.shipCombat.foughtWhileStranded;
    }));

    // Temporary weapon delays, an available player shot, enemy fire, or a mobile wingman keep combat active.
    for (const kind of ['reload-and-heat', 'player-shot', 'enemy-shot', 'mobile-wingman', 'moving-civilian']) {
      assert.ok(await page.evaluate(kind => {
        const combat = window.resolutionSetup(); window.resolutionDisable(combat);
        const enemy = combat.enemies[0];
        if (kind === 'mobile-wingman') {
          const wing = { ...enemy.ship, name: 'Mobile wing', systems: undefined, systemStats: undefined,
            installedWeapons: undefined, engineRating: 2 };
          G.pirates.push(wing); createShipCombatArena(combat, G.pirates); combat.asteroids = [];
        } else if (kind === 'moving-civilian') {
          enemy.ship.systems.engine.condition = 100; enemy.ship.systems.sensors.condition = 100;
          enemy.ship.systemStats.weaponSlots = 0;
        } else {
          enemy.x = combat.player.x + 4; enemy.y = combat.player.y;
          if (kind !== 'player-shot') enemy.ship.systems.sensors.condition = 100;
          if (kind === 'enemy-shot') G.installedWeapons = [];
          if (kind === 'reload-and-heat') {
            G.ship.heat = shipHeatCapacity(); enemy.ship.heat = shipHeatCapacity(enemy.ship);
          }
          G.ship.weaponReadyAt[0] = G.turn + 20; enemy.ship.weaponReadyAt[0] = G.turn + 20;
        }
        const stalled = shipCombatStalemated(combat);
        advanceShipCombat();
        return !stalled && G.mode === 'shipcombat' && !!G.shipCombat;
      }, kind), kind);
    }

    // Cover between permanently immobile ships can also stall, and a failed edge withdrawal can create a stall.
    assert.ok(await page.evaluate(() => {
      const combat = window.resolutionSetup(); window.resolutionDisable(combat);
      const enemy = combat.enemies[0]; enemy.ship.systems.sensors.condition = 100;
      enemy.x = combat.player.x + 4; enemy.y = combat.player.y;
      combat.asteroids = [{ x: combat.player.x + 2, y: combat.player.y }];
      advanceShipCombat(); return G.mode === 'galaxy' && !!G.stranded;
    }));
    const retreatTurn = await page.evaluate(() => {
      const combat = window.resolutionSetup(); window.resolutionDisable(combat);
      combat.player.x = 0; Math.random = () => 0; return G.turn;
    });
    await page.keyboard.press('r');
    assert.ok(await page.evaluate(turn => G.mode === 'galaxy' && G.stranded && G.turn === turn + 1, retreatTurn));

    // Fleet terms are independent of targeting and persist across save/load.
    await page.evaluate(() => {
      window.resolutionSetup(); G.mode = 'galaxy'; G.shipCombat = null; G.credits = 600;
      const flagship = { ...G.pirates[0], name: 'Flagship', systems: undefined, systemStats: undefined,
        installedWeapons: undefined, hp: 260, maxHp: 260, atk: 21, guns: 4, engineRating: 1, shields: 5, maxShields: 5 };
      const wing = { ...flagship, name: 'Wing', hp: 30, maxHp: 30, atk: 4, guns: 1, engineRating: 3, shields: 0, maxShields: 0 };
      G.pirates = [flagship, wing]; startShipCombat(flagship, true); G.shipCombat.asteroids = [];
      for (const enemy of G.shipCombat.enemies) enemy.ship.weaponReadyAt = new Array(enemy.ship.guns).fill(G.turn + 100);
    });
    assert.equal(await page.evaluate(() => getShipCombatSurrenderTerms().demand), 495);
    await page.keyboard.press('Tab');
    assert.deepEqual(await page.evaluate(() => [G.shipCombat.pirate.name, getShipCombatSurrenderTerms().demand]), ['Wing', 495]);
    assert.ok(await page.evaluate(async () => await autoSave() && await loadFromStorage() && getShipCombatSurrenderTerms().demand === 495));
    const refusalTurn = await page.evaluate(() => G.turn);
    await page.keyboard.press('h');
    assert.deepEqual(await page.evaluate(() => [G.mode, G.turn, G.credits, G.pirates.some(isPirateSatisfied)]),
      ['shipcombat', refusalTurn + 1, 600, false]);
    assert.ok(await page.evaluate(() => G.log.some(entry => entry.msg.includes('Offer 300 cr value, demand 495'))));
    await page.evaluate(() => { G.credits = 1000; renderAll(); });
    await page.getByRole('button', { name: /Surrender \(500 cr/ }).click();
    assert.deepEqual(await page.evaluate(() => [G.mode, G.credits, G.pirates.every(isPirateSatisfied), G.cargo.length]),
      ['galaxy', 500, true, 0]);
    assert.ok(await page.evaluate(() => {
      G.pirates.forEach(ship => delete ship.satisfiedUntil); startShipCombat(G.pirates[0], true);
      G.pirates[0].hp = 0; G.pirates[0].alive = false; syncShipCombatSystems(G.shipCombat);
      return getShipCombatSurrenderTerms().demand === 159 &&
        JSON.stringify(getShipCombatSurrenderTerms()) === JSON.stringify(getPirateSurrenderTerms(G.pirates[1]));
    }), 'destroyed ships stop setting the demand, and a lone survivor retains the ordinary terms');
    assert.deepEqual(errors, []);
    console.log('PASS: saved stalemates resolve to stranded/SOS without rewards or resets, rescue/exposure/new threats work, temporary delays retain combat, failed withdrawal resolves, and fleet surrender ignores target selection.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
