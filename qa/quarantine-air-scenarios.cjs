// Native contaminated-air regression; fixtures isolate the ward from other infection sources.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage(),errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
  await page.goto(gameUrl);await page.evaluate(()=>initGame('LIGHT_SCOUT','Air QA','Air QA'));
  await page.waitForFunction(()=>G?.log.some(e=>e.msg.includes('Ready for departure')));
  assert.ok(await page.evaluate(async()=>await autoSave()));
  await page.evaluate(()=>{
   window.airBase=serializeCareer(G);
   window.airSetup=(armor,punctured=false,filtered=false)=>{
    installSaveSnapshot(parseSaveSnapshot(airBase));DEBUG.on=false;
    G.ship.x=G.ship.y=10;G.mode='galaxy';G.expedition.quarantine=createQuarantineIncident(10,10,'Air QA');
    G.expedition.storySchedule.quarantine={status:'spawned',dueTurn:G.turn};boardQuarantineShip();
    const q=G.expedition.quarantine;q.repaired=true;q.filtered=filtered;
    G.player={x:26,y:14};G.crew.forEach(c=>{c.statuses={};c._quarantineExposure=0;});
    const c=G.crew[0];c.armorUsable=armor;c.armor=armor||'Naked';c._equippedArmor=null;
    if(punctured)applyCrewStatus(c,'suit_puncture',{amount:1,source:'air_fixture',silent:true});
    Math.random=()=>0.99;revealPlanet(G.curPlanet,26,14);renderAll();
   };
   window.airPawnSprite=()=>{
    const original=drawSprite,keys=[];drawSprite=(key)=>keys.push(key);
    try{drawPlayerPawn(0,0);}finally{drawSprite=original;}return keys[0];
   };
  });
  async function scenario(name,armor,options={}){
   await page.evaluate(({armor,options})=>airSetup(armor,!!options.punctured,!!options.filtered),{armor,options});
   if(options.cleanTile)await page.evaluate(()=>{G.player={x:22,y:14};revealPlanet(G.curPlanet,22,14);renderAll();});
   const sprite=await page.evaluate(()=>airPawnSprite()),turn=await page.evaluate(()=>G.turn);
   for(let i=0;i<2;i++)await page.keyboard.press('Space');
   assert.equal(await page.evaluate(()=>!!G.crew[0].statuses.infection),false,name+': not infected before exposure threshold');
   if(options.reload){assert.ok(await page.evaluate(async()=>await autoSave()&&await loadFromStorage()));await page.evaluate(()=>Math.random=()=>0.99);}
   await page.keyboard.press('Space');
   const result=await page.evaluate(()=>({infected:!!G.crew[0].statuses.infection,protectedCrewInfected:!!G.crew[1].statuses.infection,elapsed:G.turn}));
   assert.equal(result.elapsed,turn+3,name+': one turn per wait');assert.equal(result.infected,!!options.infect,name+': actual infection');assert.equal(result.protectedCrewInfected,false,name+': sealed companion is not exposed');
   assert.equal(sprite,options.helmet?'player_pawn_helmet':armor==='armor_plate'||!armor?'player_pawn':'player_pawn_suit',name+': visible helmet matches protection');results.push(name);
  }
  for(const armor of ['armor_flight','armor_reinforced','armor_exosuit','armor_diving'])await scenario('sealed '+armor,armor,{helmet:true});
  await scenario('armor plate does not seal air','armor_plate',{infect:true});
  await scenario('missing suit','', {infect:true});
  await scenario('punctured suit','armor_flight',{punctured:true,infect:true,helmet:true});
  await scenario('repaired scrubber stops airborne exposure','armor_plate',{filtered:true});
  await scenario('clean corridor is not contaminated air','armor_plate',{cleanTile:true});
  await scenario('two exposure turns survive confirmed save/load','armor_plate',{infect:true,reload:true});
  await page.evaluate(()=>{airSetup('armor_flight');G.examine=null;renderAll();});await page.screenshot({path:artifactPath('quarantine-air-helmet.png')});
  assert.deepEqual(errors,[]);fs.writeFileSync(artifactPath('quarantine-air.json'),JSON.stringify({results,errors},null,2));console.log(JSON.stringify({results,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
