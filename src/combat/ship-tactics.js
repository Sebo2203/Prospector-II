const COMBAT_MAP = { width:27, height:17, x:12, y:42 };
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
  combat.enemies = ships.map((ship,i)=>{
    const collection = shipCombatCollection(ship);
    const [x,y] = positions[i];
    return {ship,collection,x,y,dx:-1,dy:0,
      shields:i===0 ? combat.pirateShields : ship.shields||0,ready:1};
  });
  combat.target = 0;
  combat.weapon = 0;
  combat.weaponReady = [];
  combat.round = 1;
  combat.trails = [];
  combat.asteroids = [];
  combat.logFontSize ??= 12;

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
  const cooldown = (combat.weaponReady[entry.slot]||0)-combat.round;
  if(cooldown>0) return 'Ready in '+cooldown;
  if(!target || shipCombatDistance(combat.player,target)>entry.weapon.range) return 'Out of range';
  if(!shipCombatShotClear(combat,combat.player,target)) return 'Shot blocked';
  return 'Ready';
}

function shipCombatEdge(point){
  return point.x===0 || point.y===0 || point.x===COMBAT_MAP.width-1 || point.y===COMBAT_MAP.height-1;
}

function shipCombatEnemyRange(enemy){
  if(enemy.ship._homeCluster) return 1;
  return enemy.ship.guns===0 ? 0 : 5;
}

function shipCombatEnemyThreat(combat,enemy){
  return shipCombatDistance(enemy,combat.player)<=shipCombatEnemyRange(enemy) &&
    shipCombatShotClear(combat,enemy,combat.player);
}

function shipCombatEnemyCanFire(combat,enemy){
  return combat.round>=enemy.ready && shipCombatEnemyThreat(combat,enemy);
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

function damageShipCombatPlayer(combat,damage){
  const blocked = Math.min(combat.playerShields,damage);
  combat.playerShields -= blocked;
  if(damage>blocked){
    if(!DEBUG.infiniteHull) G.ship.hp = Math.max(0,G.ship.hp-(damage-blocked));
    SFX.hullHit();
  }
  if(G.ship.hp===0){
    G.deathCause = 'The ship was destroyed in combat with '+combat.pirate.name+'.';
    G.dead = true;
    G.shipCombat = null;
    G.mode = 'galaxy';
    addLog('SHIP DESTROYED — game over.','lc');
  }
  return damage-blocked;
}

function damageShipCombatEnemy(combat,enemy,damage){
  const blocked = Math.min(enemy.shields,damage);
  enemy.shields -= blocked;
  const ship = enemy.ship;
  ship.hp = Math.max(0,ship.hp-(damage-blocked));
  if(ship.hp===0){
    ship.alive = false;
    resolveShipCombatKill(combat,enemy);
  }
  return damage-blocked;
}

function moveShipInCombat(dx,dy){
  const combat = G.shipCombat;
  if(!combat || G.dead) return;
  if(G.fuel<=0 && !DEBUG.infiniteFuel){
    addLog('Engines offline. You can still fire or wait.','lw');
    renderAll();
    return;
  }
  const to = {x:combat.player.x+dx,y:combat.player.y+dy};
  if(!shipCombatOpen(combat,to)){
    addLog('That sector is blocked.','lw');
    renderAll();
    return;
  }
  const damage = moveShipCombatActor(combat,combat.player,to,G.shipStats.engineRating||1);
  if(damage){
    const hull = damageShipCombatPlayer(combat,damage);
    if(!G.dead) addLog('Crossed plasma exhaust. '+damage+' damage ('+hull+' hull).','lw');
  }
  advanceShipCombat(combat,damage>0);
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
    addLog(status+'.','lw');
    renderAll();
    return;
  }
  const {weapon,slot} = entry, enemy = combat.enemies[combat.target];
  const chance = shipCombatHitChance(G.shipStats.engineRating||1,enemy.ship.engineRating||1,
    shipCombatDistance(combat.player,enemy));
  combat.weaponReady[slot] = combat.round+weapon.cooldown+1;
  if(Math.random()<chance){
    const damage = weapon.minDmg+rnd(weapon.maxDmg-weapon.minDmg+1);
    const hull = damageShipCombatEnemy(combat,enemy,damage);
    addLog(weapon.name+' hits '+enemy.ship.name+' for '+damage+' ('+hull+' hull).','lc');
  } else {
    addLog(weapon.name+' misses '+enemy.ship.name+'.','li');
  }
  advanceShipCombat(combat);
}

