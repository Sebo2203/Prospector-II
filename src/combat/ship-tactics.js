const COMBAT_MAP = { width:27, height:17, x:12, y:12 };
const SHIP_DISENGAGE_FAILURE_CHANCE = 0.25;
const COMBAT_PLAYER_START = {x:13,y:8,dx:1,dy:0};
const COMBAT_ENEMY_STARTS = [[19,8],[18,4],[18,12],[21,6]];
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
  combat.player = {...COMBAT_PLAYER_START};
  tickShipSystems();
  combat.enemies = ships.map((ship,i)=>{
    tickShipSystems(ship);
    const collection = shipCombatCollection(ship);
    const [x,y] = COMBAT_ENEMY_STARTS[i];
    return {ship,collection,x,y,dx:-1,dy:0,moveBank:0,
      shields:ship.shieldCharge};
  });
  combat.target = 0;
  combat.weapon = 0;
  combat.weaponReady = G.ship.weaponReadyAt;
  combat.playerShields = G.ship.shieldCharge;
  combat.seenTiles = [];
  combat.round = 1;
  combat.trails = [];
  combat.missiles = [];
  combat.asteroids = [];

  initializeShipCombatEnvironment(combat);

  updateShipCombatSensors(combat);

  // Encounter coordinates and world seed keep cover consistent across save/load.
  let seed = (G.seed||0) ^ Math.imul(G.ship.x+1,73856093) ^ Math.imul(G.ship.y+1,19349663);
  if(combat.environment?.layout==='gas' || (combat.environment?.type!=='nebula' && ((seed&3)===0 || ships[0]._homeCluster))) return;
  let coverTiles=0;
  for(let i=0;i<16;i++){
    seed = (Math.imul(seed,1664525)+1013904223)>>>0;
    const x = 3+(seed>>>8)%21, y = 2+(seed>>>16)%13;
    const shape=seed%100;
    const width=((shape>=92 && shape<95) || shape>=98) ? 2 : 1;
    const height=shape>=95 ? 2 : 1;
    const rock=width===1 && height===1 ? {x,y} : {x,y,width,height};
    const tiles=shipCombatAsteroidTiles(rock);
    if(coverTiles+tiles.length>16 || tiles.some(point=>
       point.x>=COMBAT_MAP.width || point.y>=COMBAT_MAP.height ||
       shipCombatDistance(point,combat.player)<=1 ||
       combat.enemies.some(enemy=>shipCombatDistance(point,enemy)<=1) ||
       shipCombatAsteroid(combat,point) || shipCombatGas(combat,point))) continue;
    combat.asteroids.push(rock);
    coverTiles+=tiles.length;
  }
}

// A failed withdrawal changes arena positioning only, never the authoritative ships.
function resetShipCombatPositions(combat){
  Object.assign(combat.player,COMBAT_PLAYER_START);
  combat.enemies.forEach((enemy,index)=>{
    if(enemy.escaped || enemy.ship.alive===false || enemy.ship.hp<=0) return;
    const [x,y]=COMBAT_ENEMY_STARTS[index];
    Object.assign(enemy,{x,y,dx:-1,dy:0,moveBank:0,lastSeenPlayer:{x:combat.player.x,y:combat.player.y}});
    delete enemy.lastManeuverAt;
  });
  combat.trails=[];
  pointerShipCombatAim=null;
  clearShipCombatFeedback();
  syncShipCombatSystems(combat);
}

function shipDisengagementFails(){
  return Math.random()<SHIP_DISENGAGE_FAILURE_CHANCE;
}

function livingShipCombatEnemies(combat){
  return combat.enemies.filter(enemy=>!enemy.escaped && enemy.ship.alive!==false && enemy.ship.hp>0);
}

function finishShipCombatIfClear(combat){
  if(livingShipCombatEnemies(combat).length || combat.missiles.length) return false;
  G.shipCombat=null;G.mode='galaxy';
  if(!combat.result)addCombatLog('Combat ended.','li');
  return true;
}

