const assert=require('node:assert/strict');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,route=>route.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('LIGHT_SCOUT','Combat Speed QA','Combat Speed QA'));
  await page.waitForFunction(()=>G?.galaxy && G.log.some(e=>e.msg.includes('Ready for departure')));
  assert.ok(await page.evaluate(()=>G.neutralShips.every(ship=>ship.type==='patrol' || ship.engineRating===(ship.type==='cargo'?1:2))));
  const setup=async(playerEngine,npcEngine,unarmed=false)=>page.evaluate(({playerEngine,npcEngine,unarmed})=>{
    clearShipCombatFeedback();G.mode='galaxy';G.shipCombat=null;G.pirates=[];G.neutralShips=[];G.gasEntities=[];
    const classId=playerEngine===1?'BULK_FREIGHTER':playerEngine===2?'LIGHT_SCOUT':'ATTACK_CORVETTE';
    G.shipStats=buildShipStats(classId,{engine:Math.max(0,playerEngine-3),weapons:playerEngine===1?1:0});G.shipStats.shields=0;
    for(let y=9;y<=11;y++)for(let x=9;x<=11;x++)G.galaxy[y][x]={type:'VOID'};
    G.ship={x:10,y:10,hp:G.shipStats.maxHp,maxHp:G.shipStats.maxHp};G.maxFuel=G.shipStats.maxFuel;G.fuel=G.maxFuel;
    G.installedWeapons=['mass_driver'];ensureShipSystems();G.crew.forEach(crew=>crew.hp=crew.maxHp);
    const enemy={name:'Speed Opponent',x:10,y:10,hp:300,maxHp:300,guns:unarmed?0:1,engineRating:npcEngine,alive:true,shields:0,...(unarmed?{type:'trader',speed:2}:{pirateType:'guard'})};
    G[unarmed?'neutralShips':'pirates']=[enemy];startShipCombat(enemy,true);
    const combat=G.shipCombat;combat.player={x:24,y:8,dx:1,dy:0};combat.asteroids=[];
    combat.enemies[0].x=2;combat.enemies[0].y=8;combat.enemies[0].lastSeenPlayer={x:24,y:8};
    Math.random=()=>0.5;renderAll();return G.turn;
  },{playerEngine,npcEngine,unarmed});
  const metrics=[];
  for(const [player,npc,turns,moves] of [[1,3,1,3],[3,1,3,1],[2,2,2,2],[5,3,5,3]]){
    const before=await setup(player,npc);
    for(let i=0;i<turns;i++)await page.keyboard.press('Space');
    const result=await page.evaluate(()=>({x:G.shipCombat.enemies[0].x,turn:G.turn,round:G.shipCombat.round,heat:G.shipCombat.enemies[0].ship.heat,trails:G.shipCombat.trails.length}));
    assert.equal(result.x-2,moves);assert.equal(result.turn-before,turns);assert.equal(result.round,turns+1);
    if(player===1){assert.equal(result.heat,6);assert.equal(result.trails,3,'every fast substep leaves its own exhaust');}
    metrics.push({player,npc,turns,moves});
  }
  await setup(3,2);await page.keyboard.press('Space');
  const fraction=await page.evaluate(()=>G.shipCombat.enemies[0].moveBank);assert.ok(fraction>0 && fraction<1);
  assert.ok(await page.evaluate(()=>autoSave()));assert.ok(await page.evaluate(()=>loadFromStorage()));
  assert.equal(await page.evaluate(()=>G.shipCombat.enemies[0].moveBank),fraction);
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>G.shipCombat.enemies[0].x),3);
  assert.ok(await page.evaluate(()=>{
    const career=G;
    for(const bank of [null,-0.1,1,100]){
      const snapshot=JSON.parse(serializeCareer(G));snapshot.shipCombat.enemies[0].moveBank=bank;
      try{parseSaveSnapshot(JSON.stringify(snapshot));return false;}catch(e){}
    }
    return G===career;
  }),'invalid saved movement banks are rejected without replacing the active fight');
  await setup(1,3);
  await page.evaluate(()=>{const combat=G.shipCombat;combat.enemies[0].x=17;combat.player.x=24;renderAll();});
  const fireTurn=await page.evaluate(()=>G.turn);await page.keyboard.press('Space');
  assert.equal(await page.evaluate(()=>G.shipCombat.enemies[0].x),19,'fast approach stops once a clear firing range is reached');
  assert.equal(await page.evaluate(t=>G.log.filter(e=>e.turn===t && e.msg.startsWith('Speed Opponent fires')).length,fireTurn+1),0,'movement grants no free attack');
  await page.keyboard.press('Space');
  assert.equal(await page.evaluate(t=>G.log.filter(e=>e.turn===t && e.msg.startsWith('Speed Opponent fires')).length,fireTurn+2),1,'a fast enemy still fires only once on its firing turn');
  await page.evaluate(()=>{const actor=G.shipCombat.enemies[0];actor.moveBank=0.75;actor.ship.weaponReadyAt=[G.turn+100];});
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>G.shipCombat.enemies[0].moveBank),0,'holding/reloading cannot stockpile movement');
  await setup(1,3);
  await page.evaluate(()=>{for(let y=0;y<COMBAT_MAP.height;y++)G.shipCombat.asteroids.push({x:3,y});});
  await page.keyboard.press('Space');assert.ok(await page.evaluate(()=>G.shipCombat.enemies[0].x<3),'multiple substeps cannot jump cover');
  await setup(1,3);
  await page.evaluate(()=>{
    const combat=G.shipCombat,enemy=combat.enemies[0];enemy.x=4;combat.player.x=14;
    for(let x=3;x<=8;x++){combat.asteroids.push({x,y:7},{x,y:9});}combat.asteroids.push({x:3,y:8});
    combat.trails=[{x:5,y:8,damage:10,expires:combat.round+5}];Math.random=()=>0;
  });
  await page.keyboard.press('Space');
  assert.deepEqual(await page.evaluate(()=>{const e=G.shipCombat.enemies[0];return [e.x,e.ship.hp,e.ship.systems.engine.condition,e.moveBank];}),[5,290,75,0],'plasma damage and drive failure apply before the next substep');
  // All actors use the same player pace for a turn; a drive critical changes the following turn.
  await setup(2,2);
  await page.evaluate(()=>{
    const combat=G.shipCombat;G.ship.systems.engine.condition=80;combat.player.x=24;
    const first=combat.enemies[0];first.x=21;first.ship.weaponReadyAt=[G.turn];
    const second={...first.ship,_careerId:undefined,name:'Second Opponent',systems:undefined,systemStats:undefined,heat:0,weaponReadyAt:[]};
    G.pirates.push(second);ensureShipSystems(second);
    combat.enemies.push({ship:second,collection:'pirates',x:2,y:8,dx:1,dy:0,moveBank:0,lastSeenPlayer:{x:24,y:8}});Math.random=()=>0;
  });
  await page.keyboard.press('Space');assert.deepEqual(await page.evaluate(()=>[effectiveEngineRating(),G.shipCombat.enemies[1].x]),[1,3]);
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>G.shipCombat.enemies[1].x),5);
  await setup(1,2,true);
  await page.evaluate(()=>{const c=G.shipCombat;c.player.x=13;c.enemies[0].x=24;});
  await page.keyboard.press('Space');
  assert.deepEqual(await page.evaluate(()=>[G.mode,G.ship.x,G.ship.y,G.neutralShips[0].x,G.neutralShips[0].heat]),['galaxy',10,10,11,4],'fast civilians exit after checked substeps and preserve their actual ship state');
  const escapeWindows=[];
  for(const [player,expected] of [[1,4],[2,7],[3,11],[5,18]]){
    await setup(player,2,true);
    await page.evaluate(()=>{const c=G.shipCombat;c.player.x=13;c.enemies[0].x=19;});
    let turns=0;
    while(await page.evaluate(()=>G.mode==='shipcombat')){
      assert.ok(turns<30);await page.keyboard.press('Space');turns++;
    }
    assert.equal(turns,expected);escapeWindows.push({player,trader:2,turnsToExit:turns});
  }
  await setup(3,2);await page.evaluate(()=>G.shipCombat.enemies[0].x=14);await page.keyboard.press('Space');
  await page.screenshot({path:artifactPath('Combat-engine-pace.png')});
  assert.deepEqual(errors,[]);console.log(JSON.stringify({metrics,escapeWindows,checks:'relative pace, exact fractions, turn/reload/fire economy, heat/exhaust, cover, mid-step criticals, fixed phase pace, safe escape and validated save continuity'}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
