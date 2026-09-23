function doToggleDive(){
  if(G.mode !== 'planet' || G.dialogue || G.dead) return;
  const pdata = G.planets?.[G.curPlanet];
  if(!pdata) return;

  if(pdata.isUnderwater){
    // Already underwater — [Z] surfaces back
    doUnderwaterSurface();
    return;
  }

  const tile = pdata.grid[G.player.y]?.[G.player.x]?.type;
  if(tile !== 'EARTH_WATER'){
    addLog('You need to be in water to dive.','li');
    renderAll(); return;
  }

  const hasDivingSuit = G.crew.some(c => c.hp > 0 && c.armorUsable === 'armor_diving');

  // Diving itself costs one turn of O2 — sealing and descending is not free
  const diveCost = hasDivingSuit ? 2 : 8;
  G.oxygen = Math.max(0, DEBUG.infiniteOxy ? G.oxygen : G.oxygen - diveCost);

  // Generate underwater overlay lazily (mirrors surface grid)
  const uwKey = G.curPlanet + ':uw';
  if(!G.planets[uwKey]){
    generateUnderwaterMap(uwKey, G.curPlanet);
  }

  // Save surface return position — same coordinates
  G._uwReturn = { planet: G.curPlanet, x: G.player.x, y: G.player.y };
  G.underwater = true;
  G._underwaterWarned = false;
  G._oxyWarnedLow = false;
  G._oxyWarnedCrit = false;

  // Switch to underwater map; player stays at same (x,y)
  G.curPlanet = uwKey;
  revealPlanet(uwKey, G.player.x, G.player.y);

  if(hasDivingSuit){
    addLog('You dive below the surface. The world above dissolves into shifting light. Diving suit sealed — O2 draining slowly.','lw');
  } else {
    addLog('You plunge under without a diving suit. Water pressure immediately stresses the seals — O2 draining fast.','lc');
  }
  renderAll();
}

function doUnderwaterSurface(){
  if(!G._uwReturn) return;
  const surfacePlanet = G._uwReturn.planet;

  // Block surfacing if no passable non-water tile is adjacent on the surface grid.
  const surfaceGrid = G.planets[surfacePlanet]?.grid;
  if(surfaceGrid){
    const px = G.player.x, py = G.player.y;
    const hasShore = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]].some(([dx,dy]) => {
      const t = surfaceGrid[py+dy]?.[px+dx]?.type;
      return t && TILE[t]?.pass && t !== 'EARTH_WATER';
    });
    if(!hasShore){
      addLog('No shore within reach — swim to shallower water before surfacing.','lw');
      renderAll(); return;
    }
  }

  G._uwReturn = null;
  G.curPlanet = surfacePlanet;
  G.underwater = false;
  G._underwaterWarned = false;

  // Habitable planet — O2 recovers naturally via per-move regen, no instant refill.
  const biome = atmosphereBiome(G.curPlanet);
  if(biome.oxyDrain === 0){
    G._oxyWarnedLow = false;
    G._oxyWarnedCrit = false;
    addLog('You break the surface — breathable air. O2 recovering.','lg');
  } else {
    addLog('You surface.','li');
  }

  revealPlanet(G.curPlanet, G.player.x, G.player.y);
  renderAll();
}
function doRefillOxygen(){
  if(G.mode!=='planet') return;
  const cell=G.planets[G.curPlanet]?.grid[G.player.y][G.player.x];
  if(cell?.type==='SHIP'){
    G.oxygen=100;
    G._oxyWarnedLow=false;
    G._oxyWarnedCrit=false;
    G._underwaterWarned=false;
    G.underwater=false;
    addLog('Oxygen tanks refilled from ship reserves.','lg');
  } else {
    addLog('Must be at ship (>) to refill oxygen.','lw');
  }
  renderAll();
}

// ─────────────────────────────────────────────────────────────────
//  LIFT OFF  (L key) — must be on ship tile AND have living crew
// ─────────────────────────────────────────────────────────────────
function doLiftOff(){
  if(G.mode!=='planet') return;
  if(!crewAlive()){ addLog('No living crew — cannot lift off!','lc'); renderAll(); return; }
  const cell=G.planets[G.curPlanet]?.grid[G.player.y][G.player.x];
  if(cell?.type==='SHIP'){
    if(G.fuel<=0){ addLog('No fuel left - unable to launch.','lc'); renderAll(); return; }
    if(!DEBUG.infiniteFuel) G.fuel = Math.max(0, G.fuel-1);
    G.oxygen=100;
    G.underwater=false;
    G._underwaterWarned=false;
    G._oxyWarnedLow=false;
    G._oxyWarnedCrit=false;
    G._alarmOxyWarn=false;
    G._alarmOxyCrit=false;
    softenHallucinationsAfterLiftOff();
    G.mode = !G.curSystem ? 'galaxy' : 'system';
    syncPortStressPauseState();
    G.examine = null;
    G.rangeTarget = null;
    G._itemAimMode = null;
    SFX.liftoff();
    addLog('Lifted off. Back in orbit.','lg');
  } else {
    addLog('Must return to ship (>) to lift off!','lw');
  }
  renderAll();
}

