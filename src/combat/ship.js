const SHIP_WEAPONS = {
  mass_driver:   { id:'mass_driver',   name:'Mass Driver',       minDmg:6,  maxDmg:12, range:5, cooldown:1, heat:12,power:2,mountSize:1,cost:300, desc:'Light mount. Kinetic slugs, low heat, one-action reload.' },
  railgun:       { id:'railgun',       name:'Railgun',           minDmg:8,  maxDmg:13, range:8, cooldown:2, heat:22,power:4,mountSize:2,cost:450, desc:'Medium mount. Long range, two-action reload.' },
  laser_cannon:  { id:'laser_cannon',  name:'Laser Cannon',      minDmg:13, maxDmg:20, range:6, cooldown:2, heat:28,power:5,mountSize:2,cost:700, desc:'Medium mount. Heavy heat, two-action recharge.' },
  pulse_laser:   { id:'pulse_laser',   name:'Pulse Laser',       minDmg:14, maxDmg:24, range:4, cooldown:1, heat:20,power:3,mountSize:1,cost:800, desc:'Light mount. Short range, one-action recharge.' },
  artemis:       { id:'artemis',       name:'Artemis Launcher',  minDmg:18, maxDmg:30, cost:1200, desc:'Missile system. Requires ammo (not yet implemented).', placeholder:true },
};

// Legacy WEAPONS array — kept for any remaining references, maps to catalog
const WEAPONS = [
  null,
  SHIP_WEAPONS.mass_driver,
  SHIP_WEAPONS.railgun,
  SHIP_WEAPONS.laser_cannon,
  SHIP_WEAPONS.pulse_laser,
];


function ensureNeutralCombatStats(ns){
  if(!ns) return null;
  if(ns.maxHp === undefined){
    const hp = ns.type==='patrol' ? 70 : ns.type==='cargo' ? 60 : ns.type==='trader' ? 45 : 40;
    ns.maxHp = hp; ns.hp = hp;
  }
  if(ns.hp === undefined) ns.hp = ns.maxHp;
  if(ns.atk === undefined) ns.atk = ns.type==='patrol' ? 6 : 2;
  if(ns.engineRating === undefined) ns.engineRating = ns.type==='patrol' ? 3 : (ns.speed??1);
  if(ns.shields === undefined) ns.shields = ns.type==='patrol' ? 1 : 0;
  if(ns.maxShields === undefined) ns.maxShields = ns.shields;
  if(ns.guns === undefined) ns.guns = ns.type==='patrol' ? 1 : 0;
  if(ns.alive === undefined) ns.alive = true;
  return ns;
}

function nearestNeutralTarget(range=1){
  return (G.neutralShips||[])
    .filter(ns=>ns.alive!==false && neutralShipDistance(ns)<=range)
    .sort((a,b)=>neutralShipDistance(a)-neutralShipDistance(b))[0] || null;
}

function harmStationReputation(amount, reason){
  G.stationReputation = (G.stationReputation || 0) - amount;
  if(G.stationReputation <= -40){
    (G.neutralShips||[]).forEach(ns=>{ if(ns.type==='patrol' && ns.alive!==false) ns.hostile = true; });
    addCombatLog('Station patrol broadcasts: "Hostile transponder flagged. Stand down or be fired upon."','lc');
  } else if(reason){
    addCombatLog('Station reputation worsened: '+reason+' ('+G.stationReputation+').','lw');
  }
}

function doFireAtNeutral(ns){
  if(!ns || ns.alive===false) return;
  if(!shipCombatWeapons().length){
    addCombatLog('No ship weapons ready to fire.','lw');
    renderAll();
    return;
  }
  const wasHostile = !!ns.hostile;
  harmStationReputation(ns.type==='patrol' ? 35 : 20, 'attacked '+ns.name);
  if(ns.type==='patrol') ns.hostile = true;
  if((shipSystemStats(ensureNeutralCombatStats(ns)).weaponSlots||0)===0){
    ns.fleeingPlayer=true;ns.fleeFrom={x:G.ship.x,y:G.ship.y};ns.rescuing=false;
  }
  startShipCombat(ns,true);
  ns._wasHostileAtEngagement = wasHostile;
}

