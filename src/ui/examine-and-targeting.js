// ─────────────────────────────────────────────────────────────────
//  EXAMINE MODE
//
//  getExamineName(x, y) — returns the display name for a tile.
//  To add descriptions later, return an object { name, desc } here
//  and update drawExamineCursor to render the desc below the name.
// ─────────────────────────────────────────────────────────────────
function getExamineName(x, y){
  if(G.mode==='galaxy' || G.mode==='examine_galaxy'){
    // Check ships first (they sit on top of tiles)
    const SENSOR_RANGE = G.shipStats?.sensorRange ?? 3;
    const pirate = G.pirates.find(p=>p.alive&&p.x===x&&p.y===y);
    if(pirate){
      const pdist = Math.abs(pirate.x-G.ship.x)+Math.abs(pirate.y-G.ship.y);
      if(!DEBUG.fullVision && pdist > SENSOR_RANGE) return 'Unknown Contact';
      return pirate.name;
    }
    const neutral = (G.neutralShips||[]).find(ns=>ns.x===x&&ns.y===y);
    if(neutral){
      const ndist = Math.abs(neutral.x-G.ship.x)+Math.abs(neutral.y-G.ship.y);
      if(!DEBUG.fullVision && ndist > SENSOR_RANGE) return 'Unknown Contact';
      return { type:'galaxy_ship', ns: neutral, dist: ndist };
    }
    const gasEnt = (G.gasEntities||[]).find(ge=>ge.alive&&ge.x===x&&ge.y===y);
    if(gasEnt){
      const gdist = Math.abs(gasEnt.x-G.ship.x)+Math.abs(gasEnt.y-G.ship.y);
      if(!DEBUG.fullVision && gdist > SENSOR_RANGE + 2) return 'Unknown Nebula Reading';
      return gasEnt.name + ', a predatory gas entity that hunts ships inside nebulae.';
    }
    const lootThere = (G.nebulaLoot||[]).find(l=>l.x===x&&l.y===y);
    if(lootThere) return '✦ Nebula Crystal drifting at combat site. Move here or press Enter to collect.';
    // Then the tile itself
    const cell = G.galaxy[y]?.[x];
    if(!cell) return 'Unknown';
    if(cell.type==='SYSTEM'){
      const ST = STAR_TYPES[cell.starType];
      const np = cell.planets?.length || 0;
      return cell.name+' System ('+( ST?.label||cell.starType )+', '+ np +' planet'+(np!==1?'s':'')+')';
    }
    if(cell.type==='PULSAR') return cell.name+' — pulsar. Rotating neutron star. Lethal radiation at close range.';
    if(cell.type==='ROGUE_PLANET') return cell.name+' — rogue planet. No host star. Press Enter to enter orbit and scan or land.';
    if(cell.type==='BASE')        return cell.name;
    if(cell.type==='BLACK_HOLE')  return 'Singularity — gravitational anomaly. Approach is fatal.';
    if(cell.type==='PIRATE_BASE'){
      const pb = (G.pirateBases||[]).find(b=>b.x===x&&b.y===y);
      if(pb&&pb.destroyed) return cell.name+' (destroyed)';
      const pct = pb ? Math.round((pb.hp/pb.maxHp)*100) : 100;
      return cell.name+(pct<100?' ('+pct+'% integrity)':'');
    }
    if(cell.type==='CASINO')      return 'The Void Royale';
    if(cell.type==='DERELICT')    return cell.name+' (derelict station)';
    if(cell.type==='NEBULA'){
      // Check if a gas entity is lurking within a few tiles
      const nearGe = (G.gasEntities||[]).find(ge=>ge.alive && Math.abs(ge.x-x)<=3 && Math.abs(ge.y-y)<=3);
      if(nearGe) return 'Nebula Cloud — DANGER: '+nearGe.name+' detected nearby!';
      return 'Nebula Cloud';
    }
    if(cell.type==='VOID')        return 'Deep Space';
    return cell.name || cell.type || 'Unknown';
  }

  if(G.mode==='planet' || G.mode==='examine_planet'){
    // Check enemies
    const enemy = (G.enemies[G.curPlanet]||[]).find(e=>e.alive&&!e.hidden&&e.x===x&&e.y===y);
    if(enemy) return { type:'creature', enemy };
    const pdata = G.planets[G.curPlanet];
    if(!pdata) return 'Unknown';
    const cell = pdata.grid[y]?.[x];
    if(!cell) return 'Unknown';
    if(cell.drops?.length){
      return cell.drops.length === 1 ? cell.drops[0].name : 'Dropped Loot ('+cell.drops.length+')';
    }
    // Tile names
    const names = {
      MINERAL:       'Mineral Deposit',
      MINERAL_SAMPLE:'Rock Sample',
      MINERAL2:      'Rich Mineral Vein',
      ARTIFACT:      'Ancient Artifact',
      BIODATA:       'Biological Sample',
      SHIP:          'Your Ship',
      LAVA:          'Active Lava',
      LAVA_FLOOR:    'Active Lava',
      LAVA_FLOOR:    'Active Lava',
      LAVA_CRUST:    'Cooled Lava Crust',
      AMMONIA:       'Ammonia Pool',
      GEYSER:        'Toxic Vent',
      GEYSER_ACTIVE: 'Erupting Vent',
      EARTH_FLOOR:   'Open Ground',
      BLOOM_FLOOR:   'Flowering Ground',
      BLOOM_FLOOR2:  'Colorful Flowers',
      BLOOM_THICKET: 'Flower Thicket',
      EARTH_WATER:   'Shallow Water',
      EARTH_FOREST:  'Dense Forest',
      NEST:          'Creature Nest',
      EARTH_ROCK:    'Dense Forest',
      EARTH_ROCK2:   'Mountain Range',
      DESERT_FLOOR:  'Dry Sand',
      DESERT_ROCK:   'Sandstone Outcrop',
      DESERT_ROCK2:  'Sandstone Outcrop',
      FROZEN_FLOOR:  'Frozen Ground',
      FROZEN_ROCK:   'Ice Formation',
      FROZEN_ROCK2:  'Ice Formation',
      ASTEROID_FLOOR:'Asteroid Surface',
      ASTEROID_ROCK: 'Rock Cluster',
      ASTEROID_ROCK2:'Rock Cluster',
      VOLCANIC_FLOOR:'Volcanic Rock',
      VOLCANIC_FLOOR2:'Volcanic Rock',
      VOLCANIC_ROCK: 'Basalt Spire',
      VOLCANIC_ROCK2:'Basalt Spire',
      TOXIC_FLOOR:   'Toxic Sludge',
      TOXIC_FLOOR2:  'Acid Pool',
      TOXIC_FLOOR3:  'Bubbling Crust',
      TOXIC_ROCK:    'Corroded Rock',
      TOXIC_ROCK2:   'Corroded Rock',
      ANCIENT_FLOOR:   'Ancient Paving',
      ANCIENT_ROAD:    'Ancient Road',
      ANCIENT_WALL:    'Wall',
      ANCIENT_OUTPOST: 'Outpost Interior',
      ANCIENT_ROCK:  'Structure',
      ANCIENT_ROCK2: 'Structure',
      ancient_locked_door: 'Sealed Alien Door',
      ancient_statue: { type:'tile', name:'Ancient Statue', desc:'A weathered humanoid figure carved from pale stone. The proportions, contrapposto stance, and idealised features bear an uncanny resemblance to Classical Greek statues found on Earth the same serene expression, the same weight-shift of the hips. Either convergent artistic evolution reaches the same conclusions across star systems, or someone has a lot of explaining to do.' },
      nuke_crater:   'Crater',
    };
    if(CIV_TILE_TYPES.has(cell.type)) return civilizationTileName(cell.type);
    return names[cell.type] || cell.type || 'Unknown';
  }

  return 'Unknown';
}

