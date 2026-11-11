const assert=require('node:assert/strict');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.text().includes('Prospector input error:'))errors.push(m.text());});
  await page.route(/^https?:/,r=>r.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('ATTACK_CORVETTE','Nebula QA','Nebula QA'));
  await page.waitForFunction(()=>G?.galaxy && G.log.some(e=>e.msg.includes('Ready for departure')));
  const setup=(distance=2,massive=false)=>page.evaluate(({distance,massive})=>{
   shipAttackPrompt=null;G.mode='galaxy';G.shipCombat=null;G.examine=null;G.pirates=[];G.neutralShips=[];G.gasEntities=[];
   G.ship.x=10;G.ship.y=10;G.ship.hp=G.ship.maxHp;G.shipStats.shields=0;G.ship.shieldCharge=0;G.ship.heat=0;
   G.shipStats.sensorRange=3;for(const core of Object.values(G.ship.systems)){core.condition=100;core.bypassUntil=0;}
   DEBUG.shipInvisible=false;G.visited.fill(true);
   for(let y=8;y<=12;y++)for(let x=8;x<=16;x++)G.galaxy[y][x]={type:'NEBULA',nebulaVariant:'pink'};
   G.galaxy[10][10+distance]=debugBuildPaletteGalaxyObject(massive?'GAS_DEVOURER':'GAS_WRAITH',10+distance,10);
   const ge=G.gasEntities[0];ge._homeCluster=Array.from({length:7},(_,i)=>({x:10+i,y:10}));
   Math.random=()=>0.5;renderAll();return {turn:G.turn,hp:G.ship.hp};
  },{distance,massive});
  // Manual initiation within the monster's actual drawn detection range, no civilian prompt.
  await setup(5);assert.match(await page.locator('#ctx-bar [data-game-key="f"]').textContent(),/Nebula Wraith/);
  await page.keyboard.press('f');assert.equal(await page.evaluate(()=>G.mode),'shipcombat');
  assert.equal(await page.evaluate(()=>G.shipCombat.enemies[0].collection),'gasEntities');assert.equal(await page.evaluate(()=>shipAttackConfirmationActive()),false);
  // Wait through actual tactical approaches and a natural ram attack.
  const hp=await page.evaluate(()=>G.ship.hp);
  for(let i=0;i<8;i++)await page.keyboard.press('Space');
  assert.ok(await page.evaluate(before=>G.ship.hp<before,hp));
  assert.ok(await page.evaluate(()=>G.log.some(e=>e.msg.includes('Nebula Wraith rams'))));
  assert.ok(await page.evaluate(()=>G.shipCombat.trails.length===0),'natural movement emits no ship exhaust');
  await page.screenshot({path:artifactPath('Nebula-wraith-combat.png')});
  // Automatic encounter works on early turns through the normal wait action.
  const early=await setup(1,true);assert.ok(early.turn<300);await page.keyboard.press('Space');
  assert.equal(await page.evaluate(()=>G.mode),'shipcombat');assert.equal(await page.evaluate(()=>G.shipCombat.pirate.name),'Void Devourer');
  assert.equal(await page.evaluate(()=>G.turn),early.turn+1);
  // Contact already on the player tile also engages, including blind-player defense.
  await setup(0);await page.evaluate(()=>{G.ship.systems.sensors.condition=0;renderAll();});await page.keyboard.press('Space');
  assert.equal(await page.evaluate(()=>G.mode),'shipcombat');
  // Safe terrain and post-disengagement grace do not force another encounter.
  await setup(1);await page.evaluate(()=>{G.gasEntities[0].disengagedUntil=G.turn+5;});await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>G.mode),'galaxy');
  await setup(1);await page.evaluate(()=>{G.galaxy[10][10]={type:'VOID'};});await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>G.mode),'galaxy');
  await setup(2);await page.evaluate(()=>{G.ship.systems.sensors.condition=0;renderAll();});await page.keyboard.press('f');assert.equal(await page.evaluate(()=>G.mode),'galaxy');
  // Defeat retains the natural crystal reward, without a pirate station bounty.
  await setup(2);await page.keyboard.press('f');
  assert.ok(await page.evaluate(()=>{
   const c=G.shipCombat,e=c.enemies[0],before=G.pirateBounties.kills;G.cargo=[];G.shipStats.cargoCapacity=1;
   damageShipCombatEnemy(c,e,e.ship.hp+1);return !e.ship.alive && G.cargo.some(i=>i.commodityId==='nebula_crystal') && G.pirateBounties.kills===before;
  }));
  // Compare real galaxy generation over reproducible seeds against the old cluster rates.
  const generation=await page.evaluate(()=>{
   G.mode='galaxy';G.shipCombat=null;const random=Math.random,chance=nebulaEntitySpawnChance;
   const sample=old=>{
    let total=0;
    nebulaEntitySpawnChance=old?((massive,expansive)=>massive?1:expansive?0.35:0.08):chance;
    for(let seed=1;seed<=40;seed++){
     let state=seed;Math.random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
     generateGalaxy();total+=G.gasEntities.length;
    }
    return total;
   };
   try{return {old:sample(true),current:sample(false),galaxies:40};}finally{nebulaEntitySpawnChance=chance;Math.random=random;}
  });
  assert.ok(generation.old>0 && generation.current<generation.old*0.3,JSON.stringify(generation));
  assert.deepEqual(errors,[]);console.log('PASS: manual/early automatic nebula encounters, natural ram and crystal, safe-space/grace/sensor rules, palette factory and rare generation '+JSON.stringify(generation));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
