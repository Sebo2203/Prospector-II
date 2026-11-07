const assert=require('node:assert/strict');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,route=>route.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('LIGHT_SCOUT','Pursuit QA','Pursuit QA'));
  await page.waitForFunction(()=>G?.galaxy && G.log.some(e=>e.msg.includes('Ready for departure')));
  await page.evaluate(()=>{
    G.ship.x=10;G.ship.y=10;G.pirates=[];G.gasEntities=[];G.pirateBases=[];
    for(let y=5;y<35;y++)for(let x=5;x<35;x++)G.galaxy[y][x]={type:'VOID'};
    const victim={name:'Fleeing Trader',type:'trader',x:10,y:10,hp:45,maxHp:45,guns:0,engineRating:1,speed:1,alive:true,destBase:0};
    G.neutralShips=[victim];doFireAtNeutral(victim);
    const enemy=G.shipCombat.enemies[0];enemy.x=25;enemy.y=8;
    G.shipCombat.asteroids=[];renderAll();
  });
  await page.keyboard.press('Space');
  assert.deepEqual(await page.evaluate(()=>[G.mode,G.ship.x,G.ship.y,G.neutralShips[0].x,G.neutralShips[0].y,G.neutralShips[0].fleeingPlayer]),['galaxy',10,10,11,10,true]);
  assert.ok(await page.evaluate(()=>autoSave()));assert.ok(await page.evaluate(()=>loadFromStorage()));
  assert.deepEqual(await page.evaluate(()=>[G.mode,G.neutralShips[0].x,G.neutralShips[0].y,G.neutralShips[0].hp]),['galaxy',11,10,45]);
  // The faster player can actually catch the slow escaped civilian on the next move.
  await page.keyboard.press('ArrowRight');
  assert.ok(await page.evaluate(()=>G.ship.x===G.neutralShips[0].x && G.ship.y===G.neutralShips[0].y));
  assert.equal(await page.evaluate(()=>nearestNeutralTarget(0).name),'Fleeing Trader');
  // Compare real civilian flight at each engine ratio, then preserve a fractional bank through save/load.
  for(const [playerEngine,npcEngine,calls,expected] of [[3,1,3,1],[2,2,3,3],[1,3,1,3]]){
    const travelled=await page.evaluate(({playerEngine,npcEngine,calls})=>{
      G.ship.x=19;G.ship.y=20;G.shipStats.engineRating=playerEngine;
      G.ship.systems.engine.condition=100;
      const ship={name:'Ratio Trader',type:'trader',x:20,y:20,hp:45,maxHp:45,guns:0,engineRating:npcEngine,speed:1,alive:true,fleeingPlayer:true};
      G.neutralShips=[ship];for(let i=0;i<calls;i++)moveNeutralShips();return ship.x-20;
    },{playerEngine,npcEngine,calls});
    assert.equal(travelled,expected);
  }
  await page.evaluate(()=>{
    const ship=G.neutralShips[0];ship.engineRating=1;ship.systemStats.engineRating=1;ship._chaseMoveBank=0;
    G.shipStats.engineRating=3;moveNeutralShips();
  });
  const bank=await page.evaluate(()=>G.neutralShips[0]._chaseMoveBank);assert.ok(bank>0 && bank<1);
  assert.ok(await page.evaluate(()=>autoSave()));assert.ok(await page.evaluate(()=>loadFromStorage()));
  assert.equal(await page.evaluate(()=>G.neutralShips[0]._chaseMoveBank),bank);
  // Escape refuses occupied/hazardous destinations; every edge case keeps the actor identity.
  const safe=await page.evaluate(()=>{
    const victim=G.neutralShips[0];G.ship.x=0;G.ship.y=0;victim.x=0;victim.y=0;
    G.galaxy[0][1]={type:'BLACK_HOLE'};G.galaxy[1][0]={type:'PULSAR'};G.galaxy[1][1]={type:'VOID'};
    startShipCombat(victim,true);const enemy=G.shipCombat.enemies[0];enemy.x=26;enemy.y=8;
    return [escapeShipCombatEnemy(G.shipCombat,enemy),victim===G.neutralShips[0],victim.x,victim.y];
  });assert.deepEqual(safe,[true,true,1,1]);
  await page.evaluate(()=>initGame('ATTACK_CORVETTE','Weapon QA','Weapon QA'));
  await page.waitForFunction(()=>G?.shipName==='Weapon QA' && G.log.some(e=>e.msg.includes('Ready for departure')));
  await page.evaluate(()=>{
    Math.random=()=>0.5;G.installedWeapons=['railgun','mass_driver'];
    const enemy={name:'Mount Raider',x:G.ship.x,y:G.ship.y,hp:400,maxHp:400,guns:1,engineRating:2,alive:true,pirateType:'guard'};
    G.pirates=[enemy];startShipCombat(enemy);enemy.weaponReadyAt=[G.turn+999];
    const combat=G.shipCombat;combat.asteroids=[];combat.enemies[0].x=combat.player.x+3;combat.enemies[0].y=combat.player.y;renderAll();
  });
  await page.keyboard.press('1');await page.keyboard.press('f');
  assert.equal(await page.evaluate(()=>G.shipCombat.weapon),1,'a fired railgun hands selection to the ready next mount');
  assert.match(await page.locator('#ctx-bar [data-game-key="f"]').textContent(),/Mass Driver/);
  const deadline=await page.evaluate(()=>G.ship.weaponReadyAt[0]);await page.keyboard.press('f');
  assert.equal(await page.evaluate(()=>G.ship.weaponReadyAt[0]),deadline,'fallback never resets the original reload');
  const blocked=await page.evaluate(()=>[G.turn,G.ship.hp,G.ship.heat,G.fuel]);await page.keyboard.press('f');
  assert.deepEqual(await page.evaluate(()=>[G.turn,G.ship.hp,G.ship.heat,G.fuel]),blocked);
  assert.match(await page.locator('#log-list').textContent(),/Cannot fire Mass Driver: still reloading \(1 turn remaining\)\. Move or wait/);
  assert.match(await page.locator('#log-list').textContent(),/No other weapon can fire at this target/);
  // A ready but short-range or unpowered mount is never a valid fallback.
  const unavailable=await page.evaluate(()=>{
    const combat=G.shipCombat;G.ship.heat=0;G.ship.weaponReadyAt=[G.turn+5,G.turn];combat.weapon=0;
    combat.enemies[0].x=combat.player.x+7;selectReadyShipCombatWeapon(combat);const outOfRange=combat.weapon;
    combat.enemies[0].x=combat.player.x+3;G.ship.systems.reactor.condition=0;selectReadyShipCombatWeapon(combat);
    return [outOfRange,combat.weapon];
  });assert.deepEqual(unavailable,[0,0]);
  await page.screenshot({path:artifactPath('Weapon-fallback-and-reload-reason.png')});
  assert.deepEqual(errors,[]);
  console.log('PASS: persistent safe one-sector NPC escape, catch-up, shared civilian engine ratios and saved movement banks, cyclic fireable-mount fallback and explanatory free reload refusal.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
