function getSelectedSystemBody(){
  if(G.mode!=='system') return null;
  const cell = G.galaxy[G.ship.y]?.[G.ship.x];
  if(!cell || (cell.type!=='SYSTEM' && cell.type!=='ROGUE_PLANET')) return null;
  const pIdx = G.selPlanet;
  const pDesc = cell.planets?.[pIdx];
  const isMoonSelection = !!(G.selMoon>=0 && pDesc?.moons?.[G.selMoon]);
  const targetDesc = isMoonSelection ? pDesc.moons[G.selMoon] : pDesc;
  if(!targetDesc) return null;
  const pKey = isMoonSelection ? (G.curSystem+':'+pIdx+':m'+G.selMoon) : (G.curSystem+':'+pIdx);
  return { pDesc, targetDesc, pKey };
}

// Detailed readings belong in orbital view. Generated populations take
// precedence over biome estimates.
function bodyScanReadings(desc,pdata){
  const biome=BIOMES[desc.biome]||{};
  const noSurface=desc.biome==='GAS_GIANT';
  const mineral=biome.minerals>=10?'Abundant':biome.minerals>=6?'Rich':biome.minerals>=3?'Moderate':'Scarce';
  const civ=pdata?.civilization;
  let life='None detected';
  if(civ) life=civ.tierLabel+' '+civ.species;
  else {
    const actual=pdata?.spawnedAliens;
    const chance=biome.alienChance??1, max=biome.aliens??0;
    const count=actual??(chance*(1+max)/2);
    const prefix=actual===undefined?'~':'';
    if(count>0 && (actual!==undefined || (chance>0 && max>0)))
      life=actual===undefined && chance<=0.25?'Unlikely':prefix+(count>=8?'Teeming':count>=5?'Active':count>=2?'Sparse':'Unlikely');
  }
  return [
    ['Avg Temp',desc.avgTemp!==undefined?desc.avgTemp+' C':'Unknown'],
    ['Gravity',desc.gravity!==undefined?desc.gravity+' m/s2':'Unknown'],
    ['Atmosphere',desc.atmosphere||'Unknown'],
    ['Radius',desc.radius!==undefined?desc.radius+'x Earth':'Unknown'],
    ['Oxygen',noSurface?'Cannot land':biome.oxyDrain===0?'Breathable':biome.oxyDrain!==undefined?'-'+biome.oxyDrain+'%/step':'Unknown'],
    ['Minerals',noSurface?'No surface':mineral],
    ['Lifeforms',life],
    ['Biodata',biome.biodata>=7?'Abundant':biome.biodata>=4?'Rich':biome.biodata>=1?'Traces':'None'],
    ['Hazards',biome.hazards?.length?biome.hazards.map(h=>
      ({METEOR:'Meteors',LAVA_FLOOR:'Lava',SMOKE:'Gas vents',AMMONIA:'Ammonia',GEYSER:'Geysers'})[h]||h).join(', '):'None detected'],
  ];
}

function bodyScanHint(desc,pdata){
  if(!['partial','full'].includes(desc.scanState)) return '';
  const unusualBody=body=>['RINGWORLD','DESTROYED_RINGWORLD','NUCLEAR_WAR','BLOOM',
    'TALKING_TREES','ANCIENT','ANCIENT_STATION','DERELICT'].includes(body?.biome) ||
    body?.isRingworld || body?.isDestroyedRingworld || body?.isNuclearWar ||
    body?.isBloomWorld || body?.isTalkingTreesWorld || body?.isAncientStation;
  if(['BLOOM','TALKING_TREES'].includes(desc.biome) || desc.isBloomWorld || desc.isTalkingTreesWorld)
    return 'Scan: the biological returns have an unusual rhythm.';
  if(pdata?.civilization) return 'Scan: a few surface patterns look unusually regular.';
  if(unusualBody(desc)) return 'Scan: some contours do not quite fit the surrounding terrain.';
  if(desc.biome==='GAS_GIANT' && desc.scanState==='full' && desc.moons?.some(unusualBody))
    return 'Scan: one of the secondary returns does not quite fit the rest.';
  // Scattered structures only suggest an anomaly when their surface footprint
  // is actually revealed; do not inspect concealed loot or building interiors.
  const width=pdata?.grid?.[0]?.length||0;
  const regularSurface=pdata?.grid?.some((row,y)=>row.some((cell,x)=>
    (pdata.scanMask?.[y*width+x] || pdata.visited?.[y*width+x]) &&
    ['ANCIENT_ROAD','ANCIENT_WALL','ANCIENT_OUTPOST','ancient_statue'].includes(cell.type)));
  return regularSurface?'Scan: a few surface patterns look unusually regular.':'';
}

