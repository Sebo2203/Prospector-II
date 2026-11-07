const COMBAT_MAP = { width:27, height:17, x:12, y:12 };
const COMBAT_STEPS = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
let pointerShipCombatAim = null;

function shipCombatDistance(a,b){
  return Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
}

function shipCombatCollection(ship){
  if(ship._homeCluster) return 'gasEntities';
  return ship.type && !ship.pirateType ? 'neutralShips' : 'pirates';
}

function createShipCombatArena(combat, ships){
  pointerShipCombatAim = null;
  const positions = [[19,8],[18,4],[18,12],[21,6]];
  combat.player = { x:13,y:8,dx:1,dy:0 };
  tickShipSystems();
  combat.enemies = ships.map((ship,i)=>{
    tickShipSystems(ship);
    const collection = shipCombatCollection(ship);
    const [x,y] = positions[i];
    return {ship,collection,x,y,dx:-1,dy:0,
      shields:ship.shieldCharge};
  });
  combat.target = 0;
  combat.weapon = 0;
  combat.weaponReady = G.ship.weaponReadyAt;
  combat.playerShields = G.ship.shieldCharge;
  combat.seenTiles = [];
  combat.round = 1;
  combat.trails = [];
  combat.asteroids = [];

  updateShipCombatSensors(combat);

  // Encounter coordinates and world seed keep cover consistent across save/load.
  let seed = (G.seed||0) ^ Math.imul(G.ship.x+1,73856093) ^ Math.imul(G.ship.y+1,19349663);
  if((seed&3)===0 || ships[0]._homeCluster) return;
  for(let i=0;i<16;i++){
    seed = (Math.imul(seed,1664525)+1013904223)>>>0;
    const x = 3+(seed>>>8)%21, y = 2+(seed>>>16)%13;
    const point = {x,y};
    if(shipCombatDistance(point,combat.player)<=1 ||
       combat.enemies.some(enemy=>shipCombatDistance(point,enemy)<=1) ||
       shipCombatAsteroid(combat,point)) continue;
    combat.asteroids.push(point);
  }
}

function livingShipCombatEnemies(combat){
  return combat.enemies.filter(enemy=>!enemy.escaped && enemy.ship.alive!==false && enemy.ship.hp>0);
}

function updateShipCombatTarget(combat){
  const living = livingShipCombatEnemies(combat);
  const current = combat.enemies[combat.target];
  const enemy = living.includes(current) ? current : living[0];
  if(!enemy) return;
  combat.target = combat.enemies.indexOf(enemy);
  combat.pirate = enemy.ship;
  combat.isNeutralTarget = enemy.collection==='neutralShips';
  combat.pirateShields = enemy.shields;
}

function selectShipCombatTarget(index){
  const combat = G.shipCombat;
  if(!combat || !livingShipCombatEnemies(combat).includes(combat.enemies[index])) return;
  pointerShipCombatAim = null;
  combat.target = index;
  updateShipCombatTarget(combat);
  renderAll();
}

function cycleShipCombatTarget(step){
  const combat = G.shipCombat;
  const living = livingShipCombatEnemies(combat);
  if(!living.length) return;
  const current = living.indexOf(combat.enemies[combat.target]);
  selectShipCombatTarget(combat.enemies.indexOf(living[(current+step+living.length)%living.length]));
}

function shipCombatWeapons(){
  const weapons = [];
  for(const [slot,id] of (G.installedWeapons||[]).slice(0,G.shipStats.weaponSlots).entries()){
    const weapon = SHIP_WEAPONS[id];
    if(weapon && !weapon.placeholder) weapons.push({slot,weapon});
  }
  return weapons;
}

function selectShipCombatWeapon(index){
  if(!shipCombatWeapons()[index]) return;
  G.shipCombat.weapon = index;
  renderAll();
}

function shipCombatAsteroid(combat,point){
  return combat.asteroids.some(rock=>rock.x===point.x && rock.y===point.y);
}

