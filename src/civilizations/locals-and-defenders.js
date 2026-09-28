function spawnCivilizationLocals(key, pdata){
  if(!pdata?.civilization || !pdata?.grid) return [];
  const civ = pdata.civilization;
  const state = ensureCivilizationState(pdata);
  const isHostileAggression = civ.aggression === 'Hostile';
  const commRefused = isHostileAggression || !!state.hostile;
  const isPrim = civ.tier === 'primitive';

  // ── Primitive: place individuals scattered around roamCenter ──────────────
  if(isPrim){
    if(!civ.roamCenter) return []; // no valid placement found during generation
    const traits = civ.traits || {};
    const count = civ.groupSize || 3;
    const radius = civ.roamRadius || 10;
    const locals = [];
    const occupied = new Set((G.enemies?.[key] || []).filter(e=>e.alive&&!e.hidden).map(e=>e.x+','+e.y));
    const badTiles = new Set(['EARTH_WATER','LAVA','LAVA_FLOOR','LAVA_CRUST','AMMONIA']);
    const cx = civ.roamCenter.x, cy = civ.roamCenter.y;

    function canStand(x,y){
      if(x<0||x>=PW(pdata)||y<0||y>=PH(pdata)) return false;
      if(occupied.has(x+','+y)) return false;
      const t = pdata.grid[y]?.[x]?.type;
      return !!TILE[t]?.pass && !badTiles.has(t);
    }

    // Collect all passable tiles within roam radius
    const pool = [];
    for(let dy=-radius; dy<=radius; dy++){
      for(let dx=-radius; dx<=radius; dx++){
        if(Math.max(Math.abs(dx),Math.abs(dy)) > radius) continue;
        const x=cx+dx, y=cy+dy;
        if(canStand(x,y)) pool.push({x,y});
      }
    }
    if(!pool.length) return [];

    const localName = civ.species === 'Walking Tree' ? 'Walking Tree'
      : traits.diet === 'carnivore' ? civ.species+' Hunter'
      : traits.social === 'collective' ? civ.species+' Band Member'
      : civ.species+' Forager';

    const localDescPeaceful = civ.species === 'Walking Tree'
      ? 'A massive, ancient tree that moves with a slow, deliberate grace.'
      : traits.diet === 'carnivore'
      ? 'A hunter moving through their territory with quiet, practiced efficiency.'
      : traits.curiosity === 'curious'
      ? 'A member of the local band. Their eyes drift to the crew\'s equipment.'
      : traits.curiosity === 'isolated'
      ? 'A member of the local band. Their body angles toward escape routes.'
      : traits.social === 'collective'
      ? 'One of a band of hunter-gatherers. They do not act alone.'
      : 'A hunter-gatherer moving through their territory.';

    for(let i=0; i<count; i++){
      if(!pool.length) break;
      const idx = rnd(pool.length);
      const spot = pool.splice(idx, 1)[0];
      occupied.add(spot.x+','+spot.y);
      const finalDesc = (isHostileAggression || state.hostile) ? localDescHostile : localDescPeaceful;
      const finalIntent = (isHostileAggression || state.hostile) ? 'Hunting the crew' : (civ.species === 'Walking Tree' ? 'Wandering slow' : 'Ranging through territory');
      locals.push({
        uid:'civ_local_'+key+'_'+i+'_'+spot.x+'_'+spot.y,
        x:spot.x, y:spot.y,
        type:'CREATURE',
        name:localName,
        hp: civ.species === 'Walking Tree' ? 100 : 8,
        maxHp: civ.species === 'Walking Tree' ? 100 : 8,
        atk: civ.species === 'Walking Tree' ? 5 : (traits.diet === 'carnivore' ? 2 : 1),
        alive:true,
        hidden:false,
        sprite: civ.species === 'Walking Tree' ? 'walking_tree' : 'civ_local_primitive',
        bodyLabel: civ.species === 'Walking Tree' ? 'ancient plant' : 'sapient local',
        desc:finalDesc,
        behaviour:'CIV_LOCAL',
        speedRating: civ.species === 'Walking Tree' ? 1 : planetCritterSpeedRating({ civLocal:true, civPlanetKey:key }),
        hostileByDefault: isHostileAggression || !!state.hostile,
        currentlyHostile: isHostileAggression || !!state.hostile,
        canCommunicate: !isHostileAggression,
        commRefused: commRefused,
        civLocal:true,
        civPlanetKey:key,
        commRange:1,
        attitude: (isHostileAggression || state.hostile) ? 'Hostile' : civRelationLabel(state),
        intent: finalIntent,
        commMethod:civContactMethod(civ),
        // Primitives roam freely — homeX/homeY is the roam center
        homeX:cx, homeY:cy,
        roamRadius: radius,
      });
    }
    return locals;
  }

  // ── Non-primitive: original building-anchored spawn ───────────────────────
  const buildings = civilizationBuildingPositions(pdata);
  if(buildings.length < 2) return [];
  const tierCount = { tribal:3, medieval:4, industrial:5, information:6 }[civ.tier] || 3;
  const count = Math.min(tierCount, Math.max(1, Math.floor(buildings.length / 3)));
  const locals = [];
  const occupied = new Set((G.enemies?.[key] || []).filter(e=>e.alive&&!e.hidden).map(e=>e.x+','+e.y));
  const badTiles = new Set(['EARTH_WATER','LAVA','LAVA_FLOOR','LAVA_CRUST','AMMONIA']);

  function canStand(x,y){
    if(x<0||x>=PW(pdata)||y<0||y>=PH(pdata)) return false;
    if(occupied.has(x+','+y)) return false;
    const t = pdata.grid[y]?.[x]?.type;
    return !!TILE[t]?.pass && !badTiles.has(t);
  }

  for(let i=0;i<count;i++){
    const home = buildings[rnd(buildings.length)];
    const candidates = [[0,0],[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]]
      .map(([dx,dy])=>({x:home.x+dx,y:home.y+dy}))
      .filter(p=>canStand(p.x,p.y));
    if(!candidates.length) continue;
    const spot = candidates[rnd(candidates.length)];
    occupied.add(spot.x+','+spot.y);

    const hostileDesc = 'A local who will not stop to talk.';
    const finalDesc = (isHostileAggression || state.hostile) ? hostileDesc
      : 'A civilian inhabitant moving between settlement structures.';
    const finalIntent = (isHostileAggression || state.hostile) ? 'Hunting the crew'
      : 'Moving between settlement structures';

    locals.push({
      uid:'civ_local_'+key+'_'+i+'_'+spot.x+'_'+spot.y,
      x:spot.x, y:spot.y,
      type:'CREATURE',
      name:civ.species+' Local',
      hp:8, maxHp:8,
      atk:1,
      alive:true,
      hidden:false,
      sprite:'civ_local_'+civ.tier,
      bodyLabel:'sapient local',
      desc:finalDesc,
      behaviour:'CIV_LOCAL',
      speedRating:planetCritterSpeedRating({ civLocal:true, civPlanetKey:key }),
      hostileByDefault: isHostileAggression || !!state.hostile,
      currentlyHostile: isHostileAggression || !!state.hostile,
      canCommunicate: !isHostileAggression,
      commRefused: commRefused,
      civLocal:true,
      civPlanetKey:key,
      commRange:1,
      attitude: (isHostileAggression || state.hostile) ? 'Hostile' : civRelationLabel(state),
      intent: finalIntent,
      commMethod:civContactMethod(civ),
      homeX:home.x,
      homeY:home.y,
    });
  }
  return locals;
}

