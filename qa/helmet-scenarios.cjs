const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage(),errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
  await page.goto(gameUrl);await page.evaluate(()=>initGame('LIGHT_SCOUT','Helmet QA','Helmet QA'));
  await page.waitForFunction(()=>G?.log.some(e=>e.msg.includes('Ready for departure')));
  assert.ok(await page.evaluate(async()=>await autoSave()));
  await page.evaluate(()=>{
   window.helmetBase=serializeCareer(G);
   window.helmetSetup=(biome='MOON_ROCK',atShip=false)=>{
    installSaveSnapshot(parseSaveSnapshot(helmetBase));DEBUG.on=DEBUG.infiniteOxy=DEBUG.infiniteCrewHp=false;
    G.expedition.storySchedule.quarantine={status:'absent',dueTurn:null};G.expedition.quarantine=null;
    G.curPlanet='qa:helmets';const p=getOrCreateScanPlanetData(G.curPlanet,biome,'full');
    G.mode='planet';G.curSystem=null;G.player={x:10,y:10};
    for(let y=8;y<=12;y++)for(let x=8;x<=12;x++)p.grid[y][x]={type:BIOMES[biome].floor};
    if(atShip)p.grid[10][10]={type:'SHIP'};G.enemies[G.curPlanet]=[];G.oxygen=100;G.helmetMode='auto';
    G.crew.forEach(c=>{c.statuses={};c.hp=c.maxHp;c.armorUsable='armor_flight';c.armor='Flight Suit';c._equippedArmor=null;});
    G.nextCrewTalkTurn=G.nextCrewGalaxyTalkTurn=100000;Math.random=()=>0.99;revealPlanet(G.curPlanet,10,10);renderAll();
   };
   window.helmetSprite=()=>{const original=drawSprite,keys=[];drawSprite=key=>keys.push(key);try{drawPlayerPawn(0,0);}finally{drawSprite=original;}return keys[0];};
  });
  await page.evaluate(()=>helmetSetup());
  const before=await page.evaluate(()=>({hp:G.crew.map(c=>c.hp),turn:G.turn,sprite:helmetSprite(),oxygen:G.oxygen}));assert.equal(before.sprite,'player_pawn_helmet');
  await page.keyboard.press('u');
  assert.deepEqual(await page.evaluate(()=>({hp:G.crew.map(c=>c.hp),turn:G.turn,sprite:helmetSprite(),oxygen:G.oxygen,mode:G.helmetMode})),{hp:before.hp.map(h=>h-5),turn:before.turn+1,sprite:'player_pawn_suit',oxygen:100,mode:'open'});
  await page.evaluate(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'u',code:'KeyU',repeat:true,bubbles:true})));assert.equal(await page.evaluate(()=>G.turn),before.turn+1);
  await page.screenshot({path:artifactPath('helmets-open-vacuum.png')});
  await page.keyboard.press('u');assert.deepEqual(await page.evaluate(()=>({hp:G.crew.map(c=>c.hp),turn:G.turn,sprite:helmetSprite(),mode:G.helmetMode})),{hp:before.hp.map(h=>h-5),turn:before.turn+2,sprite:'player_pawn_helmet',mode:'closed'});
  assert.ok(await page.evaluate(()=>G.oxygen<100));checks.push('U opens visors in vacuum: immediate actual damage despite full tanks; held repeats are free; closing restores suit protection');
  await page.keyboard.press('Shift+U');assert.equal(await page.evaluate(()=>G.helmetMode),'open');assert.ok(await page.evaluate(async()=>await autoSave()&&await loadFromStorage()));assert.equal(await page.evaluate(()=>G.helmetMode),'open');
  assert.ok(await page.evaluate(()=>{const before=serializeCareer(G),bad=JSON.parse(before);bad.helmetMode='invalid';try{parseSaveSnapshot(bad);return false;}catch(e){return before===serializeCareer(G);}}));checks.push('uppercase U works; the manual choice survives transactional save/load; malformed modes preserve the career');
  await page.evaluate(()=>helmetSetup('HABITABLE'));const safeHp=await page.evaluate(()=>G.crew.map(c=>c.hp));await page.keyboard.press('u');assert.equal(await page.evaluate(()=>G.helmetMode),'closed');await page.keyboard.press('u');
  assert.deepEqual(await page.evaluate(()=>G.crew.map(c=>c.hp)),safeHp);assert.equal(await page.evaluate(()=>helmetSprite()),'player_pawn_suit');checks.push('opening and closing in breathable air is safe, and manual closed helmets render closed');
  const optionsTurn=await page.evaluate(()=>G.turn);await page.keyboard.press('o');assert.equal(await page.evaluate(()=>G.showOptions),true);assert.equal(await page.evaluate(()=>G.turn),optionsTurn);await page.keyboard.press('Escape');checks.push('O still opens Options without taking a helmet action');
  assert.equal(await page.locator('#persist-hints').getAttribute('hidden'),'');assert.match(await page.locator('#travel-shortcuts').textContent(),/U.*open \/ close helmets/s);assert.doesNotMatch(await page.locator('#ctx-bar').textContent(),/helmet/i);checks.push('the collapsed static Shortcuts list documents U; the context bar has no helmet control');
  await page.locator('#shortcut-toggle').click();assert.equal(await page.locator('#persist-hints').getAttribute('hidden'),null);await page.locator('#travel-shortcuts div').filter({hasText:'open / close helmets'}).scrollIntoViewIfNeeded();await page.screenshot({path:artifactPath('helmets-shortcuts.png')});await page.locator('#shortcut-toggle').click();await page.evaluate(()=>document.activeElement?.blur());
  await page.evaluate(()=>helmetSetup('MOON_ROCK',true));const airlockHp=await page.evaluate(()=>G.crew.map(c=>c.hp));await page.keyboard.press('u');await page.keyboard.press('Space');assert.deepEqual(await page.evaluate(()=>G.crew.map(c=>c.hp)),airlockHp);checks.push('the own-ship airlock permits open helmets on an airless world');
  await page.evaluate(()=>{helmetSetup();G.helmetMode='closed';G.crew[0].armorUsable='armor_plate';renderAll();});const plateHp=await page.evaluate(()=>G.crew.map(c=>c.hp));await page.keyboard.press('Space');assert.deepEqual(await page.evaluate(()=>G.crew.map(c=>c.hp)),[plateHp[0]-3,plateHp[1]]);checks.push('closing helmets cannot make an armor plate into an environmental suit');
  await page.evaluate(()=>{helmetSetup('HABITABLE');G.underwater=true;renderAll();});const waterHp=await page.evaluate(()=>G.crew.map(c=>c.hp));await page.keyboard.press('u');assert.deepEqual(await page.evaluate(()=>G.crew.map(c=>c.hp)),waterHp.map(h=>h-5));checks.push('underwater open helmets cause direct drowning damage');
  await page.evaluate(()=>{helmetSetup();DEBUG.infiniteOxy=true;});const debugHp=await page.evaluate(()=>G.crew.map(c=>c.hp));await page.keyboard.press('u');assert.deepEqual(await page.evaluate(()=>G.crew.map(c=>c.hp)),debugHp);checks.push('the existing infinite-oxygen debug protection remains effective');
  await page.evaluate(()=>{
   helmetSetup();G.mode='galaxy';G.ship.x=G.ship.y=10;G.expedition.quarantine=createQuarantineIncident(10,10,'Ward QA');G.expedition.storySchedule.quarantine={status:'spawned',dueTurn:G.turn};boardQuarantineShip();
   G.expedition.quarantine.repaired=true;G.player={x:26,y:14};revealPlanet(G.curPlanet,26,14);renderAll();
  });await page.keyboard.press('u');assert.equal(await page.evaluate(()=>G.helmetMode),'open');await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>!!G.crew[0].statuses.infection),false);await page.keyboard.press('Space');assert.ok(await page.evaluate(()=>G.crew.every(c=>c.statuses.infection)));
  await page.keyboard.press('u');await page.evaluate(()=>G.crew.forEach(c=>{c.statuses={};c._quarantineExposure=0;}));for(let i=0;i<3;i++)await page.keyboard.press('Space');assert.ok(await page.evaluate(()=>G.crew.every(c=>!c.statuses.infection)));checks.push('opening intact helmets allows ward infection after three exposed turns; closing blocks further airborne exposure');
  await page.evaluate(()=>{helmetSetup();G.crew.forEach(c=>c.hp=4);});await page.keyboard.press('u');assert.equal(await page.evaluate(()=>G.dead),true);assert.match(await page.evaluate(()=>G.deathCause),/helmets open/);
  assert.ok(await page.evaluate(async()=>await autoSave()&&await loadFromStorage()));assert.equal(await page.evaluate(()=>G.dead),true);checks.push('fatal open-helmet suffocation records and preserves the actual ending');
  assert.deepEqual(errors,[]);fs.writeFileSync(artifactPath('helmets.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