function shipCombatShotClear(combat,from,to){
  const line = buildTileLine(from.x,from.y,to.x,to.y);
  return !line.some(point=>shipCombatAsteroid(combat,point) ||
    livingShipCombatEnemies(combat).some(enemy=>enemy!==to && enemy!==from && enemy.x===point.x && enemy.y===point.y));
}

function shipCombatWeaponStatus(combat,entry){
  const target = combat.enemies[combat.target];
  const availability=shipWeaponAvailability(G.ship,entry.slot);
  if(availability!=='Ready') return availability;
  if(!target || !shipCombatContactVisible(combat,target)) return 'No sensor lock';
  if(!target || shipCombatDistance(combat.player,target)>entry.weapon.range) return 'Out of range';
  if(!shipCombatShotClear(combat,combat.player,target)) return 'Shot blocked';
  return 'Ready';
}

function shipCombatEdge(point){
  return point.x===0 || point.y===0 || point.x===COMBAT_MAP.width-1 || point.y===COMBAT_MAP.height-1;
}

function actorShipCombatWeapons(ship){
  ensureShipSystems(ship);
  return (ship.installedWeapons||[]).slice(0,shipSystemStats(ship).weaponSlots)
    .map((id,slot)=>({slot,weapon:SHIP_WEAPONS[id]})).filter(entry=>entry.weapon && !entry.weapon.placeholder);
}

function shipCombatEnemyRange(enemy){
  if(enemy.ship._homeCluster) return 1;
  return Math.max(0,...actorShipCombatWeapons(enemy.ship).filter(entry=>shipWeaponOnline(enemy.ship,entry.slot)).map(entry=>entry.weapon.range));
}

function shipCombatSensorRange(ship=G.ship){
  const rating=effectiveSensorRange(ship);
  return rating>0?6+rating*3:0;
}

function shipCombatInSensorRange(combat,point){
  const range=shipCombatSensorRange();
  return DEBUG.fullVision || (range>0 && shipCombatDistance(combat.player,point)<=range);
}

function shipCombatContactVisible(combat,enemy){
  return shipCombatInSensorRange(combat,enemy);
}

function updateShipCombatSensors(combat){
  for(let y=0;y<COMBAT_MAP.height;y++) for(let x=0;x<COMBAT_MAP.width;x++){
    if(shipCombatInSensorRange(combat,{x,y})) combat.seenTiles[y*COMBAT_MAP.width+x]=true;
  }
}

function syncShipCombatSystems(combat){
  combat.playerShields=G.ship.shieldCharge;
  combat.weaponReady=G.ship.weaponReadyAt;
  for(const enemy of combat.enemies) enemy.shields=enemy.ship.shieldCharge;
  updateShipCombatSensors(combat);
  updateShipCombatTarget(combat);
}

function shipCombatEnemyThreat(combat,enemy){
  return (enemy.ship._homeCluster || (effectiveSensorRange(enemy.ship)>0 && shipCombatDistance(enemy,combat.player)<=shipCombatSensorRange(enemy.ship))) &&
    shipCombatDistance(enemy,combat.player)<=shipCombatEnemyRange(enemy) &&
    shipCombatShotClear(combat,enemy,combat.player);
}

function shipCombatEnemyWeapon(combat,enemy){
  if(!shipCombatEnemyThreat(combat,enemy)) return null;
  return actorShipCombatWeapons(enemy.ship).find(entry=>
    shipWeaponAvailability(enemy.ship,entry.slot)==='Ready' &&
    shipCombatDistance(enemy,combat.player)<=entry.weapon.range) || null;
}

function shipCombatEnemyCanFire(combat,enemy){
  if(enemy.ship._homeCluster) return G.turn>=(enemy.ship.ramReadyAt||0) && shipCombatEnemyThreat(combat,enemy);
  return !!shipCombatEnemyWeapon(combat,enemy);
}

function shipCombatEscapeReady(combat){
  return shipCombatEdge(combat.player) &&
    !livingShipCombatEnemies(combat).some(enemy=>shipCombatEnemyCanFire(combat,enemy));
}

