function doFuelScoop(context){
  if(!G || G.dead || G.retired) return;
  if(!(G.installedModules||[]).includes('fuel_scoop')){
    addLog('No Fuel Scoop installed. Buy one at the Hangar (Modules).','lw'); return;
  }
  if(G.fuel >= G.maxFuel){ addLog('Fuel tanks already full.','li'); return; }

  function applyScoopRisk(label, chance, minDmg, maxDmg){
    if(Math.random() >= chance) return false;
    const dmg = minDmg + rnd(maxDmg - minDmg + 1);
    if(!DEBUG.infiniteHull) G.ship.hp = Math.max(0, G.ship.hp - dmg);
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
  }
  G.turn++;
  if(!G.dead){
    moveNeutralShips();
    movePirates();
    moveGasEntities();
    tickNpcStranded();
  }
  renderAll();
}

function doWaitGalaxy(){
  if(G.mode!=='galaxy'||G.dead||G.retired) return;
  G._bonusMoves = 0;
  G.turn++;
  maybeCrewGalaxyTalk();
  tickCrewStatuses('galaxy_wait');
  checkDeath();
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
  const pirateHere = G.pirates.find(p=>p.alive&&p.x===G.ship.x&&p.y===G.ship.y);
  if(pirateHere && !DEBUG.shipInvisible){ startShipCombat(pirateHere); return; }
  const hostilePatrolHere = (G.neutralShips||[]).find(ns=>ns.alive!==false&&ns.type==='patrol'&&ns.hostile&&ns.x===G.ship.x&&ns.y===G.ship.y);
  if(hostilePatrolHere && !DEBUG.shipInvisible){ startShipCombat(ensureNeutralCombatStats(hostilePatrolHere)); return; }
  renderAll();
}

function doWaitPlanet(){
  if(G.mode!=='planet'||G.dead||G.retired) return;

  // Advance planet day cycle
  const pdata = G.planets[G.curPlanet];
  if(pdata){
    const _Bw   = BIOMES[pdata.biome] || {};
    const _cycw = (_Bw.dayLength||20)*4;
    const _rawVrW = (t2) => {
      if(_Bw.tidalLock==='day') return 10;
      if(_Bw.tidalLock==='night') return 1;
      const cv = Math.cos((t2/_cycw)*2*Math.PI - Math.PI/2);
      let v = 1+(cv+1)/2*9;
      if(pdata.biome==='ANCIENT') v=Math.min(v,6);
      return v;
    };
    const _vrBeforeW = _rawVrW(pdata.planetTurn % _cycw);
    pdata.planetTurn++;
    const _vrAfterW  = _rawVrW(pdata.planetTurn % _cycw);
    _checkPhaseMessages(_vrBeforeW, _vrAfterW, pdata.biome);
  }

  // Oxygen drain, including underwater maps. Shared with tryMove()/doCombat() —
  // keep this in sync with movement via applyOxygenDrain()/applyOxygenWarnings().
  const biome = atmosphereBiome(G.curPlanet);
  if(applyOxygenDrain()){ renderAll(); return; }
  applyOxygenWarnings();
  if((biome.oxyDrain > 0 || G.underwater) && G.oxygen<=0 && !DEBUG.infiniteOxy){
    checkDeath();
    if(G.dead){ renderAll(); return; }
  }

  // Standing on hazard tiles
  const waitTile = G.planets[G.curPlanet]?.grid[G.player.y]?.[G.player.x]?.type;
  if(waitTile === 'LAVA_FLOOR'){
    const dmg = 3 + rnd(4);
    G.crew.filter(c=>c.hp>0).forEach(c=>c.hp=Math.max(0,c.hp-dmg));
    G.crew.filter(c=>c.hp>0).forEach(c=>applyCrewInjury(c, 'burns', { amount:2, source:'lava', silent:true }));
    SFX.crewHit();
    addLog('Standing in lava — crew takes '+dmg+' damage!','lc');
    checkDeath(); if(G.dead){ renderAll(); return; }
  }
  if(waitTile === 'AMMONIA'){
    const dmg = 2 + rnd(2);
    G.crew.filter(c=>c.hp>0).forEach(c=>c.hp=Math.max(0,c.hp-dmg));
    G.crew.filter(c=>c.hp>0).forEach(c=>{
      applyCrewInjury(c, 'burns', { amount:1, source:'ammonia', silent:true });
      if(Math.random() < 0.25) applyCrewStatus(c, 'toxin_poisoning', { amount:1, stackMode:'add', max:5, source:'ammonia' });
    });
    G.oxygen = Math.max(0, DEBUG.infiniteOxy ? G.oxygen : G.oxygen - biome.oxyDrain*2);
    SFX.suffocate();
    addLog('Ammonia seeps in — '+dmg+' damage and O₂ draining!','lc');
    checkDeath(); if(G.dead){ renderAll(); return; }
  }
  if(waitTile === 'TOXIC_FLOOR2'){
    const dmg = 1 + rnd(3);
    G.crew.filter(c=>c.hp>0).forEach(c=>c.hp=Math.max(0,c.hp-dmg));
    G.crew.filter(c=>c.hp>0).forEach(c=>{
      applyCrewInjury(c, 'burns', { amount:1, source:'acid', silent:true });
      if(Math.random() < 0.30) applyCrewStatus(c, 'toxin_poisoning', { amount:1, stackMode:'add', max:5, source:'acid_pool' });
    });
    SFX.crewHit();
    addLog('Acid pool burns through the suit — '+dmg+' damage!','lc');
    checkDeath(); if(G.dead){ renderAll(); return; }
  }
  if(waitTile === 'TOXIC_FLOOR3' && Math.random() < 0.15){
    const dmg = 1 + rnd(2);
    G.crew.filter(c=>c.hp>0).forEach(c=>c.hp=Math.max(0,c.hp-dmg));
    SFX.crewHit();
    addLog('A vent erupts underfoot — '+dmg+' damage!','lw');
    checkDeath(); if(G.dead){ renderAll(); return; }
  }

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
    renderAll();
    return;
  }
  moveEnemies();
  if(maybeCivilizationInitiatesContact(pdata)){
    renderAll();
    return;
  }
  processPlanetHazards();
  checkDeath();
  if(G.dead){ renderAll(); return; }
  renderAll();
}

