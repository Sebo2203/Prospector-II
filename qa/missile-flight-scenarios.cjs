const assert=require('node:assert/strict');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
const {canvasText}=require('./systems-menu-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.text().startsWith('Prospector input error:'))errors.push(message.text());});
  await page.route(/^https?:/,route=>route.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('ATTACK_CORVETTE','Flight QA','Flight QA'));
  await page.waitForFunction(()=>G?.galaxy&&G.log.some(entry=>entry.msg.includes('Ready for departure')));
  await page.evaluate(()=>{
   window.flightBase=serializeCareer(G);
   window.flightSetup=({distance=8,launcher=false,wing=false}={})=>{
    clearShipCombatFeedback();installSaveSnapshot(parseSaveSnapshot(window.flightBase));Math.random=()=>0.5;
    G.ship.x=10;G.ship.y=10;
    for(let y=9;y<=11;y++)for(let x=9;x<=11;x++)G.galaxy[y][x]={type:'VOID'};
    G.neutralShips=[];G.gasEntities=[];G.pirateBases=[];G._pirateRoamerTarget=0;
    G.ship.ammo={artemis:6};G.installedWeapons=['artemis'];
    const ship={name:'Flight Raider',x:10,y:10,homeX:10,homeY:10,pirateType:'guard',hp:200,maxHp:200,
     atk:6,guns:1,engineRating:2,shields:0,maxShields:0,alive:true,
     installedWeapons:[launcher?'artemis':'mass_driver'],ammo:{artemis:3}};
    G.pirates=[ship];
    if(wing)G.pirates.push({...ship,name:'Other Wing',x:11,installedWeapons:['mass_driver'],ammo:{}});
    startShipCombat(ship,true);const c=G.shipCombat;
    c.asteroids=[{x:15,y:8}];c.enemies[0].x=13+distance;c.enemies[0].y=8;
    if(!launcher){ship.systems.engine.condition=0;ship.weaponReadyAt=[G.turn+100];}
    if(wing){const e=c.enemies[1];e.x=25;e.y=15;e.ship.systems.engine.condition=0;e.ship.systems.sensors.condition=0;}
    renderAll();return G.turn;
   };
  });
  // Long range: no launch damage, one four-tile step, then impact on the second later turn.
  let turn=await page.evaluate(()=>window.flightSetup());
  await page.keyboard.press('f');
  assert.deepEqual(await page.evaluate(()=>[G.turn,G.ship.ammo.artemis,G.pirates[0].hp,G.shipCombat.missiles[0].x]),[turn+1,5,200,13]);
  const launched=await page.evaluate(()=>JSON.stringify([G.turn,G.shipCombat.missiles]));
  await page.evaluate(()=>{renderAll();selectShipCombatWeapon(0);});await page.keyboard.press('f');
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(()=>JSON.stringify([G.turn,G.shipCombat.missiles])),launched,'menus, playback and refused shots never move missiles');
  await page.keyboard.press('Space');
  assert.deepEqual(await page.evaluate(()=>[G.pirates[0].hp,G.shipCombat.missiles[0].x]),[200,17]);
  await page.keyboard.press('Space');
  assert.deepEqual(await page.evaluate(()=>[G.pirates[0].hp,G.shipCombat.missiles.length]),[176,0]);

  // Short range impacts on the next later turn; hit/damage rolls occur then, not at launch.
  await page.evaluate(()=>window.flightSetup({distance:4}));await page.keyboard.press('f');
  await page.evaluate(()=>{Math.random=()=>0.99;});await page.keyboard.press('Space');
  assert.equal(await page.evaluate(()=>G.pirates[0].hp),200,'a hit was not pre-rolled at launch');
  assert.ok(await page.evaluate(()=>G.log.some(entry=>entry.msg.includes('Artemis missile misses'))));

  // Homing follows the actor, even outside launch range and after sensors fail.
  await page.evaluate(()=>window.flightSetup());await page.keyboard.press('f');
  await page.evaluate(()=>{G.shipCombat.enemies[0].x=22;G.shipCombat.enemies[0].y=10;G.ship.systems.sensors.condition=0;});
  await page.keyboard.press('Space');
  assert.deepEqual(await page.evaluate(()=>[G.shipCombat.missiles[0].x,G.shipCombat.missiles[0].y]),[17,10]);
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>G.pirates[0].hp),200);
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>G.pirates[0].hp),176);

  // Saving a moving salvo preserves target identity rather than the current selection/roster order.
  await page.evaluate(()=>window.flightSetup({wing:true}));await page.keyboard.press('f');await page.keyboard.press('Space');
  assert.ok(await page.evaluate(async()=>{
   selectShipCombatTarget(1);G.pirates.reverse();const before=JSON.stringify(G.shipCombat.missiles);
   return await autoSave()&&await loadFromStorage()&&JSON.stringify(G.shipCombat.missiles)===before;
  }));
  await page.keyboard.press('Space');
  assert.deepEqual(await page.evaluate(()=>G.shipCombat.enemies.map(enemy=>enemy.ship.hp)),[176,200]);

  // The firing ship may die; its autonomous missile keeps combat open and can still kill the player.
  await page.evaluate(()=>window.flightSetup({launcher:true}));await page.keyboard.press('Space');
  assert.ok((await canvasText(page)).includes('Incoming missiles 1'));
  await page.screenshot({path:artifactPath('Artemis-incoming-flight.png')});
  await page.evaluate(()=>damageShipCombatEnemy(G.shipCombat,G.shipCombat.enemies[0],999));
  const hp=await page.evaluate(()=>G.ship.hp+G.ship.shieldCharge);
  await page.keyboard.press('Space');
  assert.equal(await page.evaluate(()=>G.mode),'shipcombat');
  assert.ok((await canvasText(page)).includes('Missiles still inbound'));
  const waitingTurn=await page.evaluate(()=>G.turn);await page.keyboard.press('h');await page.keyboard.press('f');
  assert.equal(await page.evaluate(()=>G.turn),waitingTurn,'no dead-target fire or empty-fleet surrender');
  assert.ok(await page.evaluate(async()=>await autoSave()&&await loadFromStorage()));
  await page.keyboard.press('Space');
  assert.deepEqual(await page.evaluate(()=>[G.mode,G.ship.hp+G.ship.shieldCharge]),['galaxy',hp-24]);
  await page.evaluate(()=>window.flightSetup({launcher:true}));await page.keyboard.press('Space');
  await page.evaluate(()=>{damageShipCombatEnemy(G.shipCombat,G.shipCombat.enemies[0],999);G.ship.hp=5;G.ship.shieldCharge=0;G.ship.shieldRechargeAt=G.turn+100;});
  await page.keyboard.press('Space');await page.keyboard.press('Space');
  assert.ok(await page.evaluate(()=>G.dead&&G.deathCause.includes('Artemis missile launched by Flight Raider')));

  // Target destruction never retargets another ship; escaping targets lose pursuing ordnance.
  await page.evaluate(()=>window.flightSetup({wing:true}));await page.keyboard.press('f');
  await page.evaluate(()=>damageShipCombatEnemy(G.shipCombat,G.shipCombat.enemies[0],999));await page.keyboard.press('Space');
  assert.deepEqual(await page.evaluate(()=>[G.shipCombat.missiles.length,G.shipCombat.enemies[1].ship.hp]),[0,200]);
  await page.evaluate(()=>window.flightSetup());await page.keyboard.press('f');
  assert.ok(await page.evaluate(()=>{const c=G.shipCombat;c.enemies[0].x=26;return escapeShipCombatEnemy(c,c.enemies[0])===true;}));
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>G.mode),'galaxy');

  // Limited motor lifetime prevents an endless chase.
  await page.evaluate(()=>window.flightSetup());await page.keyboard.press('f');
  for(let i=0;i<4;i++){
   await page.evaluate(()=>{const c=G.shipCombat;c.enemies[0].x=c.missiles[0].x<13?26:0;});
   await page.keyboard.press('Space');
  }
  assert.deepEqual(await page.evaluate(()=>[G.shipCombat.missiles.length,G.pirates[0].hp]),[0,200]);

  // Withdrawal advances a salvo once. Failure repositions ships without deleting or resetting missiles.
  await page.evaluate(()=>window.flightSetup({launcher:true}));await page.keyboard.press('Space');
  await page.evaluate(()=>{G.shipCombat.player.x=0;Math.random=()=>0;});await page.keyboard.press('r');
  assert.deepEqual(await page.evaluate(()=>[G.shipCombat.player.x,G.shipCombat.missiles[0].x,G.shipCombat.missiles[0].ticks]),[13,17,1]);
  await page.evaluate(()=>{Math.random=()=>0.5;});await page.keyboard.press('Space');
  assert.equal(await page.evaluate(()=>G.shipCombat.missiles.length),0);
  await page.evaluate(()=>window.flightSetup({launcher:true}));await page.keyboard.press('Space');
  await page.evaluate(()=>{G.shipCombat.player.x=0;});await page.keyboard.press('r');
  assert.deepEqual(await page.evaluate(()=>[G.mode,G.pirates[0].ammo.artemis]),['galaxy',2]);
  assert.ok(await page.evaluate(()=>{startShipCombat(G.pirates[0],true);return G.shipCombat.missiles.length===0;}));
  // A queued friendly hit that destroys the final enemy ends combat before an irrelevant retreat failure roll.
  await page.evaluate(()=>window.flightSetup({distance:4}));await page.keyboard.press('f');
  assert.ok(await page.evaluate(()=>{
   G.shipCombat.player.x=0;G.pirates[0].hp=1;Math.random=()=>0;
   doShipRetreat();return G.mode==='galaxy'&&!G.shipCombat&&!G.pirates[0].alive;
  }));
  // A missile close enough to impact gets its hit before a successful escape roll can save you.
  await page.evaluate(()=>window.flightSetup({launcher:true}));await page.keyboard.press('Space');
  await page.evaluate(()=>{G.shipCombat.player.x=0;G.shipCombat.missiles[0].x=4;G.ship.hp=5;G.ship.shieldCharge=0;G.ship.shieldRechargeAt=G.turn+100;});
  await page.keyboard.press('r');assert.ok(await page.evaluate(()=>G.dead));

  // Base missiles survive save/load and arrive during a later tactical action, without another turret volley.
  assert.ok(await page.evaluate(async()=>{
   window.flightSetup();G.mode='galaxy';G.shipCombat=null;G.pirates=[];
   G.pirateBases=[{name:'Flight base',x:11,y:10,hp:100,maxHp:100}];
   doFireAtBase(G.pirateBases[0]);const hull=G.ship.hp+G.ship.shieldCharge;
   if(!await autoSave()||!await loadFromStorage())return false;
   const enemy={name:'Unrelated interceptor',x:10,y:10,homeX:10,homeY:10,pirateType:'guard',hp:100,maxHp:100,
    atk:6,guns:1,engineRating:2,shields:0,alive:true,installedWeapons:['mass_driver']};
   G.pirates=[enemy];startShipCombat(enemy,true);enemy.weaponReadyAt=[G.turn+100];
   advanceShipCombat();
   return G.mode==='shipcombat'&&G.pirateBases[0].hp===76&&G.baseMissiles.length===0&&G.ship.hp+G.ship.shieldCharge===hull;
  }));
  assert.ok(await page.evaluate(()=>{
   window.flightSetup();G.mode='galaxy';G.shipCombat=null;G.pirates=[];G.credits=0;
   G.pirateBases=[{name:'Doomed flight base',x:11,y:10,hp:20,maxHp:20}];
   doFireAtBase(G.pirateBases[0]);if(G.credits!==0)return false;
   doWaitGalaxy();const destroyed=G.pirateBases[0].destroyed&&G.credits===3000;
   doWaitGalaxy();return destroyed&&G.credits===3000&&G.baseMissiles.length===0;
  }));

  // Accepted surrender calls off the salvo without changing its existing payment.
  await page.evaluate(()=>window.flightSetup({launcher:true}));await page.keyboard.press('Space');
  await page.evaluate(()=>{G.credits=2000;});await page.keyboard.press('h');
  assert.deepEqual(await page.evaluate(()=>[G.mode,G.credits]),['galaxy',1000]);
  assert.deepEqual(errors,[]);
  console.log('PASS: delayed near/far homing, impact RNG, no menu ticks, persistent identity, posthumous impacts/death, target loss, motor expiry, failed/successful withdrawal and surrender.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
