const debugDialog = document.getElementById('debug-dialog');
const debugPlaygroundButton = document.getElementById('debug-playground-button');
const debugContent = document.getElementById('debug-content');
const debugNavigation = document.getElementById('debug-navigation');
const DEBUG_SCAN_MODES = ['Pre-scan debug planets', 'Pre-scan all planets', 'Scan no planets'];

function debugElement(tag, label, parent){
  const element = document.createElement(tag);
  element.textContent = label;
  parent.append(element);
  return element;
}

function debugButton(parent, label, action, disabled=false){
  const button = debugElement('button', label, parent);
  button.type = 'button';
  button.disabled = disabled;
  button.addEventListener('click', action);
  return button;
}

function debugSection(parent, title){
  const section = debugElement('section', '', parent);
  debugElement('h3', title, section);
  return section;
}

function debugSelect(parent, label, options, value, change, disabled=false){
  const field = debugElement('label', label, parent);
  field.className = 'debug-field';
  const select = debugElement('select', '', field);
  select.setAttribute('aria-label', label);
  options.forEach(([key, text])=>debugElement('option', text, select).value = key);
  select.value = value;
  select.disabled = disabled;
  select.addEventListener('change', ()=>change(select.value));
  return select;
}

function debugIndexedOptions(values, random=false){
  const options = values.map((value, index)=>[index, value]);
  if(random) options.unshift([-1, 'Random']);
  return options;
}

function openDebugMenu(){
  if(!G || AUTOSAVE_STATE.transition || AUTOSAVE_STATE.loading || debugDialog.open) return;
  DEBUG.on = true;
  showDebugMenu('tools');
  debugDialog.showModal();
}

function closeDebugMenu(){
  DEBUG.on = false;
  if(debugDialog.open) debugDialog.close();
}

function dismissDebugMenu(){
  closeDebugMenu();
  if(G) drawCanvas();
}

debugDialog.addEventListener('cancel', event=>{
  event.preventDefault();
  dismissDebugMenu();
});
debugPlaygroundButton.addEventListener('click', ()=>{
  debugPlaygroundButton.blur();
  openDebugMenu();
});

function showDebugMenu(page, confirmation){
  const titles = {
    tools:'Debug Tools', items:'Spawn Gear and Cargo', civilization:'Civilization',
    directory:'Find a Playground Sample', report:'Galaxy Spawn Report', confirm:'Confirm Debug Action',
  };
  debugDialog.classList.toggle('debug-catalog', page==='items' || page==='directory');
  document.getElementById('debug-title').textContent = titles[page];
  debugNavigation.replaceChildren();
  if(page!=='tools') debugButton(debugNavigation, 'Back to Tools', ()=>showDebugMenu('tools'));
  debugButton(debugNavigation, 'Close', dismissDebugMenu);
  debugContent.replaceChildren();
  debugContent.scrollTop = 0;

  if(page==='tools') drawDebugTools();
  else if(page==='items') drawDebugItemList();
  else if(page==='civilization') drawDebugCivilizationTools();
  else if(page==='directory') drawDebugSampleDirectory();
  else if(page==='report'){
    const list = debugElement('dl', '', debugContent);
    buildDebugGalaxyReportRows().forEach(([label, value])=>{
      debugElement('dt', label, list);
      debugElement('dd', value, list);
    });
  } else {
    debugElement('p', confirmation.message, debugContent);
    debugButton(debugContent, 'Cancel', ()=>showDebugMenu(confirmation.back));
    debugButton(debugContent, confirmation.label, confirmation.action);
  }
}

function debugConfirm(back, message, label, action){
  showDebugMenu('confirm', {back, message, label, action:()=>{
    showDebugMenu(back);
    action();
  }});
}

function debugLogAction(action, refresh){
  const before = logDisplayText(G.log[0]);
  action();
  refresh?.();
  const status = document.getElementById('debug-action-status');
  const after = logDisplayText(G.log[0]);
  if(status && after!==before) status.textContent = after;
}

