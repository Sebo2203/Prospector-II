// Bounded fixture-assisted matchup measurements, not unassisted careers or survival targets.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,gameUrl,artifactPath,root}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.text().startsWith('Prospector input error:'))errors.push(message.text());});
  await page.route(/^https?:/,route=>route.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('ATTACK_CORVETTE','Matchup QA','Matchup QA'));
  await page.waitForFunction(()=>G?.galaxy&&G.log.some(entry=>entry.msg.includes('Ready for departure')));
  await page.addScriptTag({path:path.join(__dirname,'ship-combat-fixture.js')});
  const results=[];
  for(const hull of ['LIGHT_SCOUT','BULK_FREIGHTER','ATTACK_CORVETTE'])for(const trained of [false,true]){
   const batch=await page.evaluate(({hull,trained})=>{
    const reports=[],render=renderAll,random=Math.random;
    // Suppress presentation only; every committed turn, shot, hit, injury, critical and XP grant is native.
    renderAll=()=>{};
    try{
     for(const tactic of ['brawler','skirmisher','sniper','missile'])for(let seed=1;seed<=8;seed++){
      const c=window.bridgeFixture({hull,trained,tactic});
      let state=seed*104729;Math.random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
      if(seed%2===0)c.asteroids=[{x:16,y:7},{x:16,y:8},{x:16,y:9}];
      const initialTurn=G.turn,crewCount=G.crew.length;
      let actions=0;
      while(!G.dead&&G.mode==='shipcombat'&&actions<80){
       actions++;const current=G.shipCombat,enemy=current.enemies[current.target];
       if(G.ship.hp<G.ship.maxHp*0.3&&shipCombatEdge(current.player)){doShipRetreat();continue;}
       const entry=selectReadyShipCombatWeapon(current);
       if(entry&&shipCombatWeaponStatus(current,entry)==='Ready'){doShipFire();continue;}
       if(effectiveEngineRating()>0&&G.fuel>0){
        const retreat=G.ship.hp<G.ship.maxHp*0.3;
        const range=Math.max(1,...shipCombatWeapons().map(entry=>entry.weapon.range))-1;
        const score=point=>(retreat?Math.min(point.x,point.y,COMBAT_MAP.width-1-point.x,COMBAT_MAP.height-1-point.y)*3:
         Math.abs(shipCombatDistance(point,enemy)-range)*2+(shipCombatShotClear(current,point,enemy)?0:6))+
         (shipCombatPlasma(current,point)?.damage||0)*2;
        const choices=COMBAT_STEPS.map(([dx,dy])=>({x:current.player.x+dx,y:current.player.y+dy,dx,dy})).filter(point=>shipCombatOpen(current,point));
        choices.sort((a,b)=>score(a)-score(b));
        if(choices[0]&&score(choices[0])<score(current.player)){moveShipInCombat(choices[0].dx,choices[0].dy);continue;}
       }
       advanceShipCombat();
      }
      const outcome=G.dead?'death':G.mode==='shipcombat'?'turn cap':c.enemies[0].ship.hp<=0?'victory':c.enemies[0].escaped?'enemy escaped':G.stranded?'disabled':'withdrawn';
      reports.push({hull,trained,tactic,seed,outcome,actions,turns:G.turn-initialTurn,hullHp:G.ship.hp,
       crewKilledBeforeShipLoss:crewCount-G.crew.filter(crew=>crew.hp>0).length,cause:G.deathCause||null,
       final:{player:{x:c.player.x,y:c.player.y,engine:effectiveEngineRating(),sensors:effectiveSensorRange()},
        enemy:{x:c.enemies[0].x,y:c.enemies[0].y,hp:c.enemies[0].ship.hp,engine:effectiveEngineRating(c.enemies[0].ship),
         sensors:effectiveSensorRange(c.enemies[0].ship),ammo:c.enemies[0].ship.ammo},status:G.shipCombat?shipCombatEnemyActionStatus(G.shipCombat,c.enemies[0]):outcome}});
     }
    }finally{renderAll=render;Math.random=random;}
    return reports;
   },{hull,trained});
   results.push(...batch);
   const counts=batch.reduce((out,r)=>(out[r.outcome]=(out[r.outcome]||0)+1,out),{});
   console.log(JSON.stringify({hull,trained,counts,crewCasualtyFights:batch.filter(r=>r.crewKilledBeforeShipLoss).length}));
  }
  const summary=[];
  for(const hull of ['LIGHT_SCOUT','BULK_FREIGHTER','ATTACK_CORVETTE'])for(const trained of [false,true])for(const tactic of ['brawler','skirmisher','sniper','missile']){
   const rows=results.filter(r=>r.hull===hull&&r.trained===trained&&r.tactic===tactic);
   summary.push({hull,trained,tactic,fights:rows.length,outcomes:rows.reduce((out,r)=>(out[r.outcome]=(out[r.outcome]||0)+1,out),{}),
    meanTurns:Math.round(rows.reduce((sum,r)=>sum+r.turns,0)/rows.length*10)/10,crewCasualtyFights:rows.filter(r=>r.crewKilledBeforeShipLoss).length});
  }
  const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
  fs.writeFileSync(artifactPath('combat-matchups.json'),JSON.stringify({version,
   method:'192 isolated single-enemy native-action fights; 3 hulls × 2 crew profiles × 4 role/loadout pairs × 8 seeds; half with authored cover; 80-action cap; fixed aggressive/range-seeking policy with low-hull retreat; debug off. Freighter receives one legal weapon bay/gun; trained skills are fixture grants. Presentation suppressed, not rules. No economy simulation or whole-career survival inference.',summary,results,errors},null,2));
  assert.deepEqual(errors,[]);assert.equal(results.length,192);
  assert.ok(results.every(r=>r.actions>0&&r.turns>0),'each fixture must commit real turns');
  console.log('Recorded 192 bounded combat matchups; deaths and capped fights are measurements, not automatic defects.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