// Ignore temporary heat/reload limits: a ship that can fire after waiting is not stranded here.
function shipCombatStalemated(combat){
  if(combat.missiles.length) return false;
  const enemies=livingShipCombatEnemies(combat);
  if(!enemies.length || (effectiveEngineRating()>0 && (G.fuel>0 || DEBUG.infiniteFuel))) return false;
  if(enemies.some(enemy=>shipCombatMoveRating(enemy)>0 &&
    (enemy.ship._homeCluster || effectiveSensorRange(enemy.ship)>0))) return false;
  if(enemies.some(enemy=>shipCombatEnemyThreat(combat,enemy))) return false;
  return !enemies.some(enemy=>shipCombatContactVisible(combat,enemy) && shipCombatWeapons().some(({slot,weapon})=>
    shipWeaponOnline(G.ship,slot) && shipWeaponHasAmmo(G.ship,weapon) &&
    shipCombatWeaponCanReach(combat,combat.player,enemy,weapon)));
}

function resolveShipCombatStalemate(combat){
  if(combat!==G.shipCombat || !shipCombatStalemated(combat)) return false;
  G.shipCombat=null;
  G.mode='galaxy';
  G.stranded ??= {sos:false,turnsStranded:0,rescueShip:null,rescuePhase:null};
  pointerShipCombatAim=null;
  clearShipCombatFeedback();
  addCombatLog('Combat stalls: neither side can close or fire. Your ship remains disabled. Repair the drive or press [T] for SOS.','lw');
  return true;
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
  selectReadyShipCombatWeapon(combat);
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
  selectReadyShipCombatWeapon(G.shipCombat);
  renderAll();
}

function selectReadyShipCombatWeapon(combat=G.shipCombat){
  const weapons=shipCombatWeapons();
  if(!weapons.length)return null;
  if(!weapons[combat.weapon])combat.weapon=0;
  if(shipCombatWeaponStatus(combat,weapons[combat.weapon])==='Ready')return weapons[combat.weapon];
  for(let step=1;step<weapons.length;step++){
    const index=(combat.weapon+step)%weapons.length;
    if(shipCombatWeaponStatus(combat,weapons[index])==='Ready'){
      combat.weapon=index;return weapons[index];
    }
  }
  return weapons[combat.weapon];
}

function shipCombatBlockedFireMessage(entry,status){
  const reload=status.match(/^Ready in (\d+)$/);
  const name=entry?.weapon.name||'weapon';
  if(reload){
    const turns=Number(reload[1]);
    return 'Cannot fire '+name+': still reloading ('+turns+' turn'+(turns===1?'':'s')+' remaining). Move or wait to finish reloading.'+
      (shipCombatWeapons().length>1?' No other weapon can fire at this target.':'');
  }
  return 'Cannot fire '+name+': '+combatStatusText(status)+'.';
}

function shipCombatAsteroid(combat,point){
  return combat.asteroids.some(rock=>point.x>=rock.x && point.x<rock.x+(rock.width??1) &&
    point.y>=rock.y && point.y<rock.y+(rock.height??1));
}

function shipCombatAsteroidTiles(rock){
  const tiles=[];
  for(let y=rock.y;y<rock.y+(rock.height??1);y++){
    for(let x=rock.x;x<rock.x+(rock.width??1);x++) tiles.push({x,y});
  }
  return tiles;
}

function shipCombatShotClear(combat,from,to){
  const line = buildTileLine(from.x,from.y,to.x,to.y);
  return !line.some(point=>shipCombatAsteroid(combat,point) ||
    livingShipCombatEnemies(combat).some(enemy=>enemy!==to && enemy!==from && enemy.x===point.x && enemy.y===point.y));
}

function shipCombatWeaponCanReach(combat,from,to,weapon){
  return shipCombatDistance(from,to)<=weapon.range &&
    (weapon.guided || shipCombatShotClear(combat,from,to));
}

