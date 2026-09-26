const SHIP_WEAPONS = {
  mass_driver:   { id:'mass_driver',   name:'Mass Driver',       minDmg:6,  maxDmg:12, cost:300,  desc:'Basic kinetic slugs. Reliable and affordable.' },
  railgun:       { id:'railgun',       name:'Railgun',           minDmg:8,  maxDmg:13, cost:450,  desc:'Higher velocity, tighter damage range than a mass driver.' },
  laser_cannon:  { id:'laser_cannon',  name:'Laser Cannon',      minDmg:13, maxDmg:20, cost:700,  desc:'High-energy beam weapon. Consistent damage, no projectile drop-off.' },
  pulse_laser:   { id:'pulse_laser',   name:'Pulse Laser',       minDmg:14, maxDmg:24, cost:800,  desc:'Rapid pulse variant. Heavy damage.' },
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
  if(ns.engineRating === undefined) ns.engineRating = ns.type==='patrol' ? 3 : 1;
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
    addLog('Station patrol broadcasts: "Hostile transponder flagged. Stand down or be fired upon."','lc');
  } else if(reason){
    addLog('Station reputation worsened: '+reason+' ('+G.stationReputation+').','lw');
  }
}

function doFireAtNeutral(ns){
  if(!ns || ns.alive===false) return;
  ensureNeutralCombatStats(ns);
  const ss = G.shipStats || buildShipStats('LIGHT_SCOUT');
  const hasInstalled = (G.installedWeapons||[]).some(id=>id && SHIP_WEAPONS[id] && !SHIP_WEAPONS[id].placeholder);
  if(ss.weaponSlots===0 || !hasInstalled){ addLog('No ship weapons ready to fire.','lw'); renderAll(); return; }
  const wids = (G.installedWeapons||[]).filter(id=>id && SHIP_WEAPONS[id] && !SHIP_WEAPONS[id].placeholder);
  let totalDmg = 0;
  wids.forEach(wid=>{ const w = SHIP_WEAPONS[wid]; totalDmg += w.minDmg + rnd(w.maxDmg - w.minDmg + 1); });
  ns.hp = Math.max(0, ns.hp - totalDmg);
  addLog('You fire on '+ns.name+' for '+totalDmg+' hull damage.','lc');
  harmStationReputation(ns.type==='patrol' ? 35 : 20, 'attacked '+ns.name);
  if(ns.type==='patrol') ns.hostile = true;
  if(ns.hp<=0){
    ns.alive = false;
    if(ns.type==='patrol') ns.lastRespawn = G.turn; // start respawn timer from now
    addLog(ns.name+' destroyed. Station authorities mark the attack.','lc');
    harmStationReputation(ns.type==='patrol' ? 30 : 20, 'destroyed '+ns.name);
  } else if(ns.type!=='patrol'){
    addLog(ns.name+': "Cease fire! We are unarmed!"','lw');
  }
  G.turn++;
  moveNeutralShips();
  movePirates();
  moveGasEntities();
  tickNpcStranded();
  renderAll();
}
function doFireAtBase(base){
  if(!base || base.destroyed) return;
  const ss = G.shipStats || buildShipStats('LIGHT_SCOUT');
  const hasInstalled = (G.installedWeapons||[]).some(id=>id && SHIP_WEAPONS[id] && !SHIP_WEAPONS[id].placeholder);
  if(ss.weaponSlots===0 || !hasInstalled){
    addLog('No weapons to fire at the base.','lw'); return;
  }
  // Each weapon slot fires once — total volley
  let totalDmg = 0;
  const wids = (G.installedWeapons||[]).filter(id=>id && SHIP_WEAPONS[id] && !SHIP_WEAPONS[id].placeholder);
  wids.forEach(wid=>{
    const w = SHIP_WEAPONS[wid];
    const dmg = w.minDmg + rnd(w.maxDmg - w.minDmg + 1);
    totalDmg += dmg;
  });
  base.hp = Math.max(0, base.hp - totalDmg);
  const pct = Math.round((base.hp/base.maxHp)*100);
  addLog('Volley hits '+base.name+' for '+totalDmg+' damage! ('+pct+'% integrity remaining)','ll');
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
    addLog('*** '+base.name+' DESTROYED! Sector cleared. +3000 cr bonus! ***','lg');
  } else {
    // Base returns fire — turret volley back at player
    const turretDmg = 8 + rnd(18);
    if(!DEBUG.infiniteHull) G.ship.hp = Math.max(0, G.ship.hp - turretDmg);
    addLog('Defense turrets return fire: '+turretDmg+' hull damage!','lc');
    SFX.hullHit && SFX.hullHit();
    if(G.ship.hp<=0){
      G.dead=true;
      G.deathCause='The ship was destroyed by defense turrets at '+base.name+'.';
    }
  }
  G.turn++;
  moveNeutralShips();
  movePirates();
  moveGasEntities();
  tickNpcStranded();
  renderAll();
}

function isPirateSatisfied(pirate){
  return !!(pirate && pirate.satisfiedUntil && G.turn < pirate.satisfiedUntil);
}