// Global defender cap per tier — total live civ combatants allowed on this planet at once
const CIV_DEFENDER_CAP = { primitive:2, tribal:3, medieval:5, industrial:7, information:9 };
// Respawn interval in turns for each tier (tiers that respawn); primitive/tribal never respawn
const CIV_DEFENDER_RESPAWN_INTERVAL = { medieval:40, industrial:28, information:18 };

function countLiveCivDefenders(key){
  return (G.enemies?.[key] || []).filter(e=>e.alive && !e.hidden && e.civLocal && e.civCombatant).length;
}

function civilizationPlanetKeyForPdata(pdata){
  return Object.keys(G.planets || {}).find(k=>G.planets[k] === pdata) || G.curPlanet;
}

function civilizationDefenseMapFor(pdata){
  const key = civilizationPlanetKeyForPdata(pdata);
  if(!pdata?.civilization) return { key, pdata };
  if(pdata.isUnderwater || civilizationBuildingPositions(pdata).length > 0 || pdata.civilization.tier === 'primitive'){
    return { key, pdata };
  }
  const current = G.planets?.[G.curPlanet];
  if(current?.civilization === pdata.civilization && (current.isUnderwater || civilizationBuildingPositions(current).length > 0)){
    return { key:G.curPlanet, pdata:current };
  }
  if(pdata.civilization.species === 'Aquatic'){
    const found = Object.entries(G.planets || {}).find(([,p])=>
      p?.civilization === pdata.civilization && p.isUnderwater && civilizationBuildingPositions(p).length > 0
    );
    if(found) return { key:found[0], pdata:found[1] };
  }
  return { key, pdata };
}

