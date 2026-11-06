const DEBUG_GALAXY_OBJ_TYPES = [
  { id:'ROGUE_PLANET',  label:'Rogue Planet',  col:'#2a3050' },
  { id:'PULSAR',        label:'Pulsar',        col:'#00ddaa' },
  { id:'BLACK_HOLE',    label:'Black Hole',    col:'#ff8800' },
  { id:'DERELICT',      label:'Derelict',      col:'#6688aa' },
  { id:'PIRATE_BASE',   label:'Pirate Base',   col:'#bb3311' },
  ...['BASE','WAYPOINT','CASINO','NEBULA_PINK','NEBULA_BLUE','GAS_WRAITH','GAS_DEVOURER',
    'TRADER','CARGO_SHIP','SCIENCE_SHIP','PATROL','PIRATE','STRANDED_ALIVE','STRANDED_DEAD','RESEARCH_SHIP','NEBULA_LOOT','QUARANTINE']
    .map(id=>({id,label:id.replaceAll('_',' '),col:'#88bbcc',place:(x,y)=>debugBuildPaletteGalaxyObject(id,x,y)})),
];

const DEBUG_CIV_TIERS = [
  { id:'primitive', label:'Primitive' },
  { id:'tribal', label:'Tribal' },
  { id:'medieval', label:'Medieval' },
  { id:'industrial', label:'Industrial' },
  { id:'information', label:'Information Age' },
];

function debugCurrentPlanetData(){
  return G.mode === 'planet' ? G.planets?.[G.curPlanet] : null;
}

function debugResetCivilizationState(civ){
  if(!civ) return null;
  civ.state = null;
  return ensureCivilizationState({ civilization:civ });
}

function debugApplySelectedCivAggression(){
  const pd = debugCurrentPlanetData();
  if(!pd?.civilization){
    addLog('DEBUG: No civilization on current planet. Use the Civilization panel to spawn one.','lw');
    renderAll();
    return;
  }
  const agg = CIV_AGGRESSION[(DEBUG.debugCivAggression||0) % CIV_AGGRESSION.length];
  pd.civilization.aggression = agg;
  const state = debugResetCivilizationState(pd.civilization);
  resetCivVisitState(pd);
  clearCivilizationInterceptIntents(pd);
  addLog('DEBUG: Current civilization aggression set to '+agg+' (relation '+(state?.relation ?? 0)+', alert '+(state?.alert ?? 0)+').','lw');
  renderAll();
}

function debugToggleCurrentCivHostile(){
  const pd = debugCurrentPlanetData();
  if(!pd?.civilization){
    addLog('DEBUG: No civilization on current planet.','lw');
    renderAll();
    return;
  }
  const state = ensureCivilizationState(pd);
  if(state.hostile){
    state.hostile = false;
    state.alert = Math.min(state.alert || 0, 2);
    state.hostileResponse = null;
    state.nextProactiveContactTurn = (G.turn || 1) + 3;
    (G.enemies?.[G.curPlanet] || []).forEach(e=>{
      if(e?.civLocal){
        e.currentlyHostile = false;
        e.hostileByDefault = false;
        if(e.civCombatant) e.intent = 'Standing down after debug hostility clear';
      }
    });
    addLog('DEBUG: Civilization hostility cleared.','lw');
  } else {
    makeCivilizationHostile(pd, 'Debug hostility toggle');
    addLog('DEBUG: Civilization forced hostile.','lw');
  }
  renderAll();
}

function debugPinnedCivTraits(tier){
  if(tier === 'primitive'){
    return {
      diet: DEBUG.civPrimDiet >= 0 ? PRIM_DIETS[DEBUG.civPrimDiet % PRIM_DIETS.length] : null,
      social: DEBUG.civPrimSocial >= 0 ? PRIM_SOCIAL[DEBUG.civPrimSocial % PRIM_SOCIAL.length] : null,
      curiosity: DEBUG.civPrimCuriosity >= 0 ? PRIM_CURIOSITY[DEBUG.civPrimCuriosity % PRIM_CURIOSITY.length] : null,
      honor: DEBUG.civPrimHonor >= 0 ? PRIM_HONOR[DEBUG.civPrimHonor % PRIM_HONOR.length] : null,
    };
  }
  const axes = CIVI_TRAITS[tier] || {};
  const keys = Object.keys(axes);
  const out = {};
  keys.forEach(key=>{
    const debugKey = 'civTrait'+key[0].toUpperCase()+key.slice(1);
    if(DEBUG[debugKey]) out[key] = DEBUG[debugKey];
  });
  return out;
}