function logBodyScanHint(desc,pdata){
  const hint=bodyScanHint(desc,pdata);
  if(hint) addLog(hint,'li');
}

function getOrCreateScanPlanetData(pKey, biomeKey, scanState){
  if(!G.planets[pKey]){
    if(biomeKey==='ANCIENT_STATION') generateAncientStation(pKey);
    else if(biomeKey==='DERELICT')   generateDerelict(pKey);
    else if(biomeKey==='CAVE')       generateCave(pKey, 'HABITABLE');
    else if(biomeKey==='RINGWORLD')  generateRingworld(pKey);
    else if(biomeKey==='DESTROYED_RINGWORLD') generateDestroyedRingworld(pKey);
    else if(biomeKey==='NUCLEAR_WAR') generateNuclearPlanet(pKey);
    else if(biomeKey==='BLOOM') generateBloomPlanet(pKey);
    else                             generatePlanet(pKey, biomeKey);
  }
  const pdata = G.planets[pKey];
  // Set rogue planet flag from galaxy cell so scan view renders it dark
  if(!pdata.isRoguePlanet){
    const _rp=(pKey||"").split(":");
    const _rpsx=parseInt((_rp[0]||"").split(",")[0]||"",10);
    const _rpsy=parseInt((_rp[0]||"").split(",")[1]||"",10);
    if(Number.isInteger(_rpsx)&&Number.isInteger(_rpsy)&&G.galaxy?.[_rpsy]?.[_rpsx]?.type==="ROGUE_PLANET") pdata.isRoguePlanet=true;
  }
  const total = PW(pdata)*PH(pdata);
  if(!pdata.scanMask) pdata.scanMask = new Array(total).fill(false);
  // If fully scanned (e.g. debug), reveal everything
  if(scanState==='full' || DEBUG.preScan === 1){
    pdata.scanMask.fill(true);
  } else {
    const explored = pdata.explored || pdata.visited || [];
    for(let i=0;i<explored.length;i++){
      if(explored[i]) pdata.scanMask[i] = true;
    }
  }
  return pdata;
}

function getScanCoverage(mask){
  if(!mask || !mask.length) return 0;
  let revealed = 0;
  for(let i=0;i<mask.length;i++) if(mask[i]) revealed++;
  return revealed / mask.length;
}

function getSurveySaleValue(pdata){
  if(!pdata || pdata.isDerelict || pdata.isAncientStation || pdata.isCasino || pdata.isQuarantine ||
    ['DERELICT','ANCIENT_STATION','CASINO'].includes(pdata.biome)) return 0;
  const scanMask = pdata.scanMask || [];
  const explored = pdata.explored || [];
  let scannedTiles = 0;
  let exploredTiles = 0;
  const len = Math.max(scanMask.length, explored.length);
  for(let i=0;i<len;i++){
    if(scanMask[i] || explored[i]) scannedTiles++;
    if(explored[i]) exploredTiles++;
  }
  const scanOnlyTiles = Math.max(0, scannedTiles - exploredTiles);
  let value = scanOnlyTiles * SURVEY_SCAN_TILE_VALUE + exploredTiles * SURVEY_EXPLORE_TILE_VALUE;
  if(scannedTiles >= PW(pdata) * PH(pdata)) value += SURVEY_FULL_SCAN_BONUS;
  return Math.floor(value);
}

