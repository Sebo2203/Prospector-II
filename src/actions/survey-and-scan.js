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
  if(!pdata) return 0;
  const scanMask = pdata.scanMask || [];
  const explored = pdata.explored || [];
  let scannedTiles = 0;
  let exploredTiles = 0;
  const len = Math.max(scanMask.length, explored.length);
  for(let i=0;i<len;i++){
    if(scanMask[i]) scannedTiles++;
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
      if(scanMask[i]) scannedTiles++;
      if(explored[i]) exploredTiles++;
    }
    const scanOnlyTiles = Math.max(0, scannedTiles - exploredTiles);
    const baseValue = Math.floor(scanOnlyTiles * SURVEY_SCAN_TILE_VALUE + exploredTiles * SURVEY_EXPLORE_TILE_VALUE);
    const full = scannedTiles >= PW(pdata) * PH(pdata);
    const currentValue = full ? baseValue + SURVEY_FULL_SCAN_BONUS : baseValue;
    const soldValue = pdata.surveySoldValue || 0;
    if(currentValue > soldValue) pending += currentValue - soldValue;
    if(full && soldValue < currentValue){
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
  const { pDesc, targetDesc, pKey } = body;

  if(targetDesc.scanState==='full' || DEBUG.preScan === 1){
    if(DEBUG.preScan === 1) targetDesc.scanState = 'full';
    addLog(targetDesc.name+' already fully scanned.','li');
    renderAll(); return;
  }

  if(G.fuel<=0){ addLog('Not enough fuel to run scanners.','lw'); renderAll(); return; }
  if(!DEBUG.infiniteFuel){ G.fuel = Math.max(0, G.fuel-1); G.fuelSpent=(G.fuelSpent||0)+1; }
  G.turn++;
  const B = BIOMES[targetDesc.biome] || {};
  const difficulty = B.scanDifficulty ?? 0.6;
  const bestNavScan  = Math.max(0, ...(G.crew.filter(c=>c.hp>0).map(c=>c.skills?.nav||0)));
  const scoutBonus   = bestNavScan >= 2 ? 0.15 : 0;
  const sensorBonus  = ((G.shipStats?.sensorRange ?? 3) - 3) * 0.08;
  // NAV skill: best navigator's skill adds up to +0.20 scan success
  const navScanBonus = bestNavScan * 0.02;
  const roll = Math.random();

  if(roll < difficulty + scoutBonus + sensorBonus + navScanBonus){
    // Successful scan — best navigator gains 2 NAV XP
    const navCrewScan = G.crew.filter(c=>c.hp>0).sort((a,b)=>(b.skills?.nav||0)-(a.skills?.nav||0))[0];
    if(navCrewScan) giveSkillXP(navCrewScan, 'nav', 2);
    const wasUnscanned = !targetDesc.scanState || targetDesc.scanState==='failed';
    if(targetDesc.biome==='GAS_GIANT'){
      targetDesc.scanState = 'full';
      if(wasUnscanned) G.planetsScanned=(G.planetsScanned||0)+1;
      addLog('Scan complete: '+targetDesc.name+' - Gas Giant.','lg');
      addLog('Massive hydrogen-helium atmosphere. Cannot land.','li');
      if(pDesc.moons&&pDesc.moons.length){
        addLog(pDesc.moons.length+' moon'+(pDesc.moons.length>1?'s':'')+' detected and catalogued.','lg');
        pDesc.moons.forEach(m=> addLog('  > '+m.name+' ['+BIOMES[m.biome].name+']','li'));
      } else {
        addLog('No moons detected.','li');
      }
    } else {
      const pdata = getOrCreateScanPlanetData(pKey, targetDesc.biome, targetDesc.scanState);
      const coverage = revealScanProgress(pdata, difficulty, scoutBonus + sensorBonus);
      targetDesc.scanState = coverage >= 1 ? 'full' : 'partial';
      if(wasUnscanned) G.planetsScanned=(G.planetsScanned||0)+1;
      const mineralHint = B.minerals>=8 ? 'Rich mineral deposits.' : B.minerals>=4 ? 'Moderate minerals.' : 'Few minerals.';
      const _civScanHint = G.planets[pKey]?.civilization;
      const alienHint   = _civScanHint
        ? _civScanHint.tierLabel+' '+_civScanHint.species+' civilization detected.'
        : B.aliens>=2 ? 'Some lifeforms detected.' : 'Low lifeform readings.';
      const oxyHint     = B.oxyDrain===0 ? 'Breathable atmosphere.' : B.oxyDrain>=2.5 ? 'Hostile atmosphere - suit critical.' : 'Suit required.';
      addLog((coverage >= 1 ? 'Scan complete: ' : 'Scan progress: ')+targetDesc.name,'lg');
      addLog(B.name+'. '+oxyHint,'li');
      addLog(mineralHint+' '+alienHint,'li');
      addLog('Terrain coverage: '+Math.round(coverage*100)+'%.','li');
      // Civilization hint from scan data
      const _civScan = G.planets[pKey]?.civilization;
      if(_civScan) addLog('Civilization detected: '+_civScan.tierLabel+' '+_civScan.species+' ('+_civScan.aggression+').','ll');
    }
  } else if(roll < (difficulty + scoutBonus + navScanBonus)*1.5){
    if(targetDesc.biome==='GAS_GIANT'){
      targetDesc.scanState = 'partial';
      addLog('Partial scan: '+targetDesc.name+' - '+B.name+'. Interference prevents full reading.','lw');
    } else {
      const pdata = getOrCreateScanPlanetData(pKey, targetDesc.biome, targetDesc.scanState);
      const coverage = revealScanProgress(pdata, Math.max(0.15, difficulty * 0.55), scoutBonus * 0.5);
      targetDesc.scanState = coverage >= 1 ? 'full' : 'partial';
      addLog('Partial scan: '+targetDesc.name+' - '+B.name+'.','lw');
      addLog('Terrain coverage: '+Math.round(coverage*100)+'%.','li');
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

  renderAll();
}