function debugCivStatusRows(){
  const pd = debugCurrentPlanetData();
  const civ = pd?.civilization || null;
  const state = civ ? ensureCivilizationState(pd) : null;
  return [
    { label:'Aggression', value:civ?.aggression || '-' },
    { label:'Language',   value:state ? (state.languageProgress ?? 0)+' / '+CIV_LANGUAGE_MAX : '-' },
    { label:'Alert',      value:state ? (state.alert ?? 0)+' / 5' : '-' },
    { label:'Relation',   value:state ? (state.relation ?? 0)+' / 10' : '-' },
  ];
}

function debugSpawnItem(row){
  if(row.type === 'cargo'){
    if(addCargo(makeCommodityItem(row.item, 'debug', 0))) addLog('DEBUG: Cargo added: '+row.label+'.','lg');
  } else {
    G.inventory.push({ ...row.item });
    addLog('DEBUG: Item added: '+row.label+'.','lg');
  }
  renderAll();
}
function debugSpawnCivilizationOnCurrentPlanet(){
  if(G.mode !== 'planet'){
    addLog('DEBUG: Civilization spawn only works on planet surface.','lw');
    renderAll();
    return;
  }
  const pd = G.planets?.[G.curPlanet];
  if(!pd?.grid){
    addLog('DEBUG: No current planet data.','lw');
    renderAll();
    return;
  }
  const tierPick = DEBUG_CIV_TIERS[(DEBUG.debugCivTier||0) % DEBUG_CIV_TIERS.length];
  const tierDef = CIV_TIERS.find(x=>x.id===tierPick.id);
  const aggression = CIV_AGGRESSION[(DEBUG.debugCivAggression||0) % CIV_AGGRESSION.length];
  const species = DEBUG.debugCivSpecies >= 0
    ? CIV_SPECIES_TYPES[DEBUG.debugCivSpecies % CIV_SPECIES_TYPES.length]
    : CIV_SPECIES_TYPES[Math.floor(Math.random()*CIV_SPECIES_TYPES.length)];
  const count = tierDef ? tierDef.count[0]+Math.floor(Math.random()*(tierDef.count[1]-tierDef.count[0]+1)) : 4;
  let traits = tierPick.id === 'primitive' ? generatePrimitiveTraits(Math.random) : generateCivilizationTraits(tierPick.id, Math.random);
  const pinnedTraits = debugPinnedCivTraits(tierPick.id);
  if(traits && pinnedTraits) Object.entries(pinnedTraits).forEach(([key, val])=>{ if(val) traits[key] = val; });
  pd.civilization = {
    tier:tierPick.id,
    tierLabel:tierPick.label,
    species,
    aggression,
    count,
    tiles:tierDef?.tiles || ['civ_hut'],
    traits,
    _debugSpawned:true,
  };
  debugResetCivilizationState(pd.civilization);

  // Aquatic civilizations live on the seabed — generate/regenerate the underwater
  // map so their structures are placed there, not on the surface land grid.
  if(species === 'Aquatic'){
    const uwKey = G.curPlanet + ':uw';
    generateUnderwaterMap(uwKey, G.curPlanet);
    G.planets[uwKey] = G.planets[uwKey] || {};
    G.planets[uwKey].civilization = pd.civilization;
    G.planets[uwKey].isUnderwater  = true;
    G.planets[uwKey].surfaceKey    = G.curPlanet;
    G.enemies[uwKey] = G.enemies[uwKey] || [];
    const uwLocals = spawnCivilizationLocals(uwKey, G.planets[uwKey]);
    G.enemies[uwKey] = G.enemies[uwKey].filter(e=>!e.civLocal).concat(uwLocals);
    addLog('DEBUG: Spawned '+tierPick.label+' Aquatic ('+aggression+') — placed on underwater map. Dive to visit.','lw');
    renderAll();
    return;
  }
  const B2 = BIOMES[pd.biome] || {};
  const debugFloor = B2.floor || 'EARTH_FLOOR';
  const grid = pd.grid;
  for(let gy=0; gy<grid.length; gy++){
    for(let gx=0; gx<grid[gy].length; gx++){
      if(CIV_TILE_TYPES.has(grid[gy][gx].type) || grid[gy][gx].type === 'civ_ruin') grid[gy][gx].type = debugFloor;
    }
  }
  const passable = [];
  for(let gy=1; gy<grid.length-1; gy++){
    for(let gx=1; gx<grid[gy].length-1; gx++){
      const t2 = grid[gy][gx].type;
      if(TILE[t2]?.pass && t2 !== 'EARTH_WATER' && t2 !== 'SHIP') passable.push({ x:gx, y:gy });
    }
  }
  for(let i=passable.length-1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [passable[i], passable[j]] = [passable[j], passable[i]];
  }
  passable.slice(0, count).forEach(p=>{
    grid[p.y][p.x] = { type:tierDef.tiles[Math.floor(Math.random()*tierDef.tiles.length)] };
  });
  G.enemies[G.curPlanet] = (G.enemies[G.curPlanet] || []).filter(e=>!e.civLocal);
  G.enemies[G.curPlanet].push(...spawnCivilizationLocals(G.curPlanet, pd));
  addLog('DEBUG: Spawned '+tierPick.label+' '+species+' ('+aggression+') — '+count+' buildings, '+G.enemies[G.curPlanet].filter(e=>e.civLocal).length+' locals.','lw');
  renderAll();
}

