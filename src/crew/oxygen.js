function applyOxygenDrain(){
  const pdata = G.planets[G.curPlanet];
  const biome = atmosphereBiome(G.curPlanet);
  const onShipTile = pdata?.grid[G.player.y]?.[G.player.x]?.type === 'SHIP';
  if(DEBUG.infiniteOxy){
    G.oxygen = 100;
    G._oxyWarnedLow=false; G._oxyWarnedCrit=false;
    G._alarmOxyWarn=false; G._alarmOxyCrit=false;
  } else if((biome.oxyDrain === 0 && !G.underwater) || onShipTile){
    if(G.oxygen < 100){
      G.oxygen = Math.min(100, G.oxygen + 8);
      if(G.oxygen >= 100) addLog('Oxygen fully recovered.','lg');
    }
  } else {
    G.oxygen = Math.max(0, G.oxygen - biome.oxyDrain);
  }
  // Naked crew on uninhabitable planets take suit-breach damage every turn
  if(biome.oxyDrain > 0){
    const nakedCrew = G.crew.filter(c=>c.hp>0 && !c.armorUsable);
    if(nakedCrew.length){
      nakedCrew.forEach(c=>{ c.hp = Math.max(0, c.hp - 3); });
      G.oxygen = Math.max(0, DEBUG.infiniteOxy ? G.oxygen : G.oxygen - biome.oxyDrain*2);
      SFX.suffocate();
      addLog('Unprotected crew exposed to hostile atmosphere! -3 HP, O₂ draining fast!','lc');
      checkDeath();
      if(G.dead) return true;
    }
  }
  // Underwater O2 drain — only when actually submerged (G.underwater).
  if(G.underwater){
    const aliveCrew = G.crew.filter(c => c.hp > 0);
    const unsuitedCrew = aliveCrew.filter(c => c.armorUsable !== 'armor_diving');
    const allSuited = unsuitedCrew.length === 0;
    const waterDrain = aliveCrew.reduce((sum, c) => sum + (c.armorUsable === 'armor_diving' ? 2 : 8), 0);
    G.oxygen = Math.max(0, DEBUG.infiniteOxy ? G.oxygen : G.oxygen - waterDrain);
    if(!G._underwaterWarned){
      if(allSuited){
        addLog('Diving suit active — O2 draining slowly.','lw');
      } else if(unsuitedCrew.length === aliveCrew.length){
        addLog('Water pressure crushes the flight suit seals — O2 draining fast! Need a diving suit.','lc');
      } else {
        addLog(unsuitedCrew.map(c=>c.name).join(', ')+' lack a diving suit — O2 draining fast for them!','lc');
      }
      G._underwaterWarned = true;
    }
  }
  return false;
}

// Low/critical/depleted oxygen warnings + suffocation/drowning damage,
// shared by tryMove(), doWaitPlanet(), and doCombat(). Fires each message
// once per threshold crossing and resets the warning flags once oxygen is
// no longer in danger. Does NOT call checkDeath() — callers already do that
// at their existing call sites (preserving each function's control flow).
function applyOxygenWarnings(){
  const biome = atmosphereBiome(G.curPlanet);
  const oxygenDanger = biome.oxyDrain > 0 || G.underwater;
  if(oxygenDanger && !DEBUG.infiniteOxy){
    if(G.oxygen<=50&&G.oxygen>25&&!G._oxyWarnedLow){
      addLog(G.underwater ? 'O2 dropping — surface soon!' : 'Oxygen below 50% — head back to ship.','lw');
      G._oxyWarnedLow=true;
    }
    if(G.oxygen<=25&&G.oxygen>0&&!G._oxyWarnedCrit){
      addLog(G.underwater ? 'OXYGEN CRITICAL — surface now!' : 'OXYGEN CRITICAL — get back to the ship now!','lc');
      G._oxyWarnedCrit=true;
    }
    if(G.oxygen<=0){
      if(!G._oxyWarnedCrit){
        addLog(G.underwater ? 'OXYGEN GONE — drowning!' : 'OXYGEN DEPLETED — suffocating!','lc');
        G._oxyWarnedCrit=true;
      }
      G.crew.filter(c=>c.hp>0).forEach(c=>{
        c.hp = Math.max(0, c.hp - 5);
        if(c.hp<=0) addLog(crewDisplayName(c)+(G.underwater ? ' has drowned!' : ' has suffocated!'),'lc');
      });
      SFX.suffocate();
      if(!G.deathCause) G.deathCause = G.underwater
        ? 'The crew drowned — oxygen ran out underwater.'
        : 'The crew suffocated — oxygen ran out on the surface.';
    }
  }
  if(biome.oxyDrain===0 && !G.underwater){
    G._oxyWarnedLow=false; G._oxyWarnedCrit=false;
  }
}