function doFireAtBase(base){
  if(!base || base.destroyed) return;
  const ss = G.shipStats || buildShipStats('LIGHT_SCOUT');
  const hasInstalled = (G.installedWeapons||[]).some(id=>id && SHIP_WEAPONS[id] && !SHIP_WEAPONS[id].placeholder);
  if(ss.weaponSlots===0 || !hasInstalled){
    addCombatLog('No weapons to fire at the base.','lw'); return;
  }
  if(effectiveSensorRange()===0){addCombatLog('No sensor lock. Restore sensors before firing.','lw');return;}
  const entry=shipCombatWeapons().find(entry=>shipWeaponAvailability(G.ship,entry.slot)==='Ready');
  if(!entry){addCombatLog('No mount ready: check heat, reloads and core power.','lw');renderAll();return;}
  commitShipWeapon(G.ship,entry.slot);
  const totalDmg=entry.weapon.minDmg+rnd(entry.weapon.maxDmg-entry.weapon.minDmg+1);
  base.hp = Math.max(0, base.hp - totalDmg);
  const pct = Math.round((base.hp/base.maxHp)*100);
  addCombatLog(entry.weapon.name+' hits '+base.name+' for '+totalDmg+' damage! ('+pct+'% integrity remaining)','lg');
  SFX.hullHit && SFX.hullHit();

  if(base.hp <= 0){
    base.destroyed = true;
    // Remove base tile from grid
    if(G.galaxy[base.y] && G.galaxy[base.y][base.x]){
      G.galaxy[base.y][base.x] = { type:'VOID' };
    }
    // Kill all guards from this base
    G.pirates.forEach(p=>{ if(p.alive && p.homeX===base.x && p.homeY===base.y) p.alive=false; });
    earnCredits(3000);
    addCombatLog('*** '+base.name+' DESTROYED! Sector cleared. +3000 cr bonus! ***','lg');
  } else {
    // Base returns fire — turret volley back at player
    const turretDmg = 8 + rnd(18);
    const hull=absorbShipHit(G.ship,turretDmg,'defense turrets');
    addCombatLog('Defense turrets return fire: '+turretDmg+' damage ('+hull+' hull).','lc');
    SFX.hullHit && SFX.hullHit();
    if(G.ship.hp<=0){
      G.dead=true;
      G.deathCause='The ship was destroyed by defense turrets at '+base.name+'.';
    }
  }
  beginCareerTurn();
  moveNeutralShips();
  movePirates();
  moveGasEntities();
  tickNpcStranded();
  finishCareerTurn();
  renderAll();
}

function isPirateSatisfied(pirate){
  return !!(pirate && pirate.satisfiedUntil && G.turn < pirate.satisfiedUntil);
}

const SHIP_DISENGAGEMENT_TURNS = 5;

function shipDisengagementActive(ship){
  return G.turn < (ship.disengagedUntil || 0);
}

function startShipCombat(pirate,initiatedByPlayer=false){
  if(!pirate || G.mode==='shipcombat') return;
  if(!initiatedByPlayer && shipDisengagementActive(pirate)) return;
  if(isPirateSatisfied(pirate)){
    addCombatLog(pirate.name+' keeps its distance. The payoff is still fresh.','li');
    renderAll();
    return;
  }
  const collection = shipCombatCollection(pirate);
  const isNeutralTarget = collection==='neutralShips';
  const nearby = collection==='pirates' || (isNeutralTarget && pirate.type==='patrol')
    ? (G[collection]||[]).filter(ship=>ship!==pirate && ship.alive!==false &&
      (ship.hp??1)>0 && !shipDisengagementActive(ship) && shipCombatDistance(ship,pirate)<=1 &&
      (isNeutralTarget ? ship.type==='patrol' && ship.hostile : !isPirateSatisfied(ship))).slice(0,3)
    : [];
  const ships = [pirate,...nearby];
  if(isNeutralTarget) ships.forEach(ship=>{
    ensureNeutralCombatStats(ship);
    ship._wasHostileAtEngagement = !!ship.hostile;
  });

  const label = ships.length>1 ? pirate.name+' and '+nearby.length+' wingmen close in!' : 'Contact: '+pirate.name+'.';
  G.shipCombat = {
    pirate,isNeutralTarget,
    playerShields:G.shipStats.shields||0,pirateShields:pirate.shields||0,
  };
  createShipCombatArena(G.shipCombat,ships);
  G.examine = null;
  G.mode = 'shipcombat';
  selectReadyShipCombatWeapon(G.shipCombat);
  addCombatLog(label,'lc');
  G.combatsFought = (G.combatsFought||0) + 1;
  trackEvent('ship_combat_started', analyticsBaseParams({
    enemy_name:pirate.name,
    enemy_type:isNeutralTarget ? pirate.type : pirate.pirateType||'pirate',
    neutral_target:isNeutralTarget ? 1 : 0,
  }));
  renderAll();
}