function shipCombatWeaponStatus(combat,entry){
  const target = combat.enemies[combat.target];
  if(!target || target.escaped || target.ship.alive===false || target.ship.hp<=0) return 'No live target';
  const availability=shipWeaponAvailability(G.ship,entry.slot);
  if(availability!=='Ready') return availability;
  if(!target || !shipCombatContactVisible(combat,target)) return 'No sensor lock';
  if(!target || shipCombatDistance(combat.player,target)>entry.weapon.range) return 'Out of range';
  if(!shipCombatWeaponCanReach(combat,combat.player,target,entry.weapon)) return 'Shot blocked';
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
  return Math.max(0,...actorShipCombatWeapons(enemy.ship).filter(entry=>shipWeaponOnline(enemy.ship,entry.slot) &&
    shipWeaponHasAmmo(enemy.ship,entry.weapon)).map(entry=>entry.weapon.range));
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
  selectReadyShipCombatWeapon(combat);
}

function shipCombatEnemyThreat(combat,enemy){
  if(enemy.ship._homeCluster) return shipCombatDistance(enemy,combat.player)<=1 && shipCombatShotClear(combat,enemy,combat.player);
  return effectiveSensorRange(enemy.ship)>0 && shipCombatDistance(enemy,combat.player)<=shipCombatSensorRange(enemy.ship) &&
    actorShipCombatWeapons(enemy.ship).some(({slot,weapon})=>shipWeaponOnline(enemy.ship,slot) &&
      shipWeaponHasAmmo(enemy.ship,weapon) && shipCombatWeaponCanReach(combat,enemy,combat.player,weapon));
}

function shipCombatEnemyWeapon(combat,enemy){
  if(!shipCombatEnemyThreat(combat,enemy)) return null;
  const tactic=shipCombatTactic(enemy);
  return actorShipCombatWeapons(enemy.ship).filter(entry=>
    shipWeaponAvailability(enemy.ship,entry.slot)==='Ready' &&
    shipCombatWeaponCanReach(combat,enemy,combat.player,entry.weapon)).sort((a,b)=>
      tactic==='missile'?Number(!!b.weapon.guided)-Number(!!a.weapon.guided):
      tactic==='sniper'?b.weapon.range-a.weapon.range:
      tactic==='skirmisher'?a.weapon.cooldown-b.weapon.cooldown:
      b.weapon.minDmg+b.weapon.maxDmg-a.weapon.minDmg-a.weapon.maxDmg)[0] || null;
}

function shipCombatEnemyCanFire(combat,enemy){
  if(enemy.escaped || enemy.ship.alive===false || enemy.ship.hp<=0) return false;
  if(enemy.ship._homeCluster) return G.turn>=(enemy.ship.ramReadyAt||0) && shipCombatEnemyThreat(combat,enemy);
  return !!shipCombatEnemyWeapon(combat,enemy);
}

function shipCombatEscapeReady(combat){
  return shipCombatEdge(combat.player) &&
    !combat.missiles.some(missile=>missile.target<0) &&
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
    const trail = {x:actor.x,y:actor.y,damage:engine*2,expires:combat.round+engine+1};
    if(old) Object.assign(old,trail);
    else combat.trails.push(trail);
  }
  actor.dx = to.x-actor.x;
  actor.dy = to.y-actor.y;
  actor.x = to.x;
  actor.y = to.y;
  return shipCombatPlasma(combat,to)?.damage || 0;
}