function moveShipCombatEnemy(combat,enemy){
  const fleeing = shipCombatEnemyRange(enemy)===0;
  const score = point=>{
    const goal = fleeing ? Math.min(point.x,point.y,COMBAT_MAP.width-1-point.x,COMBAT_MAP.height-1-point.y) :
      shipCombatDistance(point,combat.player)*2 + 0.1*(Math.abs(point.x-combat.player.x)+Math.abs(point.y-combat.player.y));
    return goal + (shipCombatPlasma(combat,point)?.damage||0)*0.65;
  };
  const next = COMBAT_STEPS.map(([dx,dy])=>({x:enemy.x+dx,y:enemy.y+dy}))
    .filter(point=>shipCombatOpen(combat,point)).sort((a,b)=>score(a)-score(b))[0];
  if(next){
    const damage = moveShipCombatActor(combat,enemy,next,enemy.ship._homeCluster ? 0 : enemy.ship.engineRating||1);
    if(damage){
      addLog(enemy.ship.name+' crosses plasma exhaust ('+damage+' damage).','lc');
      damageShipCombatEnemy(combat,enemy,damage);
    }
  }
  if(fleeing && enemy.ship.alive!==false && shipCombatEdge(enemy)){
    enemy.escaped = true;
    addLog(enemy.ship.name+' flies out of the combat area.','li');
  }
}

function fireShipCombatEnemy(combat,enemy){
  enemy.ready = combat.round+2;
  const ship = enemy.ship;
  const chance = shipCombatHitChance(ship.engineRating||1,G.shipStats.engineRating||1,
    shipCombatDistance(enemy,combat.player));
  let damage = 0;
  for(let gun=0;gun<(ship.guns||1);gun++){
    if(Math.random()<chance) damage += Math.max(1,ship.atk+rnd(4)-2);
  }
  const hull = damage ? damageShipCombatPlayer(combat,damage) : 0;
  if(!G.dead){
    const attack = ship._homeCluster ? ' rams' : ' fires';
    addLog(ship.name+attack+' — '+(damage ? damage+' damage ('+hull+' hull).' : 'miss.'),'lc');
  }
  return damage>0;
}

function advanceShipCombat(combat=G.shipCombat,hitPlayer=false){
  pointerShipCombatAim = null;
  if(!combat || combat!==G.shipCombat){ renderAll(); return; }
  for(const enemy of livingShipCombatEnemies(combat)){
    if(shipCombatEnemyThreat(combat,enemy)){
      if(combat.round<enemy.ready) continue;
      hitPlayer = fireShipCombatEnemy(combat,enemy) || hitPlayer;
      if(G.dead){ renderAll(); return; }
    } else {
      moveShipCombatEnemy(combat,enemy);
    }
  }
  if(!livingShipCombatEnemies(combat).length){
    G.shipCombat = null;
    G.mode = 'galaxy';
    addLog(combat.result?.message||'Combat ended.',combat.result?.cls||'li');
    checkDeath();
  } else {
    updateShipCombatTarget(combat);
    if(!hitPlayer && combat.round%3===0 && combat.playerShields<G.shipStats.shields) combat.playerShields++;
    combat.round++;
    combat.trails = combat.trails.filter(trail=>trail.expires>combat.round);
  }
  renderAll();
}