function shipCombatOpen(combat,point){
  return point.x>=0 && point.y>=0 && point.x<COMBAT_MAP.width && point.y<COMBAT_MAP.height &&
    !shipCombatAsteroid(combat,point) && shipCombatDistance(point,combat.player)>0 &&
    !livingShipCombatEnemies(combat).some(enemy=>shipCombatDistance(point,enemy)===0);
}

function shipCombatPlasma(combat,point){
  return combat.trails.find(trail=>trail.x===point.x && trail.y===point.y);
}

function moveShipCombatActor(combat,actor,to,engine){
  if(engine>0){
    const old = shipCombatPlasma(combat,actor);
    const trail = {x:actor.x,y:actor.y,dx:to.x-actor.x,dy:to.y-actor.y,damage:engine*2,expires:combat.round+engine+1};
    if(old) Object.assign(old,trail);
    else combat.trails.push(trail);
  }
  actor.dx = to.x-actor.x;
  actor.dy = to.y-actor.y;
  actor.x = to.x;
  actor.y = to.y;
  return shipCombatPlasma(combat,to)?.damage || 0;
}

function damageShipCombatPlayer(combat,damage){
  const hull=absorbShipHit(G.ship,damage,'combat impact');
  combat.playerShields=G.ship.shieldCharge;
  if(hull) SFX.hullHit();
  if(G.ship.hp===0){
    G.deathCause = 'The ship was destroyed in combat with '+combat.pirate.name+'.';
    G.dead = true;
    G.shipCombat = null;
    G.mode = 'galaxy';
    addCombatLog('SHIP DESTROYED — game over.','lc');
  }
  return hull;
}

function damageShipCombatEnemy(combat,enemy,damage){
  const ship=enemy.ship;
  const hull=absorbShipHit(ship,damage,'combat impact');
  enemy.shields=ship.shieldCharge;
  if(ship.hp===0){
    ship.alive = false;
    resolveShipCombatKill(combat,enemy);
  }
  return hull;
}

function moveShipInCombat(dx,dy){
  const combat = G.shipCombat;
  if(!combat || G.dead) return;
  if(effectiveEngineRating()===0 || (G.fuel<=0 && !DEBUG.infiniteFuel)){
    addCombatLog('Engines offline. You can still fire or wait.','lw');
    renderAll();
    return;
  }
  const to = {x:combat.player.x+dx,y:combat.player.y+dy};
  if(!shipCombatOpen(combat,to)){
    addCombatLog('That sector is blocked.','lw');
    renderAll();
    return;
  }
  const damage = moveShipCombatActor(combat,combat.player,to,effectiveEngineRating());
  G.ship.heat+=2;
  if(damage){
    const hull = damageShipCombatPlayer(combat,damage);
    if(!G.dead) addCombatLog('Crossed plasma exhaust. '+damage+' damage ('+hull+' hull).','lw');
  }
  advanceShipCombat(combat,damage>0,'move');
}

function shipCombatHitChance(attackerEngine,defenderEngine,distance){
  return Math.max(0.15,Math.min(0.98,0.85+(attackerEngine-1)*0.05-(defenderEngine-1)*0.10-
    Math.max(0,distance-2)*0.025));
}

function doShipFire(){
  const combat = G.shipCombat;
  if(G.mode!=='shipcombat' || !combat) return;
  const entry = shipCombatWeapons()[combat.weapon];
  const status = entry ? shipCombatWeaponStatus(combat,entry) : 'No weapons installed';
  if(status!=='Ready'){
    addCombatLog(combatStatusText(status)+'.','lw');
    renderAll();
    return;
  }
  const {weapon,slot} = entry, enemy = combat.enemies[combat.target];
  const chance = shipCombatHitChance(effectiveEngineRating(),effectiveEngineRating(enemy.ship),
    shipCombatDistance(combat.player,enemy));
  commitShipWeapon(G.ship,slot);
  if(Math.random()<chance){
    const damage = weapon.minDmg+rnd(weapon.maxDmg-weapon.minDmg+1);
    const absorbed=Math.min(damage,enemy.ship.shieldCharge,shipShieldCapacity(enemy.ship));
    addCombatLog(weapon.name+' hits '+enemy.ship.name+' for '+damage+' ('+(damage-absorbed)+' hull).','lc');
    damageShipCombatEnemy(combat,enemy,damage);
  } else {
    addCombatLog(weapon.name+' misses '+enemy.ship.name+'.','li');
  }
  advanceShipCombat(combat,false,'fire');
}

