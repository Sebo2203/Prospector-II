function doFuelScoop(context){
  if(!G || G.dead || G.retired) return;
  if(!(G.installedModules||[]).includes('fuel_scoop')){
    addLog('No Fuel Scoop installed. Buy one at the Hangar (Modules).','lw'); return;
  }
  if(G.fuel >= G.maxFuel){ addLog('Fuel tanks already full.','li'); return; }

  function applyScoopRisk(label, chance, minDmg, maxDmg){
    if(Math.random() >= chance) return false;
    const dmg = minDmg + rnd(maxDmg - minDmg + 1);
    damagePlayerShipHull(dmg,'environmental impact');
    SFX.hullHit && SFX.hullHit();
    addLog(label+' turbulence stresses the hull! -'+dmg+' HP.','lc');
    if(G.ship.hp<=0){
      G.dead=true;
      G.deathCause='The ship was destroyed while fuel scooping.';
    }
    return true;
  }

  if(context === 'nebula'){
    const cell = G.galaxy[G.ship.y]?.[G.ship.x];
    if(cell?.type !== 'NEBULA'){ addLog('Fuel Scoop requires a nebula to harvest from.','lw'); return; }
    // 55% success — nebula gas is diffuse
    if(Math.random() < 0.55){
      const gained = 5 + rnd(10);
      G.fuel = Math.min(G.maxFuel, G.fuel + gained);
      SFX.refuel();
      addLog('Fuel Scoop harvests '+gained+' units of hydrogen from nebula gas.','lg');
    } else {
      addLog('Fuel Scoop cycling — not enough hydrogen density here. Try again.','li');
    }
    applyScoopRisk('Nebula', 0.18, 2, 7);
  } else if(context === 'gasgiant'){
    const body = getSelectedSystemBody();
    if(!body){ addLog('Must be in a system to scoop a gas giant.','lw'); return; }
    if(body.targetDesc?.biome !== 'GAS_GIANT'){ addLog('Select a gas giant to scoop fuel from.','lw'); return; }
    // 80% success — gas giants are rich sources
    if(Math.random() < 0.80){
      const gained = 15 + rnd(20);
      G.fuel = Math.min(G.maxFuel, G.fuel + gained);
      SFX.refuel();
      addLog('Fuel Scoop skims the upper atmosphere. +'+gained+' fuel harvested.','lg');
    } else {
      addLog('Atmospheric turbulence — scoop aborted.','lw');
    }
    applyScoopRisk('Gas giant', 0.28, 5, 16);
  } else return;
  beginCareerTurn();
  if(!G.dead){
    moveNeutralShips();
    movePirates();
    moveGasEntities();
    tickNpcStranded();
  }
  finishCareerTurn();
  renderAll();
}

function doWaitGalaxy(){
  if(G.mode==='shipcombat'){ advanceShipCombat(); return; }
  if(G.mode!=='galaxy'||G.dead||G.retired) return;
  G._bonusMoves = 0;
  beginCareerTurn();
  maybeCrewGalaxyTalk();
  finishCareerTurn();
  if(G.dead){ renderAll(); return; }
  if(!DEBUG.infiniteFuel) G.fuel = Math.max(0, G.fuel - 0.5);

  // Engineer passive hull repair
  const bestEngineer = G.crew.filter(c=>c.hp>0).reduce((best,c)=>{
    const e = c.skills?.eng||0; return e > (best?.skills?.eng||0) ? c : best;
  }, null);
  let repaired = false;
  if(bestEngineer && (bestEngineer.skills?.eng||0) > 0 && G.ship.hp < G.ship.maxHp){
    const engChance = Math.min(0.80, bestEngineer.skills.eng * 0.08);
    if(Math.random() < engChance){
      G.ship.hp = Math.min(G.ship.maxHp, G.ship.hp + 1);
      addLog(crewDisplayName(bestEngineer)+' patches the hull. +1 HP.','lg');
      giveSkillXP(bestEngineer, 'eng', 2);
      repaired = true;
    }
  }
  if(repaired){
    // log already added inside the repair block
  }

  // Tick active sensor drones
  if(G._activeDrones && G._activeDrones.length){
    G._activeDrones = G._activeDrones.filter(d=>{
      d.x = Math.max(0, Math.min(MAP_W-1, d.x + d.dx));
      d.y = Math.max(0, Math.min(MAP_H-1, d.y + d.dy));
      revealAround(d.x, d.y, 3);
      d.turnsLeft--;
      if(d.turnsLeft <= 0){ addLog('Sensor Drone signal lost.','lm'); return false; }
      return true;
    });
  }

  moveNeutralShips();
  movePirates();
  moveGasEntities();
  tickNpcStranded();
  const pirateHere = G.pirates.find(p=>p.alive&&p.x===G.ship.x&&p.y===G.ship.y&&!shipDisengagementActive(p));
  if(pirateHere && !DEBUG.shipInvisible){ startShipCombat(pirateHere); return; }
  const hostilePatrolHere = (G.neutralShips||[]).find(ns=>ns.alive!==false&&ns.type==='patrol'&&ns.hostile&&ns.x===G.ship.x&&ns.y===G.ship.y&&!shipDisengagementActive(ns));
  if(hostilePatrolHere && !DEBUG.shipInvisible){ startShipCombat(ensureNeutralCombatStats(hostilePatrolHere)); return; }
  renderAll();
}

function doWaitPlanet(){
  if(G.mode!=='planet'||G.dead||G.retired) return;
  beginCareerTurn();

  const pdata = G.planets[G.curPlanet];
  advancePlanetDaylight(pdata);
  revealPlanet(G.curPlanet,G.player.x,G.player.y);
  applySurfaceTurnExposure();
  if(G.dead){ renderAll(); return; }

  applyStandingSurfaceHazards();
  if(G.dead){ renderAll(); return; }

  // Medic — 30% chance to heal 1–3 HP on a random injured crew member
  const medic = G.crew.find(c=>c.role==='medic'&&c.hp>0);
  if(medic){
    const injured = G.crew.filter(c=>c.hp>0&&c.hp<c.maxHp);
    if(injured.length && Math.random()<0.3){
      const target = injured[Math.floor(Math.random()*injured.length)];
      const heal = 1 + Math.floor(Math.random()*3);
      target.hp = Math.min(target.maxHp, target.hp + heal);
      addLog(medic.name+' tends to '+target.name+'. +'+heal+' HP.','lg');
    }
  }

  // Enemies act
  if(maybeCivilizationInitiatesContact(pdata)){
    finishCareerTurn();
    renderAll();
    return;
  }
  moveEnemies();
  if(maybeCivilizationInitiatesContact(pdata)){
    finishCareerTurn();
    renderAll();
    return;
  }
  processPlanetHazards();
  finishCareerTurn();
  renderAll();
}