function damageShipCombatPlayer(combat,damage,deferFeedback=false,source=combat.pirate.name,bypassShields=false){
  const before=Object.values(ensureShipSystems()).map(component=>component.condition);
  const hull=bypassShields?damageShipHull(G.ship,damage,source):absorbShipHit(G.ship,damage,'combat impact');
  combat.playerShields=G.ship.shieldCharge;
  if(!deferFeedback && damage>0){
    const critical=Object.values(G.ship.systems).some((component,index)=>component.condition<before[index]);
    queueShipCombatFeedback(combat,combat.player,combat.player,{side:'enemy',hit:true,hull,critical,impactOnly:true});
  }
  if(G.ship.hp>0)rollShipCombatCrewDamage(hull,source);
  if(G.ship.hp===0){
    G.deathCause = 'The ship was destroyed in combat with '+source+'.';
    G.dead = true;
    G.shipCombat = null;
    G.mode = 'galaxy';
    addCombatLog('SHIP DESTROYED — game over.','lc');
  }
  return hull;
}

function damageShipCombatEnemy(combat,enemy,damage,bypassShields=false,source='combat impact'){
  const ship=enemy.ship;
  const hull=bypassShields?damageShipHull(ship,damage,source):absorbShipHit(ship,damage,source);
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
  if(!dx&&!dy)return;
  if(to.x<0||to.y<0||to.x>=COMBAT_MAP.width||to.y>=COMBAT_MAP.height){renderAll();return;}
  combat.player.dx=dx;combat.player.dy=dy;
  const collision=shipCombatCollisionAt(combat,to);
  if(collision?.enemy){
    G.ship.heat+=2;ramShipCombatEnemy(combat,collision.enemy);
    finishShipCombatManeuver(combat,'ram');return;
  }
  if(!shipCombatOpen(combat,to)){
    addCombatLog('That sector is blocked.','lw');
    renderAll();
    return;
  }
  const damage = moveShipCombatActor(combat,combat.player,to,effectiveEngineRating());
  G.ship.heat+=2;
  if(damage){
    const hull = damageShipCombatPlayer(combat,damage,false,'plasma exhaust');
    if(!G.dead) addCombatLog('Crossed plasma exhaust. '+damage+' damage ('+hull+' hull).','lw');
  }
  finishShipCombatManeuver(combat,'move',damage>0);
}

function shipCombatHitChance(gunnery,piloting,distance){
  return Math.max(0.15,Math.min(0.98,0.78+gunnery*0.035-piloting*0.03-
    Math.max(0,distance-2)*0.025));
}

function doShipFire(){
  const combat = G.shipCombat;
  if(G.mode!=='shipcombat' || !combat) return;
  const entry = selectReadyShipCombatWeapon(combat);
  const status = entry ? shipCombatWeaponStatus(combat,entry) : 'No weapons installed';
  if(status!=='Ready'){
    addCombatLog(shipCombatBlockedFireMessage(entry,status),'lw');
    renderAll();
    return;
  }
  const {weapon,slot} = entry, enemy = combat.enemies[combat.target];
  const gunner=shipBridgeOperator('cbt');
  const chance = shipCombatHitChance(shipBridgeSkills().gunnery,shipBridgeSkills(enemy.ship).piloting,
    shipCombatDistance(combat.player,enemy));
  commitShipWeapon(G.ship,slot);
  if(weapon.guided){
    launchShipCombatMissile(combat,-1,combat.target);
  } else if(Math.random()<Math.max(0.15,chance-shipCombatGasPenalty(combat,combat.player,enemy))){
    const damage = weapon.minDmg+rnd(weapon.maxDmg-weapon.minDmg+1);
    const absorbed=Math.min(damage,enemy.ship.shieldCharge,shipShieldCapacity(enemy.ship));
    addCombatLog(weapon.name+' hits '+enemy.ship.name+' for '+damage+' ('+(damage-absorbed)+' hull).','lg');
    damageShipCombatEnemy(combat,enemy,damage);
    queueShipCombatFeedback(combat,combat.player,enemy,{side:'player',hit:true,guided:weapon.guided});
  } else {
    addCombatLog(weapon.name+' misses '+enemy.ship.name+'.','ln');
    queueShipCombatFeedback(combat,combat.player,enemy,{side:'player',hit:false,guided:weapon.guided});
  }
  trainShipBridge('cbt',gunner);
  advanceShipCombat(combat,false,'fire');
}

