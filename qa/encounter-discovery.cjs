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
   const q=G.expedition.quarantine;
   if(!q||q.discovered!==false||G.visited[q.y*MAP_W+q.x])throw Error('Missing or initially revealed wreck');
   if(G.galaxy.flat().filter(c=>c.name==='Mercy of Dawn').length!==1)throw Error('Expected exactly one generated wreck');
   if(G.log.some(e=>/Mercy|distress/i.test(e.msg))||currentLogRecords().some(e=>/Mercy/.test(e.msg))||G.expedition.events.some(e=>/Mercy/.test(e.text)))throw Error('Hidden wreck leaked to log');
   if(Math.hypot(q.x-G.ship.x,q.y-G.ship.y)<=5)throw Error('Wreck placed inside opening station range');
   return{x:q.x,y:q.y};
  }));
 }
 assert.deepEqual(openings[0],openings[1]);
 console.log('12 generated-world openings passed, including repeated seeded placement');
 const discovery=await page.evaluate(async()=>{
  // Controlled fixture: preserve the generated incident, isolate its visibility and native movement.
  G.galaxy=Array.from({length:MAP_H},()=>Array.from({length:MAP_W},()=>({type:'VOID'})));G.visited.fill(false);
  G.pirates=[];G.neutralShips=[];G.npcStranded=[];G.nebulaLoot=[];G.gasEntities=[];G.pulsars=[];G.blackHoles=[];G.pirateBases=[];
  G.ship.x=60;G.ship.y=35;G.expedition.events=[];DEBUG.on=false;DEBUG.shipInvisible=true;
  const radius=G.shipStats.sensorRange+(Math.max(...G.crew.filter(c=>c.hp>0).map(c=>c.skills.nav))>=2?1:0);
  Object.assign(G.expedition.quarantine,{x:60+radius+1,y:35,discovered:false});
  let q=G.expedition.quarantine;G.galaxy[q.y][q.x]={type:'DERELICT',name:'Mercy of Dawn'};
  revealAround(60,35,radius);if(q.discovered)throw Error('Discovered beyond sensors');
  const hidden=JSON.stringify(q);await autoSave();let saved=await readStoredAutosave();installSaveSnapshot(parseSaveSnapshot(saved.record.raw));
  q=G.expedition.quarantine;if(JSON.stringify(q)!==hidden)throw Error('Hidden placement changed on load');
  Math.random=()=>0;tryMove(-1,0);if(q.discovered)throw Error('Exploring unrelated space revealed wreck');
  tryMove(1,0);tryMove(1,0);
  if(!q.discovered||!G.visited[q.y*MAP_W+q.x])throw Error('Native sensor reveal did not discover preset wreck');
  if(q.lastTick!==null||q.survivors.length)throw Error('Air clock started before boarding');
  if(!currentLogRecords().some(e=>/Mercy/.test(e.msg)))throw Error('Known wreck missing from records');
  const encounter=JSON.stringify(q);tryMove(-1,0);tryMove(1,0);
  if(JSON.stringify(q)!==encounter||G.expedition.events.filter(e=>e.id==='quarantine:signal').length!==1)throw Error('Moved or duplicated incident');
  await autoSave();saved=await readStoredAutosave();installSaveSnapshot(parseSaveSnapshot(saved.record.raw));
  if(JSON.stringify(G.expedition.quarantine)!==encounter)throw Error('Known encounter changed on load');
  const position={x:q.x+1,y:q.y+1};
  // Older worlds without an incident must not gain one by exploring, even at zero RNG.
  G.galaxy[q.y][q.x]={type:'VOID'};G.expedition.quarantine=null;G.expedition.events=[];tryMove(1,0);
  if(G.expedition.quarantine||G.galaxy.flat().some(c=>c.name==='Mercy of Dawn'))throw Error('Exploration spawned a wreck');
  return{position,checks:['one hidden preset wreck per fresh galaxy','seed repeatability','no initial coordinates or records leak','hidden placement survives transactional save/load','native movement reveals existing wreck only','one signal, stable position and stopped boarding clock','known placement survives save/load','old worlds without Mercy do not spawn one']};
 });
 await page.evaluate(()=>{let n=947;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};debugEnterPalette('galaxy');debugPaletteVisit('galaxy:QUARANTINE');doInteract();if(!quarantineInterior())throw Error('Palette Mercy is not boardable');debugReturnFromPalette();});
 await page.evaluate(()=>autoSave());await page.screenshot({path:artifactPath('Mercy-generated-world.png')});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({openings,...discovery,errors},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
