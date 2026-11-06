// ─────────────────────────────────────────────────────────────────
//  SAVE / LOAD / AUTOSAVE
//
//  Three mechanisms:
//    autoSave()      — commits a captured snapshot to IndexedDB
//    saveToFile()    — downloads G as prospector_save.json
//    loadFromFile()  — reads a .json file the player picks
//    loadFromStorage()— restores IndexedDB, with legacy localStorage import
//
//  G.visited is a plain Array (JSON-safe).
//  Everything else in G is primitives, arrays, plain objects — safe.
// ─────────────────────────────────────────────────────────────────
const SAVE_KEY = 'prospector_autosave';
const AUTOSAVE_STATE={phase:'idle',record:null,error:null,notice:'',ready:false,revision:0,loading:false};
let autosaveTimer=null,saveLoadGeneration=0;
const autosaveQueue=createAutosaveQueue(writeAutosaveRecord,(phase,record,error)=>{
  AUTOSAVE_STATE.phase=phase;AUTOSAVE_STATE.error=error||null;
  if(phase==='saved'){AUTOSAVE_STATE.record=record;AUTOSAVE_STATE.ready=true;AUTOSAVE_STATE.revision++;}
  renderAutosaveStatus();
});

function beginAutosaveCareer(){
  saveLoadGeneration++;AUTOSAVE_STATE.loading=false;AUTOSAVE_STATE.notice='';
  setSaveTransition(false);
}

function setSaveTransition(active){
  AUTOSAVE_STATE.transition=active;
  const root=document.getElementById('root');if(root)root.style.pointerEvents=active?'none':'';
}

function renderAutosaveStatus(){
  const state=AUTOSAVE_STATE,badge=document.getElementById('save-state'),notice=document.getElementById('save-notice');
  const sandbox=!!G?.debugPalette;
  if(badge){
    badge.textContent=sandbox?'DEBUG — career autosave protected':state.phase==='error'?'AUTOSAVE FAILED':
      state.phase==='saving'||autosaveTimer?'Saving…':state.record?'Saved':'';
    badge.dataset.phase=autosaveTimer?'saving':state.phase;
  }
  if(!notice)return;
  notice.hidden=sandbox||!(state.error||state.notice);
  const text=document.getElementById('save-notice-text');
  const conflict=state.error?.name==='AutosaveConflict';
  if(text)text.textContent=conflict?state.error.message:state.error?'Autosave failed. '+(state.record?'Your last good save is preserved. ':'Progress is not saved yet. ')+'Retry or export your current game.':state.notice;
  notice.title=state.error?.message||'';
  const retry=document.getElementById('save-retry');if(retry)retry.hidden=!state.error||conflict;
  const newer=document.getElementById('save-load-newer');if(newer)newer.hidden=!conflict;
  const dismiss=document.getElementById('save-notice-dismiss');if(dismiss)dismiss.hidden=!!state.error;
}

function scheduleAutoSave(){
  if(!G?.galaxy || G.debugPalette)return;
  // Bounded delay: rapid actions share a snapshot; a held key cannot postpone
  // saving indefinitely. Animation-only drawCanvas calls never save.
  if(!autosaveTimer)autosaveTimer=setTimeout(()=>{autosaveTimer=null;void autoSave();},200);
  renderAutosaveStatus();
}

function autoSave(){
  if(autosaveTimer){clearTimeout(autosaveTimer);autosaveTimer=null;}
  if(!G || G.debugPalette)return Promise.resolve(true);
  try {
    // Capture now: queued writes never read a later game or debug world.
    return autosaveQueue.save(makeAutosaveRecord(JSON.stringify(G)));
  } catch(e) {
    AUTOSAVE_STATE.phase='error';AUTOSAVE_STATE.error=e;renderAutosaveStatus();
    return Promise.resolve(false);
  }
}

function hasSave(){
  if(AUTOSAVE_STATE.ready)return !!AUTOSAVE_STATE.record;
  try { const raw=localStorage.getItem(SAVE_KEY);return !!raw && !!parseSaveSnapshot(raw); }
  catch(e){ return false; }
}

async function readStoredAutosave(){
  let slots,error;
  try{slots=await readAutosaveSlots();}catch(e){error=e;}
  const selected=selectAutosaveRecord(slots?.current,slots?.previous);
  if(selected)return {...selected,source:'database',baseToken:autosaveRecordToken(slots.current)};
  try{
    const raw=localStorage.getItem(SAVE_KEY);
    if(raw){const record=makeAutosaveRecord(raw);return {record,source:'legacy',recovered:!!(slots?.current||slots?.previous),storageError:error,baseToken:autosaveRecordToken(slots?.current)};}
  }catch(e){if(!error)error=e;}
  if(error)throw error;
  if(slots?.current||slots?.previous)throw new Error('Neither autosave copy is readable. Import a saved file to recover.');
  return null;
}