function moveShipCombatEnemy(combat,enemy){
  if(!enemy.ship._homeCluster && (effectiveEngineRating(enemy.ship)===0 || effectiveSensorRange(enemy.ship)===0)) return;
  const sight=shipCombatSensorRange(enemy.ship);
  if(shipCombatDistance(enemy,combat.player)<=sight) enemy.lastSeenPlayer={x:combat.player.x,y:combat.player.y};
  const destination=enemy.lastSeenPlayer;
  if(!destination) return;
  const fleeing = !enemy.ship._homeCluster && (shipSystemStats(enemy.ship).weaponSlots||0)===0;
  if(!fleeing && shipCombatDistance(enemy,destination)===0) return;
  const score = point=>{
    const goal = fleeing ? Math.min(point.x,point.y,COMBAT_MAP.width-1-point.x,COMBAT_MAP.height-1-point.y) :
      shipCombatDistance(point,destination)*2 + 0.1*(Math.abs(point.x-destination.x)+Math.abs(point.y-destination.y));
    return goal + (shipCombatPlasma(combat,point)?.damage||0)*0.65;
  };
  const next = COMBAT_STEPS.map(([dx,dy])=>({x:enemy.x+dx,y:enemy.y+dy}))
    .filter(point=>shipCombatOpen(combat,point)).sort((a,b)=>score(a)-score(b))[0];
  if(next){
    const damage = moveShipCombatActor(combat,enemy,next,enemy.ship._homeCluster ? 0 : effectiveEngineRating(enemy.ship));
    if(!enemy.ship._homeCluster) enemy.ship.heat+=2;
    if(damage){
      addCombatLog(enemy.ship.name+' crosses plasma exhaust ('+damage+' damage).','lc');
      damageShipCombatEnemy(combat,enemy,damage);
    }
  }
  if(fleeing && enemy.ship.alive!==false && shipCombatEdge(enemy)){
    enemy.escaped = true;
    addCombatLog(enemy.ship.name+' flies out of the combat area.','li');
  }
}

function fireShipCombatEnemy(combat,enemy){
  const ship=enemy.ship;
  const entry=ship._homeCluster?null:shipCombatEnemyWeapon(combat,enemy);
  if(!ship._homeCluster && !entry) return false;
  if(ship._homeCluster) ship.ramReadyAt=G.turn+2;
  else commitShipWeapon(ship,entry.slot);
  const chance=shipCombatHitChance(effectiveEngineRating(ship),effectiveEngineRating(),shipCombatDistance(enemy,combat.player));
  const damage=Math.random()<chance ? (entry ? entry.weapon.minDmg+rnd(entry.weapon.maxDmg-entry.weapon.minDmg+1) : Math.max(1,ship.atk+rnd(4)-2)) : 0;
  const absorbed=Math.min(damage,G.ship.shieldCharge,shipShieldCapacity());
  const hull=DEBUG.infiniteHull?0:Math.min(G.ship.hp,damage-absorbed);
  addCombatLog(ship.name+(entry?' fires '+entry.weapon.name:' rams')+' — '+(damage?damage+' damage ('+hull+' hull).':'miss.'),'lc');
  if(damage) damageShipCombatPlayer(combat,damage);
  return damage>0;
}

// Shared readiness queries drive controls and their real action guards.
function shipCombatBoostStatus(combat=G.shipCombat){
  if(!combat || G.dead) return 'Unavailable';
  if(effectiveEngineRating()===0) return 'Engines offline';
  if(!DEBUG.infiniteFuel && G.fuel<2) return 'Needs 2 fuel';
  if(G.ship.heat+18+effectiveEngineRating()*2>shipHeatCapacity()) return 'Too hot';
  const {x,y,dx,dy}=combat.player;
  if(![1,2].every(step=>shipCombatOpen(combat,{x:x+dx*step,y:y+dy*step}))) return 'Path blocked';
  return 'Ready';
}