function startShipCombat(pirate){
  if(isPirateSatisfied(pirate)){
    addLog(pirate.name+' keeps its distance. The payoff is still fresh.','li');
    renderAll();
    return;
  }
  const isNeutralTarget = !!(pirate && pirate.type && !pirate.pirateType);
  if(isNeutralTarget){
    ensureNeutralCombatStats(pirate);
    if(pirate.type==='patrol') pirate._wasHostileAtEngagement = !!pirate.hostile;
  }
  const ss = G.shipStats || buildShipStats('LIGHT_SCOUT');
  const label = isNeutralTarget ? pirate.name+' intercepts!' : 'Pirate ship '+pirate.name+' intercepts!';
  G.shipCombat = {
    pirate:       pirate,
    isNeutralTarget,
    log:          [label],
    phase:        'player',
    lastResult:   '',
    playerShields: ss.shields,           // current player shield HP
    pirateShields: pirate.shields || 0,  // current target shield HP
  };
  G.mode = 'shipcombat';
  G.combatsFought = (G.combatsFought||0) + 1;
  trackEvent('ship_combat_started', analyticsBaseParams({
    enemy_name: pirate?.name || 'unknown',
    enemy_type: isNeutralTarget ? (pirate?.type || 'neutral') : (pirate?.pirateType || 'pirate'),
    neutral_target: isNeutralTarget ? 1 : 0,
  }));
  addLog((isNeutralTarget?'INTERCEPTED by ':'INTERCEPTED by ')+pirate.name+'! Prepare for combat!','lc');
  renderAll();
}