function resolveShipCombatKill(combat,enemy){
  const ship = enemy.ship;
  const report = (message,cls)=>{
    combat.result = {message,cls};
    addCombatLog(message,cls);
  };
  if(enemy.collection==='neutralShips'){
    report(ship.name+' destroyed.','lc');
    if(ship.type==='patrol') ship.lastRespawn = G.turn;
    if(!ship._wasHostileAtEngagement) harmStationReputation(ship.type==='patrol' ? 30 : 20,'destroyed '+ship.name);
  } else if(ship._homeCluster){
    const crystal = makeCommodityItem('nebula_crystal','nebula_combat',COMMODITIES.nebula_crystal.basePrice);
    if(addCargo(crystal)) report(ship.name+' dissipates. Nebula Crystal loaded into cargo.','lg');
    else {
      G.nebulaLoot ??= [];
      G.nebulaLoot.push({x:G.ship.x,y:G.ship.y,item:crystal});
      report(ship.name+' dissipates. A Nebula Crystal drifts at the encounter site.','lg');
    }
    trackEvent('gas_entity_defeated',{entity_name:ship.name,was_massive:ship.isMassive ? 1 : 0});
  } else {
    const loot = 50+rnd(100);
    earnCredits(loot);
    let salvage = ship.name+' destroyed. Salvaged '+loot+' credits.';
    if(combat.foughtWhileStranded && G.fuel<=0){
      const fuel = 2+rnd(4);
      G.fuel = Math.min(G.maxFuel||100,fuel);
      salvage += ' Recovered '+fuel+' fuel. Engines back online.';
    }
    report(salvage,'lg');
  }
}

function getPirateSurrenderTerms(pirate){
  const cargo = G.cargo || [];
  const cargoValue = cargo.reduce((sum,item)=>{
    const com = item?.commodityId ? COMMODITIES[item.commodityId] : null;
    return sum + Math.max(item?.boughtPrice || 0, com?.basePrice || 0);
  }, 0);
  const credits = G.credits || 0;
  const creditTake = Math.min(credits, Math.ceil(credits * 0.5));
  const demand = Math.max(80, Math.round(
    50
    + (pirate?.atk || 4) * 6
    + (pirate?.guns || 1) * 35
    + (pirate?.maxShields || pirate?.shields || 0) * 25
    + (pirate?.engineRating || 2) * 15
    + (pirate?.maxHp || pirate?.hp || 30) * 0.15
  ));
  return { cargoValue, cargoCount:cargo.length, creditTake, demand, offerValue:creditTake + cargoValue };
}

function moveShipAwayFromPirate(pirate){
  if(!pirate) return;
  const threats = [...G.pirates,...(G.gasEntities||[]),...(G.neutralShips||[]).filter(ship=>ship.hostile)];
  const spots = [];
  for(let oy=-1; oy<=1; oy++){
    for(let ox=-1; ox<=1; ox++){
      if(ox===0 && oy===0) continue;
      const nx = G.ship.x + ox, ny = G.ship.y + oy;
      if(nx<0 || nx>=MAP_W || ny<0 || ny>=MAP_H) continue;
      if(G.galaxy[ny][nx].type==='BLACK_HOLE' || threats.some(ship=>ship.alive!==false && ship.x===nx && ship.y===ny)) continue;
      spots.push({x:nx, y:ny, d:Math.abs(nx-pirate.x)+Math.abs(ny-pirate.y)});
    }
  }
  spots.sort((a,b)=>b.d-a.d);
  if(spots.length){ G.ship.x = spots[0].x; G.ship.y = spots[0].y; }
}