function shipCombatMoveRating(enemy){
  return enemy.ship._homeCluster?(enemy.ship.engineRating??3):shipDrivePerformance(enemy.ship);
}

function moveShipCombatEnemy(combat,enemy,referenceEngine=shipDrivePerformance()||1){
  const rating=shipCombatMoveRating(enemy);
  if(!rating || (!enemy.ship._homeCluster && effectiveSensorRange(enemy.ship)===0)){
    enemy.moveBank=0;return;
  }
  const steps=shipRelativeMoveBudget(enemy,rating,referenceEngine,'moveBank');
  let moved=false;
  for(let step=0;step<steps;step++){
    // Guns stop at firing range; ram contact spends a remaining movement substep.
    if(step>0 && shipCombatEnemyManeuverSatisfied(combat,enemy))break;
    const result=moveShipCombatEnemyStep(combat,enemy);
    if(result==='reset')return 'reset';
    if(result==='ram')return true;
    if(!result)break;
    moved=true;
    if(enemy.escaped || enemy.ship.alive===false || enemy.ship.hp<=0 || combat!==G.shipCombat)break;
    if(shipCombatMoveRating(enemy)<rating || (!enemy.ship._homeCluster && effectiveSensorRange(enemy.ship)===0)){
      enemy.moveBank=0;break;
    }
  }
  return moved;
}

function moveShipCombatEnemyStep(combat,enemy){
  if(!enemy.ship._homeCluster && (effectiveEngineRating(enemy.ship)===0 || effectiveSensorRange(enemy.ship)===0)) return;
  const sight=shipCombatSensorRange(enemy.ship);
  if(shipCombatDistance(enemy,combat.player)<=sight) enemy.lastSeenPlayer={x:combat.player.x,y:combat.player.y};
  const destination=enemy.lastSeenPlayer;
  if(!destination) return;
  const fleeing=shipCombatTactic(enemy)==='flee';
  const next=shipCombatEnemyNextStep(combat,enemy,destination);
  if(next && next.x===combat.player.x && next.y===combat.player.y){
    if(!shipCombatEnemyCanFire(combat,enemy))return false;
    fireShipCombatEnemy(combat,enemy);return 'ram';
  }
  if(next){
    enemy.lastManeuverAt=G.turn;
    const damage = moveShipCombatActor(combat,enemy,next,enemy.ship._homeCluster ? 0 : effectiveEngineRating(enemy.ship));
    if(!enemy.ship._homeCluster) enemy.ship.heat+=2;
    if(damage){
      addCombatLog(enemy.ship.name+' crosses plasma exhaust ('+damage+' damage).','lc');
      damageShipCombatEnemy(combat,enemy,damage);
    }
  }
  if(fleeing && enemy.ship.alive!==false && shipCombatEdge(enemy)){
    if(escapeShipCombatEnemy(combat,enemy)==='reset')return 'reset';
  }
  return !!next || enemy.escaped;
}

function escapeShipCombatEnemy(combat,enemy){
  const ship=enemy.ship;
  const candidates=galaxyCombatEscapeChoices(ship);
  const dx=enemy.x===0?-1:enemy.x===COMBAT_MAP.width-1?1:0;
  const dy=enemy.y===0?-1:enemy.y===COMBAT_MAP.height-1?1:0;
  const distance=point=>Math.abs(point.x-G.ship.x)+Math.abs(point.y-G.ship.y);
  candidates.sort((a,b)=>distance(b)-distance(a) || (b.x-a.x)*dx+(b.y-a.y)*dy);
  if(!candidates.length){
    if(!enemy.escapeBlocked)addCombatLog(ship.name+' cannot find a clear galaxy escape route.','lw');
    enemy.escapeBlocked=true;return false;
  }
  if(shipDisengagementFails()){
    addCombatLog(ship.name+' fails to disengage! Remaining ships return to their starting positions.','lw');
    resetShipCombatPositions(combat);
    return 'reset';
  }
  ship.x=candidates[0].x;ship.y=candidates[0].y;
  ship.disengagedUntil=G.turn+1+SHIP_DISENGAGEMENT_TURNS;
  ship.fleeingPlayer=true;ship.fleeFrom={x:G.ship.x,y:G.ship.y};
  ship.requiresPursuit=true;
  enemy.escaped=true;
  addCombatLog(ship.name+' escapes beyond interception range. At least one clear sector separates you — give chase to re-engage.','li');
  return true;
}

