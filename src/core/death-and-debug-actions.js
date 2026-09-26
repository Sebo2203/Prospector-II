function crewAlive(){ return G.crew.some(c=>c.hp>0); }

function atmosphereBiomeKey(key){
  const pdata = G?.planets?.[key];
  if(pdata?.isUnderwater) return pdata.sourcePlanet ? (G.planets[pdata.sourcePlanet]?.biome || 'HABITABLE') : 'HABITABLE';
  return pdata?.isCave ? (pdata.sourceBiome || 'HABITABLE') : pdata?.biome;
}

function atmosphereBiome(key){
  return BIOMES[atmosphereBiomeKey(key)] || { oxyDrain:1.5 };
}

function debugRestoreCrewHp(){
  if(DEBUG.infiniteCrewHp && G?.crew){
    G.crew.forEach(c=>{ c.hp = c.maxHp; });
  }
}

function grantDebugFloodlight(){
  if(!G.inventory.some(i=>i.usable==='floodlight')){
    G.inventory.push({name:'Floodlight',col:'#ffffaa',desc:'Passive: always illuminates +2 tile radius.',value:0,usable:'floodlight'});
    addLog('DEBUG: Floodlight added to inventory.','lg');
  } else {
    addLog('DEBUG: Floodlight already in inventory.','li');
  }
}