function drawDebugTools(){
  const grid = debugElement('div', '', debugContent);
  grid.className = 'debug-grid';
  const toggles = debugSection(grid, 'Toggles');
  const switches = debugElement('div', '', toggles);
  switches.className = 'debug-switches';
  const flags = [
    ['infiniteFuel', 'Infinite fuel'], ['infiniteHull', 'Infinite hull'],
    ['infiniteOxy', 'Infinite oxygen'], ['infiniteCrewHp', 'Infinite crew HP'],
    ['fullVision', 'Full vision'], ['shipInvisible', 'Invisible to enemy ships'],
    ['showFPS', 'FPS counter'], ['combatLog', 'Combat logging'],
  ];
  for(const [key, label] of flags){
    const row = debugElement('label', '', switches);
    row.className = 'debug-toggle';
    const checkbox = debugElement('input', '', row);
    checkbox.type = 'checkbox';
    checkbox.checked = DEBUG[key];
    row.append(label);
    checkbox.addEventListener('change', ()=>{
      DEBUG[key] = checkbox.checked;
      if(key==='fullVision' && checkbox.checked) G.visited.fill(true);
      if(key==='infiniteCrewHp'){
        debugRestoreCrewHp();
        addLog('DEBUG: Infinite crew HP '+(checkbox.checked?'ON':'OFF')+'.','lw');
      }
      if(key==='shipInvisible') addLog('DEBUG: Invisible to enemy ships '+(checkbox.checked?'ON':'OFF')+'.','lw');
      renderAll();
    });
  }
  debugSelect(toggles, 'Planet pre-scan', debugIndexedOptions(DEBUG_SCAN_MODES), DEBUG.preScan, value=>{
    DEBUG.preScan = Number(value);
    addLog('DEBUG: '+DEBUG_SCAN_MODES[DEBUG.preScan]+'.','lw');
    renderAll();
  });
  debugButton(toggles, 'Download Combat Log', ()=>debugLogAction(debugCombatLogDownload, renderAll));

  const spawn = debugSection(grid, 'Spawn Near Starbase Alpha');
  const inGalaxy = G.mode==='galaxy';
  debugSelect(spawn, 'System biome', debugIndexedOptions(Object.keys(BIOMES)), DEBUG.spawnBiome,
    value=>DEBUG.spawnBiome=Number(value), !inGalaxy);
  debugButton(spawn, 'Spawn System', ()=>debugLogAction(debugSpawnSystem), !inGalaxy);
  debugSelect(spawn, 'Galaxy object', debugIndexedOptions(DEBUG_GALAXY_OBJ_TYPES.map(object=>object.label)),
    DEBUG.spawnGalaxyObj, value=>DEBUG.spawnGalaxyObj=Number(value), !inGalaxy);
  debugButton(spawn, 'Spawn Galaxy Object', ()=>debugLogAction(debugSpawnGalaxyObj), !inGalaxy);
  debugButton(spawn, 'Galaxy Spawn Report', ()=>showDebugMenu('report'));

  const career = debugSection(grid, 'Items, Crew, and Surface');
  debugButton(career, 'Spawn Gear or Cargo', ()=>showDebugMenu('items'));
  debugButton(career, 'Add 1,000 Credits', ()=>debugLogAction(()=>{
    G.credits += 1000;
    addLog('DEBUG: +1000 cr (total: '+G.credits+')','lw');
    renderAll();
  }));
  for(const [key, label] of [['radiation','Radiation'], ['disease','Disease'], ['hallucination','Hallucination']]){
    debugButton(career, 'Apply '+label, ()=>debugLogAction(()=>debugApplyCrewStatus(key)));
  }
  const onSurface = !!debugCurrentPlanetData();
  debugButton(career, 'Civilization Tools', ()=>showDebugMenu('civilization'), !onSurface);
  debugButton(career, 'Spawn Gunner Alien', ()=>debugLogAction(debugSpawnGunnerAlien), !onSurface);
  debugButton(career, 'Regenerate Surface with Ruins', ()=>debugConfirm('tools',
    'Replace the current surface map and its inhabitants?', 'Regenerate Surface',
    ()=>debugLogAction(debugRegenWithAncientRuins)), !onSurface);

  const playground = debugSection(grid, 'Playground');
  toggles.after(playground);
  const sandbox = G.debugPalette;
  debugElement('p', sandbox ? 'Disposable test world' : 'Open a test world with its own crew and ship.', playground);
  debugButton(playground, 'Galaxy Gallery', ()=>enterDebugGallery('galaxy'));
  debugButton(playground, 'Surface Gallery', ()=>enterDebugGallery('surface'));
  debugButton(playground, 'Find a Sample', ()=>{
    if(!G.debugPalette){
      enterDebugGallery('galaxy');
      openDebugMenu();
    }
    showDebugMenu('directory');
  });
  if(sandbox){
    const simulation = debugButton(playground, '', ()=>{
      sandbox.simulate = !sandbox.simulate;
      updateSimulationLabel();
      renderAll();
    });
    const updateSimulationLabel = ()=>{
      simulation.textContent = sandbox.simulate ? 'Pause NPCs' : 'Run NPCs Live';
    };
    updateSimulationLabel();
    debugButton(playground, 'Rebuild Playground', ()=>debugConfirm('tools',
      'Discard changes in the playground and rebuild both galleries?', 'Rebuild Galleries',
      ()=>enterDebugGallery('galaxy', true)));
    debugButton(playground, 'Return to Career', ()=>debugReturnFromPalette());
  }
  debugElement('p', '', debugContent).id = 'debug-action-status';
  debugElement('small', 'Build #'+getFileHash(), debugContent);
}

function enterDebugGallery(area, rebuild=false){
  closeDebugMenu();
  debugEnterPalette(area, rebuild);
}

function debugSearchList(rows, placeholder, activate){
  const search = debugElement('input', '', debugContent);
  search.type = 'search';
  search.placeholder = placeholder;
  search.setAttribute('aria-label', placeholder);
  const results = debugElement('div', '', debugContent);
  results.className = 'debug-results';
  function updateResults(){
    const query = search.value.toLowerCase().trim();
    const matching = rows.filter(row=>row.search.toLowerCase().includes(query));
    results.replaceChildren();
    results.scrollTop = 0;
    if(!matching.length) debugElement('p', 'No matches', results);
    for(const row of matching){
      const button = debugButton(results, row.label, ()=>activate(row));
      debugElement('small', row.group, button);
    }
  }
  search.addEventListener('input', updateResults);
  updateResults();
}