function doShipFire(){
  if(G.mode!=='shipcombat'||!G.shipCombat) return;
  const ss = G.shipStats || buildShipStats('LIGHT_SCOUT');
  const hasInstalled = (G.installedWeapons||[]).some(id=>id && SHIP_WEAPONS[id] && !SHIP_WEAPONS[id].placeholder);
  if(ss.weaponSlots === 0 || !hasInstalled){
    addLog(ss.weaponSlots===0 ? 'This ship has no weapon slots.' : 'No weapons installed. Visit the hangar.','lw');
    renderAll(); return;
  }
  const sc = G.shipCombat;
  const pirate = sc.pirate;
  const w = WEAPONS[G.weaponLevel]||WEAPONS[1];

  // -- Miss chance ------------------------------------------------
  // Hit chance = 85% base, +5% per player engine above 1, -10% per pirate engine above 1
  function hitChance(attackerEngine, defenderEngine){
    return Math.max(0.15, Math.min(0.98, 0.85 + (attackerEngine-1)*0.05 - (defenderEngine-1)*0.10));
  }
  const playerEngine = ss.engineRating;
  const pirateEngine = pirate.engineRating || 2;

  // -- Player fires all installed weapons ------------------------
  const installedIds = (G.installedWeapons||[]).filter(id=>id && SHIP_WEAPONS[id]);
  let outLog = '';
  let totalDmgOut = 0;

  if(installedIds.length === 0){
    outLog = 'No weapons installed!';
  } else {
    const shotResults = [];
    installedIds.forEach(wid => {
      const wdef = SHIP_WEAPONS[wid];
      if(wdef.placeholder){ shotResults.push(wdef.name+': no ammo (not implemented)'); return; }
      const hits = Math.random() < hitChance(playerEngine, pirateEngine);
      if(hits){
        let dmg = wdef.minDmg + rnd(wdef.maxDmg - wdef.minDmg + 1);
        let absorbed = 0;
        if(sc.pirateShields > 0){
          absorbed = Math.min(sc.pirateShields, dmg);
          sc.pirateShields = Math.max(0, sc.pirateShields - absorbed);
          dmg -= absorbed;
        }
        pirate.hp = Math.max(0, pirate.hp - dmg);
        totalDmgOut += dmg;
        let r = wdef.name+' hit';
        if(absorbed > 0) r += ' (shld -'+absorbed+')';
        if(dmg > 0) r += ' +'+dmg+' dmg';
        else r += ' blocked';
        shotResults.push(r);
      } else {
        shotResults.push(wdef.name+' MISS');
      }
    });
    outLog = 'You fire: '+shotResults.join('  |  ')+'.'
      + (totalDmgOut > 0 ? '  Total: '+totalDmgOut+' hull dmg.' : '');
  }

  // -- Pirate fires back — one roll per gun ----------------------
  let inLog = '';
  const pirateGuns = pirate.guns || 1;
  const shotsFired = [];
  let totalDmgIn = 0;
  let anyHit = false;

  for(let g = 0; g < pirateGuns; g++){
    const hits = Math.random() < hitChance(pirateEngine, playerEngine);
    if(hits){
      anyHit = true;
      let dmg = Math.max(1, pirate.atk + rnd(4) - 2);
      let shieldAbsorb = 0;
      if(sc.playerShields > 0){
        shieldAbsorb = Math.min(sc.playerShields, dmg);
        sc.playerShields = Math.max(0, sc.playerShields - shieldAbsorb);
        dmg -= shieldAbsorb;
      }
      if(!DEBUG.infiniteHull) G.ship.hp = Math.max(0, G.ship.hp - dmg);
      if(dmg > 0) SFX.hullHit();
      totalDmgIn += dmg;
      let r = 'hit';
      if(shieldAbsorb > 0) r += ' (shld -'+shieldAbsorb+')';
      if(dmg > 0) r += ' +'+dmg+' dmg';
      else r += ' blocked';
      shotsFired.push(r);
    } else {
      shotsFired.push('MISS');
    }
  }

  if(pirateGuns > 1){
    inLog = 'They fire (×'+pirateGuns+'): '+shotsFired.join(' | ')+'.'      + (totalDmgIn > 0 ? '  Total: '+totalDmgIn+' hull dmg.' : '');
  } else {
    // Gas entities use ramming/devouring flavour text instead of "fire"
    const isGasEntity = !!(sc.pirate && sc.pirate._homeCluster);
    if(isGasEntity){
      const RAM_VERBS = [
        'rams the hull',
        'surges through the hull plating',
        'attempts to devour the ship',
        'engulfs the hull in corrosive gas mass',
        'slams into the hull with its full body',
        'dissolves against the outer plating',
      ];
      const verb = RAM_VERBS[rnd(RAM_VERBS.length)];
      inLog = anyHit
        ? 'The '+sc.pirate.name+' '+verb+'. '+shotsFired[0]+'.'
        : 'The '+sc.pirate.name+' '+verb+'. MISS.';
    } else {
      inLog = anyHit
        ? 'They fire — '+shotsFired[0]+'.'
        : 'They fire — MISS.';
    }
  }

  let playerShieldRegenned = false;
  if(!anyHit){
    // Shield regen on no-hit turn (40% chance per shield point missing)
    const maxSh = ss.shields || 0;
    if(sc.playerShields < maxSh && Math.random() < 0.4){
      sc.playerShields = Math.min(maxSh, sc.playerShields + 1);
      inLog += ' Shield recharging (+1).';
      playerShieldRegenned = true;
    }
    // Pirate shield regen too
    if(sc.pirateShields < (pirate.maxShields||0) && Math.random() < 0.4){
      sc.pirateShields = Math.min(pirate.maxShields, sc.pirateShields + 1);
    }
  }

  // Push this turn: outLog first so inLog (their shot, most recent) ends up on top
  sc.log.unshift(outLog);
  sc.log.unshift(inLog);
  if(sc.log.length > 10) sc.log.length = 10;
  // Mirror to G.log so the LOG tab captures full combat detail
  archiveLog('['+sc.pirate.name+'] '+outLog, 'lc');
  archiveLog('['+sc.pirate.name+'] '+inLog, totalDmgIn>0 ? 'lc' : 'li');

  if(pirate.hp <= 0){
    pirate.alive = false;
    const sidebarVictoryLogs = [];
    if(sc.isNeutralTarget && pirate.type==='patrol') pirate.lastRespawn = G.turn;
    if(sc.isNeutralTarget){
      sc.log.unshift(pirate.name+' destroyed.');
      addLog(pirate.name+' destroyed.','lc');
      if(pirate.type==='patrol' && !pirate._wasHostileAtEngagement) harmStationReputation(30, 'destroyed '+pirate.name);
    } else if(pirate._homeCluster){
      // Gas entity killed, drops a nebula crystal at the combat site
      const crystal = makeCommodityItem('nebula_crystal', 'nebula_combat', COMMODITIES.nebula_crystal.basePrice);
      const canStore = addCargo(crystal);
      let crystalMsg;
      if(canStore){
        crystalMsg = 'The '+pirate.name+' dissipates! A dense Nebula Crystal crystallises, loaded into cargo.';
      } else {
        // Cargo full — leave the crystal floating at the combat tile for later retrieval
        if(!G.nebulaLoot) G.nebulaLoot = [];
        G.nebulaLoot.push({ x: G.ship.x, y: G.ship.y, item: crystal });
        crystalMsg = 'The '+pirate.name+' dissipates! A Nebula Crystal forms but your cargo hold is full. It drifts at your coordinates. Return to collect it.';
      }
      sc.log.unshift(crystalMsg);
      sidebarVictoryLogs.push({ msg: crystalMsg, cls: canStore ? 'lg' : 'lw' });
      trackEvent('gas_entity_defeated', { entity_name: pirate.name, was_massive: pirate.isMassive ? 1 : 0 });
    } else {
      const loot = 50 + rnd(100);
      earnCredits(loot);
      sc.log.unshift(pirate.name+' destroyed! Salvaged '+loot+' credits.');
      sidebarVictoryLogs.push({ msg:pirate.name+' destroyed! +'+loot+' cr.', cls:'lg' });
      // If combat started while stranded, scavenge a small amount of fuel from the wreck
      if(sc.foughtWhileStranded){
        const fuelFound = 2 + rnd(4); // 2-5 units
        G.fuel = Math.min(G.maxFuel || 100, (G.fuel || 0) + fuelFound);
        sidebarVictoryLogs.push({ msg:'Salvaged '+fuelFound+' units of fuel from the wreck. Engines back online.', cls:'lg' });
      }
    }
    G.shipCombat = null;
    G.mode = 'galaxy';
    sidebarVictoryLogs.forEach(entry=>addLog(entry.msg, entry.cls));
    checkDeath();
    renderAll();
    return;
  }
  if(G.ship.hp <= 0){
    sc.log.unshift('Hull breach — ship destroyed!');
    G.deathCause = 'The ship was destroyed by '+pirate.name+'.';
    addLog('SHIP DESTROYED — game over.','lc');
    G.dead = true;
    G.shipCombat = null;
    G.mode = 'galaxy';
    renderAll();
    return;
  }
  renderAll();
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
  const spots = [];
  for(let oy=-1; oy<=1; oy++){
    for(let ox=-1; ox<=1; ox++){
      if(ox===0 && oy===0) continue;
      const nx = G.ship.x + ox, ny = G.ship.y + oy;
      if(nx<0 || nx>=MAP_W || ny<0 || ny>=MAP_H) continue;
      if(G.pirates.some(p=>p!==pirate && p.alive && p.x===nx && p.y===ny)) continue;
      spots.push({x:nx, y:ny, d:Math.abs(nx-pirate.x)+Math.abs(ny-pirate.y)});
    }
  }
  spots.sort((a,b)=>b.d-a.d);
  if(spots.length){ G.ship.x = spots[0].x; G.ship.y = spots[0].y; }
}

