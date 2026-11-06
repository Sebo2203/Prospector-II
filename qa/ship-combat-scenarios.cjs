const assert = require('node:assert/strict');
const { chromium, gameUrl, artifactPath } = require('./runtime.cjs');

(async()=>{
  const browser=await chromium.launch({headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1000,height:620},deviceScaleFactor:1.25});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.text().startsWith('Prospector input error:')) errors.push(message.text());});
    await page.route(/^https?:/,route=>route.abort());
    await page.goto(gameUrl);
    await page.evaluate(()=>initGame('ATTACK_CORVETTE','Combat QA','Combat QA'));
    await page.waitForFunction(()=>G?.galaxy && G.log.some(entry=>entry.msg.includes('Ready for departure')));
    const setup=await page.evaluate(()=>{
      const {x,y}=G.ship;
      G.seed=Math.imul(x+1,73856093)^Math.imul(y+1,19349663);
      const pirate={x,y,hp:50,maxHp:50,atk:6,engineRating:2,shields:0,maxShields:0,guns:1,alive:true,pirateType:'guard'};
      G.pirates=[{...pirate,name:'Lead'},{...pirate,name:'Wing',x:x+1},{...pirate,name:'Distant',x:x+5}];
      G.installedWeapons=['railgun','pulse_laser'];
      return {x,y,turn:G.turn};
    });
    await page.keyboard.press('f');
    assert.deepEqual(await page.evaluate(()=>[G.mode,G.shipCombat.enemies.length,G.shipCombat.asteroids.length]),['shipcombat',2,0]);
    await page.keyboard.press('2');
    await page.keyboard.press('f');
    assert.equal(await page.evaluate(()=>G.shipCombat.round),1,'out-of-range fire is free');
    await page.keyboard.press('1');
    await page.evaluate(()=>{
      const combat=G.shipCombat;
      combat.asteroids=[{x:14,y:8}];
      combat.enemies.forEach(enemy=>enemy.ready=100);
    });
    await page.keyboard.press('f');
    await page.keyboard.press('ArrowRight');
    assert.deepEqual(await page.evaluate(()=>[G.shipCombat.round,G.shipCombat.player.x]),[1,13],'cover blocks shots and movement');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(()=>G.shipCombat.pirate.name),'Wing');

    const canvasBox=await page.locator('#gc').boundingBox();
    const lead=await page.evaluate(()=>{
      G.shipCombat.asteroids=[];
      Math.random=()=>0;
      const target=G.shipCombat.enemies[0];
      return [(COMBAT_MAP.x+target.x*TS+TS/2)/canvasWidth,(COMBAT_MAP.y+target.y*TS+TS/2)/canvasHeight];
    });
    const clickLead=()=>page.mouse.click(canvasBox.x+lead[0]*canvasBox.width,canvasBox.y+lead[1]*canvasBox.height);
    await clickLead();
    assert.deepEqual(await page.evaluate(()=>[G.shipCombat.pirate.name,G.shipCombat.round]),['Lead',1]);
    await clickLead();
    assert.deepEqual(await page.evaluate(()=>[G.pirates[0].hp,G.pirates[1].hp,G.shipCombat.round]),[42,50,2]);
    await page.keyboard.press('f');
    assert.equal(await page.evaluate(()=>G.shipCombat.round),2,'a reloading weapon is free to inspect');
    const hp=await page.evaluate(()=>G.ship.hp);
    await page.locator('.cmp-btn[data-dx="-1"][data-dy="0"]').click();
    assert.deepEqual(await page.evaluate(()=>[G.shipCombat.player.x,G.shipCombat.trails.find(t=>t.x===13 && t.y===8)?.damage]),[12,6]);
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(()=>G.ship.hp),hp-5,'crossing the corvette exhaust takes six damage, minus one shield');
    assert.ok(await page.evaluate(()=>G.shipCombat.trails.some(t=>t.damage===4)),'enemy engine leaves a weaker trail');
    assert.deepEqual(await page.evaluate(()=>[G.ship.x,G.ship.y,G.turn]),[setup.x,setup.y,setup.turn]);
    await page.screenshot({path:artifactPath('Tactical-combat.png')});

    const combatState=()=>page.evaluate(()=>{
      const {player,playerShields,round,target,weapon,weaponReady,trails,asteroids,enemies}=G.shipCombat;
      return {player,playerShields,round,target,weapon,weaponReady,trails,asteroids,
        enemies:enemies.map(({x,y,shields,ready,ship})=>({x,y,shields,ready,hp:ship.hp}))};
    });
    assert.ok(await page.evaluate(async()=>await autoSave()));
    const before=await combatState();
    assert.ok(await page.evaluate(async()=>await loadFromStorage()));
    assert.deepEqual(await combatState(),before);
    assert.ok(await page.evaluate(()=>G.shipCombat.enemies.every((enemy,i)=>enemy.ship===G.pirates[i])));
    await page.evaluate(()=>{
      const combat=G.shipCombat;
      combat.enemies.forEach(enemy=>enemy.ship.hp=8);
      combat.trails=[];
    });
    await page.keyboard.press('f');
    assert.deepEqual(await page.evaluate(()=>[G.mode,G.pirates[0].alive,G.shipCombat.pirate.name]),['shipcombat',false,'Wing']);
    await page.keyboard.press('2');
    await page.evaluate(()=>{G.shipCombat.enemies[1].x=G.shipCombat.player.x+2;G.shipCombat.enemies[1].y=G.shipCombat.player.y;});
    await page.keyboard.press('f');
    assert.deepEqual(await page.evaluate(()=>[G.mode,G.pirates[1].alive,G.pirates[2].alive,G.credits]),['galaxy',false,true,600]);

    await page.evaluate(()=>{
      const ship=G.pirates[2];
      G.seed^=1;
      startShipCombat(ship);
      const combat=G.shipCombat;
      if(!combat.asteroids.length) throw Error('Cover was never generated');
      combat.asteroids=[];
      combat.player.x=1;
    });
    await page.keyboard.press('r');
    assert.equal(await page.evaluate(()=>G.mode),'shipcombat');
    await page.keyboard.press('ArrowLeft');
    await page.evaluate(()=>{
      const combat=G.shipCombat, enemy=combat.enemies[0];
      enemy.x=2;enemy.y=combat.player.y;enemy.ready=combat.round;
      renderAll();
    });
    assert.ok(await page.getByRole('button',{name:/Disengage under fire/}).isVisible());
    assert.ok(await page.evaluate(()=>{
      const combat=G.shipCombat, enemy=combat.enemies[0];
      enemy.ready=combat.round+1;
      const canEscape=shipCombatEscapeReady(combat);
      enemy.ready=combat.round;
      return canEscape;
    }),'enemy reloads open an escape window at the edge');
    await page.evaluate(()=>{G.shipCombat.asteroids=[{x:1,y:G.shipCombat.player.y}];});
    assert.ok(await page.evaluate(()=>shipCombatEscapeReady(G.shipCombat)),'cover allows a clear withdrawal');
    const retreatHp=await page.evaluate(()=>{G.shipCombat.asteroids=[];G.shipCombat.playerShields=0;return G.ship.hp;});
    await page.keyboard.press('r');
    assert.deepEqual(await page.evaluate(()=>[G.mode,G.ship.hp]),['galaxy',retreatHp-4]);

    await page.evaluate(()=>{
      const legacy=JSON.parse(JSON.stringify(G));
      legacy.mode='shipcombat';
      legacy.shipCombat={pirate:{...legacy.pirates[2],hp:31},playerShields:0,pirateShields:0,log:['Legacy encounter']};
      installSaveSnapshot(legacy);
      renderAll();
    });
    assert.deepEqual(await page.evaluate(()=>[G.shipCombat.pirate===G.pirates[2],G.pirates[2].hp,G.shipCombat.playerShields]),[true,31,0]);
    await page.keyboard.press('h');
    assert.ok(await page.evaluate(()=>G.mode==='galaxy' && isPirateSatisfied(G.pirates[2])));

    await page.evaluate(()=>{
      const gas={name:'Nebula Wraith',x:G.ship.x,y:G.ship.y,hp:8,maxHp:8,alive:true,
        atk:4,engineRating:2,guns:1,variant:'blue',_homeCluster:[{x:G.ship.x,y:G.ship.y}]};
      G.gasEntities=[gas];
      G.shipStats.cargoCapacity=0;
      startShipCombat(gas);
    });
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(()=>G.shipCombat.trails.length),0,'gas entities move without engine exhaust');
    await page.keyboard.press('f');
    assert.ok(await page.evaluate(()=>G.mode==='galaxy' && !G.gasEntities[0].alive &&
      G.nebulaLoot.some(loot=>loot.item.commodityId==='nebula_crystal')));

    await page.evaluate(()=>{
      const patrol={type:'patrol',name:'Station Patrol',x:G.ship.x,y:G.ship.y,hostile:true};
      G.neutralShips=[patrol];
      startShipCombat(patrol);
    });
    await page.keyboard.press('h');
    assert.ok(await page.evaluate(()=>G.shipCombat.surrenderWarned && !G.dead));
    await page.keyboard.press('h');
    assert.ok(await page.evaluate(()=>G.jailed && G.dead && G.mode==='galaxy'));
    assert.deepEqual(errors,[]);
    console.log('PASS: tactical movement, range, cooldowns, cover, fleet targeting, engine trails, mid-fight saves, disengagement, and surrender.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