function drawExamineCursor(){
  if(!G.examine) return;
  if(G.mode !== 'galaxy' && G.mode !== 'planet'){ G.examine = null; return; }
  const cx = G.examine.x;
  const cy = G.examine.y;
  const blink = Math.floor(Date.now()/400)%2===0;
  ctx.strokeStyle = blink ? '#ffe066' : '#664400';
  ctx.lineWidth = 2;
  if(G.mode==='galaxy'){
    const camX = Math.max(0, Math.min(MAP_W-VIEW_W, G.ship.x-Math.floor(VIEW_W/2)));
    const camY = Math.max(0, Math.min(MAP_H-VIEW_H, G.ship.y-Math.floor(VIEW_H/2)));
    const vx = cx-camX, vy = cy-camY;
    if(vx>=0&&vx<VIEW_W&&vy>=0&&vy<VIEW_H)
      ctx.strokeRect(vx*TS+1, vy*TS+1, TS-2, TS-2);
  } else if(G.mode==='planet'){
    const pdata = G.planets[G.curPlanet];
    const _W = PW(pdata), _H = PH(pdata);
    const camX = Math.max(0, Math.min(_W-VIEW_W, G.player.x-Math.floor(VIEW_W/2)));
    const camY = Math.max(0, Math.min(_H-VIEW_H, G.player.y-Math.floor(VIEW_H/2)));
    const vx = cx-camX, vy = cy-camY;
    if(vx>=0&&vx<VIEW_W&&vy>=0&&vy<VIEW_H)
      ctx.strokeRect(vx*TS+1, vy*TS+1, TS-2, TS-2);
  }
  ctx.lineWidth = 1;
}

