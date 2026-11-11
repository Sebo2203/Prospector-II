const assert=require('node:assert/strict'),path=require('node:path');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.text().startsWith('Prospector input error:'))errors.push(m.text());});
  await page.route(/^https?:/,r=>r.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('ATTACK_CORVETTE','Nebula QA','Nebula QA'));
  await page.waitForFunction(()=>G?.galaxy&&G.log.some(e=>e.msg.includes('Ready for departure')));
  await page.addScriptTag({path:path.join(__dirname,'ship-combat-fixture.js')});
  await page.evaluate(()=>{
   window.nebulaFixture=(options={})=>{
    const c=bridgeFixture({weapons:['mass_driver'],...options});G.galaxy[10][10]={type:'NEBULA',nebulaVariant:'blue'};
    initializeShipCombatEnvironment(c);c.asteroids=[];c.environment.layout='gas';
    c.environment.pockets=[{x:14,y:8,width:2,height:2}];
    const enemy=c.enemies[0];enemy.x=18;enemy.y=8;enemy.ship.systems.engine.condition=0;enemy.ship.weaponReadyAt=[G.turn+100];
    Math.random=()=>0.99;return c;
   };
  });
  const movement=await page.evaluate(()=>{
   const c=nebulaFixture(),turn=G.turn;tryMove(1,0);
   return {x:c.player.x,gas:shipCombatGas(c,c.player),turns:G.turn-turn};
  });assert.deepEqual(movement,{x:14,gas:true,turns:1});
  const shots=await page.evaluate(()=>{
   const results=[];
   for(const gas of [true,false]){
    const c=nebulaFixture();if(!gas)c.environment.pockets=[];
    const enemy=c.enemies[0],hp=enemy.ship.hp;
    const chance=shipCombatHitChance(shipBridgeSkills().gunnery,shipBridgeSkills(enemy.ship).piloting,shipCombatDistance(c.player,enemy));
    Math.random=()=>chance-0.075;doShipFire();results.push(hp-enemy.ship.hp);
   }
   for(const gas of [true,false]){
    const c=nebulaFixture();if(!gas)c.environment.pockets=[];
    const enemy=c.enemies[0];enemy.ship.weaponReadyAt=[G.turn];G.ship.shieldCharge=0;
    const hp=G.ship.hp,chance=shipCombatHitChance(shipBridgeSkills(enemy.ship).gunnery,shipBridgeSkills().piloting,shipCombatDistance(enemy,c.player));
    Math.random=()=>chance-0.075;fireShipCombatEnemy(c,enemy);results.push(hp-G.ship.hp);
   }
   return results;
  });assert.equal(shots[0],0);assert.ok(shots[1]>0);assert.equal(shots[2],0);assert.ok(shots[3]>0);
  const warning=await page.evaluate(()=>{
   const c=nebulaFixture();c.player={x:14,y:8,dx:-1,dy:0};c.enemies[0].x=15;c.enemies[0].y=9;
   c.environment.nextChargeAt=G.turn+1;Math.random=()=>0;const hp=G.ship.hp;advanceShipCombat();
   return {hp:G.ship.hp,initial:hp,turn:G.turn,due:c.environment.charge.dueTurn};
  });assert.equal(warning.hp,warning.initial);assert.equal(warning.due,warning.turn+1);
  assert.ok(await page.locator('#msg-bar').evaluate(el=>!el.classList.contains('visible')),'no lightning warning banner');
  assert.ok(await page.evaluate(()=>!G.log.some(e=>e.msg.includes('Gas charging'))),'no advance lightning log warning');
  assert.ok(await page.evaluate(()=>{
   clearShipCombatFeedback();const environment=G.shipCombat.environment,pending=environment.charge;
   drawCanvas();const before=canvas.toDataURL();environment.charge=null;drawCanvas();
   const same=before===canvas.toDataURL()&&canvasMenuTargets.every(t=>!t.title?.includes('CHARGED'));
   environment.charge=pending;return same;
  }),'pending lightning has no outline, glow, text or hover tell');
  assert.ok(await page.evaluate(async()=>await autoSave()));assert.ok(await page.evaluate(async()=>await loadFromStorage()));
  await page.keyboard.press('F3');await page.keyboard.press('Escape');
  assert.deepEqual(await page.evaluate(()=>[G.turn,G.shipCombat.environment.charge.dueTurn]),[warning.turn,warning.due],'menus and reload do not advance the hidden schedule');
  const dodge=await page.evaluate(()=>{
   const c=G.shipCombat,enemy=c.enemies[0],hp=enemy.ship.hp,player=G.ship.hp;
   Math.random=()=>0;tryMove(-1,0);
   return {player:G.ship.hp,initial:player,enemy:enemy.ship.hp,enemyBefore:hp,charge:c.environment.charge,flash:c.environment.lastStrike};
  });assert.equal(dodge.player,dodge.initial);assert.ok(dodge.enemy<dodge.enemyBefore);assert.equal(dodge.charge,null);assert.ok(dodge.flash);
  const impacts=await page.evaluate(()=>{
   const results=[];
   for(const [hull,shield,debug,hp]of [['LIGHT_SCOUT',0,false,100],['ATTACK_CORVETTE',0,false,110],['BULK_FREIGHTER',0,false,120],
    ['ATTACK_CORVETTE',20,false,110],['ATTACK_CORVETTE',0,true,110],['ATTACK_CORVETTE',0,false,1]]){
    const c=nebulaFixture({hull});c.player={x:14,y:8,dx:1,dy:0};
    c.environment.charge={pocket:0,dueTurn:G.turn+1};G.ship.shieldCharge=shield;G.ship.shieldRechargeAt=G.turn+100;G.ship.hp=hp;
    DEBUG.infiniteHull=debug;Math.random=()=>0.99;advanceShipCombat();
    const after=G.ship.hp;if(!G.dead)advanceShipCombat();
    results.push({damage:hp-after,again:G.ship.hp===after,dead:G.dead,cause:G.deathCause});
   }
   return results;
  });assert.deepEqual(impacts.map(i=>i.damage),[10,15,25,0,0,1]);assert.ok(impacts.every(i=>i.again));
  assert.equal(impacts[5].dead,true);assert.match(impacts[5].cause,/nebula lightning/);
  const evasion=await page.evaluate(()=>{
   const c=nebulaFixture(),enemy=c.enemies[0];c.environment.pockets=[{x:18,y:8,width:2,height:2}];
   enemy.ship.systemStats.engineRating=3;enemy.ship.systems.engine.condition=100;
   const before=shipCombatEnemyNextStep(c,enemy,c.player),mode=shipCombatEnemyShouldReposition(c,enemy);
   c.environment.charge={pocket:0,dueTurn:G.turn+1};
   return {before,after:shipCombatEnemyNextStep(c,enemy,c.player),mode,sameMode:shipCombatEnemyShouldReposition(c,enemy)};
  });assert.deepEqual(evasion.before,evasion.after);assert.equal(evasion.mode,evasion.sameMode,'AI cannot anticipate hidden lightning');
  const invalid=await page.evaluate(()=>{
   const c=nebulaFixture();c.environment.charge={pocket:0,dueTurn:G.turn+1};
   const active=G,raw=JSON.parse(serializeCareer(G));raw.shipCombat.environment.charge.dueTurn=G.turn;
   try{installSaveSnapshot(parseSaveSnapshot(JSON.stringify(raw)));return false;}catch{return active===G;}
  });assert.equal(invalid,true);
  assert.ok(await page.evaluate(()=>{
   const c=nebulaFixture();c.player={x:0,y:8,dx:-1,dy:0};
   c.environment.charge={pocket:0,dueTurn:G.turn+1};Math.random=()=>0;
   doShipRetreat();
   if(G.mode!=='shipcombat'||c.environment.lastTurn!==G.turn)return false;
   try{parseSaveSnapshot(serializeCareer(G));return true;}catch{return false;}
  }),'a failed withdrawal advances the nebula schedule and remains saveable');
  await page.evaluate(()=>{
   const c=nebulaFixture();c.environment.layout='mixed';c.environment.pockets=[{x:6,y:5,width:3,height:2},{x:16,y:7,width:2,height:3}];
   c.asteroids=[{x:10,y:5,width:2,height:2},{x:6,y:11}];c.seenTiles=Array(459).fill(true);
   c.environment.charge={pocket:1,dueTurn:G.turn+1};c.environment.lastStrike={pocket:0,turn:G.turn};Math.random=bridgeRandom;
  });
  assert.ok(await page.evaluate(()=>{
   const before=serializeCareer(G),random=Math.random;Math.random=()=>{throw Error('render used gameplay RNG');};
   try{drawCanvas();return serializeCareer(G)===before;}finally{Math.random=random;}
  }),'nebula rendering changes neither career state nor rule RNG');
  for(const [variant,ascii]of [['blue',false],['pink',false],['blue',true]]){
   await page.evaluate(({variant,ascii})=>{G.shipCombat.environment.variant=variant;OPTIONS.asciiMode=ascii;renderAll();},{variant,ascii});
   await page.screenshot({path:artifactPath('Nebula-combat-'+variant+'-'+(ascii?'ascii':'sprites')+'.png')});
  }
  await page.evaluate(()=>{OPTIONS.asciiMode=false;G.shipAnim=null;});
  const career=await page.evaluate(()=>serializeCareer(G));assert.ok(await page.evaluate(async()=>await autoSave()));
  await page.evaluate(()=>{debugEnterPalette();debugPaletteVisit('galaxy:NEBULA_COMBAT');});
  assert.equal(await page.evaluate(()=>G.shipCombat.environment.type),'nebula');
  await page.evaluate(()=>{G.shipCombat.environment.charge={pocket:0,dueTurn:G.turn+1};debugPaletteVisit('galaxy:NEBULA_COMBAT');});
  assert.equal(await page.evaluate(()=>G.shipCombat.environment.charge),null);
  await page.evaluate(async()=>{await autoSave();await autosaveQueue.idle();});
  assert.equal(await page.evaluate(async()=>(await readStoredAutosave()).record.raw),career);
  await page.evaluate(()=>debugReturnFromPalette());assert.equal(await page.evaluate(()=>serializeCareer(G)),career);
  assert.deepEqual(errors,[]);
  console.log('PASS: traversable gas, symmetric shot penalties, unannounced/saved/menu-stable lightning, no AI foresight, size/shield/debug/fatal handling, no duplicate strike, valid-load preservation and isolated nebula debug reset/return.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
