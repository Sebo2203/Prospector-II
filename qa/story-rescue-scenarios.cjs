// Story-event foundation: controlled native scenarios, not natural-career balance.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
  await page.goto(gameUrl);await page.evaluate(()=>initGame('LIGHT_SCOUT','Story QA','Story QA'));
  await page.waitForFunction(()=>G?.log.some(e=>e.msg.includes('Ready for departure')));
  assert.ok(await page.evaluate(async()=>await autoSave()));
  await page.evaluate(()=>{
   window.storyBase=serializeCareer(G);
   window.storyReset=()=>{installSaveSnapshot(parseSaveSnapshot(storyBase));storyPassengerView=null;DEBUG.on=false;DEBUG.fullVision=false;DEBUG.shipInvisible=true;};
   window.storyDeck=(name='Quiet Horizon')=>{
    storyReset();G.mode='galaxy';G.ship.x=10;G.ship.y=10;
    G.expedition.quarantine=createQuarantineIncident(10,10,name);G.expedition.quarantine.discovered=true;
    G.expedition.storySchedule.quarantine={status:'spawned',dueTurn:G.turn};
    G.galaxy[10][10]={type:'DERELICT',name,storyEvent:'quarantine'};boardQuarantineShip();
    return G.expedition.quarantine;
   };
  });
  const delayed=await page.evaluate(async()=>{
   storyReset();G.expedition.quarantine=null;G.expedition.storySchedule.quarantine={status:'pending',dueTurn:G.turn+1};
   const plan=JSON.stringify(G.expedition.storySchedule);if(!await autoSave()||!await loadFromStorage())throw Error('Schedule save/load failed');
   if(plan!==JSON.stringify(G.expedition.storySchedule))throw Error('Schedule changed on load');
   G.mode='galaxy';G.galaxy[G.ship.y][G.ship.x]={type:'VOID'};doWaitGalaxy();
   const q=G.expedition.quarantine;if(!q)throw Error('Native wait did not spawn a due event');
   const name=q.name,position=[q.x,q.y];if(!await autoSave()||!await loadFromStorage())throw Error('Spawn save/load failed');
   return {name,position,same:name===G.expedition.quarantine.name&&JSON.stringify(position)===JSON.stringify([G.expedition.quarantine.x,G.expedition.quarantine.y]),status:G.expedition.storySchedule.quarantine.status};
  });assert.ok(delayed.same);assert.equal(delayed.status,'spawned');checks.push('saved due plan spawns through native career action once, with a persistent name/location');
  const signal=await page.evaluate(()=>{
   const q=storyDeck();G.mode='galaxy';q.discovered=false;G.expedition.events=[];
   G.ship={...G.ship,x:20,y:20};q.x=23;q.y=20;G.visited[20*MAP_W+23]=true;G.galaxy[20][21]=G.galaxy[20][22]={type:'VOID'};
   G.ship.x=19;revealQuarantineShip();const far=q.discovered;
   G.ship.x=20;G.galaxy[20][21]={type:'NEBULA'};revealQuarantineShip();const blocked=q.discovered;
   G.galaxy[20][21]={type:'VOID'};const sensors=G.ship.systems.sensors.condition;G.ship.systems.sensors.condition=0;revealQuarantineShip();const blind=q.discovered;
   G.ship.systems.sensors.condition=sensors;revealQuarantineShip();revealQuarantineShip();
   return {far,blocked,blind,near:q.discovered,count:G.expedition.events.filter(e=>e.id==='quarantine:signal').length,text:G.expedition.events[0]?.text};
  });assert.deepEqual([signal.far,signal.blocked,signal.blind,signal.near,signal.count],[false,false,false,true,1]);assert.match(signal.text,/Quiet Horizon/);checks.push('remote chart history, nebula obstruction and offline sensors stay silent; one named signal inside three tiles');
  await page.evaluate(()=>{
   const q=storyDeck(),p=G.planets[G.curPlanet];
   if(!p.grid.flat().some(c=>c.type==='rw_locked_door'&&c.wardSealed)||p.grid.flat().some(c=>/^q_.*door/.test(c.type)))throw Error('Different door types remain');
   G.player={x:6,y:9};renderAll();
  });await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>G.planets[G.curPlanet].grid[8][6].type),'rw_open_door');
  await page.evaluate(()=>{G.player={x:16,y:9};renderAll();});await page.keyboard.press('ArrowUp');assert.equal(await page.evaluate(()=>G.planets[G.curPlanet].grid[8][16].type),'rw_open_door');checks.push('Mercy Enter and bump opening use the same ringworld closed/open door states');
  await page.evaluate(()=>{
   const q=storyDeck(),m=q.survivors[0];Object.assign(m,{x:5,y:9});G.player={x:3,y:9};revealPlanet(G.curPlanet,3,9);G.examine=null;renderAll();
   if(getExamineName(5,9).type!=='creature')throw Error('Survivor bypasses creature examine');
  });await page.keyboard.press('x');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
  assert.match(await page.locator('#crew-list').textContent(),/Mira Vale/);
  const examinePoint=await page.evaluate(()=>{const r=canvas.getBoundingClientRect();return {x:r.x+(5-canvasMapView.camX+0.5)*TS*r.width/canvasWidth,y:r.y+(9-canvasMapView.camY+0.5)*TS*r.height/canvasHeight};});
  await page.mouse.click(examinePoint.x,examinePoint.y);assert.deepEqual(await page.evaluate(()=>G.examine),{x:5,y:9});
  // Check the shared examine payload/range without adding actors to the enemy roster.
  assert.ok(await page.evaluate(()=>{const info=getExamineName(5,9);return canExamineCreatureDetails(info.enemy)&&info.enemy.storySurvivor&&!(G.enemies[G.curPlanet]||[]).includes(info.enemy);}));
  await page.screenshot({path:artifactPath('story-rescue-examine.png')});checks.push('keyboard and pointer examine survivors through the normal creature payload, range gate and sidebar without making them enemies');
  await page.evaluate(()=>{
   const q=storyDeck();G.examine=null;DEBUG.fullVision=true;for(const s of q.survivors)s.met=true;
   G.player={x:16,y:10};const pd=G.planets[G.curPlanet];pd.visited.fill(true);pd.lit=new Array(pd.width*pd.height).fill(true);renderAll();
  });await page.screenshot({path:artifactPath('story-rescue-interior.png')});
  assert.ok(await page.evaluate(()=>{
   const c=document.createElement('canvas');c.width=c.height=TS;const g=c.getContext('2d');g.fillText=()=>{throw Error('Normal fixture art contains glyphs');};
   const before=serializeCareer(G),random=Math.random;Math.random=()=>{throw Error('Art uses rule RNG');};
   try{for(const type of Object.keys(QUARANTINE_FIXTURES))DRAW[type](g,0,0);for(const s of quarantinePeople())drawQuarantinePerson(g,0,0,s);return before===serializeCareer(G);}finally{Math.random=random;}
  }));checks.push('normal fixtures/survivors draw pixel art without glyphs, RNG or saved-state mutation');
  await page.evaluate(()=>{
   const q=storyDeck();q.repaired=true;const s=q.survivors.find(s=>s.id==='ilya');s.status='onboard';
   G.mode='galaxy';G.inventory=[{name:'Antibiotics',usable:'antibiotics',value:0}];G._prevMode='galaxy';G.mode='inventory';G._viewTab='ship';renderAll();
  });await page.keyboard.press('p');assert.ok(await page.evaluate(()=>storyPassengerView?.career===G));
  await page.screenshot({path:artifactPath('story-rescue-passengers.png')});
  const before=await page.evaluate(()=>G.turn);await page.keyboard.press('t');
  assert.deepEqual(await page.evaluate(()=>[quarantinePeople().find(s=>s.id==='ilya').infectious,G.inventory.length,G.turn]),[false,0,before+1]);
  await page.keyboard.press('t');assert.equal(await page.evaluate(()=>G.turn),before+1,'refused treatment is free');
  assert.ok(await page.evaluate(async()=>await autoSave()&&await loadFromStorage()));assert.equal(await page.evaluate(()=>quarantinePeople().find(s=>s.id==='ilya').infectious),false);
  checks.push('keyboard passenger care consumes one antibiotic and one turn, refuses repeated care freely, and persists');
  // Pointer and keyboard invoke the same medical action.
  await page.evaluate(()=>{const q=storyDeck();q.repaired=true;const s=q.survivors.find(s=>s.id==='rowan');s.status='onboard';G.inventory=[{name:'Medikit',usable:'medikit',value:0}];G.mode='inventory';G._prevMode='galaxy';G._viewTab='ship';openStoryPassengers();});
  const point=await page.evaluate(()=>{const t=canvasMenuTargets.find(t=>t.label==='Give medical care [T]'),r=canvas.getBoundingClientRect();return {x:r.x+(t.x+t.w/2)*r.width/canvasWidth,y:r.y+(t.y+t.h/2)*r.height/canvasHeight};});
  await page.mouse.click(point.x,point.y);assert.equal(await page.evaluate(()=>quarantinePeople().find(s=>s.id==='rowan').injured),false);checks.push('pointer care uses the same owned medikit to stabilize an onboard casualty');
  await page.evaluate(()=>{quarantinePeople().forEach(s=>s.status='onboard');renderAll();});
  await page.setViewportSize({width:800,height:600});await page.evaluate(()=>renderAll());await page.screenshot({path:artifactPath('story-rescue-passengers-small.png')});await page.setViewportSize({width:1400,height:720});
  const outcome=await page.evaluate(()=>{
   const q=storyDeck();q.repaired=true;q.survivors.forEach(s=>Object.assign(s,{status:'dead',hp:0,met:true,seenCondition:'found dead'}));
   const credits=G.credits;doWaitPlanet();const mission=activeMissionSummaries().some(m=>m.title===q.name+' rescue');
   const result={closed:q.status==='closed',mission,paid:G.credits-credits,events:G.expedition.events.filter(e=>e.id==='quarantine:closed').length};
   resolveQuarantineOutcome();result.eventsAfter=G.expedition.events.filter(e=>e.id==='quarantine:closed').length;return result;
  });assert.deepEqual(outcome,{closed:true,mission:false,paid:0,events:1,eventsAfter:1});checks.push('confirmed total loss closes on the native tick, leaves active missions and pays nothing without docking');
  assert.ok(await page.evaluate(()=>{
   const good=serializeCareer(G),bad=JSON.parse(good);bad.expedition.storySchedule.quarantine.dueTurn=-1;
   try{parseSaveSnapshot(bad);return false;}catch(e){return good===serializeCareer(G);}
  }));checks.push('invalid event deadlines are rejected without replacing the active career');
  assert.deepEqual(errors,[]);fs.writeFileSync(artifactPath('story-rescue.json'),JSON.stringify({checks,errors,delayed},null,2));console.log(JSON.stringify({checks,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