function pirateTakesSurrenderShot(sc){
  const pirate = sc.pirate;
  const ss = G.shipStats || buildShipStats('LIGHT_SCOUT');
  const hitChance = Math.max(0.15, Math.min(0.98, 0.85 + ((pirate.engineRating||2)-1)*0.05 - ((ss.engineRating||1)-1)*0.10));
  const shots = [];
  let anyHit = false;
  let totalDmg = 0;
  for(let g=0; g<(pirate.guns||1); g++){
    if(Math.random() < hitChance){
      anyHit = true;
      let dmg = Math.max(1, pirate.atk + rnd(4) - 2);
      let shieldAbsorb = 0;
      if(sc.playerShields > 0){
        shieldAbsorb = Math.min(sc.playerShields, dmg);
        sc.playerShields = Math.max(0, sc.playerShields - shieldAbsorb);
        dmg -= shieldAbsorb;
      }
      if(!DEBUG.infiniteHull) G.ship.hp = Math.max(0, G.ship.hp - dmg);
      if(dmg > 0) SFX.hullHit();
      totalDmg += dmg;
      shots.push('hit'+(shieldAbsorb>0?' (shld -'+shieldAbsorb+')':'')+(dmg>0?' +'+dmg+' dmg':' blocked'));
    } else {
      shots.push('MISS');
    }
  }
  const log = anyHit
    ? 'They reject surrender and fire: '+shots.join(' | ')+'.'+(totalDmg>0?' Total: '+totalDmg+' hull dmg.':'')
    : 'They reject surrender and fire: MISS.';
  sc.log.unshift(log);
  addLog('Surrender refused! Took '+totalDmg+' damage.','lw');
  if(sc.log.length > 10) sc.log.length = 10;
  if(G.ship.hp<=0){
    G.deathCause='The ship was destroyed after '+pirate.name+' refused surrender.';
    addLog('SHIP DESTROYED.','lc');
    G.dead=true; G.shipCombat=null; G.mode='galaxy';
  }
}