function debugSpawnGunnerAlien(){
  if(!G || G.mode!=='planet' || !G.player){
    addLog('DEBUG: Gunner alien spawn only works on planet surfaces.','lw');
    renderAll();
    return;
  }
  const pdata = G.planets?.[G.curPlanet];
  if(!pdata){ addLog('DEBUG: No planet map loaded.','lw'); renderAll(); return; }
  const enemies = G.enemies[G.curPlanet] || (G.enemies[G.curPlanet] = []);
  const px = G.player.x, py = G.player.y;
  const candidates = [];
  for(let r=4; r<=7; r++){
    for(let dy=-r; dy<=r; dy++){
      for(let dx=-r; dx<=r; dx++){
        if(Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = px + dx, y = py + dy;
        if(x<0||x>=PW(pdata)||y<0||y>=PH(pdata)) continue;
        const tileType = pdata.grid[y]?.[x]?.type;
        if(!TILE[tileType]?.pass) continue;
        if(['EARTH_WATER','LAVA','LAVA_FLOOR','LAVA_CRUST','AMMONIA','rw_void','ancient_st_void'].includes(tileType)) continue;
        if(enemies.some(e=>e.alive&&!e.hidden&&e.x===x&&e.y===y)) continue;
        if(!hasPlanetLOS(pdata, px, py, x, y)) continue;
        candidates.push({x,y,dist:Math.abs(dx)+Math.abs(dy)});
      }
    }
    if(candidates.length) break;
  }
  if(!candidates.length){
    addLog('DEBUG: No visible open tile found for gunner alien.','lw');
    renderAll();
    return;
  }
  candidates.sort((a,b)=>a.dist-b.dist);
  const spot = candidates[0];
  if(pdata.visited) pdata.visited[spot.y*PW(pdata)+spot.x] = true;
  enemies.push({
    uid:'debug_gunner_'+G.turn+'_'+spot.x+'_'+spot.y,
    x:spot.x, y:spot.y,
    type:'CREATURE',
    name:'Debug Gunner',
    hp:14, maxHp:14,
    atk:3,
    alive:true,
    hidden:false,
    diet:'carnivore',
    sprite:'creature_biped',
    bodyLabel:'armed test creature',
    desc:'A debug-only alien carrying a crude ranged weapon. Its posture suggests it is listening as much as aiming.',
    behaviour:'TERRITORIAL',
    speedRating:2,
    hostileByDefault:false,
    currentlyHostile:false,
    territoryRange:3,
    calmRange:8,
    rangedWeapon:{ name:'Spitter Carbine', maxRange:7, accuracy:0.72, falloff:0.07, minDmg:2, maxDmg:5 },
    canCommunicate:true,
    commRange:4,
    attitude:'Wary',
    intent:'Trying to decide if the crew is a threat',
    commMethod:'Gestures / copied radio tones',
    commGreeting:'...signal shape recognized. Keep distance.',
    commNeed:'No nest harm. No chase. Distance.',
    pacifiedByComm:false,
    debugGunner:true,
  });
  addLog('DEBUG: Spawned gunner alien at '+spot.x+','+spot.y+'.','lw');
  renderAll();
}

function debugApplyCrewStatus(id){
  const target = (G.crew||[]).find(c=>c.hp>0);
  if(!target){ addLog('DEBUG: No living crew for status test.','lw'); renderAll(); return; }
  if(id === 'disease') id = 'infection';
  if(id === 'hallucination' && G.mode === 'planet'){
    const living = (G.crew||[]).filter(c=>c.hp>0);
    const currentMax = living.reduce((max,c)=>{
      const s = getCrewStatus(c, 'hallucination');
      return Math.max(max, s?.intensity || 0, s?.severity || 0);
    }, 0);
    const next = Math.min(6, currentMax + 1);
    const pdata = G.planets?.[G.curPlanet];
    if(pdata){
      const exposureForLevel = [0, 7, 14, 24, 42, 58, 76];
      pdata.hallucinogenic = true;
      pdata.hallucinationExposure = Math.max(pdata.hallucinationExposure || 0, exposureForLevel[next] || 76);
      if(!G.perception) G.perception = {};
      G.perception.hallucinationUntil = Math.max(G.perception.hallucinationUntil || 0, (G.turn || 1) + 4);
      addLog('DEBUG: Current planet marked hallucinogenic for testing.','lw');
    }
    living.forEach(c=>applyCrewStatus(c, 'hallucination', { amount:next, duration:80, source:'debug', silent:true }));
    addLog('DEBUG: Crew hallucination level '+next+'.','lw');
    renderAll();
    return;
  }
  const current = getCrewStatus(target, id);
  const next = Math.min(6, (current?.intensity || current?.severity || 0) + 1);
  applyCrewStatus(target, id, { amount:next, duration:id==='radiation'?null:80, source:'debug' });
  addLog('DEBUG: '+crewDisplayName(target)+' '+id+' level '+next+'.','lw');
  renderAll();
}

function pruneDead(){
  debugRestoreCrewHp();
  const deadCrew = G.crew.filter(c=>c.hp<=0);
  if(deadCrew.length) applyCrewDeathMorale(deadCrew);
  // Remove crew members with hp<=0 to prevent ghost-state bugs
  G.crew=G.crew.filter(c=>c.hp>0);
}

function checkDeath(){
  pruneDead();
  if(!crewAlive() && !G.dead){
    // Figure out the most recent cause from the log
    const combatDeath = G.log.find(l=>l.cls==='lc'&&l.msg.includes('has died'));
    const oxyDeath    = G.log.find(l=>l.msg.includes('suffocated') || l.msg.includes('drowned'));
    if(oxyDeath && (!combatDeath || G.log.indexOf(oxyDeath)<G.log.indexOf(combatDeath))){
      const wasUnderwater = oxyDeath.msg.includes('drowned');
      G.deathCause = wasUnderwater
        ? 'The crew drowned — oxygen ran out underwater.'
        : 'The crew suffocated — oxygen ran out on the surface.';
    } else if(combatDeath){
      const sysCell = G.curSystem ? G.galaxy[G.ship.y]?.[G.ship.x] : null;
      const pIdx    = G.selPlanet||0;
      const pName   = sysCell?.planets?.[pIdx]?.name || G.curSystem || 'an unknown world';
      G.deathCause  = 'The crew was killed in combat on '+pName+'.';
    } else {
      G.deathCause = 'The crew perished on the mission.';
    }
    addLog('ALL CREW DEAD — mission failed.','lc');
    G.dead=true;
  }
  if(G.ship.hp<=0 && !G.dead){
    G.deathCause = 'The ship was destroyed in deep space.';
    addLog('SHIP DESTROYED — mission failed.','lc');
    G.dead=true;
  }
  checkCrewSleepCollapse();
}

// -----------------------------------------------------------------
//  ALARM CHECKS  — fires sounds once per threshold crossing,
//  resets when value recovers above threshold
// -----------------------------------------------------------------
// -----------------------------------------------------------------
//  PLANET HAZARD PROCESSING
//  Called every turn on the planet surface. Handles:
//   - Lava floor/crust cycling (cooling + re-heating)
//   - Lava eruptions (burst spreading)
//   - Geyser eruptions
//   - Meteor rain events
//   - Smoke grid drift
// -----------------------------------------------------------------