function getSurveyPayoutBreakdown(){
  let pending = 0;
  const fullBonusBodies = [];
  Object.entries(G.planets || {}).forEach(([pKey, pdata])=>{
    const scanMask = pdata.scanMask || [];
    const explored = pdata.explored || [];
    let scannedTiles = 0;
    let exploredTiles = 0;
    const len = Math.max(scanMask.length, explored.length);
    for(let i=0;i<len;i++){
      if(scanMask[i] || explored[i]) scannedTiles++;
      if(explored[i]) exploredTiles++;
    }
    const full = scannedTiles >= PW(pdata) * PH(pdata);
    const currentValue = getSurveySaleValue(pdata);
    const soldValue = pdata.surveySoldValue || 0;
    if(currentValue > soldValue) pending += currentValue - soldValue;
    if(full && currentValue>0 && soldValue < currentValue){
      const bodyName = findBodyNameByKey(pKey);
      if(bodyName) fullBonusBodies.push(bodyName);
    }
  });
  return { pending, fullBonusBodies };
}

function getPendingSurveySaleValue(){
  return getSurveyPayoutBreakdown().pending;
}

function findBodyNameByKey(pKey){
  const parts = (pKey || '').split(':');
  if(parts.length < 2) return pKey;
  const sysKey = parts[0];
  const pIdx = parseInt(parts[1], 10);
  const sx = parseInt((sysKey.split(',')[0] || ''), 10);
  const sy = parseInt((sysKey.split(',')[1] || ''), 10);
  const cell = Number.isInteger(sx) && Number.isInteger(sy) ? G.galaxy?.[sy]?.[sx] : null;
  const planet = cell?.planets?.[pIdx];
  if(!planet) return pKey;
  if(parts[2] && parts[2].startsWith('m')){
    const moonIdx = parseInt(parts[2].slice(1), 10);
    return planet.moons?.[moonIdx]?.name || pKey;
  }
  return planet.name || pKey;
}

function canLandAt(pdata, x, y){
  if(!pdata) return false;
  if(x<0 || x>=PW(pdata) || y<0 || y>=PH(pdata)) return false;
  const _W=PW(pdata);
  const revealed = (pdata.scanMask && pdata.scanMask[y*_W+x]) || (pdata.visited && pdata.visited[y*_W+x]);
  if(!revealed) return false;
  const cell = pdata.grid?.[y]?.[x];
  if(!cell) return false;
  if(['MINERAL','MINERAL_SAMPLE','ARTIFACT','BIODATA'].includes(cell.type)) return false;
  if(cell.type==='rw_void' || cell.type==='ancient_st_void') return false;
  return TILE[cell.type]?.pass !== false;
}

function ensureScanCursor(pKey){
  const pdata = G.planets[pKey];
  if(!pdata) return;
  const _W=PW(pdata), _H=PH(pdata);
  if(Number.isInteger(G.scanCursorX) && Number.isInteger(G.scanCursorY)
    && G.scanCursorX>=0 && G.scanCursorX<_W
    && G.scanCursorY>=0 && G.scanCursorY<_H){
    return;
  }
  if(canLandAt(pdata, pdata.spawnX, pdata.spawnY)){
    G.scanCursorX = pdata.spawnX;
    G.scanCursorY = pdata.spawnY;
    return;
  }

  let best = null;
  let bestScore = Infinity;
  for(let y=0;y<_H;y++){
    for(let x=0;x<_W;x++){
      if(!canLandAt(pdata, x, y)) continue;
      const score = Math.abs(x - pdata.spawnX) + Math.abs(y - pdata.spawnY);
      if(score < bestScore){
        bestScore = score;
        best = {x,y};
      }
    }
  }
  if(best){
    G.scanCursorX = best.x;
    G.scanCursorY = best.y;
  }
}

