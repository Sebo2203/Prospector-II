const assert=require('node:assert/strict');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route(/^https?:/,route=>route.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('LIGHT_SCOUT','Escape QA','Escape QA'));
  await page.waitForFunction(()=>G?.galaxy && G.log.some(e=>e.msg.includes('Ready for departure')));
  const setup=()=>page.evaluate(()=>{
   G.mode='galaxy';G.shipCombat=null;G.ship.x=10;G.ship.y=10;
   G.ship.hp=G.ship.maxHp;G.ship.heat=0;G.ship.shieldCharge=0;G.shipStats.shields=0;
   for(const core of Object.values(G.ship.systems)){core.condition=100;core.bypassUntil=0;}
   G.shipStats.engineRating=2;G.fuel=G.maxFuel;G.crew.forEach(c=>{c.hp=c.maxHp;c.statuses={};});
   for(let y=9;y<=11;y++)for(let x=9;x<=11;x++)G.galaxy[y][x]={type:'VOID'};
   G.pirates=[];G.gasEntities=[];
   G.neutralShips=[0,1].map(i=>({name:'Escape Trader '+i,type:'trader',x:10,y:10,hp:45,maxHp:45,guns:0,engineRating:2,alive:true}));
   startShipCombat(G.neutralShips[0],true);
   createShipCombatArena(G.shipCombat,G.neutralShips);
   G.shipCombat.asteroids=[];Math.random=()=>0.5;
   return G.turn;
  });
  await setup();
  // A failed player attempt consumes one action and preserves physical resources.
  let before=await page.evaluate(()=>{
   const c=G.shipCombat;c.player.x=0;c.enemies[0].x=5;c.enemies[1].x=6;
   G.ship.hp-=9;G.ship.heat=20;G.ship.weaponReadyAt=[G.turn+9];
   c.trails=[{x:13,y:8,damage:8,expires:c.round+8}];Math.random=()=>0;
   return [G.turn,c.round,G.ship.hp,G.fuel,G.ship.weaponReadyAt[0]];
  });
  await page.keyboard.press('r');
  assert.deepEqual(await page.evaluate(()=>[G.turn,G.shipCombat.round,G.ship.hp,G.fuel,G.ship.weaponReadyAt[0]]),[before[0]+1,before[1]+1,...before.slice(2)]);
  const reset=()=>page.evaluate(()=>({player:[G.shipCombat.player.x,G.shipCombat.player.y],enemies:G.shipCombat.enemies.map(e=>[e.x,e.y,e.moveBank]),trails:G.shipCombat.trails.length,world:G.neutralShips.map(e=>[e.x,e.y,e.alive])}));
  assert.deepEqual(await reset(),{player:[13,8],enemies:[[19,8,0],[18,4,0]],trails:0,world:[[10,10,true],[10,10,true]]});
  assert.ok(await page.evaluate(async()=>await autoSave()));assert.ok(await page.evaluate(async()=>await loadFromStorage()));
  assert.deepEqual((await reset()).player,[13,8]);
  // An NPC edge attempt resets the whole engagement and stops later NPC actions.
  await setup();before=await page.evaluate(()=>{
   const c=G.shipCombat;c.player.x=20;c.enemies[0].x=25;c.enemies[0].y=8;
   c.enemies[1].x=24;c.enemies[1].y=4;Math.random=()=>0;
   return [G.turn,c.round];
  });
  await page.keyboard.press('Space');
  assert.deepEqual(await reset(),{player:[13,8],enemies:[[19,8,0],[18,4,0]],trails:0,world:[[10,10,true],[10,10,true]]});
  assert.deepEqual(await page.evaluate(()=>[G.turn,G.shipCombat.round]),before.map(v=>v+1));
  // Boundary roll succeeds at 0.25 and safely relocates only the escaping roster ship.
  await setup();assert.ok(await page.evaluate(()=>{
   const c=G.shipCombat;Math.random=()=>0.25;c.enemies[0].x=26;
   return escapeShipCombatEnemy(c,c.enemies[0])===true && c.enemies[0].escaped && G.neutralShips[0].x!==10 && G.neutralShips[1].x===10;
  }));
  // Blocked routes never roll/reset; dead or previously escaped actors stay out.
  await setup();assert.ok(await page.evaluate(()=>{
   const c=G.shipCombat,old=Math.random;Math.random=()=>{throw Error('No roll for a blocked route');};
   for(let y=9;y<=11;y++)for(let x=9;x<=11;x++)if(x!==10||y!==10)G.galaxy[y][x]={type:'BLACK_HOLE'};
   const blocked=escapeShipCombatEnemy(c,c.enemies[0])===false;
   Math.random=old;c.enemies[1].escaped=true;c.enemies[1].x=26;c.enemies[1].ship.alive=false;
   resetShipCombatPositions(c);return blocked && c.enemies[1].escaped && c.enemies[1].x===26 && !c.enemies[1].ship.alive;
  }));
  // Successful player withdrawal retains the existing galaxy transition.
  await setup();await page.evaluate(()=>{G.shipCombat.player.x=0;Math.random=()=>0.5;renderAll();});
  await page.keyboard.press('r');assert.equal(await page.evaluate(()=>G.mode),'galaxy');
  // Improvised repair menu keeps the availability guard and still uses the actual engineer/access guards.
  await setup();assert.ok(await page.evaluate(()=>{
   G.crew.push(randomCrewMember('engineer'));
   openShipSystems();selectShipSystem('engine');
   const reason=shipSystemsActions().find(a=>a.method==='improvised').reason;
   G.ship.systems.engine.condition=50;
   const available=!shipSystemsActions().find(a=>a.method==='improvised').reason;
   G.crew.forEach(c=>{if(c.role==='engineer')c.hp=0;});
   const engineer=shipSystemsActions().find(a=>a.method==='improvised').reason;
   return reason==='No repair needed' && available && engineer.includes('engineer');
  }));
  await page.screenshot({path:artifactPath('Bypass-availability.png')});
  assert.deepEqual(errors,[]);console.log('PASS: symmetric disengagement failure/success, exact reset, single action, preserved resources/save state, blocked routes and improvised repair guards.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
