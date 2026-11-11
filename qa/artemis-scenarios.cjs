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
  await page.evaluate(()=>{window.artemisRandom=Math.random;});
  await page.evaluate(()=>initGame('ATTACK_CORVETTE','Artemis QA','Artemis QA'));
  await page.waitForFunction(()=>G?.galaxy&&G.log.some(entry=>entry.msg.includes('Ready for departure')));
  // A bare magazine is not proof of launcher ownership. Rejections are free through both input paths.
  await page.evaluate(()=>{
   G.credits=5000;G.mode='base';Object.assign(G.base,{sel:0,screen:'sub',hangarSub:'armament'});
   G.ship.ammo.artemis=1;
   G.base.subSel=STATION_BUILDINGS[0].actions().findIndex(row=>row.id==='ship_ammo_artemis');renderAll();
  });
  assert.ok(await page.evaluate(()=>STATION_BUILDINGS[0].actions().find(row=>row.id==='ship_ammo_artemis').disabled));
  assert.match(await canvasText(page),/Requires an owned Artemis Launcher/);
  const rejected=await page.evaluate(()=>[G.credits,G.ship.ammo.artemis,G.turn,G.careerTime.minutes]);
  await page.keyboard.press('Enter');
  await page.evaluate(()=>executeBaseAction('ship_ammo_artemis'));
  assert.deepEqual(await page.evaluate(()=>[G.credits,G.ship.ammo.artemis,G.turn,G.careerTime.minutes]),rejected);
  // Launchers stored at another station are still owned, even when not fitted to this hull.
  await page.evaluate(()=>{G.hangarStores['QA other station']={weapons:[{id:'artemis',readyAt:G.turn+5}],modules:[]};renderAll();});
  assert.ok(!await page.evaluate(()=>STATION_BUILDINGS[0].actions().find(row=>row.id==='ship_ammo_artemis').disabled));
  await page.keyboard.press('Enter');
  assert.deepEqual(await page.evaluate(()=>[G.credits,G.ship.ammo.artemis]),[4940,2]);
  await page.evaluate(()=>{delete G.hangarStores['QA other station'];renderAll();});
  assert.ok(await page.evaluate(()=>STATION_BUILDINGS[0].actions().find(row=>row.id==='ship_ammo_artemis').disabled));
  await page.evaluate(()=>{G.ship.ammo.artemis=0;});
  // Real installation and purchases, with fixture credits. The magazine is separate from trade cargo.
  await page.evaluate(()=>{
   G.credits=5000;G.mode='base';Object.assign(G.base,{sel:0,screen:'installweapon',weaponSlot:0,weaponSel:3});renderAll();
  });
  await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
  assert.deepEqual(await page.evaluate(()=>[G.installedWeapons[0],G.credits,G.ship.ammo.artemis||0]),['artemis',3800,0]);
  const purchase=await page.evaluate(()=>{
   G.base.hangarSub='armament';G.base.screen='sub';
   G.base.subSel=STATION_BUILDINGS[0].actions().findIndex(row=>row.id==='ship_ammo_artemis');renderAll();
   return [G.turn,G.cargo.length];
  });
  await page.keyboard.press('Enter');
  assert.deepEqual(await page.evaluate(()=>[G.ship.ammo.artemis,G.credits,G.turn,G.cargo.length]),[1,3740,...purchase]);
  assert.ok((await canvasText(page)).includes('Magazine 1/12'));
  await page.screenshot({path:artifactPath('Artemis-ammunition-shop.png')});
  assert.ok(await page.evaluate(()=>{
   for(let i=0;i<11;i++)executeBaseAction('ship_ammo_artemis');
   const credits=G.credits;executeBaseAction('ship_ammo_artemis');
   const full=G.ship.ammo.artemis===12&&credits===G.credits;
   G.ship.ammo.artemis=11;G.credits=59;executeBaseAction('ship_ammo_artemis');
   return full&&G.ship.ammo.artemis===11&&G.credits===59;
  }));
  await page.evaluate(()=>{
   window.artemisSetup=()=>{
    clearShipCombatFeedback();G.mode='galaxy';G.shipCombat=null;G.stranded=null;G.dead=false;
    for(const core of Object.values(G.ship.systems)){core.condition=100;core.bypassUntil=0;}
    G.ship.hp=G.ship.maxHp;G.ship.heat=0;G.ship.shieldCharge=20;G.fuel=G.maxFuel;
    G.ship.weaponReadyAt=[];G.ship.ammo={artemis:2};G.installedWeapons=['artemis','mass_driver'];
    G.neutralShips=[];G.gasEntities=[];G.credits=500;G.cargo=[];Math.random=()=>0.5;
    const enemy={name:'Artemis test raider',x:G.ship.x,y:G.ship.y,homeX:G.ship.x,homeY:G.ship.y,
     hp:200,maxHp:200,atk:6,guns:1,engineRating:2,shields:0,maxShields:0,alive:true,pirateType:'guard',
     installedWeapons:['mass_driver']};
    G.pirates=[enemy];startShipCombat(enemy,true);
    const c=G.shipCombat;c.asteroids=[{x:15,y:8}];c.enemies[0].x=17;c.enemies[0].y=8;
    enemy.systems.engine.condition=0;enemy.weaponReadyAt=[G.turn+100];renderAll();return G.turn;
   };
   window.artemisSetup();
  });
  assert.deepEqual(await page.evaluate(()=>shipCombatWeapons().map(entry=>shipCombatWeaponStatus(G.shipCombat,entry))),['Ready','Shot blocked']);
  await page.screenshot({path:artifactPath('Artemis-player-cover.png')});
  const turn=await page.evaluate(()=>G.turn);
  await page.keyboard.press('f');
  assert.deepEqual(await page.evaluate(()=>[G.ship.ammo.artemis,G.pirates[0].hp,G.turn,G.ship.weaponReadyAt[0]-G.turn]),[1,200,turn+1,3]);
  await page.keyboard.press('f');
  assert.deepEqual(await page.evaluate(()=>[G.turn,G.ship.ammo.artemis]),[turn+1,1],'reload refusal is free');
  for(let i=0;i<3;i++)await page.keyboard.press('Space');
  await page.evaluate(()=>{Math.random=()=>0.99;});await page.keyboard.press('f');
  assert.deepEqual(await page.evaluate(()=>[G.ship.ammo.artemis,G.pirates[0].hp]),[0,176],'a miss also consumes one missile');
  const emptyTurn=await page.evaluate(()=>G.turn);await page.keyboard.press('f');
  assert.equal(await page.evaluate(()=>G.turn),emptyTurn);
  assert.ok((await canvasText(page)).includes('No Artemis missiles'));
  await page.keyboard.press('Space');
  assert.equal(await page.evaluate(()=>G.pirates[0].hp),176,'accuracy resolves on missile impact');

  // Sensor, range, power and heat guards still apply, without spending a missile or turn.
  for(const guard of ['range','sensors','reactor','heat']){
   const before=await page.evaluate(guard=>{
    const turn=window.artemisSetup();
    if(guard==='range')G.shipCombat.enemies[0].x=26;
    if(guard==='sensors')G.ship.systems.sensors.condition=0;
    if(guard==='reactor')G.ship.systems.reactor.condition=0;
    if(guard==='heat')G.ship.heat=shipHeatCapacity();
    return turn;
   },guard);
   await page.keyboard.press('f');
   assert.deepEqual(await page.evaluate(()=>[G.turn,G.ship.ammo.artemis]),[before,2],guard);
  }
  // Pointer aiming shares the same guided fire action.
  await page.evaluate(()=>window.artemisSetup());
  const aim=await page.evaluate(()=>{
   const e=G.shipCombat.enemies[0],r=canvas.getBoundingClientRect();
   return {x:r.x+(COMBAT_MAP.x+(e.x+0.5)*TS)*r.width/canvasWidth,y:r.y+(COMBAT_MAP.y+(e.y+0.5)*TS)*r.height/canvasHeight};
  });
  await page.mouse.click(aim.x,aim.y);assert.equal(await page.evaluate(()=>G.ship.ammo.artemis),2);
  await page.mouse.click(aim.x,aim.y);assert.equal(await page.evaluate(()=>G.ship.ammo.artemis),1);

  // Enemies select the guided mount behind cover, then use an ordinary mount when ammo is gone.
  await page.evaluate(()=>{
   window.artemisSetup();const e=G.pirates[0];
   e.guns=2;delete e.systemStats;e.installedWeapons=['mass_driver','artemis'];e.ammo={artemis:1};e.weaponReadyAt=[];
   ensureShipSystems(e);
   G.installedWeapons=['mass_driver'];renderAll();
  });
  assert.equal(await page.evaluate(()=>shipCombatEnemyWeapon(G.shipCombat,G.shipCombat.enemies[0]).weapon.id),'artemis');
  await page.screenshot({path:artifactPath('Artemis-cover-combat.png')});
  const hp=await page.evaluate(()=>G.ship.hp+G.ship.shieldCharge);
  await page.keyboard.press('Space');
  assert.deepEqual(await page.evaluate(()=>[G.pirates[0].ammo.artemis,G.ship.hp+G.ship.shieldCharge]),[0,hp]);
  assert.equal(await page.evaluate(()=>shipCombatEnemyCanFire(G.shipCombat,G.shipCombat.enemies[0])),false);
  await page.keyboard.press('Space');
  assert.equal(await page.evaluate(()=>G.ship.hp+G.ship.shieldCharge),hp-24);
  await page.evaluate(()=>{G.shipCombat.asteroids=[];});
  assert.equal(await page.evaluate(()=>shipCombatEnemyWeapon(G.shipCombat,G.shipCombat.enemies[0]).weapon.id),'mass_driver');

  // Retreat, re-entry and load keep both finite magazines and reload deadlines.
  await page.evaluate(()=>{G.ship.ammo.artemis=5;G.shipCombat.player.x=0;});
  await page.keyboard.press('r');
  assert.equal(await page.evaluate(()=>G.mode),'galaxy');
  assert.ok(await page.evaluate(async()=>{
   startShipCombat(G.pirates[0],true);const deadline=G.pirates[0].weaponReadyAt[1];
   if(!await autoSave()||!await loadFromStorage())return false;
   return G.ship.ammo.artemis===5&&G.pirates[0].ammo.artemis===0&&G.pirates[0].weaponReadyAt[1]===deadline&&
    G.shipCombat.enemies[0].ship===G.pirates[0];
  }));
  // A guided shot is a real firing opportunity in stalemate detection; an empty magazine is not.
  assert.ok(await page.evaluate(()=>{
   window.artemisSetup();G.ship.systems.engine.condition=0;G.pirates[0].systems.sensors.condition=0;
   const loaded=!shipCombatStalemated(G.shipCombat);G.ship.ammo.artemis=0;
   return loaded&&shipCombatStalemated(G.shipCombat);
  }));
  // Pirate-base bombardment uses the same finite ammunition action.
  assert.ok(await page.evaluate(()=>{
   G.shipCombat=null;G.mode='galaxy';G.installedWeapons=['artemis'];G.ship.ammo.artemis=1;
   G.ship.weaponReadyAt=[];G.ship.heat=0;G.pirates=[];
   const base={name:'Ammo test base',hp:100,maxHp:100,x:G.ship.x,y:G.ship.y};G.pirateBases=[base];
   doFireAtBase(base);const launched=base.hp===100&&G.ship.ammo.artemis===0;
   doWaitGalaxy();return launched&&base.hp===76;
  }));

  // The registered debug sample has a real interaction, resets its stocks, and cannot overwrite the career.
  await page.evaluate(()=>{G.ship.systems.engine.condition=100;renderAll();});
  const career=await page.evaluate(()=>serializeCareer(G));
  await page.evaluate(()=>{Math.random=window.artemisRandom;debugEnterPalette();debugPaletteVisit('galaxy:ARTEMIS_RAIDER');Math.random=()=>0.5;});
  assert.ok(await page.evaluate(()=>G.mode==='shipcombat'&&shipCombatWeaponStatus(G.shipCombat,shipCombatWeapons()[0])==='Ready'));
  await page.keyboard.press('f');
  assert.deepEqual(await page.evaluate(()=>[G.ship.ammo.artemis,G.shipCombat.pirate.ammo.artemis]),[5,2]);
  assert.equal(await page.evaluate(async()=>{await autoSave();await autosaveQueue.idle();return (await readStoredAutosave()).record.raw;}),career);
  await page.evaluate(()=>{debugPaletteNavigateHome('galaxy');debugPaletteVisit('galaxy:ARTEMIS_RAIDER');});
  assert.deepEqual(await page.evaluate(()=>[G.ship.ammo.artemis,G.shipCombat.pirate.ammo.artemis]),[6,3]);
  await page.evaluate(()=>debugReturnFromPalette());
  assert.equal(await page.evaluate(()=>serializeCareer(G)),career);
  assert.deepEqual(errors,[]);
  console.log('PASS: Artemis purchase/cap, guided player and NPC fire, finite shared ammo/hit/miss, sensor/power/range/heat guards, mouse aim, energy fallback, persistence, stalemates, base bombardment and debug reset/career isolation.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