function civilizationNeedsInitialDefenders(state, key, pdata){
  if(!state?.reinforcementsSpawned) return true;
  return !!(pdata?.isUnderwater && !state.reinforcementDefenderCount && countLiveCivDefenders(key) === 0);
}

function spawnCivilizationDefenders(key, pdata, opts={}){
  if(!pdata?.civilization || !pdata?.grid) return 0;
  const civ = pdata.civilization;
  const buildings = civilizationBuildingPositions(pdata);
  if(!buildings.length) return 0;
  const state = ensureCivilizationState(pdata);
  const enemies = G.enemies[key] || (G.enemies[key] = []);
  const occupied = new Set(enemies.filter(e=>e.alive&&!e.hidden).map(e=>e.x+','+e.y));
  const badTiles = new Set(['EARTH_WATER','LAVA','LAVA_FLOOR','LAVA_CRUST','AMMONIA']);
  const tierHp = { primitive:7, tribal:9, medieval:12, industrial:18, information:22 }[civ.tier] || 10;
  const tierAtk = { primitive:1, tribal:2, medieval:3, industrial:5, information:6 }[civ.tier] || 2;
  // Primitive: trait modifiers on defenders
  const isPrimDef = civ.tier === 'primitive';
  const primDefTraits = isPrimDef ? (civ.traits || {}) : null;
  const aggrMod = civ.aggression === 'Hostile' ? 2 : civ.aggression === 'Territorial' ? 1 : 0;
  const defHp  = (isPrimDef && primDefTraits.social === 'collective' ? tierHp + 2 : tierHp) + aggrMod;
  const defAtk = (isPrimDef && primDefTraits.diet === 'carnivore'    ? tierAtk + 1 : tierAtk) + (civ.aggression === 'Hostile' ? 1 : 0);
  const defName = isPrimDef
    ? (primDefTraits.diet === 'carnivore' ? civ.species+' Hunter' : primDefTraits.social === 'collective' ? civ.species+' Band Defender' : civ.species+' Fighter')
    : civ.species+' Defender';
  const defDesc = isPrimDef
    ? (primDefTraits.diet === 'carnivore' ? 'A hunter responding to a territorial threat. Their discipline is predator discipline — patient and exact.'
     : primDefTraits.social === 'collective' ? 'Part of a collective response. They are here because the group decided together. That makes them harder to scatter.'
     : primDefTraits.honor === 'honor' ? 'A fighter answering an obligation. This is not rage — this is duty.'
     : 'A hunter-gatherer defending their territory.')
    : 'A local defender answering the settlement alarm.';
  const defenderGun = ({
    industrial:{ name:'Industrial Service Rifle', maxRange:6, accuracy:0.68, falloff:0.09, minDmg:2, maxDmg:5 },
    information:{ name:'Modern Assault Rifle', maxRange:7, accuracy:0.75, falloff:0.07, minDmg:3, maxDmg:6 },
  })[civ.tier] || null;

  // How many can we still spawn before hitting the global cap?
  const globalCap = CIV_DEFENDER_CAP[civ.tier] ?? 3;
  const currentLive = countLiveCivDefenders(key);
  const slots = Math.max(0, globalCap - currentLive);
  if(slots <= 0) return 0;

  // How many to try to spawn this wave: 1-2 for primitive/tribal, up to cap remainder for others
  const waveSize = civ.tier === 'primitive' ? Math.min(slots, 2)
    : civ.tier === 'tribal'   ? Math.min(slots, 2)
    : civ.tier === 'medieval' ? Math.min(slots, 3)
    : civ.tier === 'industrial' ? Math.min(slots, 4)
    : Math.min(slots, 5); // information

  const count = opts.topup ? Math.min(slots, Math.max(1, Math.floor(waveSize / 2))) : waveSize;

  let spawned = 0;

  function canStand(x,y){
    if(x<0||x>=PW(pdata)||y<0||y>=PH(pdata)) return false;
    if(occupied.has(x+','+y)) return false;
    const t = pdata.grid[y]?.[x]?.type;
    return !!TILE[t]?.pass && !badTiles.has(t);
  }

  for(let i=0; i<count; i++){
    const nearby = Number.isFinite(opts.origin?.x) && Number.isFinite(opts.origin?.y)
      ? buildings
          .map(b=>({ ...b, d:Math.max(Math.abs(b.x-opts.origin.x), Math.abs(b.y-opts.origin.y)) }))
          .sort((a,b)=>a.d-b.d)
          .slice(0, Math.min(6, buildings.length))
      : buildings;
    const home = nearby[rnd(nearby.length)] || buildings[rnd(buildings.length)];
    const candidates = [];
    for(let r=0; r<=2; r++){
      for(let dy=-r; dy<=r; dy++) for(let dx=-r; dx<=r; dx++){
        const x = home.x + dx, y = home.y + dy;
        if(canStand(x,y)) candidates.push({x,y});
      }
      if(candidates.length) break;
    }
    if(!candidates.length) continue;
    const spot = candidates[rnd(candidates.length)];
    occupied.add(spot.x+','+spot.y);
    const defender = {
      uid:'civ_defender_'+key+'_'+(G.turn||0)+'_'+i+'_'+spot.x+'_'+spot.y,
      x:spot.x, y:spot.y,
      type:'CREATURE',
      name:defName,
      hp:defHp, maxHp:defHp,
      atk:defAtk,
      alive:true,
      hidden:false,
      sprite:'civ_local_'+civ.tier,
      bodyLabel:'armed sapient local',
      desc:defDesc,
      behaviour:'CIV_LOCAL',
      speedRating:2,
      hostileByDefault:true,
      currentlyHostile:true,
      canCommunicate:true,
      commRefused:true,
      civLocal:true,
      civCombatant:true,
      civPlanetKey:key,
      commRange:1,
      attitude:'Hostile',
      intent:'Hunting the away team',
      commMethod:civContactMethod(civ),
      homeX:home.x,
      homeY:home.y,
    };
    if(defenderGun){
      defender.rangedWeapon = { ...defenderGun };
      defender.desc = civ.tier === 'information'
        ? 'A settlement defender carrying modern military-grade firearms. They are trained, coordinated, and dangerous at range.'
        : 'A settlement defender carrying industrial-grade firearms. They are equipped to defend the settlement perimeter.';
      defender.intent = 'Defending the settlement with ranged weapons';
    }
    enemies.push(defender);
    spawned++;
  }
  pdata.spawnedAliens = enemies.length;

  // Schedule next respawn for tiers that support it (only if settlement is not ruined)
  const respawnInterval = CIV_DEFENDER_RESPAWN_INTERVAL[civ.tier];
  if(respawnInterval && state && !(state.ruinedSettlementCount >= 2)){
    state.nextDefenderRespawn = (G.turn || 0) + respawnInterval;
  }

  return spawned;
}

