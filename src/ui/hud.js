function renderHUD(){
  document.getElementById('h-creds').textContent=G.credits;

  // ── Left gauge panel — swap based on mode ────────────────────
  const onPlanet = (G.mode==='planet');
  document.getElementById('gauge-fuel').style.display = onPlanet ? 'none' : '';
  document.getElementById('gauge-hull').style.display = onPlanet ? 'none' : '';
  document.getElementById('gauge-oxy').style.display  = onPlanet ? ''     : 'none';

  if(onPlanet){
    // Oxygen gauge
    const biomeKey = atmosphereBiomeKey(G.curPlanet);
    const oxyDrain = BIOMES[biomeKey]?.oxyDrain ?? 1.5;
    const oxyPct   = Math.max(0, Math.min(1, G.oxygen/100));
    const oxyFill  = document.getElementById('oxy-fill');
    oxyFill.style.height = Math.round(oxyPct*100)+'%';
    // Colour: cyan when full → yellow → red
    oxyFill.style.background = oxyPct<0.2?'#ff2200':oxyPct<0.4?'#ffaa00':oxyPct<0.65?'#44ddaa':'#44ddff';
    const gOxy = document.getElementById('g-oxy');
    gOxy.textContent = Math.round(G.oxygen)+'%';
    gOxy.className   = 'gauge-val '+(oxyPct<0.2?'cr':oxyPct<0.4?'co':'cc');
    // Breathable surface — show full green locked bar. Underwater still spends O2.
    if(oxyDrain===0 && !G.underwater){
      oxyFill.style.height='100%';
      oxyFill.style.background='#44ff88';
      gOxy.textContent='∞';
      gOxy.className='gauge-val cg';
    }
  } else {
    // Fuel gauge
    const fuelPct  = Math.max(0, Math.min(1, G.fuel/G.maxFuel));
    const fuelFill = document.getElementById('fuel-fill');
    fuelFill.style.height = Math.round(fuelPct*100)+'%';
    fuelFill.style.background = fuelPct<0.2?'#ff2200':fuelPct<0.4?'#ff6600':fuelPct<0.6?'#ffaa00':'#ff8800';
    const gFuel = document.getElementById('g-fuel');
    gFuel.textContent = Math.round(G.fuel);
    gFuel.className   = 'gauge-val '+(fuelPct<0.2?'cr':fuelPct<0.4?'co':'co');

    // Hull gauge
    const hullPct  = Math.max(0, Math.min(1, G.ship.hp/G.ship.maxHp));
    const hullFill = document.getElementById('hull-fill');
    hullFill.style.height = Math.round(hullPct*100)+'%';
    hullFill.style.background = hullPct<0.25?'#ff3300':hullPct<0.5?'#ffaa00':'#44aaff';
    const gHull = document.getElementById('g-hull');
    gHull.textContent = G.ship.hp;
    gHull.className   = 'gauge-val '+(hullPct<0.25?'cr':hullPct<0.5?'co':'cg');
  }

  document.getElementById('h-turn').textContent=G.turn;

  const mn={galaxy:'GALAXY MAP', system:'SYSTEM VIEW', planet:'PLANET SURFACE', base:'STARBASE', inventory:'INVENTORY', shipcombat:'SHIP COMBAT', casino:'THE VOID ROYALE', radio:'SHIP RADIO', examine:'EXAMINE'};
  document.getElementById('h-mode').textContent=mn[G.mode]||G.mode.toUpperCase();

  let loc='Deep Space';
  if(G.mode==='base'){
    loc=G.base.stationName||'Starbase';
  } else if(G.mode==='casino'){
    loc='The Void Royale';
  } else if(G.mode==='system'){
    const cell=G.galaxy[G.ship.y]?.[G.ship.x];
    loc = cell?.type==='ROGUE_PLANET' ? (cell?.name||'Rogue Planet')+' (Rogue)' : (cell?.name||'Unknown')+' System';
  } else if(G.mode==='planet'){
    const cell=G.galaxy[G.ship.y]?.[G.ship.x];
    {
      const pDesc=cell?.planets?.[G.selPlanet];
      const bKey=G.planets[G.curPlanet]?.biome;
      const bName=BIOMES[bKey]?.name||'';
      loc=(pDesc?.name||'Unknown')+(bName?' ['+bName+']':'');
    }
  } else {
    const c=G.galaxy[G.ship.y][G.ship.x];
    if(c.type==='BASE') loc=c.name;
    else if(c.type==='PIRATE_BASE'){
      const _hpb=(G.pirateBases||[]).find(b=>b.x===G.ship.x&&b.y===G.ship.y);
      loc = (_hpb&&_hpb.destroyed) ? c.name+' (ruins)' : c.name+' ⚠';
    }
    else if(c.type==='SYSTEM') loc=c.name+' System';
    else if(c.name) loc=c.name;
  }
  if(G.ship){
    const coord = 'X:'+(G.ship.x+1)+' Y:'+(G.ship.y+1);
    loc = loc+'  ['+coord+']';
  }
  const el=document.getElementById('h-loc');
  el.textContent=loc.length>36?loc.slice(0,34)+'...':loc;

  // ── Phase indicator (left side of HUD, planet only) ───────────
  const phaseBox = document.getElementById('h-phase-box');
  const phaseEl  = document.getElementById('h-phase');
  if(onPlanet && G.curPlanet && G.planets[G.curPlanet]){
    const pdata2 = G.planets[G.curPlanet];
    const B2     = BIOMES[pdata2.biome];
    if(B2 && (B2.tidalLock || B2.dayLength)){
      const ph = planetPhase(G.curPlanet);
      const dayLen = B2.dayLength || 20;
      const cycle  = dayLen * 4;
      const t      = pdata2.planetTurn % cycle;

      // Find turns until next phase change by stepping forward until vr crosses a threshold
      // Use the raw cosine formula only — no floodlight/smoke/forest modifiers — so
      // current and future phases are computed identically and the counter never gets stuck.
      let turnsLeft = null;
      if(!B2.tidalLock){
        const rawVr = (angle => 1 + (Math.cos(angle - Math.PI/2) + 1) / 2 * 9);
        const rawPhase = (futureT) => {
          const q2 = cycle / 4;
          if(futureT < q2)          return 'dawn';
          if(futureT < cycle / 2)   return 'day';
          if(futureT < 3 * q2)      return 'dusk';
          return 'night';
        };
        const curPh = rawPhase(t);
        for(let i=1; i<=cycle; i++){
          if(rawPhase((t + i) % cycle) !== curPh){ turnsLeft = i; break; }
        }
      }

      const icon  = B2.tidalLock==='day'   ? '☀' :
                    B2.tidalLock==='night'  ? '☾' :
                    ph==='dawn'  ? '☀↑' :
                    ph==='day'   ? '☀' :
                    ph==='dusk'  ? '☀↓' : '☾';
      const col   = ph==='night' ? '#4466aa' :
                    ph==='dusk'  ? '#ff6622' :
                    ph==='dawn'  ? '#ffaa44' : '#ffcc44';
      const label = turnsLeft !== null ? `${icon} ${turnsLeft}t` : icon;
      phaseEl.textContent = label;
      phaseEl.style.color = col;
      phaseBox.style.display = '';
    } else {
      phaseBox.style.display = 'none';
    }
  } else {
    phaseBox.style.display = 'none';
  }

  // ── Gauge label flash states ──────────────────────────────────
  if(onPlanet){
    const oxyPct = G.oxygen/100;
    const lbl = document.querySelector('#gauge-oxy .gauge-label');
    if(lbl) lbl.className = 'gauge-label'+(oxyPct<=0.25?' crit':oxyPct<=0.5?' warn':'');
  } else {
    const fuelPct = G.fuel/G.maxFuel;
    const hullPct = G.ship.hp/G.ship.maxHp;
    const fLbl = document.querySelector('#gauge-fuel .gauge-label');
    const hLbl = document.querySelector('#gauge-hull .gauge-label');
    if(fLbl) fLbl.className = 'gauge-label'+(fuelPct<=0.25?' crit':fuelPct<=0.5?' warn':'');
    if(hLbl) hLbl.className = 'gauge-label'+(hullPct<=0.25?' crit':hullPct<=0.5?' warn':'');
  }
}