function combatStatusText(status){
  return status.replace(/^Ready in (\d+)$/,(_,turns)=>'Reload '+turns+' action'+(turns==='1'?'':'s'));
}

function shipCombatEnemyActionStatus(combat,enemy){
  const ship=enemy.ship;
  if(ship._homeCluster){
    const turns=Math.max(0,(ship.ramReadyAt||0)-G.turn);
    if(turns) return 'Ram reloading: '+turns+' action'+(turns===1?'':'s');
    return shipCombatEnemyCanFire(combat,enemy)?'Can ram':'Out of ram range';
  }
  const weapons=actorShipCombatWeapons(ship);
  if(!weapons.length) return 'Unarmed';
  if(effectiveSensorRange(ship)===0) return 'Sensors offline';
  const powered=weapons.filter(entry=>shipWeaponOnline(ship,entry.slot));
  if(!powered.length) return 'Mounts offline';
  const ready=powered.filter(entry=>shipWeaponAvailability(ship,entry.slot)==='Ready');
  if(!ready.length){
    const turns=Math.min(...powered.map(entry=>Math.max(0,(ship.weaponReadyAt[entry.slot]||0)-G.turn)));
    return turns?combatStatusText('Ready in '+turns):'Heat limited';
  }
  if(!ready.some(entry=>shipCombatDistance(enemy,combat.player)<=entry.weapon.range)) return 'Out of range';
  if(!shipCombatShotClear(combat,enemy,combat.player)) return 'Shot blocked';
  return shipCombatEnemyCanFire(combat,enemy)?'Can fire':'No sensor lock';
}

function boostShipInCombat(){
  const combat=G.shipCombat;
  if(!combat || G.dead) return;
  const heat=18+effectiveEngineRating()*2;
  const status=shipCombatBoostStatus(combat);
  if(status!=='Ready'){addCombatLog('Boost: '+status+'.','lw');renderAll();return;}
  const {x,y,dx,dy}=combat.player;
  const path=[{x:x+dx,y:y+dy},{x:x+dx*2,y:y+dy*2}];
  if(!DEBUG.infiniteFuel){G.fuel-=2;G.fuelSpent=(G.fuelSpent||0)+2;}
  G.ship.heat+=heat;
  for(const point of path){
    const damage=moveShipCombatActor(combat,combat.player,point,effectiveEngineRating());
    if(damage) damageShipCombatPlayer(combat,damage);
    if(G.dead) break;
  }
  advanceShipCombat(combat,false,'boost');
}

function advanceShipCombat(combat=G.shipCombat,hitPlayer=false,action='wait'){
  pointerShipCombatAim = null;
  if(!combat || combat!==G.shipCombat){ renderAll(); return; }
  if(action==='wait') G.ship.extraCooling=shipCoolingRate();
  beginCareerTurn();
  finishCareerTurn();
  if(G.dead){ renderAll(); return; }
  for(const enemy of livingShipCombatEnemies(combat)){
    tickShipSystems(enemy.ship);
    if(shipCombatEnemyCanFire(combat,enemy)){
      hitPlayer=fireShipCombatEnemy(combat,enemy)||hitPlayer;
      if(G.dead){ renderAll(); return; }
    } else if(shipCombatEnemyThreat(combat,enemy)){
      enemy.ship.heat=Math.max(0,enemy.ship.heat-shipCoolingRate(enemy.ship));
    } else moveShipCombatEnemy(combat,enemy);
  }
  if(!livingShipCombatEnemies(combat).length){
    G.shipCombat=null;G.mode='galaxy';
    if(!combat.result) addCombatLog('Combat ended.','li');
  } else {
    combat.round++;
    combat.trails=combat.trails.filter(trail=>trail.expires>combat.round);
    syncShipCombatSystems(combat);
  }
  renderAll();
}