function doShipSurrender(){
  if(G.mode!=='shipcombat'||!G.shipCombat) return;
  const sc = G.shipCombat;
  const pirate = sc.pirate;

  // -- GAS ENTITY — mindless, cannot be negotiated with -----------
  if(pirate._homeCluster){
    sc.log.unshift('The '+pirate.name+' has no mind to bargain with. It surges forward hungrily.');
    addLog('The '+pirate.name+' cannot be surrendered to. It only wants to consume.','lw');
    // Still deals a ramming shot for trying
    pirateTakesSurrenderShot(sc);
    if(sc.log.length > 10) sc.log.length = 10;
    renderAll();
    return;
  }

  // -- PATROL SURRENDER — two-step jail flow ----------------------
  if(sc.isNeutralTarget && pirate.type==='patrol'){
    if(!sc.surrenderWarned){
      // First press — warn the player
      sc.surrenderWarned = true;
      sc.log.unshift('PATROL: "Cut engines and prepare for boarding. Comply or be destroyed."');
      sc.log.unshift('Surrendering to station patrol means arrest. Press [S] again to comply.');
      addLog('Patrol demands you stand down. Press [S] again to accept arrest.','lw');
      if(sc.log.length > 10) sc.log.length = 10;
      renderAll();
      return;
    }
    // Second press — jailed, game over
    addLog('You surrendered. Boarded, arrested, and taken to the station brig.','lc');
    G.jailed = true;
    G.dead = true;
    G.deathCause = 'You surrendered to '+pirate.name+' and were taken into custody. The crew spent the rest of their days in a station detention block. Your ship was impounded and auctioned.';
    G.shipCombat = null;
    G.mode = 'galaxy';
    renderAll();
    return;
  }

  // -- PIRATE SURRENDER — original logic -------------------------
  if(sc.isNeutralTarget){ addLog(sc.pirate.name+': "No deals. Cut engines and stand by."','lw'); renderAll(); return; }
  const terms = getPirateSurrenderTerms(pirate);
  if(terms.offerValue < terms.demand){
    sc.log.unshift('Surrender refused. Offer '+terms.offerValue+' cr value, demand '+terms.demand+'.');
    pirateTakesSurrenderShot(sc);
    renderAll();
    return;
  }

  G.credits = Math.max(0, (G.credits||0) - terms.creditTake);
  G.cargo = [];
  pirate.satisfiedUntil = G.turn + 45;
  pirate._chaseTurns = 0;
  pirate._gaveUp = 0;
  pirate._chaseMoveBank = 0;
  if(pirate.pirateType==='roamer') pirate.roamTarget = { x:5+rnd(MAP_W-10), y:5+rnd(MAP_H-10) };
  sc.log.unshift('Surrender accepted. Lost '+terms.creditTake+' cr and '+terms.cargoCount+' cargo.');
  G.shipCombat = null;
  G.mode = 'galaxy';
  addLog('Pirates accepted surrender: -'+terms.creditTake+' cr, cargo hold emptied. They will ignore you for a while.','lw');
  moveShipAwayFromPirate(pirate);
  renderAll();
}
function doShipRetreat(){
  if(G.mode!=='shipcombat'||!G.shipCombat) return;
  const sc=G.shipCombat;
  const ss = G.shipStats || buildShipStats('LIGHT_SCOUT');
  const eng = ss.engineRating || 1;
  // Engine rating affects retreat: cost = max(5, 12 - eng*2), success = 35% + eng*15%
  let retreatCost = Math.max(5, 12 - eng*2);
  let retreatChance = Math.min(0.95, 0.35 + eng*0.15);
  // Gas entity: nebula drag doubles fuel cost and cuts retreat chance
  const isGasEntity = !!(sc.pirate && sc.pirate._homeCluster);
  if(isGasEntity){
    retreatCost = retreatCost * 2;
    retreatChance = Math.max(0.10, retreatChance - 0.25);
  }
  if(G.fuel<retreatCost){ addLog('Not enough fuel to retreat! (Need '+retreatCost+')','lw'); renderAll(); return; }
  if(!DEBUG.infiniteFuel) G.fuel = Math.max(0, G.fuel-retreatCost);
  if(Math.random()<retreatChance){
    const escMsg = isGasEntity
      ? 'Escaped the '+sc.pirate.name+'! The nebula drag burned '+retreatCost+' fuel tearing free.'
      : 'Retreat successful! Burned '+retreatCost+' fuel escaping.';
    sc.log.unshift(escMsg);
    addLog('Escaped from '+sc.pirate.name+'.','li');
    G.shipCombat=null;
    G.mode='galaxy';
    const dx=G.ship.x-sc.pirate.x, dy=G.ship.y-sc.pirate.y;
    const nx=Math.max(0,Math.min(MAP_W-1, G.ship.x+(dx>0?1:-1)));
    const ny=Math.max(0,Math.min(MAP_H-1, G.ship.y+(dy>0?1:-1)));
    G.ship.x=nx; G.ship.y=ny;
  } else {
    let dmg = Math.max(0, sc.pirate.atk + rnd(6));
    let shieldAbsorb = 0;
    if(sc.playerShields > 0){
      shieldAbsorb = Math.min(sc.playerShields, dmg);
      sc.playerShields = Math.max(0, sc.playerShields - shieldAbsorb);
      dmg -= shieldAbsorb;
    }
    if(!DEBUG.infiniteHull) G.ship.hp = Math.max(0, G.ship.hp - dmg);
    if(dmg > 0) SFX.hullHit();
    const retreatMsg = isGasEntity
      ? 'Retreat failed! The '+sc.pirate.name+' surges around the hull'
        + (shieldAbsorb > 0 ? ', shield absorbed '+shieldAbsorb+',' : ',')
        + ' '+dmg+' damage.'
      : 'Retreat failed! Pirate fires as you flee'
        + (shieldAbsorb > 0 ? ' — shield absorbed '+shieldAbsorb+',' : ' —')
        + ' '+dmg+' damage.';
    sc.log.unshift(retreatMsg);
    addLog('Retreat failed! Took '+dmg+' damage.','lw');
    if(sc.log.length>6) sc.log.pop();
    if(G.ship.hp<=0){
      G.deathCause='The ship was destroyed fleeing from '+sc.pirate.name+'.';
      addLog('SHIP DESTROYED.','lc');
      G.dead=true; G.shipCombat=null; G.mode='galaxy';
    }
  }
  renderAll();
}

