// Diagnostic fixtures for the November 2026 combat review, not balance pass/fail tests.
// These deliberately construct damaged ships and fleets; they are not natural careers.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium, gameUrl, artifactPath } = require('./runtime.cjs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route(/^https?:/, route => route.abort());
    await page.goto(gameUrl);
    await page.evaluate(() => initGame('LIGHT_SCOUT', 'Combat review', 'Combat review'));
    await page.waitForFunction(() => G?.galaxy && G.log.some(entry => entry.msg.includes('Ready for departure')));
    const report = await page.evaluate(() => {
      const base = serializeCareer(G);
      const realRandom = Math.random;
      const reset = () => {
        clearShipCombatFeedback();
        installSaveSnapshot(parseSaveSnapshot(base));
        G.pirates = [];
        G.neutralShips = [];
        G.gasEntities = [];
        G.cargo = [];
        G.credits = 0;
        G.installedWeapons = ['mass_driver'];
        Math.random = () => 0.5;
      };
      const pirate = (name, extra = {}) => ({
        name, x: G.ship.x, y: G.ship.y, hp: 80, maxHp: 80,
        atk: 6, engineRating: 2, shields: 0, maxShields: 0,
        guns: 1, alive: true, pirateType: 'guard', ...extra
      });
      const engage = ships => {
        G.pirates = ships;
        startShipCombat(ships[0], true);
        G.shipCombat.asteroids = [];
        return G.shipCombat;
      };
      const state = () => ({
        mode: G.mode, dead: !!G.dead, turn: G.turn, hull: G.ship.hp,
        player: G.shipCombat && { x: G.shipCombat.player.x, y: G.shipCombat.player.y },
        enemies: G.pirates.map(ship => ({ name: ship.name, hull: ship.hp, satisfied: isPirateSatisfied(ship) })),
        round: G.shipCombat?.round
      });
      try {
        reset();
        const blind = pirate('Blind raider');
        const combat = engage([blind]);
        ensureShipSystems(blind).sensors.condition = 0;
        ensureShipSystems().engine.condition = 0;
        const before = state();
        const shotStatus = shipCombatWeaponStatus(combat, shipCombatWeapons()[0]);
        moveShipInCombat(1, 0);
        doShipFire();
        doShipRetreat();
        doShipSurrender();
        for (let i = 0; i < 30 && G.shipCombat && !G.dead; i++) advanceShipCombat();
        const disabled = { before, after: state(), shotStatus,
          engineerAvailable: G.crew.some(crew => crew.hp > 0 && crew.role === 'engineer'),
          enemyPosition: { x: combat.enemies[0].x, y: combat.enemies[0].y },
          latestMessages: G.log.slice(0, 6).map(entry => entry.msg) };

        reset();
        G.credits = 600;
        const flagship = pirate('Flagship', { hp: 260, maxHp: 260, atk: 21, guns: 4, engineRating: 1, shields: 5, maxShields: 5 });
        const wingman = pirate('Corvette', { hp: 30, maxHp: 30, atk: 4, guns: 1, engineRating: 3 });
        engage([flagship, wingman]);
        const flagshipTerms = getPirateSurrenderTerms(G.shipCombat.pirate);
        const fleetTermsBeforeSelection = getShipCombatSurrenderTerms();
        selectShipCombatTarget(1);
        const wingmanTerms = getPirateSurrenderTerms(G.shipCombat.pirate);
        const fleetTermsAfterSelection = getShipCombatSurrenderTerms();
        doShipSurrender();
        const surrender = { flagshipTerms, wingmanTerms, fleetTermsBeforeSelection, fleetTermsAfterSelection,
          after: state(), credits: G.credits };

        reset();
        const edgeEnemy = pirate('Blind edge raider');
        engage([edgeEnemy]).player.x = 0;
        G.fuel = 0;
        ensureShipSystems().engine.condition = 0;
        ensureShipSystems(edgeEnemy).sensors.condition = 0;
        doShipRetreat();
        const powerlessRetreat = { after: state(), fuel: G.fuel, engineCondition: G.ship.systems.engine.condition };

        const engines = [1, 2, 3, 4, 5].map(engine => ({
          engine,
          hitChanceAgainstEngine1AtRange5: shipCombatHitChance(engine, 1, 5),
          engine1HitChanceAgainstItAtRange5: shipCombatHitChance(1, engine, 5),
          engine1MovementInTenPlayerActions: (() => {
            const actor = {};
            let steps = 0;
            for (let i = 0; i < 10; i++) steps += shipRelativeMoveBudget(actor, 1, engine, 'bank');
            return steps;
          })(),
          exhaustDamage: engine * 2
        }));
        return { version: GAME_VERSION, fixtures: true, disabled, surrender, powerlessRetreat, engines };
      } finally {
        Math.random = realRandom;
      }
    });
    assert.deepEqual(errors, [], 'review fixtures must not cause runtime exceptions');
    fs.writeFileSync(artifactPath('combat-review.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