function buildDebugGalaxyReportRows(){
  const rows = [];
  const cells = (G?.galaxy || []).flat();
  const countType = type => cells.filter(c=>c?.type===type).length;
  const systems = cells.filter(c=>c?.type==='SYSTEM');
  const starCounts = {};
  systems.forEach(s=>{ starCounts[s.starType || 'UNKNOWN'] = (starCounts[s.starType || 'UNKNOWN'] || 0) + 1; });
  const planets = systems.reduce((sum,s)=>sum+(s.planets?.length||0),0);
  const nebulaTiles = countType('NEBULA');
  const blueNebula = cells.filter(c=>c?.type==='NEBULA' && c.nebulaVariant==='blue').length;
  const pinkNebula = cells.filter(c=>c?.type==='NEBULA' && c.nebulaVariant!=='blue').length;
  const massiveNebula = cells.filter(c=>c?.type==='NEBULA' && c.massive).length;
  const pirates = G?.pirates || [];
  const livePirates = pirates.filter(p=>p.alive);
  const guardTarget = G?._pirateGuardTarget ?? 0;
  const perBaseGuardTarget = G?._pirateGuardPerBaseTarget ?? 0;
  rows.push(['Map size', MAP_W+' x '+MAP_H+' ('+(MAP_W*MAP_H)+' tiles)']);
  rows.push(['Star systems', systems.length+' / target 50-100']);
  rows.push(['Planets', planets]);
  rows.push(['Star colors', Object.entries(starCounts).map(([k,v])=>k+': '+v).join('   ') || 'none']);
  rows.push(['Friendly stations', (G?.bases||[]).map(b=>b.name+' @ '+(b.x+1)+','+(b.y+1)).join('   ') || 'none']);
  rows.push(['Pirate bases', (G?.pirateBases||[]).filter(b=>!b.destroyed).length+' active / '+(G?.pirateBases||[]).length+' total']);
  rows.push(['Pirate guard target', guardTarget+' total, '+perBaseGuardTarget+' per base']);
  rows.push(['Current pirates', livePirates.length+' live ('+livePirates.filter(p=>p.pirateType==='guard').length+' guards, '+livePirates.filter(p=>p.pirateType==='roamer').length+' raiders)']);
  rows.push(['Raider target', G?._pirateRoamerTarget ?? 0]);
  rows.push(['Nebula gas', nebulaTiles+' tiles ('+blueNebula+' blue, '+pinkNebula+' pink)']);
  rows.push(['Massive nebula', massiveNebula ? massiveNebula+' tiles' : 'none this run']);
  const liveGasEnts = (G?.gasEntities||[]).filter(ge=>ge.alive);
  rows.push(['Gas entities', liveGasEnts.length+' alive ('+liveGasEnts.filter(ge=>ge.isMassive).length+' Void Devourers)']);
  rows.push(['Derelicts', countType('DERELICT')]);
  rows.push(['Casino stations', countType('CASINO')]);
  rows.push(['Neutral ships', (G?.neutralShips||[]).filter(ns=>ns.alive!==false).length]);
  rows.push(['Stranded contacts', (G?.npcStranded||[]).length]);
  return rows;
}

