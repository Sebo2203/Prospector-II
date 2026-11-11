const assert=require('node:assert/strict');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
const {canvasText,clickTarget,assertMenuFits}=require('./systems-menu-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.text().startsWith('Prospector input error:'))errors.push(message.text());});
  await page.route(/^https?:/,route=>route.abort());await page.goto(gameUrl);
  const start=async id=>{
   await page.evaluate(id=>initGame(id,'Hull QA','Hull QA'),id);
   await page.waitForFunction(()=>G?.galaxy && G.log.some(entry=>entry.msg.includes('Ready for departure')));
   // Hull quote identity includes crew IDs. Settle the first transactional save
   // before reviewing quotes so its ID assignment cannot invalidate the fixture's quote.
   assert.ok(await page.evaluate(async()=>await autoSave()));
  };
  await start('ATTACK_CORVETTE');
  await page.evaluate(()=>{G.credits=10000;G.installedWeapons=['artemis'];G.installedModules=['fuel_scoop'];G.ship.ammo.artemis=5;G.ship.weaponReadyAt=[G.turn+5];});
  await page.keyboard.press('Enter');await page.keyboard.press('Enter');
  await page.evaluate(()=>executeBaseAction('changehull'));
  await page.keyboard.press('ArrowRight');
  assert.match(await canvasText(page),/Bulk Freighter|BULK FREIGHTER/);
  assert.match(await canvasText(page),/Net exchange 2000 cr/);
  const before=await page.evaluate(()=>[G.credits,G.turn,G.fuel,G.shipStats.classId]);
  await clickTarget(page,'Review exchange [Enter]');
  assert.deepEqual(await page.evaluate(()=>[G.credits,G.turn,G.fuel,G.shipStats.classId]),before);
  assert.match(await canvasText(page),/Confirm exchange/);
  await assertMenuFits(page);await page.screenshot({path:artifactPath('Hull-exchange-quote.png')});
  await page.keyboard.press('Enter');
  assert.deepEqual(await page.evaluate(()=>[G.credits,G.turn,G.fuel,G.shipStats.classId]),[before[0]-2000,before[1],90,'BULK_FREIGHTER']);
  assert.deepEqual(await page.evaluate(()=>[G.installedWeapons.length,G.installedModules.length,G.ship.ammo.artemis]),[0,0,5]);
  assert.equal(await page.evaluate(()=>stationEquipmentStore().weapons[0].readyAt),before[1]+5);
  assert.ok(await page.evaluate(async()=>await autoSave()));assert.ok(await page.evaluate(async()=>await loadFromStorage()));
  assert.deepEqual(await page.evaluate(()=>[stationEquipmentStore().weapons[0].id,stationEquipmentStore().weapons[0].readyAt,stationEquipmentStore().modules[0]]),['artemis',before[1]+5,'fuel_scoop']);
  await page.evaluate(()=>{executeBaseAction('upwslot');executeBaseAction('upwslot');G.base.weaponSlot=1;G.base.weaponSel=Object.keys(SHIP_WEAPONS).indexOf('artemis');executeBaseAction('confirminstall');executeBaseAction('restore_module_fuel_scoop');});
  assert.deepEqual(await page.evaluate(()=>[G.credits,G.installedWeapons[1],G.installedModules[0],G.ship.weaponReadyAt[1],G.ship.ammo.artemis]),[before[0]-3000,'artemis','fuel_scoop',before[1]+5,5]);
  assert.equal(await page.evaluate(()=>parseSaveSnapshot(serializeCareer(G)).shipRefits.upwslot),2);
  assert.ok(await page.evaluate(async()=>await autoSave()));assert.ok(await page.evaluate(async()=>await loadFromStorage()));
  assert.deepEqual(await page.evaluate(()=>[G.shipStats.classId,G.installedWeapons[1],G.ship.ammo.artemis]),['BULK_FREIGHTER','artemis',5]);
  // More than three later-purchase hulls use a scrollable catalog without altering starters.
  await page.evaluate(()=>{registerShipHull({...SHIP_CLASSES.BULK_FREIGHTER,id:'QA_LATER_HULL',name:'QA later hull',size:3});registerShipHull({...SHIP_CLASSES.LIGHT_SCOUT,id:'QA_LATER_SCOUT',name:'QA later scout'});executeBaseAction('changehull');});
  await page.keyboard.press('PageDown');
  assert.match(await canvasText(page),/QA LATER SCOUT/);
  assert.equal(await page.evaluate(()=>STARTER_HULL_IDS.length),3);await assertMenuFits(page);
  for(const viewport of [{width:1400,height:720},{width:900,height:650}]){
   await page.setViewportSize(viewport);await assertMenuFits(page);await page.screenshot({path:artifactPath('Hull-catalog-'+viewport.width+'.png')});
  }
  // Native movement, wait, rough approach and liftoff preserve turns while charging size-specific costs.
  for(const [id,travel,idle,launch,impact]of [['LIGHT_SCOUT',0.8,0.5,1,3],['ATTACK_CORVETTE',1.3,0.75,1.5,5],['BULK_FREIGHTER',2,1.25,2.5,8]]){
   await start(id);
   const outcome=await page.evaluate(()=>{
    G.pirates=[];G.neutralShips=[];G.gasEntities=[];G.npcStranded=[];G.pulsars=[];G.blackHoles=[];G._pirateRoamerTarget=0;
    G.nextCrewGalaxyTalkTurn=G.nextCrewTalkTurn=G.turn+1000;
    G.ship.x=10;G.ship.y=10;for(let y=9;y<13;y++)for(let x=9;x<13;x++)G.galaxy[y][x]={type:'VOID'};
    const fuel=G.fuel,turn=G.turn;tryMove(1,0);const moved=G.fuel;doWaitGalaxy();
    return {travel:Math.round((fuel-moved)*100)/100,idle:Math.round((moved-G.fuel)*100)/100,turns:G.turn-turn};
   });assert.deepEqual(outcome,{travel,idle,turns:2});
   const landing=await page.evaluate(()=>{
    const key='qa:hull-landing',desc={biome:'DESERT',name:'Landing QA',scanState:'full'};
    getOrCreateScanPlanetData(key,'DESERT','full');G.crew.forEach(crew=>crew.skills.nav=0);
    G.ship.shieldCharge=0;const hp=G.ship.hp,fuel=G.fuel,turn=G.turn;
    const random=Math.random;Math.random=()=>0;try{doLandOnPlanet(key,desc);}finally{Math.random=random;}
    const damage=hp-G.ship.hp;doLiftOff();
    return {damage,fuel:Math.round((fuel-G.fuel)*100)/100,turns:G.turn-turn,mode:G.mode};
   });assert.deepEqual(landing,{damage:impact,fuel:launch,turns:0,mode:'galaxy'});
   const low=await page.evaluate(()=>{
    G.fuel=0.1;const x=G.ship.x,turn=G.turn;tryMove(1,0);
    return [G.ship.x===x,G.turn===turn,!!G.stranded,strandedLifeSupportFailing()];
   });assert.deepEqual(low,[true,true,true,false]);
   const fractional=await page.evaluate(()=>parseSaveSnapshot(serializeCareer(G)).fuel);assert.equal(fractional,0.1);
  }
  // Real workshop uses normal hull limits; reset and return cannot replace the active career.
  const career=await page.evaluate(()=>{G.shipAnim=null;return serializeCareer(G);});
  await page.evaluate(()=>{debugEnterPalette();debugPaletteVisit('galaxy:HULL_WORKSHOP');});
  assert.equal(await page.evaluate(()=>G.mode),'base');
  assert.equal(await page.evaluate(()=>hullFittingReason(G.shipStats,G.ship.maxHp,G.installedWeapons)),'');
  await page.evaluate(()=>executeBaseAction('changehull'));await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>G.shipStats.classId),'BULK_FREIGHTER');
  await page.evaluate(()=>debugPaletteVisit('galaxy:HULL_WORKSHOP'));
  assert.equal(await page.evaluate(()=>G.shipStats.classId),'ATTACK_CORVETTE');
  await page.evaluate(async()=>{await autoSave();await autosaveQueue.idle();});
  const stored=await page.evaluate(async()=>(await readStoredAutosave())?.record.raw);
  const a=JSON.parse(stored),b=JSON.parse(career);assert.deepEqual(Object.keys(b).filter(key=>JSON.stringify(a[key])!==JSON.stringify(b[key])),[],'stored career fields changed');
  await page.evaluate(()=>debugReturnFromPalette());
  const returned=JSON.parse(await page.evaluate(()=>serializeCareer(G)));assert.deepEqual(Object.keys(b).filter(key=>JSON.stringify(returned[key])!==JSON.stringify(b[key])),[],'returned career fields changed');
  // Failed launch is a terminal expedition outcome, through keyboard and mouse alike.
  for(const scenario of [
   {id:'BULK_FREIGHTER',fuel:1,input:'keyboard',dead:true},
   {id:'ATTACK_CORVETTE',fuel:1.49,input:'mouse',dead:true},
   {id:'BULK_FREIGHTER',fuel:2.5,input:'keyboard',dead:false},
   {id:'BULK_FREIGHTER',fuel:0,input:'keyboard',dead:false,debug:true},
  ]){
   await start(scenario.id);
   await page.evaluate(scenario=>{
    const key='qa:fuel-ending';getOrCreateScanPlanetData(key,'DESERT','full');G.fuel=scenario.fuel;G.curSystem='';
    const random=Math.random;Math.random=()=>0.99;
    try{doLandOnPlanet(key,{biome:'DESERT',name:'Fuel Ending QA',scanState:'full'});}finally{Math.random=random;}
    DEBUG.infiniteFuel=!!scenario.debug;renderAll();
   },scenario);
   assert.equal(await page.evaluate(()=>G.dead),false,'landing itself does not end the run');
   const turn=await page.evaluate(()=>G.turn);
   await page.evaluate(()=>{G.player.x++;doLiftOff();G.player.x--;renderAll();});
   assert.equal(await page.evaluate(()=>G.dead),false,'being away from the ship refuses launch without ending the run');
   const lift=page.locator('#ctx-bar [data-game-key="l"]');assert.ok(await lift.isEnabled());
   if(scenario.input==='mouse')await lift.click();else await page.keyboard.press('l');
   assert.equal(await page.evaluate(()=>!!G.dead),scenario.dead);
   assert.equal(await page.evaluate(()=>G.turn),turn);
   if(scenario.dead){
    assert.match(await canvasText(page),/MISSION FAILED.*Insufficient fuel for liftoff.*No one returned/);
    assert.equal(await page.evaluate(()=>G.mode),'planet');assert.equal(await page.evaluate(()=>G.fuel),scenario.fuel);
    const ended=await page.evaluate(()=>JSON.stringify([G.ship,G.crew,G.fuel,G.turn,G.careerTime,G.deathCause]));
    await page.evaluate(()=>doLiftOff());assert.equal(await page.evaluate(()=>JSON.stringify([G.ship,G.crew,G.fuel,G.turn,G.careerTime,G.deathCause])),ended);
    assert.ok(await page.evaluate(async()=>await autoSave()));assert.ok(await page.evaluate(async()=>await loadFromStorage()));
    assert.equal(await page.evaluate(()=>G.dead),true);await assertMenuFits(page);
    await page.screenshot({path:artifactPath('Fuel-launch-game-over-'+scenario.input+'.png')});
    await page.keyboard.press('Enter');await page.waitForFunction(()=>G===null);
   }else{
    assert.equal(await page.evaluate(()=>G.mode),'galaxy');assert.equal(await page.evaluate(()=>G.fuel),0);
   }
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: reviewed keyboard/mouse exchange, local equipment and cooldown retention, paid/free fitting, save round-trip, expandable catalog, scaled native travel/wait/landing/launch, low-fuel travel guards, keyboard/mouse fatal launch and its saved ending, launch boundaries/debug exception and isolated resettable workshop.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
