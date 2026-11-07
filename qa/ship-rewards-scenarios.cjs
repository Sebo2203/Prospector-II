const assert=require('node:assert/strict');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('ATTACK_CORVETTE','Salvage QA','Salvage QA'));
  await page.waitForFunction(()=>G?.galaxy && G.log.some(e=>e.msg.includes('Ready for departure')));
  const kill=(type,roll)=>page.evaluate(({type,roll})=>{
   G.mode='galaxy';G.shipCombat=null;G.pirates=[];G.neutralShips=[];G.gasEntities=[];
   G.stationReputation=0;G.ship.hp=G.ship.maxHp;G.ship.heat=0;G.ship.weaponReadyAt=[G.turn];G.installedWeapons=['mass_driver'];
   for(const core of Object.values(G.ship.systems)){core.condition=100;core.bypassUntil=0;}
   G.shipStats.shields=0;G.ship.shieldCharge=0;
   const pirate=['guard','roamer'].includes(type);
   const ship={name:'Reward '+type,x:G.ship.x,y:G.ship.y,hp:1,maxHp:1,shields:0,guns:0,engineRating:1,alive:true,...(pirate?{pirateType:type}:{type})};
   G[pirate?'pirates':'neutralShips']=[ship];startShipCombat(ship,true);
   G.shipCombat.asteroids=[];G.shipCombat.enemies[0].x=G.shipCombat.player.x+1;G.shipCombat.enemies[0].y=G.shipCombat.player.y;
   Math.random=()=>roll;doShipFire();return G.mode;
  },{type,roll});
  const credits=await page.evaluate(()=>G.credits);
  assert.equal(await kill('guard',0.1),'galaxy');
  assert.equal(await page.evaluate(()=>G.credits),credits);
  assert.deepEqual(await page.evaluate(()=>[G.pirateBounties.kills,G.pirateBounties.credits]),[1,60]);
  assert.ok(await page.evaluate(()=>activeMissionSummaries().some(m=>m.title==='Pirate bounty claims')));
  assert.ok(await page.evaluate(()=>currentLogRecords().some(r=>r.msg.includes('PIRATE BOUNTIES'))));
  await page.evaluate(()=>{G.inventory=[];});await kill('roamer',0.6);
  assert.equal(await page.evaluate(()=>G.inventory.length),1);
  // Cargo overflow remains visible and survives real save/load.
  await page.evaluate(()=>{G.shipStats.cargoCapacity=0;G.cargo=[];});await kill('cargo',0.9);
  assert.ok(await page.evaluate(()=>G.nebulaLoot.length>0));
  assert.ok(await page.evaluate(async()=>await autoSave()));assert.ok(await page.evaluate(async()=>await loadFromStorage()));
  assert.equal(await page.evaluate(()=>G.pirateBounties.kills),2);
  assert.ok(await page.evaluate(()=>getExamineName(G.ship.x,G.ship.y).includes(G.nebulaLoot[0].item.name)));
  // Even with a full hold and drifting cargo, docking settles exactly once.
  const claim=await page.evaluate(()=>G.pirateBounties.credits);
  const beforeDock=await page.evaluate(()=>{
   const station=G.galaxy.flatMap((row,y)=>row.map((cell,x)=>({cell,x,y}))).find(p=>p.cell.type==='BASE');
   G.ship.x=station.x;G.ship.y=station.y;G.stationReputation=0;
   G.nebulaLoot=[{x:station.x,y:station.y,item:makeCommodityItem('parts','combat salvage',0)}];
   renderAll();return G.credits;
  });
  await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>G.mode),'base');
  // Payroll may deduct credits, so compare the actual bounty event and cleared state.
  assert.ok(await page.evaluate(claim=>G.log.some(e=>e.msg.includes('pays '+claim+' cr for 2 confirmed pirate kills')),claim));
  assert.deepEqual(await page.evaluate(()=>[G.pirateBounties.credits,G.pirateBounties.kills]),[0,0]);
  const settled=await page.evaluate(()=>G.credits);
  await page.evaluate(()=>settlePirateBountiesAtStation(G.base.stationName));assert.equal(await page.evaluate(()=>G.credits),settled);
  assert.ok(await page.evaluate(async()=>await autoSave()));assert.ok(await page.evaluate(async()=>await loadFromStorage()));
  await page.evaluate(()=>settlePirateBountiesAtStation(G.base.stationName));assert.equal(await page.evaluate(()=>G.credits),settled);
  // Bad claims fail transactional parsing without replacing the active career.
  assert.ok(await page.evaluate(()=>{
   const active=G,save=JSON.parse(serializeCareer(G));save.pirateBounties={credits:-1,kills:1};
   try{parseSaveSnapshot(JSON.stringify(save));return false;}catch{return G===active;}
  }));
  // Non-pirate cash is immediate and never generates a pirate bounty.
  const cashBefore=await page.evaluate(()=>G.credits);await kill('trader',0.4);
  assert.ok(await page.evaluate(before=>G.credits>before,cashBefore));assert.equal(await page.evaluate(()=>G.pirateBounties.kills),0);
  assert.equal(await page.evaluate(()=>G.stationReputation),-20);
  // Previously resolved patrol actors may award loot after a real patrol respawn.
  assert.ok(await page.evaluate(()=>{
   G.mode='galaxy';G.shipCombat=null;G.stationReputation=0;
   const patrol={name:'Replacement Patrol',type:'patrol',alive:false,hp:0,maxHp:70,combatRewardsResolved:true,lastRespawn:G.turn-61,patrolRoute:[{x:G.ship.x+1,y:G.ship.y}]};
   G.neutralShips=[patrol];moveNeutralShips();
   if(!patrol.alive || patrol.combatRewardsResolved)return false;
   patrol.hp=0;patrol.alive=false;
   resolveShipCombatKill({}, {ship:patrol,collection:'neutralShips'});
   renderAll();return patrol.combatRewardsResolved===true;
  }),'replacement patrols get a fresh reward opportunity');
  await page.screenshot({path:artifactPath('Ship-salvage-and-station-claims.png')});
  assert.deepEqual(errors,[]);console.log('PASS: real kill rewards, station-only pirate claims, overflow/save/load, safe docking, one-time settlement, claim validation, pending UI and civilian cash/reputation.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
