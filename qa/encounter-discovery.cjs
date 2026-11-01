const {gameUrl,artifactPath,fixtureFile}=require('./runtime.cjs');
const {chromium}=require('./runtime.cjs'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
 await page.goto(gameUrl);await page.waitForFunction(()=>typeof initGame==='function');
 for(let i=0;i<12;i++){
  await page.evaluate(i=>{let n=i+123;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};initGame('LIGHT_SCOUT','Discovery QA','Quiet Start');},i);
  await page.waitForFunction(()=>G?.galaxy&&G.log.some(e=>e.msg.includes('Ready for departure')));
  assert.equal(await page.evaluate(()=>!!G.expedition?.quarantine||G.galaxy.some(row=>row.some(c=>c.name==='Mercy of Dawn'))||G.log.some(e=>/Mercy|distress/i.test(e.msg))||(G.expedition?.events||[]).some(e=>/Mercy/.test(e.text))),false);
 }
 console.log('Startup checks passed');await page.screenshot({path:artifactPath('Mercy-random-event-startup.png')});
 console.log('Testing movement discovery');const discovery=await page.evaluate(async()=>{
  // Controlled isolation fixture, separate from the ordinary retirement career.
  G.galaxy=Array.from({length:MAP_H},()=>Array.from({length:MAP_W},()=>({type:'VOID'})));G.visited.fill(false);
  G.pirates=[];G.neutralShips=[];G.npcStranded=[];G.nebulaLoot=[];G.gasEntities=[];G.pulsars=[];G.blackHoles=[];G.pirateBases=[];
  G.ship.x=60;G.ship.y=35;G.expedition={version:1,events:[],surveys:{},quarantine:null};DEBUG.on=false;DEBUG.shipInvisible=true;
  const radius=G.shipStats.sensorRange+(Math.max(...G.crew.map(c=>c.skills.nav))>=2?1:0);revealAround(60,35,radius);
  Math.random=()=>0.5;tryMove(1,0);if(G.expedition.quarantine)throw Error('No-hit roll created an encounter');
  Math.random=()=>0;tryMove(-1,0);tryMove(1,0);if(G.expedition.quarantine)throw Error('Previously charted space rerolled');
  tryMove(1,0);const q=G.expedition.quarantine;if(!q)throw Error('Winning discovery roll did not create the wreck');
  if(!G.visited[q.y*MAP_W+q.x]||Math.hypot(q.x-G.ship.x,q.y-G.ship.y)>radius)throw Error('Discovery is beyond actual sensor reveal');
  if(q.lastTick!==null||q.survivors.length)throw Error('Air clock or deck started before boarding');
  const encounter=JSON.stringify(q),signals=G.expedition.events.filter(e=>e.id==='quarantine:signal').length;
  tryMove(1,0);if(JSON.stringify(q)!==encounter||G.expedition.events.filter(e=>e.id==='quarantine:signal').length!==signals)throw Error('Duplicated encounter');
  await autoSave();await autosaveQueue.idle();const stored=await readStoredAutosave();if(!stored?.record?.raw)throw Error('Discovery did not save');
  installSaveSnapshot(parseSaveSnapshot(stored.record.raw));if(JSON.stringify(G.expedition.quarantine)!==encounter)throw Error('Discovery changed on load');
  return{position:{x:q.x+1,y:q.y+1},signals,started:q.lastTick,checks:['no startup spawn/message/marker in 12 fresh careers','no-hit discovery roll','no rerolls on charted sectors','actual galaxy movement discovers a nearby wreck','first boarding clock remains stopped','one incident and one signal','transactional save and native load retain encounter']};
 });
 console.log('Movement/save checks passed');await page.evaluate(()=>{let n=947;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};debugEnterPalette('galaxy');debugPaletteVisit('galaxy:QUARANTINE');doInteract();if(!quarantineInterior())throw Error('Palette Mercy is not boardable');debugReturnFromPalette();});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({...discovery,errors},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
