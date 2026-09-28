const DEBUG_GALAXY_OBJ_TYPES = [
  { id:'ROGUE_PLANET',  label:'Rogue Planet',  col:'#2a3050' },
  { id:'PULSAR',        label:'Pulsar',        col:'#00ddaa' },
  { id:'BLACK_HOLE',    label:'Black Hole',    col:'#ff8800' },
  { id:'DERELICT',      label:'Derelict',      col:'#6688aa' },
  { id:'PIRATE_BASE',   label:'Pirate Base',   col:'#bb3311' },
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
    addLog('DEBUG: No civilization on current planet. Press 6 to spawn one.','lw');
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

function cycleArrayIndex(current, len, dir, allowRandom=false){
  const min = allowRandom ? -1 : 0;
  const span = len + (allowRandom ? 1 : 0);
  let next = (current ?? min) + dir;
  if(next < min) next = min + span - 1;
  if(next >= len) next = min;
  return next;
}

function cycleStringChoice(current, values, dir){
  const opts = ['', ...values];
  const idx = Math.max(0, opts.indexOf(current ?? ''));
  return opts[(idx + dir + opts.length) % opts.length];
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

function debugCivSubMenuRows(){
  const tierPick = DEBUG_CIV_TIERS[(DEBUG.debugCivTier||0) % DEBUG_CIV_TIERS.length];
  const tier = tierPick?.id || 'primitive';
  const speciesValue = DEBUG.debugCivSpecies < 0 ? 'Random' : CIV_SPECIES_TYPES[DEBUG.debugCivSpecies % CIV_SPECIES_TYPES.length];
  const rows = [
    { key:'tier', label:'Tier', value:tierPick?.label || 'Primitive' },
    { key:'species', label:'Species', value:speciesValue },
    { key:'aggression', label:'Aggression', value:CIV_AGGRESSION[(DEBUG.debugCivAggression||0) % CIV_AGGRESSION.length] },
  ];
  if(tier === 'primitive'){
    rows.push(
      { key:'primDiet', label:'Diet', value:DEBUG.civPrimDiet < 0 ? 'Random' : PRIM_DIETS[DEBUG.civPrimDiet] },
      { key:'primSocial', label:'Social', value:DEBUG.civPrimSocial < 0 ? 'Random' : PRIM_SOCIAL[DEBUG.civPrimSocial] },
      { key:'primCuriosity', label:'Curiosity', value:DEBUG.civPrimCuriosity < 0 ? 'Random' : PRIM_CURIOSITY[DEBUG.civPrimCuriosity] },
      { key:'primHonor', label:'Honor', value:DEBUG.civPrimHonor < 0 ? 'Random' : PRIM_HONOR[DEBUG.civPrimHonor] },
    );
  } else {
    Object.entries(CIVI_TRAITS[tier] || {}).forEach(([axis, values])=>{
      const debugKey = 'civTrait'+axis[0].toUpperCase()+axis.slice(1);
      rows.push({ key:'trait:'+debugKey, label:axis, value:DEBUG[debugKey] || 'Random', values });
    });
  }
  // Live-edit rows for an already-spawned civ on the current planet
  const pd = debugCurrentPlanetData();
  const liveState = pd?.civilization ? ensureCivilizationState(pd) : null;
  const langVals = ['0','1','2','3','4','5'];
  const alertVals = ['0','1','2','3','4','5'];
  rows.push({ key:'liveLanguage', label:'Language (live)', value: liveState ? String(Math.max(0, Math.min(5, liveState.languageProgress || 0))) : '—', values: langVals, liveOnly: true });
  rows.push({ key:'liveAlert',    label:'Alert (live)',    value: liveState ? String(Math.max(0, Math.min(5, liveState.alert || 0)))             : '—', values: alertVals, liveOnly: true });

  rows.push({ key:'spawn', label:'Spawn civilization', value:'Enter / Space' });
  rows.push({ key:'close', label:'Close submenu', value:'Esc / C' });
  return rows;
}

function debugCivSubMenuApplyRow(row, dir){
  if(!row) return;
  if(row.key === 'tier') DEBUG.debugCivTier = cycleArrayIndex(DEBUG.debugCivTier || 0, DEBUG_CIV_TIERS.length, dir);
  else if(row.key === 'species') DEBUG.debugCivSpecies = cycleArrayIndex(DEBUG.debugCivSpecies ?? -1, CIV_SPECIES_TYPES.length, dir, true);
  else if(row.key === 'aggression') DEBUG.debugCivAggression = cycleArrayIndex(DEBUG.debugCivAggression || 0, CIV_AGGRESSION.length, dir);
  else if(row.key === 'primDiet') DEBUG.civPrimDiet = cycleArrayIndex(DEBUG.civPrimDiet ?? -1, PRIM_DIETS.length, dir, true);
  else if(row.key === 'primSocial') DEBUG.civPrimSocial = cycleArrayIndex(DEBUG.civPrimSocial ?? -1, PRIM_SOCIAL.length, dir, true);
  else if(row.key === 'primCuriosity') DEBUG.civPrimCuriosity = cycleArrayIndex(DEBUG.civPrimCuriosity ?? -1, PRIM_CURIOSITY.length, dir, true);
  else if(row.key === 'primHonor') DEBUG.civPrimHonor = cycleArrayIndex(DEBUG.civPrimHonor ?? -1, PRIM_HONOR.length, dir, true);
  else if(row.key?.startsWith('trait:')) DEBUG[row.key.slice(6)] = cycleStringChoice(DEBUG[row.key.slice(6)], row.values || [], dir);
  else if(row.key === 'liveLanguage'){
    const pd = debugCurrentPlanetData();
    if(!pd?.civilization){ addLog('DEBUG: No civilization on current planet.','lw'); return; }
    const state = ensureCivilizationState(pd);
    const cur = Math.max(0, Math.min(5, state.languageProgress || 0));
    state.languageProgress = Math.max(0, Math.min(5, cur + dir));
  }
  else if(row.key === 'liveAlert'){
    const pd = debugCurrentPlanetData();
    if(!pd?.civilization){ addLog('DEBUG: No civilization on current planet.','lw'); return; }
    const state = ensureCivilizationState(pd);
    const cur = Math.max(0, Math.min(5, state.alert || 0));
    state.alert = Math.max(0, Math.min(5, cur + dir));
    if(state.alert <= 2) state.hostile = false;
  }
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

function drawDebugCivSubMenu(){
  const rows = debugCivSubMenuRows();
  const statusRows = debugCivStatusRows();
  const pad = 10, lh = 22, w = 520;
  const x = canvas.width - w - 8, y = 8;
  const h = pad*2 + (rows.length + statusRows.length + 4)*lh;
  ctx.fillStyle='rgba(0,0,0,0.9)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle='#88ffcc'; ctx.lineWidth=1;
  ctx.strokeRect(x, y, w, h);
  ctx.font='bold 15px Courier New'; ctx.textAlign='left';
  ctx.fillStyle='#88ffcc';
  ctx.fillText('CIV DEBUG SUBMENU', x+pad, y+pad+lh);
  ctx.font='14px Courier New';
  ctx.fillStyle='#aaaacc';
  ctx.fillText('Up/Down select   Left/Right change   Enter spawn   Esc/C close', x+pad, y+pad+lh*2);
  rows.forEach((row, i)=>{
    const yy = y + pad + lh*(i+3);
    const sel = i === (DEBUG.civSubSel || 0);
    ctx.fillStyle = sel ? '#ffe066' : row.key === 'spawn' ? '#90f0a0' : row.key === 'close' ? '#ff8888' : '#cccccc';
    ctx.fillText((sel?'> ':'  ')+row.label+': '+row.value, x+pad, yy);
  });
  const statusTopY = y + pad + lh*(rows.length+3.6);
  ctx.fillStyle = '#223333';
  ctx.fillRect(x+8, statusTopY - 14, w-16, 1);
  ctx.font = '12px Courier New';
  statusRows.forEach((row, i)=>{
    const yy = statusTopY + i*lh;
    ctx.fillStyle = '#667788';
    ctx.fillText(row.label+':', x+pad, yy);
    ctx.fillStyle = '#ccddcc';
    ctx.fillText(row.value, x+pad+130, yy);
  });
}

function debugItemRowsFromCatalog(catalog, type){
  const rows = [];
  catalog.forEach(group=>{
    rows.push({ type:'header', label:group.cat });
    group.items.forEach(item=>rows.push({ type, label:type === 'cargo' ? (COMMODITIES[item]?.name || item) : item.name, item }));
  });
  return rows;
}

function drawDebugItemSubMenu(){
  const leftRows = debugItemRowsFromCatalog(DEBUG_ITEM_CATALOG, 'inventory');
  const rightRows = debugItemRowsFromCatalog(DEBUG_CARGO_CATALOG, 'cargo');
  drawDebugItemSubMenu._leftRows = leftRows;
  drawDebugItemSubMenu._rightRows = rightRows;

  // Fill the entire canvas
  const x = 0, y = 0, w = canvas.width, h = canvas.height;
  const pad = 18, lh = 26, footerH = 28;
  const gap = 16;
  const colW = Math.floor((w - pad * 3 - gap) / 2);

  // Header: title on line 1, legend on line 2, column labels on line 3, divider after
  const titleY  = pad + 22;
  const legendY = titleY + 24;
  const colLblY = legendY + 24;
  const headerH = colLblY + 14;   // divider sits here
  const searchBarH = DEBUG.itemSubSearch !== undefined ? 34 : 0;
  const listTop = headerH + searchBarH;
  const maxVisible = Math.floor((h - listTop - footerH) / lh);

  ctx.fillStyle = '#060810';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 2;
  ctx.strokeRect(x+1, y+1, w-2, h-2);

  ctx.font = 'bold 20px Courier New'; ctx.textAlign = 'left';
  ctx.fillStyle = '#ffe066';
  ctx.fillText('DEBUG — ITEM SUBMENU', x+pad, titleY);

  ctx.font = '14px Courier New';
  ctx.fillStyle = '#7788aa';
  ctx.fillText('←/→ switch column    ↑/↓ select    Enter spawn    F search    Esc / I  close', x+pad, legendY);

  // Column labels — left and right aligned to their column x
  const leftCX  = x + pad;
  const rightCX = x + pad + colW + gap;
  ctx.font = 'bold 13px Courier New';
  ctx.fillStyle = (DEBUG.itemSubCol||'left') === 'left' ? '#88ccff' : '#445566';
  ctx.fillText('── INVENTORY ITEMS ──', leftCX, colLblY);
  ctx.fillStyle = (DEBUG.itemSubCol||'left') === 'right' ? '#88ccff' : '#445566';
  ctx.fillText('── CARGO COMMODITIES ──', rightCX, colLblY);

  ctx.fillStyle = '#223';
  ctx.fillRect(x+4, headerH+2, w-8, 1);

  // Search bar — shown when itemSubSearch is active
  if(DEBUG.itemSubSearch !== undefined){
    const sbY = headerH + 8;
    const sbH = 22;
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(x+pad, sbY, w-pad*2, sbH);
    ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 1;
    ctx.strokeRect(x+pad, sbY, w-pad*2, sbH);
    ctx.font = '14px Courier New';
    ctx.fillStyle = '#aabbcc';
    ctx.fillText('Search: ', x+pad+6, sbY+15);
    ctx.fillStyle = '#ffffff';
    const cursor = Math.floor(Date.now()/500)%2===0 ? '▌' : '';
    ctx.fillText((DEBUG.itemSubSearch||'')+cursor, x+pad+74, sbY+15);
  }

  // Vertical divider
  const divX = x + pad + colW + Math.round(gap/2);
  ctx.fillStyle = '#1a2030';
  ctx.fillRect(divX, listTop+4, 1, maxVisible * lh);

  const drawCol = (rows, colName, cx, selected)=>{
    const active = colName === (DEBUG.itemSubCol || 'left');
    let scrollTop = Math.max(0, selected - Math.floor(maxVisible / 2));
    scrollTop = Math.min(scrollTop, Math.max(0, rows.length - maxVisible));
    const visible = rows.slice(scrollTop, scrollTop + maxVisible);

    ctx.save();
    ctx.beginPath();
    ctx.rect(cx, listTop+4, colW, maxVisible*lh);
    ctx.clip();

    visible.forEach((row, vi)=>{
      const i = scrollTop + vi;
      const yy = listTop + 4 + vi*lh + lh - 6;
      const sel = selected === i && active;
      if(sel){
        ctx.fillStyle = 'rgba(80,68,0,0.9)';
        ctx.fillRect(cx, listTop+4+vi*lh, colW, lh);
        ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 1;
        ctx.strokeRect(cx+0.5, listTop+4+vi*lh+0.5, colW-1, lh-1);
      }
      if(row.type === 'header'){
        ctx.font = 'bold 12px Courier New';
        ctx.fillStyle = '#556633';
        ctx.fillText('── '+String(row.label||'').toUpperCase()+' ──', cx+6, yy);
      } else {
        const itemCol = row.type === 'cargo' ? (COMMODITIES[row.item]?.col||'#aaa') : (row.item.col||'#aaa');
        ctx.fillStyle = itemCol;
        ctx.fillRect(cx+6, yy-14, 10, 10);
        ctx.font = sel ? 'bold 15px Courier New' : '14px Courier New';
        ctx.fillStyle = sel ? '#ffffff' : '#cccccc';
        const label = String(row.label||'');
        ctx.fillText(label.length > 38 ? label.slice(0,37)+'…' : label, cx+22, yy);
      }
    });
    ctx.restore();

    // Scroll indicator — only at bottom
    if(scrollTop + maxVisible < rows.length){
      ctx.font = '13px Courier New';
      ctx.fillStyle = '#667';
      ctx.textAlign = 'center';
      ctx.fillText('▼ more', cx+colW/2, listTop+4+maxVisible*lh+footerH-6);
      ctx.textAlign = 'left';
    }
  };

  drawCol(leftRows, 'left',  leftCX,  DEBUG.itemSubSel  || 0);
  drawCol(rightRows,'right', rightCX, DEBUG.itemSubSelR || 0);
}

function debugItemSubMenuSpawn(){
  if(!G) return;
  const col = DEBUG.itemSubCol || 'left';
  drawDebugItemSubMenu();
  const rows = col === 'right' ? drawDebugItemSubMenu._rightRows : drawDebugItemSubMenu._leftRows;
  const selKey = col === 'right' ? 'itemSubSelR' : 'itemSubSel';
  const row = rows[Math.max(0, Math.min(DEBUG[selKey] || 0, rows.length - 1))];
  if(!row || row.type === 'header') return;
  if(row.type === 'cargo'){
    const commodityId = row.item;
    if(addCargo(makeCommodityItem(commodityId, 'debug', 0))) addLog('DEBUG: Cargo added: '+(COMMODITIES[commodityId]?.name || commodityId)+'.','lg');
  } else {
    G.inventory.push({ ...row.item });
    addLog('DEBUG: Item added: '+row.item.name+'.','lg');
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
    const uwKey = G.curPlanet + '_uw';
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

function drawDebugOverlay(){
  if(DEBUG.civSubMenu){
    drawDebugCivSubMenu();
    return;
  }
  if(DEBUG.itemSubMenu){
    drawDebugItemSubMenu();
    return;
  }
  const pad = 10, lh = 22, w = 430;
  const x = canvas.width - w - 8, y = 8;

  const items = [
    { key:'1', label:'Infinite Fuel',           val: DEBUG.infiniteFuel    },
    { key:'2', label:'Infinite Hull',           val: DEBUG.infiniteHull    },
    { key:'3', label:'Full Vision',             val: DEBUG.fullVision      },
    { key:'4', label:'Infinite O2',             val: DEBUG.infiniteOxy     },
    { key:'7', label:'Infinite Crew HP',        val: DEBUG.infiniteCrewHp  },
    { key:'8', label:'Invisible to enemy ships', val: DEBUG.shipInvisible   },
    { key:'9', label:['Pre-scan debug planets','Pre-scan all planets','Scan no planets'][DEBUG.preScan||0], val: DEBUG.preScan !== 2 },
    { key:'0', label:'FPS Counter',             val: DEBUG.showFPS         },
  ];

  // Total rows: title + items + money + spawner controls + civ + tools + close
  const totalRows = 1 + items.length + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1;
  const h = pad*2 + totalRows*lh;

  ctx.fillStyle='rgba(0,0,0,0.82)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle='#ff4400'; ctx.lineWidth=1;
  ctx.strokeRect(x, y, w, h);

  ctx.font='bold 15px Courier New'; ctx.textAlign='left';

  let row = 0;
  const ly = ()=> y + pad + (row++)*lh + lh; // advance and return y

  ctx.fillStyle='#ff4400';
  ctx.fillText('⚙ DEBUG MODE  #'+getFileHash(), x+pad, ly());

  items.forEach(item=>{
    ctx.fillStyle = item.val ? '#44ff88' : '#666666';
    ctx.fillText('['+item.key+'] '+item.label+': '+(item.val?'ON':'OFF'), x+pad, ly());
  });

  ctx.fillStyle='#ffe066';
  ctx.fillText('[M] +1000 cr  (have: '+G.credits+')', x+pad, ly());

  ctx.fillStyle='#aaddff';
  ctx.fillText('[V] Galaxy Spawn Report', x+pad, ly());

  ctx.fillStyle='#ffaa44';
  const debugBiomes = Object.keys(BIOMES);
  const selBiome = debugBiomes[DEBUG.spawnBiome % debugBiomes.length];
  const spawnModeActive = DEBUG.spawnMode === 'galaxy_obj';
  ctx.fillText('[5] Spawn: '+(spawnModeActive ? 'GALAXY OBJ' : 'System')+'  ◄►: '+selBiome, x+pad, ly());

  // Galaxy object spawn selector
  const selGObj = DEBUG_GALAXY_OBJ_TYPES[DEBUG.spawnGalaxyObj % DEBUG_GALAXY_OBJ_TYPES.length];
  ctx.fillStyle = spawnModeActive ? '#00ddaa' : '#446655';
  ctx.fillText('[X] Galaxy Obj Mode'+(spawnModeActive?' [ON]':' [off]')+'  ◄►: '+selGObj.label, x+pad, ly());

  ctx.fillStyle='#ff6622';
  ctx.fillText('[Enter] → Place next to Starbase', x+pad, ly());

  const civTierNames = DEBUG_CIV_TIERS.map(t=>t.label);
  const civTierLabel = civTierNames[(DEBUG.debugCivTier||0) % civTierNames.length];
  const civAgg = CIV_AGGRESSION[(DEBUG.debugCivAggression||0) % CIV_AGGRESSION.length];
  const civPdata = G.mode==='planet' ? G.planets?.[G.curPlanet] : null;
  const civState = civPdata?.civilization ? civPdata.civilization.tierLabel+' '+civPdata.civilization.species+' / '+civPdata.civilization.aggression+(civPdata.civilization.state?.hostile?' / HOSTILE':'') : 'none';
  ctx.fillStyle = '#88ffcc';
  ctx.fillText('[6] Spawn Civ: '+civTierLabel+' / '+civAgg+'  (current: '+civState+')', x+pad, ly());

  ctx.fillStyle = '#88ccff';
  ctx.fillText('[C] Civ Menu   [T] Tier   [A] Aggression   [Shift+A] Apply', x+pad, ly());

  ctx.fillStyle = '#ff8888';
  ctx.fillText('[K] Toggle Current Civ Hostile/Clear Hostility', x+pad, ly());

  ctx.fillStyle=G.mode==='planet' ? '#ffaaa0' : '#664444';
  ctx.fillText('[G] Spawn Gunner Alien', x+pad, ly());

  ctx.fillStyle=G.mode==='planet' ? '#44ffdd' : '#1a5548';
  ctx.fillText('[N] Regen planet + overlay Ancient Ruins', x+pad, ly());

  ctx.fillStyle='#d488ff';
  ctx.fillText('[R] Rad  [D] Disease  [H] Hallucination', x+pad, ly());

  ctx.fillStyle='#554433';
  ctx.fillText('Shift+B to close', x+pad, ly());

  ctx.textAlign='left';
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

function drawDebugGalaxyReportPopup(){
  const rows = buildDebugGalaxyReportRows();
  const w = 660, pad = 16, lh = 22;
  const h = pad*2 + 46 + rows.length*lh + 26;
  const x = Math.floor((canvas.width - w)/2);
  const y = Math.floor((canvas.height - h)/2);
  ctx.fillStyle='rgba(0,0,0,0.9)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='rgba(4,10,18,0.98)';
  ctx.fillRect(x,y,w,h);
  ctx.strokeStyle='#44aaff';
  ctx.lineWidth=2;
  ctx.strokeRect(x,y,w,h);
  ctx.font='bold 20px Courier New';
  ctx.textAlign='left';
  ctx.fillStyle='#aaddff';
  ctx.fillText('GALAXY SPAWN REPORT', x+pad, y+pad+22);
  ctx.font='13px Courier New';
  ctx.fillStyle='#6688aa';
  ctx.fillText('Generated and current galaxy population.  ESC / V closes.', x+pad, y+pad+42);
  ctx.font='bold 14px Courier New';
  let yy = y + pad + 72;
  rows.forEach(([label,value])=>{
    ctx.fillStyle='#88ccff';
    ctx.fillText(label, x+pad, yy);
    ctx.fillStyle='#ddddcc';
    ctx.fillText(String(value), x+210, yy);
    yy += lh;
  });
  ctx.textAlign='left';
  ctx.lineWidth=1;
}

function debugSpawnSystem(){
  if(G.mode !== 'galaxy') { addLog('Debug spawn only works on galaxy map.','lw'); renderAll(); return; }

  const biomeKeys = Object.keys(BIOMES);
  const biomeKey  = biomeKeys[DEBUG.spawnBiome % biomeKeys.length];
  const B = BIOMES[biomeKey];

  // Place next to Starbase Alpha — find nearest VOID tile
  const homeBase = (G.bases||[]).find(b=>b.name==='Starbase Alpha') || G.bases?.[0];
  const bx=homeBase?.x ?? Math.floor(MAP_W/2), by=homeBase?.y ?? Math.floor(MAP_H/2);
  const offsets=[[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[0,2],[0,-2],[1,1],[-1,1],[1,-1],[-1,-1],[3,0],[-3,0],[0,3],[0,-3]];
  let placed=false;
  for(const [dx,dy] of offsets){
    const tx=bx+dx, ty=by+dy;
    if(tx<1||tx>=MAP_W-1||ty<1||ty>=MAP_H-1) continue;
    if(G.galaxy[ty][tx].type!=='VOID') continue;

    // Build planet descriptor
    const sysName = 'Debug-'+biomeKey;
    // Skip CAVE as a standalone planet — caves only exist inside other planets
    const _skipBiomes = ['CAVE'];
    if(_skipBiomes.includes(biomeKey)){ addLog('DEBUG: CAVE is not a standalone planet — spawn a rocky biome and enter it.','li'); placed=true; break; }
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
    placed=true;
    break;
  }
  if(!placed) addLog('DEBUG: No VOID tile near starbase to spawn into.','lw');
  renderAll();
}

function debugSpawnGalaxyObj(){
  if(G.mode !== 'galaxy'){ addLog('DEBUG: Galaxy object spawn only works on galaxy map.','lw'); renderAll(); return; }
  const objType = DEBUG_GALAXY_OBJ_TYPES[DEBUG.spawnGalaxyObj % DEBUG_GALAXY_OBJ_TYPES.length];
  const homeBase = (G.bases||[]).find(b=>b.name==='Starbase Alpha') || G.bases?.[0];
  const bx = homeBase?.x ?? Math.floor(MAP_W/2);
  const by = homeBase?.y ?? Math.floor(MAP_H/2);
  const offsets = [[2,0],[-2,0],[0,2],[0,-2],[3,0],[-3,0],[0,3],[0,-3],[2,1],[-2,1],[2,-1],[-2,-1],[1,2],[-1,2],[1,-2],[-1,-2]];
  let placed = false;
  for(const [dx,dy] of offsets){
    const tx=bx+dx, ty=by+dy;
    if(tx<1||tx>=MAP_W-1||ty<1||ty>=MAP_H-1) continue;
    if(G.galaxy[ty][tx].type !== 'VOID') continue;

    let cellData;
    if(objType.id === 'ROGUE_PLANET'){
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

    if(cellData){
      G.galaxy[ty][tx] = cellData;
      G.visited[ty*MAP_W+tx] = true;
      addLog('DEBUG: Spawned '+objType.label+' at ('+tx+','+ty+').','lg');
      placed = true;
    }
    break;
  }
  if(!placed) addLog('DEBUG: No VOID tile near starbase for galaxy object.','lw');
  renderAll();
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

