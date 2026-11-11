const assert=require('node:assert/strict');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
const {clickTarget,canvasText}=require('./systems-menu-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.text().includes('Prospector input error:'))errors.push(m.text());});await page.route(/^https?:/,r=>r.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('ATTACK_CORVETTE','Attack QA','Attack QA'));
  await page.waitForFunction(()=>G?.galaxy && G.log.some(e=>e.msg.includes('Ready for departure')));
  await page.evaluate(()=>{window.confirm=()=>{throw Error('Browser confirmations must not be used');};});
  const setup=type=>page.evaluate(async type=>{
   shipAttackPrompt=null;G.mode='galaxy';G.shipCombat=null;G.examine=null;G.pirates=[];G.neutralShips=[];G.gasEntities=[];G.stationReputation=0;
   G.ship.x=10;G.ship.y=10;G.shipStats.sensorRange=3;G.ship.systems.sensors.condition=100;G.ship.systems.reactor.condition=100;
   G.visited.fill(true);G.galaxy[10][10]={type:'VOID'};
   const ship={name:type==='patrol'?'Station Patrol':'Civilian Freighter',x:12,y:10,guns:type==='patrol'?1:0,engineRating:2,hp:50,maxHp:50,alive:true,...(type==='pirate'?{pirateType:'roamer'}:{type})};
   G[type==='pirate'?'pirates':'neutralShips']=[ship];renderAll();await autoSave();
   return JSON.stringify([G.turn,G.credits,G.fuel,G.careerTime,G.stationReputation,ship]);
  },type);
  for(const type of ['cargo','patrol']){
   const before=await setup(type);await page.keyboard.press('f');
   assert.ok(await page.evaluate(()=>shipAttackConfirmationActive()));assert.match(await canvasText(page),/REALLY ATTACK/);
   assert.equal(await page.evaluate(()=>G.mode),'galaxy');
   await page.keyboard.press('ArrowRight');await page.keyboard.press('F3');await page.locator('.cmp-btn').first().click();
   assert.deepEqual(await page.evaluate(()=>[G.ship.x,G.ship.y]),[10,10]);assert.equal(await page.evaluate(()=>shipSystemsActive()),false);
   await page.keyboard.press('n');
   assert.equal(await page.evaluate(()=>JSON.stringify([G.turn,G.credits,G.fuel,G.careerTime,G.stationReputation,G.neutralShips[0]])),before,'cancel has no gameplay effects');
   await page.locator('#ctx-bar [data-game-key="f"]').click();await clickTarget(page,'Attack [Y]');
   assert.equal(await page.evaluate(()=>G.mode),'shipcombat');assert.ok(await page.evaluate(()=>G.stationReputation<0));
  }
  // Nearby pirates start immediately even when they are not on the player's tile.
  await setup('pirate');await page.keyboard.press('f');assert.equal(await page.evaluate(()=>G.mode),'shipcombat');
  assert.equal(await page.evaluate(()=>shipAttackConfirmationActive()),false);
  // Nearest target and button agree; Examine can select a different detected ship.
  await setup('cargo');await page.evaluate(()=>{G.pirates=[{name:'Near Raider',pirateType:'roamer',x:10,y:11,guns:1,hp:50,maxHp:50,alive:true}];renderAll();});
  assert.match(await page.locator('#ctx-bar [data-game-key="f"]').textContent(),/Near Raider/);
  await page.evaluate(()=>{G.examine={x:12,y:10};renderAll();});await page.keyboard.press('f');
  assert.ok(await page.evaluate(()=>shipAttackConfirmationActive() && shipAttackPrompt.ship===G.neutralShips[0]));await page.keyboard.press('Escape');
  // User keybinding conflicts cannot swallow galaxy Fire.
  await setup('pirate');await page.evaluate(()=>{OPTIONS.keybinds.e='KeyF';});await page.keyboard.press('f');
  assert.equal(await page.evaluate(()=>G.mode),'shipcombat');await page.evaluate(()=>{OPTIONS.keybinds={...DEFAULT_KEYBINDS};});
  // No lock / outside sensors / uncharted contacts / dead targets do not enter combat.
  for(const condition of ['blind','distant','hidden','dead']){
   await setup('pirate');const before=await page.evaluate(condition=>{
    const p=G.pirates[0];if(condition==='blind')G.ship.systems.sensors.condition=0;
    if(condition==='distant')p.x=14;if(condition==='hidden')G.visited[p.y*MAP_W+p.x]=false;if(condition==='dead')p.alive=false;
    renderAll();return [G.turn,G.careerTime.minutes];
   },condition);await page.keyboard.press('f');
   assert.equal(await page.evaluate(()=>G.mode),'galaxy');assert.deepEqual(await page.evaluate(()=>[G.turn,G.careerTime.minutes]),before);
  }
  // Pirate-base firing remains available when no ship is selected.
  await setup('pirate');await page.evaluate(()=>{
   G.pirates=[];G.galaxy[10][10]={type:'PIRATE_BASE'};
   G.pirateBases=[{name:'Test Base',x:10,y:10,hp:1000,maxHp:1000,destroyed:false}];renderAll();
  });assert.match(await page.locator('#ctx-bar [data-game-key="f"]').textContent(),/Test Base/);
  // Prompt state is not saved or carried into another career; stale targets cannot be approved.
  await setup('cargo');await page.keyboard.press('f');
  await page.evaluate(()=>{G.neutralShips[0].alive=false;resolveShipAttackConfirmation(true);renderAll();});
  assert.equal(await page.evaluate(()=>G.mode),'galaxy');assert.equal(await page.evaluate(()=>shipAttackConfirmationActive()),false);
  await setup('patrol');await page.keyboard.press('f');await page.screenshot({path:artifactPath('In-game-attack-confirmation.png')});
  assert.ok(await page.evaluate(()=>!serializeCareer(G).includes('shipAttackPrompt')));
  await page.keyboard.press('y');assert.equal(await page.evaluate(()=>G.mode),'shipcombat');
  // Forced hostile interception remains immediate.
  await setup('patrol');await page.evaluate(()=>startShipCombat(G.neutralShips[0]));assert.equal(await page.evaluate(()=>G.mode),'shipcombat');
  assert.deepEqual(errors,[]);console.log('PASS: in-game confirmation without browser dialogs, nearby/manual/examined attacks, consistent targets, free cancellation, blocked modal controls, sensor locks, stale targets and forced defense.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