// -----------------------------------------------------------------
//  ITEM AIM OVERLAY  (jetpack / grappling hook direction picker)
//  Draws pulsing directional arrows around the player when G._itemAimMode is set
// -----------------------------------------------------------------
function drawItemAimOverlay(){
  if(!G._itemAimMode) return;
  const pdata = G.planets[G.curPlanet];
  if(!pdata) return;
  const _W = PW(pdata), _H = PH(pdata);
  const camX = Math.max(0, Math.min(_W-VIEW_W, G.player.x-Math.floor(VIEW_W/2)));
  const camY = Math.max(0, Math.min(_H-VIEW_H, G.player.y-Math.floor(VIEW_H/2)));
  const px = G.player.x, py = G.player.y;
  const sx = (px - camX) * TS, sy = (py - camY) * TS;
  const isJet = G._itemAimMode.usable === 'jetpack';
  const col = isJet ? '#ff9922' : '#ccaa88';

  // Draw arrows for each of the 4 cardinal directions (plus diagonals for jetpack)
  const dirs = [[0,-1,'N'],[0,1,'S'],[-1,0,'W'],[1,0,'E']];
  if(isJet) dirs.push(...[[-1,-1,'NW'],[1,-1,'NE'],[-1,1,'SW'],[1,1,'SE']]);

  const t = Date.now();
  const pulse = 0.6 + 0.4 * Math.sin(t / 200);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = col;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  dirs.forEach(([dx, dy]) => {
    const tx = sx + dx * TS + TS/2;
    const ty = sy + dy * TS + TS/2;
    // Arrow triangle
    ctx.save();
    ctx.translate(tx, ty);
    const angle = Math.atan2(dy, dx);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-5, -5);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  // Label above player
  ctx.globalAlpha = 1;
  ctx.fillStyle = col;
  ctx.font = 'bold 11px monospace';
  const label = isJet ? 'JETPACK \u2014 pick direction' : 'GRAPPLE \u2014 pick direction';
  ctx.fillText(label, sx + TS/2, sy - 8);
  ctx.restore();
}

// -----------------------------------------------------------------
//  RANGED FIRE MODE
//  G.rangeTarget = null | { x, y }  — aim cursor position
// -----------------------------------------------------------------

function drawRangeCursor(){
  if(!G.rangeTarget) return;
  const cx = G.rangeTarget.x;
  const cy = G.rangeTarget.y;
  const pdata = G.planets[G.curPlanet];
  const _W = PW(pdata), _H = PH(pdata);
  const camX = Math.max(0, Math.min(_W-VIEW_W, G.player.x-Math.floor(VIEW_W/2)));
  const camY = Math.max(0, Math.min(_H-VIEW_H, G.player.y-Math.floor(VIEW_H/2)));

  const best = getBestRangedWeapon();
  const maxRange = best ? best.profile.maxRange : 6;

  // Shade the line-of-fire tiles
  const px = G.player.x, py = G.player.y;
  const dx = cx - px, dy = cy - py;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  if(steps > 0){
    for(let i=1; i<=Math.max(steps, maxRange); i++){
      const tx = Math.round(px + (dx/steps)*i);
      const ty = Math.round(py + (dy/steps)*i);
      if(tx<0||tx>=_W||ty<0||ty>=_H) break;
      const vx = tx-camX, vy = ty-camY;
      if(vx>=0&&vx<VIEW_W&&vy>=0&&vy<VIEW_H){
        if(i <= maxRange){
          ctx.fillStyle = (i <= steps) ? 'rgba(255,100,0,0.15)' : 'rgba(255,200,100,0.07)';
        } else {
          ctx.fillStyle = 'rgba(80,80,80,0.20)';
        }
        ctx.fillRect(vx*TS, vy*TS, TS, TS);
      }
    }
  }

  // Draw crosshair on cursor tile
  const vx = cx-camX, vy = cy-camY;
  if(vx>=0&&vx<VIEW_W&&vy>=0&&vy<VIEW_H){
    const blink = Math.floor(Date.now()/300)%2===0;
    const dist = Math.max(Math.abs(dx), Math.abs(dy));
    const inRange = dist <= maxRange && dist > 0;
    ctx.strokeStyle = inRange ? (blink ? '#ff6600' : '#882200') : '#555555';
    ctx.lineWidth = 2;
    const pad = 3;
    ctx.strokeRect(vx*TS+pad, vy*TS+pad, TS-pad*2, TS-pad*2);
    // crosshair
    ctx.beginPath();
    const mx = vx*TS+TS/2, my = vy*TS+TS/2;
    ctx.moveTo(mx-4, my); ctx.lineTo(mx+4, my);
    ctx.moveTo(mx, my-4); ctx.lineTo(mx, my+4);
    ctx.stroke();
    ctx.lineWidth = 1;
  }
}

function renderRangeSidebar(){
  const best = getBestRangedWeapon();
  if(!best){ G.rangeTarget=null; renderAll(); return; }
  const { crew: shooter, profile } = best;
  const allMode = best.count > 1 && G._rangeFireMode !== 'single';
  const cx = G.rangeTarget.x, cy = G.rangeTarget.y;
  const dx = cx - G.player.x, dy = cy - G.player.y;
  const dist = Math.max(Math.abs(dx), Math.abs(dy));
  const inRange = dist <= profile.maxRange && dist > 0;
  const rawAcc = inRange ? Math.max(0.05, profile.accuracy - (dist-1) * profile.falloff) : 0;
  const cbtBonus = (shooter.skills && shooter.skills.cbt ? shooter.skills.cbt : 0) * 0.02;
  const finalAcc = Math.min(0.99, rawAcc + cbtBonus);
  const pct = Math.round(finalAcc * 100);

  const enemies = (G.enemies[G.curPlanet]||[]).filter(function(e){ return e.alive && e.x===cx && e.y===cy; });
  const target = enemies[0] || null;

  var html = '<div style="color:#ff8844;font-weight:bold;margin-bottom:6px;font-size:14px">FIRE MODE</div>';
  var shooterHint = best.count > 1 ? ' &nbsp; Tab/Q/E: single shooter' : '';
  html += '<div style="font-size:12px;color:#888;margin-bottom:8px">WASD/Arrows: aim &nbsp; F/Enter: fire &nbsp; ESC: cancel' + shooterHint + '</div>';
  if(allMode){
    html += '<div style="color:#ffaa44;margin-bottom:4px">Mode: <span style="color:#ffe066">All shooters</span> <span style="color:#777">(' + best.count + ' guns)</span></div>';
    html += '<div style="color:#777;margin-bottom:4px">Lead: <span style="color:#aaa">' + crewDisplayName(shooter) + '</span></div>';
  } else {
    html += '<div style="color:#ffaa44;margin-bottom:4px">Shooter: <span style="color:#ffe066">' + crewDisplayName(shooter) + '</span>' + (best.count > 1 ? ' <span style="color:#777">(' + (best.index+1) + '/' + best.count + ')</span>' : '') + '</div>';
  }
  html += '<div style="color:#aaa;margin-bottom:4px">Weapon: <span style="color:#aaaaff">' + shooter.weapon + '</span></div>';
  html += '<div style="color:#aaa;margin-bottom:4px">Max range: <span style="color:#aaaaff">' + profile.maxRange + ' tiles</span></div>';
  var distCol = inRange ? '#70f090' : (dist===0 ? '#555' : '#ff4444');
  var distLabel = dist === 0 ? 'aim at a tile' : dist + ' tile' + (dist>1?'s':'') + (!inRange ? ' (out of range)' : '');
  html += '<div style="color:#aaa;margin-bottom:8px">Distance: <span style="color:' + distCol + '">' + distLabel + '</span></div>';
  if(inRange && dist > 0){
    var col = pct>=70 ? '#70f090' : pct>=40 ? '#ffcc44' : '#ff6644';
    html += '<div style="color:#aaa;margin-bottom:8px">Hit chance: <span style="color:' + col + '">' + pct + '%</span></div>';
  }
  if(target){
    html += '<div style="color:#ff8844;margin-bottom:4px">Target: <span style="color:#ffcc66">' + target.name + '</span></div>';
    var hpPct = target.hp / target.maxHp;
    var hpCol = hpPct>0.5?'#70f090':hpPct>0.25?'#ffcc44':'#ff4444';
    html += '<div style="color:#aaa">HP: <span style="color:' + hpCol + '">' + target.hp + ' / ' + target.maxHp + '</span></div>';
  } else if(dist > 0){
    html += '<div style="color:#556677;font-style:italic">No target — bullet travels path</div>';
  }
  if(best.count > 1){
    html += '<button id="fire-volley-btn" style="margin-top:10px;width:100%;background:#2a1a12;border:1px solid #ff8844;color:#ffcc66;padding:6px;font-family:Courier New,monospace;font-weight:bold;cursor:pointer">FIRE ALL WEAPONS</button>';
  }

  // Write into crew-list, clear the others, hide section titles — same pattern as examine mode
  document.querySelectorAll('#sidebar .s-title').forEach(function(el){ el.style.display = 'none'; });
  var crewList = document.getElementById('crew-list');
  var invList  = document.getElementById('inv-list');
  var logList  = document.getElementById('log-list');
  if(crewList) crewList.innerHTML  = html;
  if(invList)  invList.innerHTML   = '';
  if(logList){ logList.innerHTML = ''; logList.style.flex = '0 0 0'; }
  var volleyBtn = document.getElementById('fire-volley-btn');
  if(volleyBtn) volleyBtn.onclick = function(){ doRangedVolley(); };
}