function drawDebugItemList(){
  debugElement('p', '', debugContent).id = 'debug-action-status';
  const rows = [
    ...DEBUG_ITEM_CATALOG.flatMap(({cat, items})=>items.map(item=>({
      item, type:'inventory', group:cat, label:item.name, search:cat+' '+item.name,
    }))),
    ...DEBUG_CARGO_CATALOG.flatMap(({cat, items})=>items.map(item=>({
      item, type:'cargo', group:'Cargo / '+cat, label:COMMODITIES[item]?.name || item,
      search:'cargo '+cat+' '+(COMMODITIES[item]?.name || item),
    }))),
  ];
  debugSearchList(rows, 'Filter gear or cargo', row=>debugLogAction(()=>debugSpawnItem(row)));
}

function drawDebugSampleDirectory(){
  const rows = G.debugPalette.entries.map(entry=>({
    ...entry, group:entry.kind, search:entry.kind+' '+entry.label+' '+entry.id,
  }));
  debugSearchList(rows, 'Filter samples', row=>debugPaletteVisit(row.id));
}

function drawDebugCivilizationTools(){
  const civilization = debugCurrentPlanetData()?.civilization;
  const grid = debugElement('div', '', debugContent);
  grid.className = 'debug-grid';
  const setup = debugSection(grid, 'Spawn Settings');
  const tier = DEBUG_CIV_TIERS[DEBUG.debugCivTier].id;
  const setIndex = (key, value)=>DEBUG[key]=Number(value);
  debugSelect(setup, 'Tier', debugIndexedOptions(DEBUG_CIV_TIERS.map(item=>item.label)), DEBUG.debugCivTier, value=>{
    setIndex('debugCivTier', value);
    showDebugMenu('civilization');
  });
  debugSelect(setup, 'Species', debugIndexedOptions(CIV_SPECIES_TYPES, true), DEBUG.debugCivSpecies,
    value=>setIndex('debugCivSpecies', value));
  debugSelect(setup, 'Aggression', debugIndexedOptions(CIV_AGGRESSION), DEBUG.debugCivAggression,
    value=>setIndex('debugCivAggression', value));

  if(tier==='primitive'){
    for(const [key, label, options] of [
      ['civPrimDiet', 'Diet', PRIM_DIETS], ['civPrimSocial', 'Social', PRIM_SOCIAL],
      ['civPrimCuriosity', 'Curiosity', PRIM_CURIOSITY], ['civPrimHonor', 'Honor', PRIM_HONOR],
    ]){
      debugSelect(setup, label, debugIndexedOptions(options, true), DEBUG[key], value=>setIndex(key, value));
    }
  } else {
    for(const [axis, values] of Object.entries(CIVI_TRAITS[tier] || {})){
      const key = 'civTrait'+axis[0].toUpperCase()+axis.slice(1);
      debugSelect(setup, axis, [['','Random'], ...values.map(value=>[value,value])],
        values.includes(DEBUG[key]) ? DEBUG[key] : '', value=>DEBUG[key]=value);
    }
  }
  const spawn = ()=>debugLogAction(debugSpawnCivilizationOnCurrentPlanet, ()=>showDebugMenu('civilization'));
  debugButton(setup, 'Spawn Civilization', ()=>{
    if(civilization) debugConfirm('civilization', 'Replace the current civilization on this surface?', 'Replace Civilization', spawn);
    else spawn();
  });

  const live = debugSection(grid, 'Current Civilization');
  debugElement('p', '', debugContent).id = 'debug-action-status';
  if(!civilization){
    debugElement('p', 'No civilization on this surface.', live);
    return;
  }
  const refresh = ()=>showDebugMenu('civilization');
  const civState = ensureCivilizationState(debugCurrentPlanetData());
  const status = debugElement('dl', '', live);
  for(const {label, value} of debugCivStatusRows()){
    debugElement('dt', label, status);
    debugElement('dd', value, status);
  }
  const levels = debugIndexedOptions(['0','1','2','3','4','5']);
  debugSelect(live, 'Language level', levels, Math.min(5, civState.languageProgress || 0), value=>{
    civState.languageProgress = Number(value);
    renderAll();
    refresh();
  });
  debugSelect(live, 'Alert level', levels, Math.min(5, civState.alert || 0), value=>{
    civState.alert = Number(value);
    if(civState.alert<=2) civState.hostile = false;
    renderAll();
    refresh();
  });
  debugButton(live, 'Apply Selected Aggression', ()=>debugLogAction(debugApplySelectedCivAggression, refresh));
  debugButton(live, civState.hostile ? 'Clear Hostility' : 'Force Hostility',
    ()=>debugLogAction(debugToggleCurrentCivHostile, refresh));
}