function debugSpawnSystem(){
  if(G.mode !== 'galaxy') { addLog('Debug spawn only works on galaxy map.','lw'); renderAll(); return; }

  const biomeKeys = Object.keys(BIOMES);
  const biomeKey  = biomeKeys[DEBUG.spawnBiome % biomeKeys.length];
  const B = BIOMES[biomeKey];

  if(biomeKey==='CAVE'){
    addLog('DEBUG: CAVE is not a standalone planet — spawn a rocky biome and enter it.','li');
    renderAll();
    return;
  }
  const sector = findDebugSpawnSector();
  if(!sector){
    addLog('DEBUG: No empty adjacent sector for the system.','lw');
    renderAll();
    return;
  }
  const {x:tx,y:ty} = sector;
  const sysName = 'Debug-'+biomeKey;
  const scanState = (DEBUG.preScan === 2) ? 'none' : 'full';
  const desc = { name:sysName, biome:biomeKey, biomeName:B.name, orbitSlot:0, scanState };
  if(biomeKey==='GAS_GIANT'){
    desc.moons=[
      { name:sysName+' Moon', biome:'MOON_ROCK', biomeName:BIOMES.MOON_ROCK.name, moonIdx:0,
        avgTemp:-80, gravity:'0.6', atmosphere:'Trace', radius:'0.25', scanState },
      { name:sysName+' Station', biome:'ANCIENT_STATION', biomeName:'Ancient Refueling Station',
        moonIdx:1, avgTemp:-60, gravity:'0.4', atmosphere:'Vacuum', radius:'0.12',
        isAncientStation:true, scanState },
    ];
  } else if(biomeKey==='ANCIENT_STATION'){
    desc.isAncientStation = true;
  }

  G.galaxy[ty][tx] = {
    type:'SYSTEM', name:sysName, starType:'YELLOW',
    planets:[desc],
  };

  // Pre-generate the planet map so it exists before landing
  const _pKey = tx+','+ty+':0';
  if(biomeKey==='ANCIENT_STATION'||desc.isAncientStation) generateAncientStation(_pKey);
  else if(biomeKey==='DERELICT') generateDerelict(_pKey);
  else if(biomeKey==='RINGWORLD'||desc.isRingworld) generateRingworld(_pKey);
  else if(biomeKey==='DESTROYED_RINGWORLD'||desc.isDestroyedRingworld) generateDestroyedRingworld(_pKey);
  else if(biomeKey==='NUCLEAR_WAR'||desc.isNuclearWar) generateNuclearPlanet(_pKey);
  else if(biomeKey==='BLOOM'||desc.isBloomWorld) generateBloomPlanet(_pKey);
  else generatePlanet(_pKey, biomeKey);

  // If rocky biome — force a cave entrance into the planet map
  const _hasCaveRocks = BIOMES[biomeKey]?.rockDensity > 0;
  if(_hasCaveRocks && G.planets[_pKey]){
    const _pdata = G.planets[_pKey];
    const _B = BIOMES[biomeKey];
    const _caveKey = _pKey+':cave';
    // Find a rock tile to place the entrance on
    let _cx=-1, _cy=-1;
    for(let _y=1;_y<PH(_pdata)-1&&_cx<0;_y++){
      for(let _x=1;_x<PW(_pdata)-1;_x++){
        const _t=_pdata.grid[_y][_x].type;
        if(_t===_B.rock||_t===_B.rock2){ _cx=_x; _cy=_y; break; }
      }
    }
    if(_cx>=0){
      _pdata.grid[_cy][_cx]={type:'CAVE_ENTRANCE',caveKey:_caveKey};
      addLog('DEBUG: Cave entrance placed at ('+_cx+','+_cy+') on '+biomeKey+' planet.','li');
    } else {
      addLog('DEBUG: No rock tile found for cave entrance on '+biomeKey+'.','lw');
    }
  }

  // Reveal it
  G.visited[ty*MAP_W+tx]=true;
  addLog('DEBUG: Spawned '+biomeKey+' system at ('+tx+','+ty+'). Press Enter to land.','lg');
  renderAll();
}

function findDebugSpawnSector(){
  const occupants = [
    ...(G.neutralShips||[]), ...(G.pirates||[]), ...(G.gasEntities||[]),
    ...(G.npcStranded||[]), ...(G.nebulaLoot||[]),
  ];
  const offsets = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
  for(const [dx,dy] of offsets){
    const x = G.ship.x + dx, y = G.ship.y + dy;
    if(G.galaxy[y]?.[x]?.type!=='VOID') continue;
    if(occupants.some(object=>object.alive!==false && object.x===x && object.y===y)) continue;
    return {x,y};
  }
  return null;
}

function debugSpawnGalaxyObj(){
  if(G.mode !== 'galaxy'){ addLog('DEBUG: Galaxy object spawn only works on galaxy map.','lw'); renderAll(); return; }
  const objType = DEBUG_GALAXY_OBJ_TYPES[DEBUG.spawnGalaxyObj % DEBUG_GALAXY_OBJ_TYPES.length];
  const sector = findDebugSpawnSector();
  if(sector){
    placeDebugGalaxyObject(objType,sector.x,sector.y);
  } else {
    addLog('DEBUG: No empty adjacent sector for the galaxy object.','lw');
  }
  renderAll();
}

