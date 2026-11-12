const {gameUrl,artifactPath,chromium}=require('./runtime.cjs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
 await page.goto(gameUrl);await page.waitForFunction(()=>typeof initGame==='function');
 const openings=[];
 for(let i=0;i<12;i++){
  await page.evaluate(i=>{let n=(i<2?123:i+123);Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};initGame('LIGHT_SCOUT','Discovery QA','Quiet Start');},i);
  await page.waitForFunction(()=>G?.galaxy&&G.log.some(e=>e.msg.includes('Ready for departure')));
  openings.push(await page.evaluate(()=>{
   const q=G.expedition.quarantine,plan=G.expedition.storySchedule.quarantine;
   if(!['pending','absent','spawned'].includes(plan.status))throw Error('Missing story plan');
   if(q){
    if(q.discovered!==false||G.visited[q.y*MAP_W+q.x])throw Error('Initially revealed wreck');
    if(G.galaxy.flat().filter(c=>c.storyEvent==='quarantine').length!==1)throw Error('Expected one rescue vessel');
    if(!QUARANTINE_SHIP_NAMES.includes(q.name))throw Error('Missing catalog name');
    if(Math.hypot(q.x-G.ship.x,q.y-G.ship.y)<=5)throw Error('Wreck inside opening station range');
   }
   if(G.log.some(e=>/distress transmission/i.test(e.msg))||G.expedition.events.some(e=>e.id==='quarantine:signal'))throw Error('Hidden wreck leaked');
   return{plan:{...plan},name:q?.name||null,x:q?.x??null,y:q?.y??null};
  }));
 }
 assert.deepEqual(openings[0],openings[1]);
 assert.ok(openings.some(o=>o.plan.status==='absent'));assert.ok(openings.some(o=>o.plan.status==='pending'));assert.ok(openings.some(o=>o.plan.status==='spawned'));
 console.log('12 optional/generated story plans passed, including repeated seed');
 const discovery=await page.evaluate(async()=>{
  // Controlled fixture: preserve the generated incident, isolate its visibility and native movement.
  G.galaxy=Array.from({length:MAP_H},()=>Array.from({length:MAP_W},()=>({type:'VOID'})));G.visited.fill(false);
  G.pirates=[];G.neutralShips=[];G.npcStranded=[];G.nebulaLoot=[];G.gasEntities=[];G.pulsars=[];G.blackHoles=[];G.pirateBases=[];
  G.ship.x=60;G.ship.y=35;G.expedition.events=[];DEBUG.on=false;DEBUG.shipInvisible=true;
  const radius=G.shipStats.sensorRange+(Math.max(...G.crew.filter(c=>c.hp>0).map(c=>c.skills.nav))>=2?1:0);
  G.expedition.storySchedule.quarantine={status:'spawned',dueTurn:G.turn};
  G.expedition.quarantine=createQuarantineIncident(60+Math.min(radius,3)+1,35,'Quiet Horizon');
  let q=G.expedition.quarantine;G.galaxy[q.y][q.x]={type:'DERELICT',name:q.name};
  revealAround(60,35,radius);if(q.discovered)throw Error('Discovered beyond sensors');
  const hidden=JSON.stringify(q);await autoSave();let saved=await readStoredAutosave();installSaveSnapshot(parseSaveSnapshot(saved.record.raw));
  q=G.expedition.quarantine;if(JSON.stringify(q)!==hidden)throw Error('Hidden placement changed on load');
  Math.random=()=>0;tryMove(-1,0);if(q.discovered)throw Error('Exploring unrelated space revealed wreck');
  tryMove(1,0);tryMove(1,0);
  if(!q.discovered||!G.visited[q.y*MAP_W+q.x])throw Error('Native sensor reveal did not discover preset wreck');
  if(q.lastTick!==null||q.survivors.length)throw Error('Air clock started before boarding');
  if(!currentLogRecords().some(e=>e.msg.includes(q.name)))throw Error('Known wreck missing from records');
  const encounter=JSON.stringify(q);tryMove(-1,0);tryMove(1,0);
  if(JSON.stringify(q)!==encounter||G.expedition.events.filter(e=>e.id==='quarantine:signal').length!==1)throw Error('Moved or duplicated incident');
  await autoSave();saved=await readStoredAutosave();installSaveSnapshot(parseSaveSnapshot(saved.record.raw));
  if(JSON.stringify(G.expedition.quarantine)!==encounter)throw Error('Known encounter changed on load');
  const position={x:q.x+1,y:q.y+1};
  // An absent career never acquires the event just by exploring or waiting.
  G.galaxy[q.y][q.x]={type:'VOID'};G.expedition.quarantine=null;G.expedition.events=[];G.expedition.storySchedule.quarantine={status:'absent',dueTurn:null};tryMove(1,0);
  if(G.expedition.quarantine)throw Error('Absent story spawned');
  return{position,checks:['optional saved story plan per fresh galaxy','seed repeatability','no initial coordinates or records leak','hidden placement survives transactional save/load','native movement reveals existing wreck only','one nearby signal, stable position and unchanged boarding clock','known placement survives save/load','absent story does not spawn from exploration']};
 });
 await page.evaluate(()=>{let n=947;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};debugEnterPalette('galaxy');debugPaletteVisit('galaxy:QUARANTINE');doInteract();if(!quarantineInterior())throw Error('Palette Mercy is not boardable');debugReturnFromPalette();});
 await page.evaluate(()=>autoSave());await page.screenshot({path:artifactPath('Mercy-generated-world.png')});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({openings,...discovery,errors},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
