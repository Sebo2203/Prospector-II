// ─────────────────────────────────────────────────────────────────
//  SAVE / LOAD / AUTOSAVE
//
//  Three mechanisms:
//    autoSave()      — writes G to localStorage after every action
//    saveToFile()    — downloads G as prospector_save.json
//    loadFromFile()  — reads a .json file the player picks
//    loadFromStorage()— restores G from localStorage
//
//  G.visited is a plain Array (JSON-safe).
//  Everything else in G is primitives, arrays, plain objects — safe.
// ─────────────────────────────────────────────────────────────────
const SAVE_KEY = 'prospector_autosave';

function autoSave(){
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(G));
  } catch(e) {
    // localStorage full or unavailable — silently skip
  }
}

function hasSave(){
  try { return !!localStorage.getItem(SAVE_KEY); }
  catch(e){ return false; }
}

function saveToFile(){
  try {
    const raw = G ? JSON.stringify(G, null, 2) : localStorage.getItem(SAVE_KEY);
    if(!raw) throw new Error('No save data');
    const json = G ? raw : JSON.stringify(JSON.parse(raw), null, 2);
    const blob = new Blob([json], {type:'application/json'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'prospector_save.json';
    a.click();
    URL.revokeObjectURL(url);
    if(G){
      autoSave();
      addLog('Game saved to file.','lg');
      renderAll();
    } else {
      alert('Autosave exported to file.');
      drawMenuScreen();
    }
  } catch(e) {
    if(G) addLog('Save to file failed.','lw');
    else alert('No active or autosaved game to save yet.');
  }
}

function loadFromFile(){
  const input = document.createElement('input');
  input.type  = 'file';
  input.accept= '.json,application/json';
  input.onchange = e => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const loaded = JSON.parse(ev.target.result);
        // Basic sanity check
        if(!loaded.galaxy || !loaded.crew) throw new Error('Invalid save');
        G = loaded;
        removeInteriorOreDeposits(G.planets);
        ensureCrewStatusState();
        addLog('Save file loaded. Welcome back, Captain.','lg');
        loadSprites().then(()=>{ restoreGameUI(); renderAll(); autoSave(); });
      } catch(err) {
        alert('Could not load save file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function loadFromStorage(){
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return false;
    const loaded = JSON.parse(raw);
    if(!loaded.galaxy || !loaded.crew) return false;
    G = loaded;
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
    addLog('Autosave restored. Welcome back, Captain.','lg');
    return true;
  } catch(e){ return false; }
}

// Wrapper used by menu — reloads sprites before rendering after a load
function loadAndRender(loadFn){
  const ok = loadFn();
  if(ok) loadSprites().then(()=>{ restoreGameUI(); renderAll(); });
  return ok;
}

async function quitGame(){
  try {
    const invoke = window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke;
    if(invoke){
      await invoke('quit_app');
      return;
    }
  } catch(e) {}

  try { window.close(); } catch(e) {}
  setTimeout(() => {
    if(document.visibilityState !== 'hidden'){
      alert('Your browser blocked automatic tab closing. You can close this tab now.');
    }
  }, 150);
}