function refuseShipSurrender(combat,message){
  addCombatLog(message,'lw');
  advanceShipCombat(combat);
}

function doShipSurrender(){
  if(G.mode!=='shipcombat'||!G.shipCombat) return;
  const sc = G.shipCombat;
  const pirate = sc.pirate;

  // -- GAS ENTITY — mindless, cannot be negotiated with -----------
  if(pirate._homeCluster){
    refuseShipSurrender(sc,pirate.name+' does not respond to surrender.');
    return;
  }

  // -- PATROL SURRENDER — two-step jail flow ----------------------
  if(sc.isNeutralTarget && pirate.type==='patrol'){
    if(!sc.surrenderWarned){
      // First press — warn the player
      sc.surrenderWarned = true;
      addCombatLog('PATROL: "Cut engines and prepare for boarding. Comply or be destroyed."','lw');
      addCombatLog('Patrol demands you stand down. Press [H] again to accept arrest.','lw');
      renderAll();
      return;
    }
    // Second press — jailed, game over
    beginCareerTurn();
    addCombatLog('You surrendered. Boarded, arrested, and taken to the station brig.','lc');
    G.jailed = true;
    G.dead = true;
    G.deathCause = 'You surrendered to '+pirate.name+' and were taken into custody. The crew spent the rest of their days in a station detention block. Your ship was impounded and auctioned.';
    G.shipCombat = null;
    G.mode = 'galaxy';
    finishCareerTurn();
    renderAll();
    return;
  }

  // -- PIRATE SURRENDER — original logic -------------------------
  if(sc.isNeutralTarget){ addCombatLog(sc.pirate.name+': "No deals. Cut engines and stand by."','lw'); renderAll(); return; }
  const terms = getPirateSurrenderTerms(pirate);
  if(terms.offerValue < terms.demand){
    refuseShipSurrender(sc,'Surrender refused. Offer '+terms.offerValue+' cr value, demand '+terms.demand+'.');
    return;
  }

  beginCareerTurn();
  G.credits = Math.max(0, (G.credits||0) - terms.creditTake);
  G.cargo = [];
  for(const {ship} of livingShipCombatEnemies(sc)){
    ship.satisfiedUntil = G.turn + 45;
    ship._chaseTurns = 0;
    ship._gaveUp = 0;
    ship._chaseMoveBank = 0;
    if(ship.pirateType==='roamer') ship.roamTarget = {x:5+rnd(MAP_W-10),y:5+rnd(MAP_H-10)};
  }
  G.shipCombat = null;
  G.mode = 'galaxy';
  addCombatLog('Pirates accepted surrender: -'+terms.creditTake+' cr, cargo hold emptied. They will ignore you for a while.','lw');
  moveShipAwayFromPirate(pirate);
  finishCareerTurn();
  renderAll();
}
function doShipRetreat(){
  const combat = G.shipCombat;
  if(G.mode!=='shipcombat' || !combat) return;
  if(!shipCombatEdge(combat.player)){
    addCombatLog('Reach the edge of the combat map to disengage.','li');
    renderAll();
    return;
  }
  const returningFire=livingShipCombatEnemies(combat).filter(enemy=>shipCombatEnemyCanFire(combat,enemy));
  const underFire=returningFire.length>0;
  beginCareerTurn();
  finishCareerTurn();
  for(const {ship} of livingShipCombatEnemies(combat)) tickShipSystems(ship);
  syncShipCombatSystems(combat);
  if(G.dead){ renderAll(); return; }
  if(underFire){
    for(const enemy of returningFire){
      if(shipCombatEnemyCanFire(combat,enemy)) fireShipCombatEnemy(combat,enemy);
      if(G.dead){ renderAll(); return; }
    }
  }
  for(const {ship} of livingShipCombatEnemies(combat)){
    ship.disengagedUntil=G.turn+1+SHIP_DISENGAGEMENT_TURNS;
  }
  G.shipCombat = null;
  G.mode = 'galaxy';
  moveShipAwayFromPirate(combat.pirate);
  addCombatLog('Disengaged from '+combat.pirate.name+(underFire?' under fire.':'.'),'li');
  renderAll();
}
