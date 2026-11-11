const assert=require('node:assert/strict');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('ATTACK_CORVETTE','Calendar QA','Calendar QA'));
  await page.waitForFunction(()=>G?.galaxy && G.log.some(e=>e.msg.includes('Ready for departure')));
  assert.equal(await page.locator('#h-clock').textContent(),'D1 00:00');
  const travel=await page.evaluate(()=>{
   DEBUG.shipInvisible=true;G.pirates=[];G.neutralShips=[];G.gasEntities=[];
   G.ship.x=10;G.ship.y=10;for(let y=9;y<=12;y++)for(let x=9;x<=12;x++)G.galaxy[y][x]={type:'VOID'};
   const turn=G.turn;tryMove(1,0);doWaitGalaxy();return [G.turn-turn,G.careerTime.minutes,G.careerTime.locations.space];
  });assert.deepEqual(travel,[2,120,120]);
  const surface=await page.evaluate(()=>{
   generatePlanet('calendar-test','FROZEN');const p=G.planets['calendar-test'];
   G.mode='planet';G.curPlanet='calendar-test';G.player={x:10,y:10};G.enemies[G.curPlanet]=[];
   G.crew.forEach(c=>{c.armorUsable='armor_vac';});G.oxygen=100;p.planetTurn=5;
   p.grid[10][10]={type:'FROZEN_FLOOR'};p.grid[10][11]={type:'FROZEN_FLOOR'};
   applyCrewStatus(G.crew[0],'hangover',{duration:20,silent:true});
   const raw=serializeCareer(G),record=recordCareerActionTime;
   const run=enabled=>{
    installSaveSnapshot(parseSaveSnapshot(raw));Math.random=()=>0.5;
    if(!enabled)recordCareerActionTime=()=>{};
    try{tryMove(1,0);doWaitPlanet();}finally{recordCareerActionTime=record;}
    const result=JSON.parse(serializeCareer(G));delete result.careerTime;return JSON.stringify(result);
   };
   const off=run(false),on=run(true);return {identical:off===on,time:G.careerTime.minutes,planet:G.careerTime.locations.planets,local:planetLocalTimeText(G.curPlanet)};
  });assert.ok(surface.identical,'recording does not alter any serialized gameplay state');assert.equal(surface.time,130);assert.equal(surface.planet,10);
  assert.ok((await page.locator('#h-phase').textContent()).includes(surface.local));
  const beforeMenu=await page.evaluate(()=>[G.turn,G.careerTime.minutes]);
  await page.keyboard.press('i');await page.keyboard.press('Escape');assert.deepEqual(await page.evaluate(()=>[G.turn,G.careerTime.minutes]),beforeMenu);
  const service=await page.evaluate(()=>{
   G.mode='base';G.base={screen:'main',sel:0,stationName:'Starbase Alpha'};G.credits=1000;G.fuel=G.maxFuel-10;
   const before=[G.turn,G.careerTime.minutes];executeBaseAction('refuel');const after=[G.turn,G.careerTime.minutes];
   executeBaseAction('refuel');return {before,after,again:[G.turn,G.careerTime.minutes],station:G.careerTime.locations.stations};
  });assert.equal(service.after[0],service.before[0]);assert.equal(service.after[1]-service.before[1],30);assert.deepEqual(service.again,service.after);assert.equal(service.station,30);
  const combat=await page.evaluate(()=>{
   G.mode='galaxy';const enemy={name:'Clock Raider',pirateType:'guard',x:G.ship.x,y:G.ship.y,engineRating:1,guns:1,hp:100,maxHp:100,alive:true};
   G.pirates=[enemy];startShipCombat(enemy);enemy.weaponReadyAt=[G.turn+100];G.shipCombat.asteroids=[];
   const before=[G.turn,G.careerTime.minutes];advanceShipCombat();
   const after=[G.turn,G.careerTime.minutes];G.ship.systems.sensors.condition=50;
   G.crew.push(randomCrewMember('engineer'));Math.random=()=>0.1;repairShipSystem('sensors','improvised');
   return {before,after,repair:[G.turn,G.careerTime.minutes],remaining:G.ship.systems.sensors.bypassUntil-G.turn};
  });assert.deepEqual(combat.after,[combat.before[0]+1,combat.before[1]+1]);assert.deepEqual(combat.repair,[combat.after[0]+1,combat.after[1]+15]);assert.equal(combat.remaining,14);
  const saved=await page.evaluate(()=>JSON.stringify(G.careerTime));assert.ok(await page.evaluate(async()=>await autoSave()));assert.ok(await page.evaluate(async()=>await loadFromStorage()));assert.equal(await page.evaluate(()=>JSON.stringify(G.careerTime)),saved);
  assert.ok(await page.evaluate(()=>{
   const active=G,snapshot=JSON.parse(serializeCareer(G));snapshot.careerTime.locations.space++;
   try{parseSaveSnapshot(JSON.stringify(snapshot));return false;}catch{return G===active;}
  }),'mismatched time totals are rejected transactionally');
  await page.evaluate(()=>{
   G.mode='planet';G.curPlanet='calendar-test';G.retired=false;G.dead=false;renderAll();
  });
  for(const viewport of [{width:1400,height:720},{width:1000,height:620}]){
   await page.setViewportSize(viewport);
   assert.ok(await page.locator('#h-clock').evaluate(el=>{const a=el.getBoundingClientRect(),b=document.getElementById('hud').getBoundingClientRect();return a.left>=b.left && a.right<=b.right;}));
   await page.screenshot({path:artifactPath('Calendar-surface-'+viewport.width+'.png')});
  }
  await page.evaluate(()=>{recordCareerTime('travel',43200+1440,'space');G.retired=true;renderAll();});
  await page.screenshot({path:artifactPath('Calendar-retirement.png')});
  await page.evaluate(()=>{G.retired=false;G.dead=true;G.deathCause='A calendar QA encounter ended the expedition.';renderAll();});
  await page.screenshot({path:artifactPath('Calendar-death.png')});
  assert.deepEqual(errors,[]);console.log('PASS: parallel travel/surface/combat/repair/service time, identical gameplay state, free menus/failed actions, local solar display, save validation and end-report screenshots.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