function fireShipCombatEnemy(combat,enemy){
  const ship=enemy.ship;
  const entry=ship._homeCluster?null:shipCombatEnemyWeapon(combat,enemy);
  if(!ship._homeCluster && !entry) return false;
  if(ship._homeCluster){
    ship.ramReadyAt=G.turn+2;ramShipCombatEnemy(combat,enemy,false,true);return true;
  }
  commitShipWeapon(ship,entry.slot);
  if(entry?.weapon.guided){
    launchShipCombatMissile(combat,combat.enemies.indexOf(enemy),-1);
    return false;
  }
  const pilot=effectiveEngineRating()>0&&(G.fuel>0||DEBUG.infiniteFuel)?shipBridgeOperator('nav'):null;
  const chance=Math.max(0.15,shipCombatHitChance(shipBridgeSkills(ship).gunnery,shipBridgeSkills().piloting,shipCombatDistance(enemy,combat.player))-
    (entry?shipCombatGasPenalty(combat,enemy,combat.player):0));
  const damage=Math.random()<chance ? (entry ? entry.weapon.minDmg+rnd(entry.weapon.maxDmg-entry.weapon.minDmg+1) : Math.max(1,ship.atk+rnd(4)-2)) : 0;
  const absorbed=Math.min(damage,G.ship.shieldCharge,shipShieldCapacity());
  const hull=DEBUG.infiniteHull?0:Math.min(G.ship.hp,damage-absorbed);
  addCombatLog(ship.name+(entry?' fires '+entry.weapon.name:' rams')+' — '+(damage?damage+' damage ('+hull+' hull).':'miss.'),damage?'lc':'ll');
  const visible=shipCombatInSensorRange(combat,enemy);
  const before=Object.values(ensureShipSystems()).map(component=>component.condition);
  if(damage) damageShipCombatPlayer(combat,damage,true,ship.name);
  if(!G.dead)trainShipBridge('nav',pilot);
  const critical=Object.values(G.ship.systems).some((component,index)=>component.condition<before[index]);
  queueShipCombatFeedback(combat,enemy,combat.player,{side:'enemy',hit:damage>0,hull,critical,visible,impactOnly:!entry,guided:entry?.weapon.guided});
  return damage>0;
}

// Shared readiness queries drive controls and their real action guards.
function shipCombatBoostStatus(combat=G.shipCombat){
  if(!combat || G.dead) return 'Unavailable';
  if(effectiveEngineRating()===0) return 'Engines offline';
  if(!DEBUG.infiniteFuel && G.fuel<2*hullSize()) return 'Needs '+(2*hullSize())+' fuel';
  if(G.ship.heat+18+effectiveEngineRating()*2>shipHeatCapacity()) return 'Too hot';
  const {x,y,dx,dy}=combat.player;
  if(!dx&&!dy)return 'No heading';
  for(const step of [1,2]){
    const point={x:x+dx*step,y:y+dy*step};
    if(point.x<0||point.y<0||point.x>=COMBAT_MAP.width||point.y>=COMBAT_MAP.height)return 'Path blocked';
    if(shipCombatCollisionAt(combat,point))return 'Ready';
  }
  return 'Ready';
}

function combatStatusText(status){
  return status.replace(/^Ready in (\d+)$/,(_,turns)=>'Reload in '+turns+'t');
}