async function refreshSavedGameMenu(){
  const revision=AUTOSAVE_STATE.revision;
  try{
    const saved=await readStoredAutosave();
    if(revision===AUTOSAVE_STATE.revision){
      AUTOSAVE_STATE.record=saved?.record||null;AUTOSAVE_STATE.ready=true;
      if(G===null && !autosaveQueue.busy){autosaveBaseKnown=true;autosaveExpectedToken=saved?.baseToken||null;}
    }
    if(saved?.storageError)throw saved.storageError;
  }catch(error){AUTOSAVE_STATE.error=error;AUTOSAVE_STATE.phase='error';}
  if(G===null){MENU_STATE.hasAutosave=hasSave();drawMenuScreen();}
  renderAutosaveStatus();
}

async function retryAutosave(){
  if(G && !G.debugPalette)await autoSave();
  else {AUTOSAVE_STATE.error=null;await refreshSavedGameMenu();}
}

async function saveToFile(){
  if(G?.debugPalette){addLog('DEBUG: Use Return to Career in the Playground menu before exporting a save.','li');renderAll();return;}
  const active=G;
  try {
    const raw = active ? JSON.stringify(active) : (await readStoredAutosave())?.record.raw;
    if(!raw) throw new Error('No save data');
    const json = JSON.stringify(JSON.parse(raw), null, 2);
    const blob = new Blob([json], {type:'application/json'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'prospector_save.json';
    a.click();
    URL.revokeObjectURL(url);
    if(active && G===active){
      void autoSave();
      addLog('Game saved to file.','lg');
      renderAll();
    } else if(!G){
      alert('Autosave exported to file.');
      drawMenuScreen();
    }
  } catch(e) {
    if(G) addLog('Save to file failed.','lw');
    else alert('No active or autosaved game to save yet.');
  }
}

function installSaveSnapshot(loaded){
  const before=G;
  try{
    G=loaded;
    delete G._expeditionPanel;
    ensureExpeditionState();
    restoreStrandedShipMarkers();
    removeInteriorOreDeposits(G.planets);
    // Back-compat: old saves won't have shipStats or cargo
    if(!G.shipStats) G.shipStats = buildShipStats('LIGHT_SCOUT');
    if(!G.cargo)     G.cargo = [];
    if(G.maxFuel === undefined) G.maxFuel = G.shipStats.maxFuel;
    if(!G.installedWeapons){
      G.installedWeapons = [];
      if((G.shipStats.weaponSlots||0) > 0)
        G.installedWeapons[0] = (G.shipStats.classId === 'ATTACK_CORVETTE') ? 'railgun' : 'mass_driver';
    }
    if(!G.installedModules) G.installedModules = [];
    if(!G.seed) G.seed = Math.floor(Math.random() * 0xFFFFFF); // back-compat
    // Patch pirate bases — old saves lack hp/destroyed/lastRespawn
    if(G.pirateBases) G.pirateBases.forEach(pb=>{
      if(pb.hp === undefined)   pb.hp         = 1000;
      if(pb.maxHp === undefined) pb.maxHp     = 1000;
      if(pb.destroyed === undefined) pb.destroyed = false;
      if(pb.lastRespawn === undefined) pb.lastRespawn = 0;
    });
    if(G.pirateBases && G._pirateGuardPerBaseTarget === undefined){
      const guardTarget = G._pirateGuardTarget || scaledGalaxyCount(8, 5);
      G._pirateGuardPerBaseTarget = Math.max(1, Math.ceil(guardTarget / 2));
      G._pirateGuardTarget = G._pirateGuardPerBaseTarget * Math.max(1, G.pirateBases.length);
    }
    // Patch pirates — old saves lack pirateType / chase state
    if(G.pirates) G.pirates.forEach(p=>{
      if(!p.pirateType) p.pirateType = 'guard';
      if(p._chaseTurns === undefined) p._chaseTurns = 0;
    });
    // Patch gas entities — absent in saves before this feature
    if(!G.gasEntities) G.gasEntities = [];
    // Patch nebula loot — absent in saves before this feature
    if(!G.nebulaLoot) G.nebulaLoot = [];
    if(G._bonusMoves === undefined) G._bonusMoves = 0;
    if(!G.npcStranded) G.npcStranded = [];
    if(G._caveReturn===undefined) G._caveReturn=null;
    if(!G.derelicts) G.derelicts = [];
    if(G._ancientStationPlaced===undefined) G._ancientStationPlaced=false;
    // _specialPlanetType/_specialPlanetPlaced removed: specials now roll independently per planet.
    if(!G._stationCorps){
      const _corpPool = CORPORATIONS.slice().sort(() => Math.random() - 0.5);
      G._stationCorps = {
        'Starbase Alpha': _corpPool[0].id,
        'Waypoint Omega':  _corpPool[1].id,
      };
    }
    if(G.planets) Object.entries(G.planets).forEach(([key,p])=>{
      // (small station migration removed)
    });
    // Patch crew — old saves won't have skills or _skillXp
    if(G.crew) G.crew.forEach(c=>{
      if(!c.skills){
        const base = ROLE_STARTING_SKILLS[c.role] || { nav:0, sci:0, cbt:0, soc:0, med:0, eng:0 };
        c.skills = { ...base };
      }
      if(c.skills.com !== undefined){
        if(c.skills.cbt === undefined) c.skills.cbt = c.skills.com;
        if(c.skills.soc === undefined) c.skills.soc = c.role === 'captain' ? Math.max(4, c.skills.com) : Math.max(0, Math.floor(c.skills.com/2));
        delete c.skills.com;
      }
      ['nav','sci','cbt','soc','med','eng'].forEach(sk=>{ if(c.skills[sk] === undefined) c.skills[sk] = 0; });
      if(!c._skillXp) c._skillXp = {};
      if(c._skillXp.com !== undefined){
        c._skillXp.cbt = (c._skillXp.cbt || 0) + c._skillXp.com;
        delete c._skillXp.com;
      }
      if(!c.statuses) c.statuses = {};
    });
    ensureCrewStatusState();
    return G;
  }catch(error){G=before;throw error;}
}

function loadFromFile(){
  if(G?.debugPalette){addLog('DEBUG: Use Return to Career in the Playground menu before loading a save.','li');renderAll();return;}
  const generation=++saveLoadGeneration;
  const input = document.createElement('input');
  input.type  = 'file';
  input.accept= '.json,application/json';
  input.onchange = e => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const before=G;
      try {
        const loaded = parseSaveSnapshot(ev.target.result);
        if(generation!==saveLoadGeneration || G?.debugPalette)return;
        setSaveTransition(true);
        await autosaveQueue.idle();
        if(generation!==saveLoadGeneration || G?.debugPalette)return;
        installSaveSnapshot(loaded);
        addLog('Save file loaded. Welcome back, Captain.','lg');
        await loadSprites();
        if(generation!==saveLoadGeneration)return;
        restoreGameUI();renderAll();await autoSave();
      } catch(err) {
        if(generation===saveLoadGeneration)G=before;
        alert('Could not load save file: ' + err.message);
      } finally {
        setSaveTransition(false);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

async function loadFromStorage(){
  if(G?.debugPalette)return false;
  const generation=++saveLoadGeneration,before=G;
  try {
    await autosaveQueue.idle();
    const saved=await readStoredAutosave();
    if(!saved || generation!==saveLoadGeneration)return false;
    const loaded = parseSaveSnapshot(saved.record.raw);
    installSaveSnapshot(loaded);
    autosaveBaseKnown=true;autosaveExpectedToken=saved.baseToken;
    AUTOSAVE_STATE.record=saved.record;AUTOSAVE_STATE.ready=true;
    if(!saved.storageError){AUTOSAVE_STATE.error=null;AUTOSAVE_STATE.phase='saved';}
    if(saved.recovered)AUTOSAVE_STATE.notice='Recovered the previous autosave: '+saved.record.summary.captain+', turn '+saved.record.summary.turn+'. Export a copy to keep it.';
    if(saved.storageError){AUTOSAVE_STATE.error=saved.storageError;AUTOSAVE_STATE.phase='error';}
    addLog('Autosave restored. Welcome back, Captain.','lg');
    renderAutosaveStatus();
    return true;
  } catch(e){
    if(generation===saveLoadGeneration)G=before;
    AUTOSAVE_STATE.error=e;AUTOSAVE_STATE.phase='error';renderAutosaveStatus();return false;
  }
}

// Wrapper used by menu — reloads sprites before rendering after a load
async function loadAndRender(loadFn){
  const ok = await loadFn();
  if(ok){
    const loaded=G;await loadSprites();if(G!==loaded)return false;
    restoreGameUI();renderAll();
  }
  return ok;
}

async function continueSavedGame(){
  if(AUTOSAVE_STATE.loading)return;
  AUTOSAVE_STATE.loading=true;setSaveTransition(true);
  const generation=saveLoadGeneration+1,before=G;
  try{
    if(!await loadAndRender(loadFromStorage) && generation===saveLoadGeneration){
      if(before){restoreGameUI();renderAll();}else showMenu();
    }
  }
  finally{AUTOSAVE_STATE.loading=false;setSaveTransition(false);}
}

async function quitGame(){
  if(AUTOSAVE_STATE.transition)return;
  if(G?.debugPalette)debugReturnFromPalette(false);
  const career=G;setSaveTransition(true);
  try{
    if(G && !await autoSave())return;
    if(!await autosaveQueue.idle() || G!==career)return;
    try {
      const invoke = window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke;
      if(invoke){await invoke('quit_app');return;}
    }catch(e){}
    try{window.close();}catch(e){}
    setTimeout(()=>{
      if(document.visibilityState!=='hidden')alert('Your browser blocked automatic tab closing. You can close this tab now.');
    },150);
  }finally{setSaveTransition(false);}
}

document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden' && G && !G.debugPalette)void autoSave();
});
window.addEventListener('beforeunload',event=>{
  if(!G || G.debugPalette)return;
  if(autosaveTimer || autosaveQueue.busy || AUTOSAVE_STATE.phase==='error'){
    void autoSave();
    if(autosaveQueue.busy || AUTOSAVE_STATE.phase==='error'){event.preventDefault();event.returnValue='';}
  }
});

