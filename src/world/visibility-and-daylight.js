function _checkPhaseMessages(vrBefore, vrAfter, biome){
  // No messages for indoor/fixed-light environments
  if(biome === 'DERELICT' || biome === 'ANCIENT_STATION') return;
  // Tidal-locked biomes handled at landing — no per-turn transitions possible
  const B = BIOMES[biome] || {};
  if(B.tidalLock) return;

  // Thresholds scale to the planet's actual vr range.
  // Normal planets: 1–10.  ANCIENT: 1–6 (capped).
  // nightThresh = first visible light rising / last light falling
  // dayThresh   = "clearly bright" rising / first dimming falling
  const isAncient = biome === 'ANCIENT';
  const nightThresh = 2.5;                    // same for all — absolute darkness threshold
  const dayThresh   = isAncient ? 5.0 : 8.0; // ANCIENT peaks at 6, so 5 = "as bright as it gets"

  // Dawn: vr climbing through nightThresh — first visible improvement
  if(vrBefore <= nightThresh && vrAfter > nightThresh)
    addLog('The horizon brightens. Dawn is breaking.','li');
  // Full day: vr climbing through dayThresh
  else if(vrBefore < dayThresh && vrAfter >= dayThresh)
    addLog(isAncient ? 'The pale star climbs. Dim daylight.' : 'The sun rises. Full daylight.','lg');
  // Dusk: vr falling through dayThresh
  else if(vrBefore >= dayThresh && vrAfter < dayThresh)
    addLog(isAncient ? 'The light thins. Twilight settles.' : 'The light fades. Dusk is settling in.','lw');
  // Night: vr falling through nightThresh — vision now severely limited
  else if(vrBefore > nightThresh && vrAfter <= nightThresh)
    addLog('Darkness falls — visibility reduced.','lw');
}

function planetPhase(key){
  const pdata = G.planets[key];
  if(!pdata) return 'day';
  const B = BIOMES[pdata.biome];
  if(!B) return 'day';
  if(B.tidalLock==='day')   return 'day';
  if(B.tidalLock==='night') return 'night';
  const dayLen = B.dayLength || 20;
  const cycle  = dayLen * 4;
  const t      = pdata.planetTurn % cycle;
  // Phase derived purely from position in cycle — no vr thresholds which can fire twice.
  // Cycle: angle = (t/cycle)*2π, cosVal = cos(angle-π/2)
  //   t=0        : cosVal=0  → vr=5.5  (dawn start)
  //   t=cycle/4  : cosVal=1  → vr=10   (day peak)
  //   t=cycle/2  : cosVal=0  → vr=5.5  (dusk start)
  //   t=3*cycle/4: cosVal=-1 → vr=1    (night peak)
  const q = cycle / 4;
  if(t < q)         return 'dawn';
  if(t < cycle / 2) return 'day';
  if(t < 3 * q)     return 'dusk';
  return 'night';
}

// Returns a continuous vision radius (float) based on exact position in the day cycle.
// Full day = 10 tiles, full night = 1 tile, smooth cosine curve between them.
function planetVisionRadius(key){
  const pdata = G.planets[key];
  if(!pdata) return 10;
  if(pdata.isCasino) return 10;
  // Rogue planet: no star, perpetual night — only suit lights and floodlight
  if(pdata.isRoguePlanet){
    const flood = G && (G.inventory||[]).some(i=>i.usable==='floodlight') ? 2 : 0;
    return 1 + flood;
  }
  // Derelict: emergency lighting only — fixed dim radius
  if(pdata.isDerelict){
    const flood = G && (G.inventory||[]).some(i=>i.usable==='floodlight') ? 2 : 0;
    return 3 + flood;
  }
  // Ringworld: artificial lighting — always full brightness
  if(pdata.isRingworld) return 10;
  // Destroyed ringworld: open space — starlight, full visibility
  if(pdata.isDestroyedRingworld) return 10;
  // Ancient station: open to space, no roof — very long day cycle, always bright
  // dayLength drives a very slow cycle; minimum vision is 7 (starlight + alien glow)
  if(pdata.isAncientStation){
    const flood = G && (G.inventory||[]).some(i=>i.usable==='floodlight') ? 2 : 0;
    const t = pdata.planetTurn % 400; // 400-turn full cycle — mostly bright
    const angle = (t / 400) * 2 * Math.PI;
    const cosVal = Math.cos(angle - Math.PI / 2);
    // Range 7–10: never truly dark, alien glow sources keep minimum at 7
    return Math.round(7 + (cosVal + 1) / 2 * 3) + flood;
  }
  // Underwater: water scatters light and swallows distance.
  // Keep LOS short so the seabed feels dangerous instead of daylight-clear.
  if(pdata.isUnderwater){
    const flood = G && (G.inventory||[]).some(i=>i.usable==='floodlight') ? 2 : 0;
    const hasDivingSuit = G?.crew?.some(c => c.hp > 0 && c.armorUsable === 'armor_diving');
    return (hasDivingSuit ? 5 : 3) + flood;
  }
  const B = BIOMES[pdata.biome];
  if(!B) return 10;
  let vr;
  if(B.tidalLock==='day')        vr = 10;
  else if(B.tidalLock==='night') vr = 1;
  else {
    const dayLen = B.dayLength || 20;
    const cycle  = dayLen * 4;
    const t      = pdata.planetTurn % cycle;
    const angle  = (t / cycle) * 2 * Math.PI;
    const cosVal = Math.cos(angle - Math.PI / 2);
    vr = 1 + (cosVal + 1) / 2 * 9;
  }

  // Ancient ruins — dim star, cap brightness at 6
  if(pdata.biome === 'ANCIENT') vr = Math.min(vr, 6);

  // Mist: vision reduction applied in renderer only (not here) so the HUD
  // day/night phase indicator is not affected by standing in mist.

  // Smoke overrides vision — forces near-night darkness
  if(pdata.smokeClouds && G.player){
    const cloudsHere = pdata.smokeClouds.filter(c=>c.x===G.player.x && c.y===G.player.y).length;
    if(cloudsHere > 0){
      vr = 1.5; // near-night — only adjacent tile visible, like standing in dense fog
    }
  }

  // Forest canopy reduces vision — harder to see creatures and terrain
  if(G.player && pdata.grid){
    const playerTile = pdata.grid[G.player.y]?.[G.player.x];
    if(playerTile?.type === 'EARTH_FOREST'){
      vr = Math.min(vr, 3.5); // canopy cuts vision to ~3 tiles regardless of time of day
    }
  }

  // Floodlight: always adds +2 tiles regardless of night cycle
  if(G && (G.inventory||[]).some(i=>i.usable==='floodlight')) vr += 2;

  return vr;
}

// Legacy helper — vision restriction only during night
function planetIsNight(key){
  return planetPhase(key) === 'night';
}