function shipCombatEnemyActionStatus(combat,enemy){
  const ship=enemy.ship;
  if(ship._homeCluster){
    const turns=Math.max(0,(ship.ramReadyAt||0)-G.turn);
    if(turns) return 'Ram reload in '+turns+'t';
    return shipCombatEnemyCanFire(combat,enemy)?'Can ram':'Out of ram range';
  }
  const weapons=actorShipCombatWeapons(ship);
  if(!weapons.length) return 'Unarmed';
  if(effectiveSensorRange(ship)===0) return 'Sensors offline';
  const powered=weapons.filter(entry=>shipWeaponOnline(ship,entry.slot));
  if(!powered.length) return 'Mounts offline';
  const supplied=powered.filter(entry=>shipWeaponHasAmmo(ship,entry.weapon));
  if(!supplied.length) return 'Out of ammunition';
  const ready=supplied.filter(entry=>shipWeaponAvailability(ship,entry.slot)==='Ready');
  if(!ready.length){
    const turns=Math.min(...supplied.map(entry=>Math.max(0,(ship.weaponReadyAt[entry.slot]||0)-G.turn)));
    return turns?combatStatusText('Ready in '+turns):'Heat limited';
  }
  if(!ready.some(entry=>shipCombatDistance(enemy,combat.player)<=entry.weapon.range)) return 'Out of range';
  if(!ready.some(entry=>shipCombatWeaponCanReach(combat,enemy,combat.player,entry.weapon))) return 'Shot blocked';
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
  spendShipFuel(2*hullSize());
  G.ship.heat+=heat;
  for(const point of path){
    const collision=shipCombatCollisionAt(combat,point);
    if(collision){
      if(collision.rock)crashShipCombatAsteroid(combat,collision.rock);
      else ramShipCombatEnemy(combat,collision.enemy,true);
      break;
    }
    const damage=moveShipCombatActor(combat,combat.player,point,effectiveEngineRating());
    if(damage) damageShipCombatPlayer(combat,damage,false,'plasma exhaust');
    if(G.dead) break;
  }
  finishShipCombatManeuver(combat,'boost');
}

function advanceShipCombat(combat=G.shipCombat,hitPlayer=false,action='wait'){
  pointerShipCombatAim = null;
  if(!combat || combat!==G.shipCombat){ renderAll(); return; }
  if(action==='wait') G.ship.extraCooling=shipCoolingRate();
  beginCareerTurn(action==='repair'?'repair':'combat');
  finishCareerTurn();
  if(G.dead){ renderAll(); return; }
  // One player pace for this committed turn, even if an early hit damages the drive.
  const referenceEngine=shipDrivePerformance()||1;
  for(const enemy of livingShipCombatEnemies(combat)){
    tickShipSystems(enemy.ship);
    if(shipCombatEnemyShouldReposition(combat,enemy)){
      if(moveShipCombatEnemy(combat,enemy,referenceEngine)==='reset')break;
    } else if(shipCombatEnemyCanFire(combat,enemy)){
      enemy.moveBank=0;
      hitPlayer=fireShipCombatEnemy(combat,enemy)||hitPlayer;
      if(G.dead){ renderAll(); return; }
    } else if(shipCombatEnemyThreat(combat,enemy)){
      enemy.moveBank=0;
      enemy.ship.heat=Math.max(0,enemy.ship.heat-shipCoolingRate(enemy.ship));
    } else if(moveShipCombatEnemy(combat,enemy,referenceEngine)==='reset')break;
    if(G.dead){renderAll();return;}
  }
  advanceShipCombatMissiles(combat);
  if(G.dead){renderAll();return;}
  advanceShipCombatEnvironment(combat);
  if(G.dead){renderAll();return;}
  if(!finishShipCombatIfClear(combat) && !resolveShipCombatStalemate(combat)){
    combat.round++;
    combat.trails=combat.trails.filter(trail=>trail.expires>combat.round);
    syncShipCombatSystems(combat);
  }
  renderAll();
}
