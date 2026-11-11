const assert=require('node:assert/strict');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
const {canvasText}=require('./systems-menu-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));await page.route(/^https?:/,r=>r.abort());await page.goto(gameUrl);
  await page.evaluate(()=>window.qaBalanceRandom=Math.random);
  for(const hull of ['LIGHT_SCOUT','BULK_FREIGHTER','ATTACK_CORVETTE']){
   await page.evaluate(hull=>initGame(hull,'Balance QA','Balance QA'),hull);
   await page.waitForFunction(()=>G?.galaxy && G.log.some(entry=>entry.msg.includes('Ready for departure')));
   assert.deepEqual(await page.evaluate(()=>G.crew.map(c=>c.role)),['captain','scout']);
  }
  const upgrades=await page.evaluate(()=>{
   Math.random=()=>0.5;G.credits=10000;G.mode='base';G.base.stationName='Starbase Alpha';G.base.hangarSub='upgrades';
   const ids=['uphull','upfuel','upshield','upsensor','upcargo','upengine','upreactor','upcooling'];
   const enabled=ids.every(id=>!STATION_BUILDINGS[0].actions().find(action=>action.id===id).disabled);
   const before=JSON.stringify(G.crew.map(c=>c._skillXp||{}));
   for(const id of [...ids,'upwslot'])executeBaseAction(id);
   const trained=JSON.stringify(G.crew.map(c=>c._skillXp||{}))!==before;
   return {enabled,trained,stats:[G.ship.maxHp,G.shipStats.engineRating,G.shipStats.reactorRating,G.shipStats.coolingRating,G.shipStats.weaponSlots]};
  });
  assert.equal(upgrades.enabled,true);assert.equal(upgrades.trained,false);assert.deepEqual(upgrades.stats,[130,4,2,2,3]);
  await page.evaluate(()=>{
   G.base.recruitSel=1;executeBaseAction('recruit_confirm');executeBaseAction('recruit_confirm');
  });
  assert.equal(await page.evaluate(()=>G.crew.filter(c=>c.role==='engineer').length),2);
  assert.deepEqual(await page.locator('.crew-badge').evaluateAll(badges=>badges.map(b=>b.firstElementChild.textContent)),['C','N','e','e']);
  // A real SOS offer at full fuel must advertise and repair both disabled cores.
  await page.evaluate(()=>{
   G.mode='galaxy';G.pirates=[];G.gasEntities=[];G.ship.hp=G.ship.maxHp;
   for(const core of Object.values(G.ship.systems)){core.condition=100;core.bypassUntil=0;}
   G.fuel=G.shipStats.maxFuel;syncPlayerShipSystems();G.ship.systems.engine.condition=0;G.ship.systems.reactor.condition=0;
   const ns={name:'Rescue QA',type:'cargo',destBase:0,x:G.ship.x,y:G.ship.y,speed:1,hp:100,maxHp:100,guns:0,engineRating:1,rescueCost:150,fuelGift:40,rescuing:true,alive:true};
   G.neutralShips=[ns];G.stranded={sos:true,turnsStranded:0,rescueShip:null,rescuePhase:null};doStrandedWait();
  });
  assert.ok(await page.evaluate(()=>G.stranded.rescuePhase==='offer'));
  const offer=await canvasText(page);assert.ok(offer.includes('engine repair + reactor repair'));assert.ok(!offer.includes('offers 40 fuel'));
  await page.screenshot({path:artifactPath('SOS-drive-repair.png')});
  const fee=await page.evaluate(()=>G.credits);await page.keyboard.press('y');
  assert.deepEqual(await page.evaluate(()=>[G.stranded,G.ship.systems.engine.condition,G.ship.systems.reactor.condition,G.credits]),[null,80,80,fee-150]);
  const actual=await page.evaluate(()=>G.log.findLast(e=>e.msg.includes('transferred')).msg);assert.ok(actual.includes('transferred 0 units'));
  const movement=await page.evaluate(()=>{const x=G.ship.x;tryMove(1,0);return G.ship.x-x;});assert.equal(movement,1);
  // Detailed full/partial readings stay in orbit; comms provide at most one broad hint.
  for(const test of [{biome:'DESERT',partial:false,moon:false},{biome:'VOLCANIC',partial:true,moon:true},{biome:'GAS_GIANT',partial:false,moon:false}]){
   const readings=await page.evaluate(test=>{
    const key=G.ship.x+','+G.ship.y;G.curSystem=key;G.mode='system';G.selPlanet=0;G.selMoon=test.moon?0:-1;
    const desc={name:test.moon?'Reading Moon':'Reading Planet',biome:test.biome,scanState:'none',avgTemp:15,gravity:'0.0',atmosphere:'Reading Atmosphere',radius:0.5,moons:[]};
    const parent=test.moon?{name:'Parent',biome:'GAS_GIANT',scanState:'full',moons:[desc]}:desc;
    G.galaxy[G.ship.y][G.ship.x]={type:'SYSTEM',starType:'YELLOW',name:'Reading System',planets:[parent]};
    const selected=getSelectedSystemBody();delete G.planets[selected.pKey];delete G.enemies[selected.pKey];
    Math.random=window.qaBalanceRandom;
    if(test.biome!=='GAS_GIANT'){const body=getSelectedSystemBody();getOrCreateScanPlanetData(body.pKey,desc.biome,desc.scanState);}
    G.fuel=G.maxFuel;const oldLog=G.log.length;let firstRoll=true;
    Math.random=()=>{if(firstRoll){firstRoll=false;return test.partial?0.7:0;}return window.qaBalanceRandom();};
    doScan();const body=getSelectedSystemBody(),pdata=G.planets[body.pKey];
    renderAll();return {rows:bodyScanReadings(desc,pdata),log:G.log.slice(0,G.log.length-oldLog).map(e=>e.msg),scan:desc.scanState};
   },test);
   assert.ok(['partial','full'].includes(readings.scan));
   const text=await canvasText(page);
   for(const [label,value] of readings.rows){assert.ok(!readings.log.some(msg=>msg.startsWith(label+':')),label+' omitted from comms');assert.ok(text.includes(value),label+' orbital value');}
   assert.ok(readings.log.filter(msg=>msg.startsWith('Scan:')).length<=1,'at most one broad anomaly hint');
   if(test.biome==='GAS_GIANT')assert.ok(!text.includes('* Breathable'));
   await page.screenshot({path:artifactPath('Scan-readings-'+test.biome+'.png')});
   if(test.biome==='DESERT'){
    const practice=await page.evaluate(()=>{
     const body=getSelectedSystemBody(),nav=G.crew.find(c=>c.role==='scout');Math.random=()=>0.5;
     const before=nav._skillXp?.nav||0;doLandOnPlanet(body.pKey,body.targetDesc);doLiftOff();
     const first=nav._skillXp.nav;doLandOnPlanet(body.pKey,body.targetDesc);doLiftOff();
     return [first-before,nav._skillXp.nav-first];
    });assert.deepEqual(practice,[1,1],'each repeated approach earns navigation XP and its launch costs fuel');
   }
  }
  // A generated empty world must not continue using a biome life estimate.
  assert.equal(await page.evaluate(()=>bodyScanReadings({biome:'HABITABLE'},{spawnedAliens:0}).find(row=>row[0]==='Lifeforms')[1]),'None detected');
  // The actual turn coordinator fades temporary boosts, while browsing is free.
  await page.evaluate(()=>{
   G.mode='galaxy';G.shipCombat=null;G.pirates=[];G.neutralShips=[];G.gasEntities=[];G.fuel=G.maxFuel;G.turn=1;G.ship.systemTurn=1;
   G.crew.forEach(c=>{c.moraleBase=55;c.grief=0;c.eventMorale=0;c.drinkGlow=0;c.drugRush=0;});
   boostCrewFromDrink();boostCrewFromDrugs();adjustCrewEventMorale(3);renderAll();
  });
  assert.equal(await page.evaluate(()=>G.crew[0].moraleBase),55);
  assert.ok(await page.evaluate(async()=>await autoSave()));assert.ok(await page.evaluate(async()=>await loadFromStorage()));
  assert.equal(await page.evaluate(()=>G.crew[0].eventMorale),3);
  const free=await page.evaluate(()=>JSON.stringify(G.crew));await page.keyboard.press('i');await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>JSON.stringify(G.crew)),free);
  await page.evaluate(()=>{G.mode='inventory';G._prevMode='galaxy';G._viewTab='crew';renderAll();});
  await page.screenshot({path:artifactPath('Crew-progression.png')});
  await page.evaluate(()=>{const c=G.crew[0];c.unpaidDocks=1;c.moraleBase=45;c.grief=4;c.encouragedUntil=G.turn+30;});
  await page.keyboard.press('x');await page.screenshot({path:artifactPath('Crew-morale-breakdown.png')});
  await page.keyboard.press('Escape');await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>{for(let i=0;i<6;i++)beginCareerTurn('waiting');return G.crew[0].drinkGlow;}),5);
  // Real arena damage propagates a tank explosion to kill/reward resolution.
  const blast=await page.evaluate(()=>{
   const npc={name:'Blast Raider',x:G.ship.x,y:G.ship.y,engineRating:1,guns:1,hp:15,maxHp:100,alive:true,pirateType:'guard'};
   G.pirates=[npc];startShipCombat(npc);const combat=G.shipCombat,rolls=[0,0.99,0,0];Math.random=()=>rolls.length?rolls.shift():0.5;
   damageShipCombatEnemy(combat,combat.enemies[0],1);
   return [npc.hp,npc.alive,G.pirateBounties.kills,G.log.filter(e=>e.msg.includes('FUEL TANK EXPLOSION')).length];
  });
  assert.deepEqual(blast.slice(0,3),[0,false,1]);assert.ok(blast[3]>0);
  await page.screenshot({path:artifactPath('Crew-balance.png')});
  assert.deepEqual(errors,[]);console.log('PASS: two-person hull starts, multiple engineers, ungated upgrades without purchased XP, full-tank SOS drive/reactor repair and real movement, orbital details without comms duplication, fading saved morale and lethal NPC tank explosion rewards.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