function placeDebugGalaxyObject(objType,tx,ty){
  let cellData;
  if(objType.place){
    cellData=objType.place(tx,ty);
  } else if(objType.id === 'ROGUE_PLANET'){
    const name = 'Debug Rogue';
    const rpPlanetDesc = {
      name, biome:'FROZEN', biomeName: BIOMES.FROZEN?.name||'Frozen',
      orbitSlot:0, scanState:'none',
      avgTemp:-180, gravity:'3.2', atmosphere:'None', radius:'0.55',
    };
    cellData = { type:'ROGUE_PLANET', name, planets:[rpPlanetDesc] };
    G.roguePlanets = G.roguePlanets || [];
    G.roguePlanets.push({ x:tx, y:ty, name });
  } else if(objType.id === 'PULSAR'){
    const name = 'Debug PSR';
    cellData = { type:'PULSAR', name };
    G.pulsars = G.pulsars || [];
    G.pulsars.push({ x:tx, y:ty, name });
  } else if(objType.id === 'BLACK_HOLE'){
    cellData = { type:'BLACK_HOLE', name:'Debug Singularity' };
    G.blackHoles = G.blackHoles || [];
    G.blackHoles.push({ x:tx, y:ty });
  } else if(objType.id === 'DERELICT'){
    const DERELICT_NAMES = ['DSS Erebus','DSS Vanguard','Station Threnody','Station Morrow',
      'DSS Koval','Outpost Silica','DSS Heliodor','Station Lacuna'];
    const dname = pick(DERELICT_NAMES);
    cellData = { type:'DERELICT', name:dname };
    G.derelicts = G.derelicts || [];
    G.derelicts.push({ x:tx, y:ty, name:dname });
  } else if(objType.id === 'PIRATE_BASE'){
    const PIRATE_BASE_NAMES = ['Cutthroat Station','Ironjaw Anchorage','The Maw',
      'Voidbreaker Post','Redrock Station','Corsair\'s Rest'];
    const pbName = pick(PIRATE_BASE_NAMES);
    cellData = { type:'PIRATE_BASE', name:pbName };
    G.pirateBases = G.pirateBases || [];
    G.pirateBases.push({ x:tx, y:ty, name:pbName, hp:1000, maxHp:1000, destroyed:false, lastRespawn:0 });
  }

  if(!cellData) return false;
  G.galaxy[ty][tx] = cellData;
  G.visited[ty*MAP_W+tx] = true;
  addLog('DEBUG: Spawned '+objType.label+' at ('+tx+','+ty+').','lg');
  return true;
}

function debugRegenWithAncientRuins(){
  if(G.mode !== 'planet'){
    addLog('DEBUG: Must be on a planet surface to use this.','lw');
    renderAll(); return;
  }
  const key = G.curPlanet;
  const pdata = G.planets?.[key];
  if(!pdata){ addLog('DEBUG: No planet data for current planet.','lw'); renderAll(); return; }

  const biomeKey = pdata.biome;

  delete G.planets[key];
  delete G.enemies[key];

  if(biomeKey === 'HABITABLE')          generateHabitablePlanet(key);
  else if(biomeKey === 'BLOOM')         generateBloomPlanet(key);
  else if(biomeKey === 'TALKING_TREES') generateTalkingTreesPlanet(key);
  else if(biomeKey === 'RINGWORLD')     generateRingworld(key);
  else if(biomeKey === 'DESTROYED_RINGWORLD') generateDestroyedRingworld(key);
  else if(biomeKey === 'NUCLEAR_WAR')   generateNuclearPlanet(key);
  else if(biomeKey === 'ANCIENT_STATION') generateAncientStation(key);
  else if(biomeKey === 'DERELICT')      generateDerelict(key);
  else                                  generatePlanet(key, biomeKey);

  const newPdata = G.planets[key];
  if(!newPdata){ addLog('DEBUG: Planet regen failed.','lw'); renderAll(); return; }

  const B = BIOMES[biomeKey] || BIOMES.DESERT;
  placeAncientRuinsOnPlanet(newPdata.grid, PW(newPdata), PH(newPdata), key, B.floor);

  G.player.x = newPdata.spawnX;
  G.player.y = newPdata.spawnY;
  revealPlanet(key, G.player.x, G.player.y);

  addLog('DEBUG: Planet regenerated ('+biomeKey+') with ancient ruins overlaid.','lg');
  renderAll();
}

