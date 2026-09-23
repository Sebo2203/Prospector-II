function checkAlarms(){
  // -- Oxygen (planet only) --
  if(G.mode==='planet'){
    const biomeKey = atmosphereBiomeKey(G.curPlanet);
    const drain    = BIOMES[biomeKey]?.oxyDrain ?? 1.5;
    if(drain>0){
      if(G.oxygen<=25 && !G._alarmOxyCrit){
        SFX.alarmCrit(); G._alarmOxyCrit=true;
      } else if(G.oxygen<=50 && !G._alarmOxyWarn && !G._alarmOxyCrit){
        SFX.alarmWarn(); G._alarmOxyWarn=true;
      }
      if(G.oxygen>50){ G._alarmOxyWarn=false; G._alarmOxyCrit=false; }
      else if(G.oxygen>25){ G._alarmOxyCrit=false; }
    }
  }
  // -- Fuel (space only) --
  if(G.mode==='galaxy'||G.mode==='system'||G.mode==='shipcombat'){
    const fuelPct = G.fuel / G.maxFuel;
    if(fuelPct<=0.25 && !G._alarmFuelCrit){
      SFX.alarmCrit(); G._alarmFuelCrit=true;
    } else if(fuelPct<=0.5 && !G._alarmFuelWarn && !G._alarmFuelCrit){
      SFX.alarmWarn(); G._alarmFuelWarn=true;
    }
    if(fuelPct>0.5){ G._alarmFuelWarn=false; G._alarmFuelCrit=false; }
    else if(fuelPct>0.25){ G._alarmFuelCrit=false; }
  }
}

// -----------------------------------------------------------------
//  MOVEMENT
// -----------------------------------------------------------------
function getAnimatedShipMapPosition(){
  const anim = G?.shipAnim;
  if(!anim) return { x:G.ship.x, y:G.ship.y, active:false };
  const elapsed = performance.now() - anim.start;
  const delay = anim.delay || 0;
  if(elapsed < delay){
    return { x:anim.fromX, y:anim.fromY, active:true };
  }
  const t = Math.min(1, Math.max(0, (elapsed - delay) / anim.duration));
  const eased = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;
  if(t >= 1){
    G.shipAnim = null;
    return { x:G.ship.x, y:G.ship.y, active:false };
  }
  return {
    x: anim.fromX + (anim.toX - anim.fromX) * eased,
    y: anim.fromY + (anim.toY - anim.fromY) * eased,
    active:true,
  };
}

function startGalaxyShipMoveAnimation(fromX, fromY, toX, toY){
  const current = G.shipAnim ? getAnimatedShipMapPosition() : { x:fromX, y:fromY };
  G.shipAnim = {
    fromX: current.x,
    fromY: current.y,
    toX,
    toY,
    start: performance.now(),
    delay: 70,
    duration: 105,
  };
}

function tickOreScanner(){
  if(G.mode !== 'planet') return;
  if(!(G.inventory||[]).some(i => i.usable === 'ore_scanner')) return;
  const pdata = G.planets[G.curPlanet];
  if(!pdata || !pdata.grid) return;
  const px = G.player.x, py = G.player.y;
  const W = pdata.grid[0].length, H = pdata.grid.length;
  const RANGE = 8;
  for(let dy = -RANGE; dy <= RANGE; dy++){
    for(let dx = -RANGE; dx <= RANGE; dx++){
      const tx = px+dx, ty = py+dy;
      if(tx < 0 || ty < 0 || tx >= W || ty >= H) continue;
      const cell = pdata.grid[ty][tx];
      if(cell && cell.type === 'MINERAL' && !cell.revealed){
        cell._scanned = true;
      }
    }
  }
}

