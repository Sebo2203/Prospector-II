// Fixture-assisted combat audit. Decisions use charted terrain/visible contacts;
// the hidden lightning schedule is observed for reporting, never for decisions.
window.COMBAT_AUDIT={version:'1',metrics:null};
{
 const audit=window.COMBAT_AUDIT;
 function observe(name,wrapper){const original=window[name];window[name]=function(...args){return wrapper(original,args);};}
 observe('ramShipCombatEnemy',(native,args)=>{
  const result=native(...args),m=audit.metrics;if(m){
   const incoming=!!args[3];m[incoming?'incomingRams':'playerRams']++;
   if(args[2])m.boostRams++;m.ramHullLost+=result.playerHull;m.ramHullDealt+=result.enemyHull;
  }return result;
 });
 observe('crashShipCombatAsteroid',(native,args)=>{
  const hp=G.ship.hp,result=native(...args),m=audit.metrics;
  if(m){m.asteroidCrashes++;m.crashHullLost+=hp-G.ship.hp;}return result;
 });
 observe('launchShipCombatMissile',(native,args)=>{
  const result=native(...args),m=audit.metrics;if(m)m[args[1]<0?'playerMissiles':'enemyMissiles']++;return result;
 });
 observe('advanceShipCombatEnvironment',(native,args)=>{
  const c=args[0],hp=G.ship.hp,last=c.environment?.lastStrike?.turn,
   enemy=c.enemies.reduce((sum,e)=>sum+e.ship.hp,0),result=native(...args),m=audit.metrics;
  if(m&&c.environment?.lastStrike?.turn===G.turn&&last!==G.turn){
   m.lightningStrikes++;m.lightningHullLost+=hp-G.ship.hp;
   m.lightningEnemyHullLost+=enemy-c.enemies.reduce((sum,e)=>sum+e.ship.hp,0);
  }return result;
 });
 audit.newMetrics=()=>({playerRams:0,incomingRams:0,boostRams:0,ramHullLost:0,ramHullDealt:0,asteroidCrashes:0,
  crashHullLost:0,playerMissiles:0,enemyMissiles:0,lightningStrikes:0,lightningHullLost:0,lightningEnemyHullLost:0,
  boosts:0,moves:0,shots:0,waits:0,withdrawals:0,refusedActions:0,validations:0,reloads:0});
 audit.random=seed=>{let state=seed>>>0;Math.random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};};
 audit.enemy=(kind,index=0)=>{
  const profiles={
   raider:{name:'Corvette',hp:30,atk:4,engineRating:3,combatTactic:'brawler',installedWeapons:['mass_driver']},
   skirmisher:{name:'Frigate',hp:50,atk:6,engineRating:3,combatTactic:'skirmisher',installedWeapons:['mass_driver']},
   sniper:{name:'Cruiser',hp:80,atk:9,engineRating:2,combatTactic:'sniper',installedWeapons:['railgun']},
   missile:{name:'Artemis Raider',hp:100,atk:9,engineRating:2,combatTactic:'missile',installedWeapons:['artemis','mass_driver'],ammo:{artemis:3}},
   wraith:{name:'Nebula Wraith',hp:150,atk:18,engineRating:3,_homeCluster:[{x:10,y:10}],isMassive:false},
   devourer:{name:'Void Devourer',hp:260,atk:26,engineRating:3,_homeCluster:[{x:10,y:10}],isMassive:true}
  };
  const p=JSON.parse(JSON.stringify(profiles[kind]));if(!p)throw Error('Unknown threat '+kind);
  return {...p,name:p.name+(index?' Wing':''),x:G.ship.x,y:G.ship.y,maxHp:p.hp,alive:true,shields:0,
   guns:p.installedWeapons?.length||1,...(p._homeCluster?{variant:'blue'}:{pirateType:'guard'})};
 };
 audit.encounter=(spec,stage=0)=>{
  const {environment,seed,threat,fleet}=spec;
  const cell=environment==='nebula'?{type:'NEBULA',nebulaVariant:seed%2?'blue':'pink'}:{type:'VOID'};
  G.galaxy[G.ship.y][G.ship.x]=cell;
  const kinds=fleet?(seed%2?['raider','sniper']:['skirmisher','missile']):[threat];
  const ships=kinds.map(audit.enemy);
  for(const ship of ships)(ship._homeCluster?G.gasEntities:G.pirates).push(ship);
  G.seed=(Math.imul(seed,104729)^Math.imul(stage+1,19349663))>>>0;
  startShipCombat(ships[0],true);if(!G.shipCombat)throw Error('Fixture did not enter combat');
  const c=G.shipCombat;serializeCareer(G);
  return {ids:c.enemies.map(e=>e.ship._careerId),layout:c.environment?.layout||'space',
   rocks:c.asteroids.length,largeRocks:c.asteroids.filter(r=>(r.width??1)*(r.height??1)>1).length,
   pockets:c.environment?.pockets?.length||0};
 };
 audit.setup=spec=>{
  audit.random(spec.seed*104729+12345);
  bridgeFixture({hull:spec.hull,trained:spec.trained,setupOnly:true});
  G.inventory=[];G.log=[];G.shipRefits=spec.hull==='BULK_FREIGHTER'?{upwslot:1}:{};
  const special=spec.seed%3===0;
  G.installedWeapons=spec.hull==='ATTACK_CORVETTE'?(special?['artemis','mass_driver']:['railgun','mass_driver']):[special?'pulse_laser':'mass_driver'];
  G.ship.ammo.artemis=G.installedWeapons.includes('artemis')?8:0;
  if(hullFittingReason(G.shipStats,G.ship.maxHp,G.installedWeapons))throw Error('Illegal player fitting');
  if(G.installedWeapons.some((_,slot)=>!shipWeaponOnline(G.ship,slot)))throw Error('Unpowered fixture fitting');
  G.visited.fill(false);revealAround(G.ship.x,G.ship.y,effectiveSensorRange());
  return audit.encounter(spec);
 };
 audit.visible=c=>livingShipCombatEnemies(c).filter(e=>shipCombatContactVisible(c,e));
 audit.knownRock=(c,p)=>!!c.seenTiles[p.y*COMBAT_MAP.width+p.x]&&shipCombatAsteroid(c,p);
 audit.knownClear=(c,from,to)=>!buildTileLine(from.x,from.y,to.x,to.y).some(p=>audit.knownRock(c,p)||
  audit.visible(c).some(e=>e!==to&&e.x===p.x&&e.y===p.y));
 audit.open=(c,p)=>p.x>=0&&p.y>=0&&p.x<27&&p.y<17&&!audit.knownRock(c,p)&&
  !audit.visible(c).some(e=>e.x===p.x&&e.y===p.y);
 audit.plasma=(c,p)=>shipCombatInSensorRange(c,p)?shipCombatPlasma(c,p)?.damage||0:0;
 audit.choose=(c,policy,memory)=>{
  const visible=audit.visible(c).sort((a,b)=>a.ship.hp-b.ship.hp||shipCombatDistance(c.player,a)-shipCombatDistance(c.player,b));
  const target=visible[0];if(target)selectShipCombatTarget(c.enemies.indexOf(target));
  const retreat=G.ship.hp<G.ship.maxHp*0.3 || !shipCombatWeapons().some(({slot,weapon})=>shipWeaponOnline(G.ship,slot)&&shipWeaponHasAmmo(G.ship,weapon));
  if(retreat&&shipCombatEdge(c.player))return {kind:'withdraw'};
  let ram=false;
  if(policy==='mixed'&&target&&!retreat&&effectiveEngineRating()>0&&(G.fuel>0||DEBUG.infiniteFuel)){
   const expected=shipCombatRamDamage(shipCombatImpactSize(G.ship),shipCombatImpactSize(target.ship),false,2);
   ram=G.ship.hp>Math.max(G.ship.maxHp*0.45,expected.recoil*3)&&
    (shipCombatImpactSize(G.ship)>=shipCombatImpactSize(target.ship)*1.1||target.ship.hp<=expected.target);
   const dx=Math.sign(target.x-c.player.x),dy=Math.sign(target.y-c.player.y),distance=shipCombatDistance(c.player,target);
   if(ram&&distance===1)return {kind:'move',dx,dy};
   if(ram&&distance===2 && (target.x===c.player.x||target.y===c.player.y||Math.abs(target.x-c.player.x)===Math.abs(target.y-c.player.y))){
    const mid={x:c.player.x+dx,y:c.player.y+dy},worst=shipCombatRamDamage(shipCombatImpactSize(G.ship),shipCombatImpactSize(target.ship),true,4);
    if(audit.open(c,mid)&&G.ship.hp>worst.recoil+G.ship.maxHp*0.25){
     const old=[c.player.dx,c.player.dy];c.player.dx=dx;c.player.dy=dy;const ready=shipCombatBoostStatus(c)==='Ready';
     [c.player.dx,c.player.dy]=old;if(ready)return {kind:'boost',dx,dy};
    }
   }
  }
  const entry=selectReadyShipCombatWeapon(c);
  if(target&&entry&&shipCombatWeaponStatus(c,entry)==='Ready')return {kind:'fire'};
  if(effectiveEngineRating()>0&&(G.fuel>0||DEBUG.infiniteFuel)){
   const range=ram?1:Math.max(1,...shipCombatWeapons().map(e=>e.weapon.range))-1;
   const score=p=>(retreat||!target?Math.min(p.x,p.y,26-p.x,16-p.y)*3:
    Math.abs(shipCombatDistance(p,target)-range)*2+(audit.knownClear(c,p,target)?0:6))+
    audit.plasma(c,p)*2+(memory.get(p.x+','+p.y)||0)*0.18;
   const moves=COMBAT_STEPS.map(([dx,dy])=>({kind:'move',x:c.player.x+dx,y:c.player.y+dy,dx,dy})).filter(p=>audit.open(c,p));
   moves.sort((a,b)=>score(a)-score(b));
   if(moves[0]&&score(moves[0])<score(c.player)-0.01){
    const first=moves[0],end={x:c.player.x+first.dx*2,y:c.player.y+first.dy*2};
    // Ordinary boosts require charted, visibly clear steps. Never consult the hidden storm schedule.
    if(audit.open(c,end)&&c.seenTiles[first.y*27+first.x]&&c.seenTiles[end.y*27+end.x]&&
      audit.plasma(c,first)===0&&audit.plasma(c,end)===0&&score(end)<score(first)-0.5){
     const old=[c.player.dx,c.player.dy];c.player.dx=first.dx;c.player.dy=first.dy;
     const ready=shipCombatBoostStatus(c)==='Ready';[c.player.dx,c.player.dy]=old;
     if(ready)return {kind:'boost',dx:first.dx,dy:first.dy};
    }
    return first;
   }
  }
  return {kind:'wait'};
 };
 audit.execute=action=>{
  const m=audit.metrics;
  if(action.kind==='boost'){G.shipCombat.player.dx=action.dx;G.shipCombat.player.dy=action.dy;m.boosts++;boostShipInCombat();}
  else if(action.kind==='move'){m.moves++;moveShipInCombat(action.dx,action.dy);}
  else if(action.kind==='fire'){m.shots++;doShipFire();}
  else if(action.kind==='withdraw'){m.withdrawals++;doShipRetreat();}
  else {m.waits++;advanceShipCombat();}
 };
 audit.assertState=()=>{
  if(!Number.isFinite(G.ship.hp)||G.ship.hp<0||!Number.isFinite(G.ship.heat)||G.ship.heat<0||G.fuel<0)throw Error('Invalid player resource state');
  const c=G.shipCombat;if(!c)return;
  if(shipCombatAsteroid(c,c.player))throw Error('Player ended inside solid cover');
  const occupied=new Set([c.player.x+','+c.player.y]);
  for(const enemy of livingShipCombatEnemies(c)){
   const key=enemy.x+','+enemy.y;
   if(occupied.has(key)||shipCombatAsteroid(c,enemy))throw Error('Actor overlap or solid-cover intrusion');occupied.add(key);
   if(!Number.isFinite(enemy.ship.hp)||enemy.ship.hp<0||enemy.moveBank<0||enemy.moveBank>=1)throw Error('Invalid NPC state');
  }
 };
 audit.fight=(spec,initial,cap=90,resume=false)=>{
  const initialTurn=G.turn,initialHp=G.ship.hp,initialFuel=G.fuel,initialCrew=G.crew.filter(c=>c.hp>0).length;
  const memory=new Map(),trace=[];let actions=0,last=G.shipCombat;
  while(!G.dead&&G.mode==='shipcombat'&&actions<cap){
   const c=G.shipCombat;last=c;memory.set(c.player.x+','+c.player.y,(memory.get(c.player.x+','+c.player.y)||0)+1);
   const action=audit.choose(c,spec.policy,memory),turn=G.turn;
   audit.execute(action);
   if(G.turn===turn&&!G.dead&&G.mode==='shipcombat'){audit.metrics.refusedActions++;audit.execute({kind:'wait'});}
   if(G.turn!==turn+1)throw Error('Action did not commit exactly one turn: '+action.kind+' '+turn+' -> '+G.turn);
   actions++;audit.assertState();
   if(actions%10===0||G.mode!=='shipcombat'||G.dead){parseSaveSnapshot(serializeCareer(G));audit.metrics.validations++;}
   if(resume&&actions===12&&G.mode==='shipcombat'&&!G.dead){
    const raw=serializeCareer(G);installSaveSnapshot(parseSaveSnapshot(raw));last=G.shipCombat;audit.metrics.reloads++;
   }
   trace.push({a:action.kind,t:G.turn,hp:G.ship.hp,heat:G.ship.heat,p:G.shipCombat?{x:G.shipCombat.player.x,y:G.shipCombat.player.y}:null,
    visible:G.shipCombat?audit.visible(G.shipCombat).map(e=>({x:e.x,y:e.y,hp:e.ship.hp,heat:e.ship.heat})):[],
    enemies:initial.ids.map(id=>[...G.pirates,...G.gasEntities].find(s=>s._careerId===id)?.hp)});if(trace.length>18)trace.shift();
  }
  const actors=initial.ids.map(id=>[...G.pirates,...G.gasEntities].find(s=>s._careerId===id));
  const defeated=actors.every(ship=>ship.hp<=0||ship.alive===false),escaped=last.enemies.every(e=>e.escaped||e.ship.hp<=0||e.ship.alive===false);
  const outcome=G.dead?'death':G.mode==='shipcombat'?'cap':defeated?'victory':escaped?'enemy escaped':G.stranded?'disabled':'withdrawn';
  return {...spec,...initial,outcome,actions,turns:G.turn-initialTurn,initialHp,hp:G.ship.hp,fuelSpent:initialFuel-G.fuel,
   crewLost:initialCrew-G.crew.filter(c=>c.hp>0).length,cause:G.deathCause||null,metrics:{...audit.metrics},trace,
   final:{player:{...last.player},heat:G.ship.heat,engine:effectiveEngineRating(),sensors:effectiveSensorRange(),
    systems:JSON.parse(JSON.stringify(G.ship.systems)),weapons:shipCombatWeapons().map(e=>({id:G.installedWeapons[e.slot],slot:e.slot,status:shipCombatWeaponStatus(last,e)})),
    crew:G.crew.map(c=>({name:c.name,hp:c.hp,statuses:Object.keys(c.statuses||{})})),
    enemies:actors.map(ship=>({name:ship.name,hp:ship.hp,alive:ship.alive,engine:effectiveEngineRating(ship),ammo:ship.ammo})),
    status:G.shipCombat?shipCombatEnemyActionStatus(G.shipCombat,G.shipCombat.enemies[G.shipCombat.target]):outcome}};
 };
 audit.run=(spec,cap=90,resume=false)=>{
  audit.metrics=audit.newMetrics();const initial=audit.setup(spec);return audit.fight(spec,initial,cap,resume);
 };
 audit.batch=(specs,cap,probe=false)=>{
  const render=renderAll,queue=queueShipCombatFeedback,random=Math.random;renderAll=()=>{};queueShipCombatFeedback=()=>{};
  try{return specs.map(spec=>{
   const result=audit.run(spec,cap,spec.seed%3===0);
   if(probe&&result.outcome==='cap'&&shipCombatEdge(G.shipCombat.player)){
    const turn=G.turn;doShipRetreat();audit.assertState();parseSaveSnapshot(serializeCareer(G));
    if(G.turn!==turn+1)throw Error('Capped-state withdrawal did not commit a turn');
    result.withdrawalProbe={turns:G.turn-turn,outcome:G.dead?'death':G.mode==='shipcombat'?'failed/reset':'left combat',hp:G.ship.hp};
   }
   return result;
  });}
  finally{renderAll=render;queueShipCombatFeedback=queue;Math.random=random;audit.metrics=null;}
 };
 audit.resumePairs=specs=>{
  const render=renderAll,queue=queueShipCombatFeedback,random=Math.random;renderAll=()=>{};queueShipCombatFeedback=()=>{};
  try{return specs.map(spec=>{
   const first=audit.run(spec,90,false),expected=serializeCareer(G),second=audit.run(spec,90,true),actual=serializeCareer(G);
   return {spec,identical:expected===actual,first:first.outcome,second:second.outcome,reloaded:second.metrics.reloads>0};
  });}finally{renderAll=render;queueShipCombatFeedback=queue;Math.random=random;audit.metrics=null;}
 };
 audit.gauntlet=spec=>{
  const render=renderAll,queue=queueShipCombatFeedback,random=Math.random;renderAll=()=>{};queueShipCombatFeedback=()=>{};
  try{
   audit.metrics=audit.newMetrics();const stages=[];
   let initial=audit.setup({...spec,threat:'raider'});
   for(let stage=0;stage<3;stage++){
    if(stage){
     // A real paid sector move between scripted encounters, carrying all damage/crew/ammo forward.
     const next={x:G.ship.x+1,y:G.ship.y};G.galaxy[next.y][next.x]={type:'VOID'};
     const turn=G.turn;tryMove(1,0);
     if(G.dead||G.stranded||G.mode!=='galaxy'||G.turn!==turn+1)break;
     initial=audit.encounter({...spec,threat:stage===1?'skirmisher':'missile'},stage);
    }
    const result=audit.fight({...spec,stage},initial,90,true);stages.push(result);
    if(!['victory','enemy escaped'].includes(result.outcome))break;
   }
   return {spec,completed:stages.length===3&&stages.every(s=>['victory','enemy escaped'].includes(s.outcome)),
    stages,outcome:stages.at(-1)?.outcome||'travel stopped',hp:G.ship.hp,dead:G.dead,crew:G.crew.length,metrics:{...audit.metrics}};
  }finally{renderAll=render;queueShipCombatFeedback=queue;Math.random=random;audit.metrics=null;}
 };
}