// Called each turn while on a planet — tops up defenders for eligible tiers
function tickCivilizationDefenderRespawn(key, pdata){
  if(!pdata?.civilization) return;
  const civ = pdata.civilization;
  const respawnInterval = CIV_DEFENDER_RESPAWN_INTERVAL[civ.tier];
  if(!respawnInterval) return; // primitive/tribal never respawn
  const state = ensureCivilizationState(pdata);
  if(!state?.hostile) return; // only respawn once hostile
  if((state.ruinedSettlementCount || 0) >= 2) return; // settlement destroyed — no more respawns
  if(!state.nextDefenderRespawn || (G.turn || 0) < state.nextDefenderRespawn) return;
  const currentLive = countLiveCivDefenders(key);
  const globalCap = CIV_DEFENDER_CAP[civ.tier] ?? 3;
  if(currentLive >= globalCap){ state.nextDefenderRespawn = (G.turn || 0) + respawnInterval; return; }
  const buildings = civilizationBuildingPositions(pdata);
  if(!buildings.length) return;
  const spawned = spawnCivilizationDefenders(key, pdata, { topup:true });
  if(spawned > 0){
    addLog('The '+civ.species.toLowerCase()+' send more defenders.','lc');
  }
}

function ensureCivilizationLocals(key){
  const pdata = G.planets?.[key];
  if(!pdata?.civilization) return;
  const enemies = G.enemies[key] || (G.enemies[key] = []);
  const civSprite = 'civ_local_'+pdata.civilization.tier;
  enemies.filter(e=>e.civLocal).forEach(e=>{
    // Walking Tree NPCs have their own sprite — don't overwrite with the humanoid fallback
    if(e.bodyLabel !== 'ancient plant') e.sprite = civSprite;
    e.commMethod = civContactMethod(pdata.civilization);
  });
  if(enemies.some(e=>e.alive && e.civLocal)) return;
  enemies.push(...spawnCivilizationLocals(key, pdata));
  pdata.spawnedAliens = enemies.length;
}
// XP required to go from level N to N+1 = N * 10 (so 0→1 costs 0? no — use (N+1)*10)
// Simpler: cost to reach level N = N*10. Total to max (10) = 550 XP.