// -- Draw ship combat overlay -------------------------------------
function drawShipCombatOverlay(){
  const sc=G.shipCombat;
  if(!sc) return;
  const cw=canvas.width, ch=canvas.height;  // 960 × 480

  ctx.fillStyle='rgba(5,2,12,0.96)'; ctx.fillRect(0,0,cw,ch);

  // Title
  ctx.textAlign='center';
  ctx.font='bold 15px Courier New'; ctx.fillStyle='#f07070';
  ctx.fillText('— SHIP COMBAT —', cw/2, 20);
  ctx.fillStyle='#2a1111'; ctx.fillRect(0,26,cw,1);

  const PAD=10, PANEL_W=310, PANEL_Y=32, BTN_H=34;
  const lx=PAD, rx=cw-PAD-PANEL_W;
  const ss = G.shipStats || buildShipStats('LIGHT_SCOUT');
  const installedIds = (G.installedWeapons||[]).filter(id=>id && SHIP_WEAPONS[id]);
  const hasWeapon = installedIds.length > 0;
  const weaponLabel = hasWeapon
    ? installedIds.map(id=>SHIP_WEAPONS[id].name).join(' + ')
    : 'NONE — unarmed';
  const playerShields = sc.playerShields ?? ss.shields;
  const pirateShields = sc.pirateShields ?? 0;
  const pirate = sc.pirate;

  // ── helpers ───────────────────────────────────────────────────
  function hullBar(x,y,bw,hp,maxHp,fc,ec){
    ctx.fillStyle=ec; ctx.fillRect(x,y,bw,9);
    ctx.fillStyle=fc; ctx.fillRect(x,y,Math.round(bw*(hp/maxHp)),9);
  }
  function shieldPips(x,y,cur,max,ac,ec,bc){
    for(let s=0;s<max;s++){
      ctx.fillStyle=s<cur?ac:ec; ctx.fillRect(x+s*15,y,12,7);
      ctx.strokeStyle=bc; ctx.lineWidth=1; ctx.strokeRect(x+s*15,y,12,7);
    }
  }

  // ── measure panel content to set height ───────────────────────
  // Fixed rows: title(18) weapon(16) engine+shields(16) bar(9) [pips(11)?] hull(16) name(14) = ~90 or 101
  const PANEL_H = 148 + (ss.shields>0||(pirate.maxShields||0)>0 ? 18 : 0);

  // ── PLAYER PANEL ──────────────────────────────────────────────
  ctx.fillStyle='#06121e'; ctx.fillRect(lx,PANEL_Y,PANEL_W,PANEL_H);
  ctx.strokeStyle='#1a3a6a'; ctx.lineWidth=1; ctx.strokeRect(lx,PANEL_Y,PANEL_W,PANEL_H);
  let py = PANEL_Y+16;
  ctx.textAlign='left';
  ctx.font='bold 13px Courier New'; ctx.fillStyle='#aaddff';
  ctx.fillText('YOUR SHIP  —  '+ss.hullType, lx+PAD, py); py+=17;
  ctx.font='12px Courier New'; ctx.fillStyle='#5577aa';
  ctx.fillText('Weapon: '+weaponLabel, lx+PAD, py); py+=16;
  ctx.fillStyle='#445566';
  ctx.fillText('Engine: '+ss.engineRating+'   Shields: '+playerShields+' / '+ss.shields, lx+PAD, py); py+=16;
  hullBar(lx+PAD, py, PANEL_W-PAD*2, G.ship.hp, G.ship.maxHp,
    G.ship.hp/G.ship.maxHp<0.3?'#ff3333':G.ship.hp/G.ship.maxHp<0.6?'#ffaa00':'#2288dd', '#0d1e2e');
  py += ss.shields>0 ? 18 : 28;
  if(ss.shields>0){ shieldPips(lx+PAD,py,playerShields,ss.shields,'#44aaff','#0a1525','#1e3a5a'); py+=18; }
  ctx.font='12px Courier New'; ctx.fillStyle='#8899bb';
  ctx.fillText('Hull: '+G.ship.hp+' / '+G.ship.maxHp, lx+PAD, py); py+=18;
  ctx.font='10px Courier New'; ctx.fillStyle='#223344';
  ctx.fillText(G.shipName||'', lx+PAD, py);
  drawSprite(ss.sprite || 'player_ship', lx+PANEL_W-32, PANEL_Y+PANEL_H-32, '#3366aa');

  // ── VS ────────────────────────────────────────────────────────
  ctx.textAlign='center';
  ctx.font='bold 18px Courier New'; ctx.fillStyle='#cc4422';
  ctx.fillText('VS', cw/2, PANEL_Y+PANEL_H/2+6);

  // ── PIRATE PANEL ──────────────────────────────────────────────
  const isDevourer = sc.isDevourer;
  ctx.fillStyle= isDevourer ? '#030d10' : '#130606';
  ctx.fillRect(rx,PANEL_Y,PANEL_W,PANEL_H);
  ctx.strokeStyle= isDevourer ? '#0d5a50' : '#6a1a1a';
  ctx.lineWidth=1; ctx.strokeRect(rx,PANEL_Y,PANEL_W,PANEL_H);
  let ry = PANEL_Y+16;
  ctx.textAlign='left';
  ctx.font='bold 13px Courier New';
  ctx.fillStyle= isDevourer ? '#44ffcc' : '#ff9977';
  ctx.fillText(pirate.name.toUpperCase(), rx+PAD, ry); ry+=18;
  ctx.font='12px Courier New';
  ctx.fillStyle= isDevourer ? '#2a8877' : '#775544';
  if(isDevourer){
    ctx.fillText('Attack: RAMMING / DEVOURING', rx+PAD, ry); ry+=14;
    ctx.fillStyle='#1a6655';
    ctx.fillText('Dmg: '+(pirate.atk)+'-'+(pirate.atk+5)
      +'   Entity: GAS FORM   Hull: '+pirate.hp+'/'+pirate.maxHp, rx+PAD, ry); ry+=16;
  } else {
    ctx.fillText('Atk: '+pirate.atk+'–'+(pirate.atk+3)
      +'   Engine: '+(pirate.engineRating||2)
      +'   Shields: '+pirateShields+'/'+(pirate.maxShields||0)
      +'   Guns: '+(pirate.guns||1), rx+PAD, ry); ry+=16;
  }
  hullBar(rx+PAD, ry, PANEL_W-PAD*2, pirate.hp, pirate.maxHp,
    isDevourer
      ? (pirate.hp/pirate.maxHp<0.3?'#00eeaa':pirate.hp/pirate.maxHp<0.6?'#00aa88':'#006655')
      : (pirate.hp/pirate.maxHp<0.3?'#ff2200':pirate.hp/pirate.maxHp<0.6?'#cc4400':'#882200'),
    isDevourer ? '#001510' : '#200a0a');
  ry += (pirate.maxShields||0)>0 ? 18 : 28;
  if((pirate.maxShields||0)>0){ shieldPips(rx+PAD,ry,pirateShields,pirate.maxShields,'#cc3311','#180808','#5a1a1a'); ry+=18; }
  if(!isDevourer){
    ctx.font='12px Courier New'; ctx.fillStyle='#aa8877';
    ctx.fillText('Hull: '+pirate.hp+' / '+pirate.maxHp, rx+PAD, ry);
    drawSprite('pirate_ship', rx+PANEL_W-32, PANEL_Y+PANEL_H-32, '#882200');
  } else {
    // Draw the procedural devourer sprite in the panel corner
    DRAW.nebula_devourer(ctx, rx+PANEL_W-28, PANEL_Y+PANEL_H-28);
  }

  // ── COMBAT LOG ────────────────────────────────────────────────
  // Newest at top, oldest at bottom — log array is already newest-first
  const logY = PANEL_Y+PANEL_H+8;
  const logH  = ch - logY - BTN_H - 10;
  ctx.fillStyle='#04040c'; ctx.fillRect(lx,logY,cw-PAD*2,logH);
  ctx.strokeStyle='#14142a'; ctx.lineWidth=1; ctx.strokeRect(lx,logY,cw-PAD*2,logH);

  // Font size controls — [−] [+] in top-right corner of log box
  const logFontSize = Math.max(9, Math.min(16, sc.logFontSize || 12));
  sc.logFontSize = logFontSize; // normalise on first draw
  const szBtnW=22, szBtnH=16, szBtnY=logY+4;
  const szBtnMinus = { x: cw-PAD*2-szBtnW*2-6, y: szBtnY, w: szBtnW, h: szBtnH };
  const szBtnPlus  = { x: cw-PAD*2-szBtnW-2,   y: szBtnY, w: szBtnW, h: szBtnH };
  sc._logFontBtnRects = [szBtnMinus, szBtnPlus];

  // Draw minus button
  const canDecrease = logFontSize > 9;
  ctx.fillStyle = canDecrease ? '#0e0e22' : '#080810';
  ctx.fillRect(szBtnMinus.x, szBtnMinus.y, szBtnMinus.w, szBtnMinus.h);
  ctx.strokeStyle = canDecrease ? '#2a2a55' : '#14141e'; ctx.lineWidth=1;
  ctx.strokeRect(szBtnMinus.x, szBtnMinus.y, szBtnMinus.w, szBtnMinus.h);
  ctx.font='bold 12px Courier New'; ctx.textAlign='center';
  ctx.fillStyle = canDecrease ? '#7777bb' : '#2a2a44';
  ctx.fillText('−', szBtnMinus.x + szBtnMinus.w/2, szBtnMinus.y + 12);

  // Draw plus button
  const canIncrease = logFontSize < 16;
  ctx.fillStyle = canIncrease ? '#0e0e22' : '#080810';
  ctx.fillRect(szBtnPlus.x, szBtnPlus.y, szBtnPlus.w, szBtnPlus.h);
  ctx.strokeStyle = canIncrease ? '#2a2a55' : '#14141e'; ctx.lineWidth=1;
  ctx.strokeRect(szBtnPlus.x, szBtnPlus.y, szBtnPlus.w, szBtnPlus.h);
  ctx.font='bold 12px Courier New';
  ctx.fillStyle = canIncrease ? '#7777bb' : '#2a2a44';
  ctx.fillText('+', szBtnPlus.x + szBtnPlus.w/2, szBtnPlus.y + 12);

  // Size label between buttons
  ctx.font='10px Courier New'; ctx.fillStyle='#33334a';
  ctx.fillText(logFontSize+'px', szBtnMinus.x - 24, szBtnY + 11);

  // Log lines
  const lineH = Math.round(logFontSize * 1.4);
  const maxLines = Math.floor((logH - 8) / lineH);
  ctx.font = logFontSize+'px Courier New'; ctx.textAlign='left';
  sc.log.slice(0, maxLines).forEach((line, i) => {
    ctx.fillStyle = i===0 ? '#dddddd' : i===1 ? '#8899aa' : '#445566';
    ctx.fillText(line, lx+PAD, logY+lineH+i*lineH);
  });

  // ── BUTTONS ───────────────────────────────────────────────────
  const btnY=ch-BTN_H-4, btnW=180, btnGap=8;
  const btn1x=cw/2-(btnW*3+btnGap*2)/2, btn2x=btn1x+btnW+btnGap, btn3x=btn2x+btnW+btnGap;
  if(hasWeapon){
    ctx.fillStyle='#160808'; ctx.fillRect(btn1x,btnY,btnW,BTN_H);
    ctx.strokeStyle='#aa2211'; ctx.lineWidth=1; ctx.strokeRect(btn1x,btnY,btnW,BTN_H);
    ctx.font='bold 13px Courier New'; ctx.textAlign='center'; ctx.fillStyle='#ff5533';
    ctx.fillText('[F]  FIRE  '+weaponLabel, btn1x+btnW/2, btnY+22);
  } else {
    ctx.fillStyle='#0c0c0c'; ctx.fillRect(btn1x,btnY,btnW,BTN_H);
    ctx.strokeStyle='#2a1111'; ctx.lineWidth=1; ctx.strokeRect(btn1x,btnY,btnW,BTN_H);
    ctx.font='bold 12px Courier New'; ctx.textAlign='center'; ctx.fillStyle='#3a1a1a';
    ctx.fillText('NO WEAPONS', btn1x+btnW/2, btnY+22);
  }
  ctx.fillStyle='#060c18'; ctx.fillRect(btn2x,btnY,btnW,BTN_H);
  ctx.strokeStyle='#1a3377'; ctx.lineWidth=1; ctx.strokeRect(btn2x,btnY,btnW,BTN_H);
  ctx.font='bold 13px Courier New'; ctx.textAlign='center'; ctx.fillStyle='#4466aa';
  const retreatFuel = Math.max(5, 12 - ((G.shipStats?.engineRating||1)*2));
  ctx.fillText('[R]  RETREAT  (-'+retreatFuel+' fuel)', btn2x+btnW/2, btnY+22);

  const terms = getPirateSurrenderTerms(sc.pirate);
  const isPatrolCombat = sc.isNeutralTarget && sc.pirate.type === 'patrol';
  const surrenderWarned = !!sc.surrenderWarned;
  if(isPatrolCombat){
    // Patrol surrender — jail warning state
    if(surrenderWarned){
      // Second press confirms arrest — show red urgent button
      ctx.fillStyle='#1a0505'; ctx.fillRect(btn3x,btnY,btnW,BTN_H);
      ctx.strokeStyle='#cc2211'; ctx.lineWidth=2; ctx.strokeRect(btn3x,btnY,btnW,BTN_H);
      ctx.font='bold 12px Courier New'; ctx.textAlign='center'; ctx.fillStyle='#ff4433';
      ctx.fillText('[S]  CONFIRM ARREST', btn3x+btnW/2, btnY+15);
      ctx.font='10px Courier New'; ctx.fillStyle='#aa3322';
      ctx.fillText('You will be jailed', btn3x+btnW/2, btnY+29);
    } else {
      // First press available — amber warning
      ctx.fillStyle='#181006'; ctx.fillRect(btn3x,btnY,btnW,BTN_H);
      ctx.strokeStyle='#775511'; ctx.lineWidth=1; ctx.strokeRect(btn3x,btnY,btnW,BTN_H);
      ctx.font='bold 12px Courier New'; ctx.textAlign='center'; ctx.fillStyle='#ddaa44';
      ctx.fillText('[S]  SURRENDER', btn3x+btnW/2, btnY+15);
      ctx.font='10px Courier New'; ctx.fillStyle='#886622';
      ctx.fillText('Leads to arrest', btn3x+btnW/2, btnY+29);
    }
  } else {
    // Normal pirate surrender button
    ctx.fillStyle='#181006'; ctx.fillRect(btn3x,btnY,btnW,BTN_H);
    ctx.strokeStyle='#775511'; ctx.lineWidth=1; ctx.strokeRect(btn3x,btnY,btnW,BTN_H);
    ctx.font='bold 12px Courier New'; ctx.textAlign='center'; ctx.fillStyle='#ddaa44';
    ctx.fillText('[S]  SURRENDER', btn3x+btnW/2, btnY+15);
    ctx.font='10px Courier New'; ctx.fillStyle='#886622';
    ctx.fillText('50% cr + '+terms.cargoCount+' cargo', btn3x+btnW/2, btnY+29);
  }

  ctx.textAlign='left';
}