function revealScanProgress(pdata, difficulty, scoutBonus){
  const _W=PW(pdata), _H=PH(pdata);
  const total = _W * _H;
  const mask = pdata.scanMask || (pdata.scanMask = new Array(total).fill(false));
  const hidden = [];
  for(let i=0;i<mask.length;i++) if(!mask[i]) hidden.push(i);
  if(!hidden.length) return 1;

  const revealFraction = Math.max(0.025, Math.min(0.16, 0.015 + difficulty * 0.09 + scoutBonus * 0.08));
  let revealBudget = Math.max(10, Math.floor(total * revealFraction));
  revealBudget = Math.min(revealBudget, hidden.length);

  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  const seeds = Math.max(1, Math.min(6, Math.floor(1 + difficulty * 4)));
  const walkers = [];

  for(let i=0;i<seeds && hidden.length;i++){
    const idx = hidden.splice(rnd(hidden.length), 1)[0];
    const x = idx % _W;
    const y = Math.floor(idx / _W);
    mask[idx] = true;
    walkers.push({x,y});
    revealBudget--;
  }

  while(revealBudget > 0 && walkers.length){
    const walker = walkers[rnd(walkers.length)];
    const dir = dirs[rnd(dirs.length)];
    const nx = Math.max(0, Math.min(_W - 1, walker.x + dir[0]));
    const ny = Math.max(0, Math.min(_H - 1, walker.y + dir[1]));
    const idx = ny * _W + nx;
    // Ancient building walls are opaque to orbital scanners — cannot cross or reveal through them
    const nxType = pdata.grid?.[ny]?.[nx]?.type;
    if(nxType === 'ANCIENT_WALL' || nxType === 'ancient_locked_door' || nxType === 'ANCIENT_OUTPOST'){
      // Bounce: remove this walker entirely so budget always decreases and the loop terminates.
      // (A walker trapped inside a walled enclosure would loop forever if we only 'continue'.)
      walkers.splice(walkers.indexOf(walker), 1);
      revealBudget--;
      continue;
    }

    if(!mask[idx]){
      mask[idx] = true;
      revealBudget--;
    }

    walker.x = nx;
    walker.y = ny;

    if(Math.random() < 0.18 + difficulty * 0.2){
      walkers.push({x:nx, y:ny});
      if(walkers.length > 12) walkers.splice(rnd(walkers.length), 1);
    }
  }

  const coverage = getScanCoverage(mask);
  if(coverage >= 0.995){
    for(let i=0;i<mask.length;i++) mask[i] = true;
    return 1;
  }
  return coverage;
}
// ─────────────────────────────────────────────────────────────────
//  VIEW SCAN  (V key in system view — shows satellite imagery)
// ─────────────────────────────────────────────────────────────────
function doViewScan(){
  const body = getSelectedSystemBody();
  if(!body) return;
  const { targetDesc, pKey } = body;
  if(targetDesc.biome==='GAS_GIANT'){
    addLog('Cannot view scan - gas giant has no surface.','lw');
    renderAll(); return;
  }
  if(targetDesc.scanState!=='full' && targetDesc.scanState!=='partial' && DEBUG.preScan !== 1){
    addLog('No scan data available. Scan first.','lw');
    renderAll(); return;
  }

  getOrCreateScanPlanetData(pKey, targetDesc.biome, targetDesc.scanState);
  ensureScanCursor(pKey);
  G.scanViewKey = pKey;
  G._prevMode = G.mode;
  G.mode = 'scanview';
  renderAll();
}
function doScan(){
  const body = getSelectedSystemBody();
  if(!body) return;
  const { targetDesc, pKey } = body;
  if(effectiveSensorRange()===0){
    addLog('Sensors offline. Repair the sensor core before scanning.','lw');
    renderAll();return;
  }

  if(targetDesc.scanState==='full' || DEBUG.preScan === 1){
    if(DEBUG.preScan === 1) targetDesc.scanState = 'full';
    addLog(targetDesc.name+' already fully scanned.','li');
    renderAll(); return;
  }

  if(G.fuel<=0){ addLog('Not enough fuel to run scanners.','lw'); renderAll(); return; }
  if(!DEBUG.infiniteFuel){ G.fuel = Math.max(0, G.fuel-1); G.fuelSpent=(G.fuelSpent||0)+1; }
  beginCareerTurn('scan');
  const B = BIOMES[targetDesc.biome] || {};
  const difficulty = B.scanDifficulty ?? 0.6;
  const bestNavScan  = Math.max(0, ...(G.crew.filter(c=>c.hp>0).map(c=>c.skills?.nav||0)));
  const scoutBonus   = bestNavScan >= 2 ? 0.15 : 0;
  const sensorBonus  = (effectiveSensorRange() - 3) * 0.08;
  // NAV skill: best navigator's skill adds up to +0.20 scan success
  const navScanBonus = bestNavScan * 0.02;
  const roll = Math.random();
  const wasUnscanned = !targetDesc.scanState || targetDesc.scanState==='none' || targetDesc.scanState==='failed';

  if(roll < difficulty + scoutBonus + sensorBonus + navScanBonus){
    if(wasUnscanned)SFX.scan();
    // Every successful paid scan trains navigation; completed-scan browsing is free.
    const navCrewScan = G.crew.filter(c=>c.hp>0).sort((a,b)=>(b.skills?.nav||0)-(a.skills?.nav||0))[0];
    if(targetDesc.biome==='GAS_GIANT'){
      targetDesc.scanState = 'full';
      if(navCrewScan) giveSkillXP(navCrewScan,'nav',2);
      if(wasUnscanned) G.planetsScanned=(G.planetsScanned||0)+1;
      logBodyScanHint(targetDesc);
    } else {
      const pdata = getOrCreateScanPlanetData(pKey, targetDesc.biome, targetDesc.scanState);
      const coverage = revealScanProgress(pdata, difficulty, scoutBonus + sensorBonus);
      if(navCrewScan) giveSkillXP(navCrewScan,'nav',2);
      targetDesc.scanState = coverage >= 1 ? 'full' : 'partial';
      if(wasUnscanned) G.planetsScanned=(G.planetsScanned||0)+1;
      logBodyScanHint(targetDesc,pdata);
    }
  } else if(roll < (difficulty + scoutBonus + navScanBonus)*1.5){
    if(wasUnscanned)SFX.scan();
    if(targetDesc.biome==='GAS_GIANT'){
      targetDesc.scanState = 'partial';
      logBodyScanHint(targetDesc);
    } else {
      const pdata = getOrCreateScanPlanetData(pKey, targetDesc.biome, targetDesc.scanState);
      const coverage = revealScanProgress(pdata, Math.max(0.15, difficulty * 0.55), scoutBonus * 0.5);
      targetDesc.scanState = coverage >= 1 ? 'full' : 'partial';
      logBodyScanHint(targetDesc,pdata);
    }
  } else {
    if(targetDesc.biome!=='GAS_GIANT'){
      const pdata = getOrCreateScanPlanetData(pKey, targetDesc.biome, targetDesc.scanState);
      const coverage = getScanCoverage(pdata.scanMask);
      targetDesc.scanState = coverage > 0 ? (coverage >= 1 ? 'full' : 'partial') : (targetDesc.scanState || 'failed');
    } else {
      targetDesc.scanState = targetDesc.scanState || 'failed';
    }
    addLog('Scan failed. Dense atmosphere or interference. Try again.','lw');
  }

  recordSurveyFinding(body);
  finishCareerTurn();
  renderAll();
}
