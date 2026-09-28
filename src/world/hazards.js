function initPlanetHazards(key, biomeKey){
  const pdata = G.planets[key];
  if(!pdata) return;
  const B = BIOMES[biomeKey] || {};
  const hazards = B.hazards || [];

  // Smoke clouds — volcanic gets dense coverage, toxic gets sparse geyser plumes
  if(hazards.includes('SMOKE')){
    const clouds = [];
    const variants = ['smoke_cloud_a','smoke_cloud_b','smoke_cloud_c'];
    const isVolcanic = biomeKey === 'VOLCANIC';
    const numHerds   = isVolcanic ? 8 + rnd(4)  : 3 + rnd(3);   // toxic: 3-5 herds
    const herdSzMin  = isVolcanic ? 28 : 5;
    const herdSzRnd  = isVolcanic ? 14 : 6;                      // toxic: 5-10 per herd
    const spread     = isVolcanic ? 4  : 2;                      // toxic: tighter clusters
    for(let h=0;h<numHerds;h++){
      const herdX = rnd(PW(pdata));
      const herdY = rnd(PH(pdata));
      const herdDx = rnd(3)-1;
      const herdDy = rnd(3)-1;
      const herdSize = herdSzMin + rnd(herdSzRnd);
      for(let i=0;i<herdSize;i++){
        clouds.push({
          x: (herdX + rnd(spread*2+1)-spread + PW(pdata)) % PW(pdata),
          y: (herdY + rnd(spread*2+1)-spread + PH(pdata)) % PH(pdata),
          sprite: variants[rnd(variants.length)],
          dx: herdDx,
          dy: herdDy,
          driftTimer: 2 + rnd(3),
          life: isVolcanic ? 50 + rnd(80) : 30 + rnd(40),
          herd: h,
          biome: biomeKey,  // store for tint colour
        });
      }
    }
    pdata.smokeClouds = clouds;
    pdata.smokeHerdDirs = Array.from({length:numHerds},()=>({dx:rnd(3)-1,dy:rnd(3)-1,timer:5+rnd(8)}));
  }

  // Meteor rain state
  if(hazards.includes('METEOR')){
    pdata.meteorTurnsUntilRain = 10 + rnd(81); // first shower: 10-90 turns
    pdata.meteorRainTurnsLeft  = 0;
  }

  // Geyser eruption timers
  if(hazards.includes('GEYSER')){
    pdata.geyserTimers = {};
    for(let y=0;y<PH(pdata);y++){
      for(let x=0;x<PW(pdata);x++){
        const t = pdata.grid[y]?.[x]?.type;
        if(t==='GEYSER'||t==='GEYSER_ACTIVE'){
          pdata.geyserTimers[x+','+y] = 5 + rnd(8);
        }
      }
    }
  }

  // Mist clouds — ancient ruins: dense blob patches that drift slowly as one unit
  if(hazards.includes('MIST')){
    const clouds = [];
    const W = PW(pdata), H = PH(pdata);
    const numPatches = 5 + rnd(4);        // 5-8 patches
    const patchSize  = 14 + rnd(10);      // 14-23 tiles — bigger so they form solid blobs
    for(let p=0;p<numPatches;p++){
      // Seed a blob by doing a drunk-walk from a centre point so tiles stay contiguous
      const cx = 2 + rnd(W-4), cy = 2 + rnd(H-4);
      const placed = new Set();
      placed.add(cx+','+cy);
      const frontier = [{x:cx,y:cy}];
      while(placed.size < patchSize && frontier.length){
        const fi = rnd(frontier.length);
        const {x,y} = frontier[fi];
        const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
        const d = dirs[rnd(4)];
        const nx = (x+d[0]+W)%W, ny = (y+d[1]+H)%H;
        const key = nx+','+ny;
        if(!placed.has(key)){
          placed.add(key);
          frontier.push({x:nx,y:ny});
          clouds.push({
            x: nx, y: ny,
            dx: 0, dy: 0,
            driftTimer: 5 + rnd(5),
            life: undefined,   // immortal — replenish handles count
            patch: p,
          });
        }
        // Occasionally prune frontier so blob stays roughly convex
        if(frontier.length > 8) frontier.splice(rnd(frontier.length), 1);
      }
    }
    pdata.mistClouds = clouds;
    // Each patch gets a heading and a drift countdown; driftTimer fires every ~25 turns
    pdata.mistPatchDirs = Array.from({length:numPatches},()=>({
      dx: rnd(2)?1:-1, dy: rnd(3)-1,   // start with a non-zero x direction
      timer: 60+rnd(40),                // turns until next heading change
      driftTimer: 5+rnd(20),            // stagger initial steps so patches don't all move at once
    }));
  }

  // Lava crust reheating timers
  pdata.lavaCrustTimers = {};
}

// ── Structural HP: how many "blast points" each tile can absorb ──────────
// C4 deals 100 blast points. Tiles at 0 are destroyed (replaced with floor).
const TILE_STRUCTURAL_HP = {
  // Mountains / solid bedrock — survive any single charge
  ROCK:          999, EARTH_ROCK:   999, EARTH_ROCK2:   999,
  VOLCANIC_ROCK: 999, VOLCANIC_ROCK2:999,
  FROZEN_ROCK:   999, FROZEN_ROCK2: 999,
  ASTEROID_ROCK: 999, ASTEROID_ROCK2:999,
  DESERT_ROCK:   999, DESERT_ROCK2: 999,
  TOXIC_ROCK:    999, TOXIC_ROCK2:  999,
  cave_wall:     999, uw_wall:      999,
  // Ancient wall — very strong but destroyable with C4
  ANCIENT_WALL:  120,
  ANCIENT_ROCK:  999,
  // Doors — weaker than walls
  ancient_locked_door: 60,
  rw_locked_door:      60,
  station_wall:        80,
  // Trees / light obstacles
  EARTH_FOREST:  30,
  // Nuke terrain
  nuke_rock:     999,
};

function tileStructuralHp(type){
  return TILE_STRUCTURAL_HP[type] ?? (TILE[type]?.pass === false ? 999 : 0);
}

// Returns the appropriate floor tile to replace a destroyed tile with
function tileBlastReplacement(pdata, x, y){
  if(pdata.isAncientStation) return 'ancient_st_floor';
  if(pdata.isDerelict)       return 'station_floor';
  if(pdata.isCave)           return 'cave_floor';
  if(pdata.biome === 'ANCIENT'){
    const ct = pdata.grid?.[y]?.[x]?.type;
    // Structural tiles become rubble road; natural ground becomes scorched crater
    if(ct === 'ANCIENT_WALL' || ct === 'ancient_locked_door' ||
       ct === 'ANCIENT_OUTPOST' || ct === 'ANCIENT_ROAD'){
      return 'ANCIENT_ROAD';
    }
    return 'nuke_crater';
  }
  return 'nuke_crater';
}

function detonateC4(px, py){
  const pdata = G.planets?.[G.curPlanet];
  if(!pdata) return;
  const _W = PW(pdata), _H = PH(pdata);
  const BLAST = 100;

  addLog('💥 BOOM! The C4 detonates!', 'lc');
  SFX.explosion?.();

  // Pre-scan: record whether the SHIP tile is in the blast radius before the
  // loop replaces it. Applies on every biome — the ship can be destroyed
  // anywhere the player lands, not just on ANCIENT planets.
  let _shipInBlast = false;
  for(let _pdy=-1; _pdy<=1; _pdy++){
    for(let _pdx=-1; _pdx<=1; _pdx++){
      const _ptx=px+_pdx, _pty=py+_pdy;
      if(_ptx<0||_ptx>=_W||_pty<0||_pty>=_H) continue;
      if(pdata.grid[_pty]?.[_ptx]?.type === 'SHIP') _shipInBlast = true;
    }
  }

  // Hit all 9 tiles (centre + 8 neighbours)
  for(let dy=-1; dy<=1; dy++){
    for(let dx=-1; dx<=1; dx++){
      const tx = px+dx, ty = py+dy;
      if(tx<0||tx>=_W||ty<0||ty>=_H) continue;
      const cell = pdata.grid[ty][tx];
      if(!cell) continue;
      const ct = cell.type;

      // Damage crew/enemies on any blast tile
      if(tx===G.player.x && ty===G.player.y){
        const dmg = dx===0&&dy===0 ? 60 : 30;
        G.crew.filter(c=>c.hp>0).forEach(c=>{
          const d = Math.max(0, dmg - (c.def||0));
          if(!DEBUG.infiniteCrewHp) c.hp = Math.max(0, c.hp - d);
          if(d>0) addLog(c.name+' caught in blast — -'+d+' HP!','lc');
        });
      }
      // Damage enemies
      (G.enemies[G.curPlanet]||[]).filter(e=>e.alive&&!e.hidden&&e.x===tx&&e.y===ty).forEach(e=>{
        const d = dx===0&&dy===0 ? 60 : 30;
        e.hp = Math.max(0, e.hp - d);
        if(e.hp<=0){ e.alive=false; addLog(e.name+' destroyed by blast!','lg'); dropAlienDeathLoot(e); }
        else addLog(e.name+' hit by blast for '+d+'!','lw');
      });

      // Structural damage — cumulative across multiple blasts
      // Never touch void tiles — no surface to crater, and craters here would be an exploit
      const isVoidTile = ct === 'ancient_st_void' || ct === 'rw_void';
      const shp = isVoidTile ? 999 : tileStructuralHp(ct);
      if(shp < 999){
        cell._blastDmg = (cell._blastDmg || 0) + BLAST;
        if(cell._blastDmg >= shp){
          // Tile destroyed — replace with appropriate floor
          const floor = tileBlastReplacement(pdata, tx, ty);
          const under = cell._underFloor;
          pdata.grid[ty][tx] = under ? {type:floor, _underFloor:under} : {type:floor};
          if(pdata.visited) pdata.visited[ty*_W+tx] = true;
        }
      }
    }
  }

  // Ship tile was caught in the blast on any planet — crew are stranded.
  // This is a hard game-over that bypasses DEBUG.infiniteCrewHp because it is
  // the *ship* that is gone, not the crew's hit points.
  if(_shipInBlast && !G.dead){
    const _sc = G.curSystem ? G.galaxy?.[G.ship.y]?.[G.ship.x] : null;
    const _pName = _sc?.planets?.[G.selPlanet||0]?.name || 'an unnamed world';
    addLog('💀 THE SHIP HAS BEEN DESTROYED — the crew is stranded on '+_pName+'.','lc');
    G.deathCause = '__C4_STRANDED__' + _pName;
    G.dead = true;
    renderAll();
    return;
  }

  checkDeath();
}

function processPlanetHazards(){
  const key = G.curPlanet;
  const pdata = G.planets[key];
  if(!pdata) return;
  const biomeKey = pdata.biome;
  const B = BIOMES[biomeKey] || {};
  const hazards = B.hazards || [];
  const grid = pdata.grid;
  const pt = pdata.planetTurn;

  // ── C4 countdown tick ─────────────────────────────────────────
  if(G.mode === 'planet' || G._prevMode === 'planet'){
    // Tick armed C4 in inventory
    for(let _ci = G.inventory.length-1; _ci >= 0; _ci--){
      const _c4 = G.inventory[_ci];
      if(_c4?.usable !== 'c4' || !_c4._armed) continue;
      _c4._c4Timer--;
      if(_c4._c4Timer <= 0){
        // Explodes in inventory — lethal
        G.inventory.splice(_ci, 1);
        addLog('The C4 detonates inside the inventory!','lc');
        G.crew.filter(c=>c.hp>0).forEach(c=>{
          if(!DEBUG.infiniteCrewHp) c.hp = Math.max(0, c.hp - 80);
          addLog(c.name+' severely wounded by internal blast!','lc');
        });
        checkDeath();
      } else if(_c4._c4Timer === 1){
        addLog('⚠ C4 — 1 TURN UNTIL DETONATION! DROP IT NOW!','lc');
      } else {
        addLog('C4 armed — '+_c4._c4Timer+' turns remaining.','lw');
      }
    }
    // Tick armed C4 dropped on the floor (in cell.drops)
    if(pdata){
      const _W2 = PW(pdata), _H2 = PH(pdata);
      for(let _fy=0; _fy<_H2; _fy++){
        for(let _fx=0; _fx<_W2; _fx++){
          const _fc = pdata.grid[_fy]?.[_fx];
          if(!_fc?.drops?.length) continue;
          for(let _di = _fc.drops.length-1; _di >= 0; _di--){
            const _fd = _fc.drops[_di];
            if(_fd?.usable !== 'c4' || !_fd._armed) continue;
            _fd._c4Timer--;
            if(_fd._c4Timer <= 0){
              _fc.drops.splice(_di, 1);
              detonateC4(_fx, _fy);
            } else if(_fd._c4Timer <= 2){
              addLog('⚠ C4 on the ground — '+_fd._c4Timer+' turns!','lc');
            }
          }
        }
      }
    }
  }

  if(pdata.isNuclearWar || biomeKey === 'NUCLEAR_WAR'){
    const tile = grid[G.player.y]?.[G.player.x]?.type;
    let dose = 0, chance = 0;
    if(tile === 'nuke_water'){ dose = 3; chance = 1; }
    else if(tile === 'nuke_crater'){ dose = 2; chance = 0.85; }
    else if(tile === 'nuke_dirt'){ dose = 1; chance = 0.28; }
    const nearHotspot = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]].some(([dx,dy])=>{
      const t = grid[G.player.y+dy]?.[G.player.x+dx]?.type;
      return t === 'nuke_crater' || t === 'nuke_water';
    });
    if(nearHotspot && tile !== 'nuke_water'){
      dose = Math.max(dose, 1);
      chance = Math.max(chance, 0.45);
    }

    applyRadiationExposureToCrew(dose, 'nuclear_war_planet', chance);
  }

  // -- Lava floor cooling + re-heating --------------------------
  if(hazards.includes('LAVA_FLOOR') || B.special==='LAVA_FLOOR'){
    // Random cooling — lava floor ? lava crust
    if(Math.random() < 0.08){
      const candidates = [];
      for(let y=1;y<PH(pdata)-1;y++)
        for(let x=1;x<PW(pdata)-1;x++)
          if(grid[y][x].type==='LAVA_FLOOR') candidates.push({x,y});
      if(candidates.length){
        const c = candidates[rnd(candidates.length)];
        grid[c.y][c.x].type = 'LAVA_CRUST';
        pdata.lavaCrustTimers[c.x+','+c.y] = 8 + rnd(8);
      }
    }
    // Crust re-heating timers
    const timers = pdata.lavaCrustTimers || {};
    for(const k2 in timers){
      timers[k2]--;
      if(timers[k2] <= 0){
        const [cx,cy] = k2.split(',').map(Number);
        if(grid[cy]?.[cx]?.type === 'LAVA_CRUST'){
          grid[cy][cx].type = 'LAVA_FLOOR';
          if(Math.abs(G.player.x-cx)<=3 && Math.abs(G.player.y-cy)<=3)
            addLog('The lava crust re-heats nearby!','lw');
        }
        delete timers[k2];
      }
    }

    // Lava eruption — occasional burst spreading lava floor
    if(Math.random() < 0.04){
      // Find an existing lava tile to erupt from
      const lavaTiles = [];
      for(let y=1;y<PH(pdata)-1;y++)
        for(let x=1;x<PW(pdata)-1;x++)
          if(grid[y][x].type==='LAVA'||grid[y][x].type==='LAVA_FLOOR') lavaTiles.push({x,y});
      if(lavaTiles.length){
        const src = lavaTiles[rnd(lavaTiles.length)];
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        let spread = false;
        for(const [dx,dy] of dirs){
          const nx=src.x+dx, ny=src.y+dy;
          if(nx<1||nx>=PW(pdata)-1||ny<1||ny>=PH(pdata)-1) continue;
          const nt = grid[ny][nx].type;
          if(nt===B.floor || nt==='VOLCANIC_FLOOR2'){
            grid[ny][nx].type = 'LAVA_FLOOR';
            spread = true;
          }
        }
        if(spread){
          addLog('A lava surge erupts nearby!','lw');
          // Eruption spawns a burst of new smoke clouds
          if(pdata.smokeClouds){
            const variants = ['smoke_cloud_a','smoke_cloud_b','smoke_cloud_c'];
            const herdIdx = pdata.smokeHerdDirs ? rnd(pdata.smokeHerdDirs.length) : 0;
            for(let i=0;i<4+rnd(4);i++){
              pdata.smokeClouds.push({
                x:(src.x+rnd(5)-2+PW(pdata))%PW(pdata),
                y:(src.y+rnd(5)-2+PH(pdata))%PH(pdata),
                sprite:variants[rnd(variants.length)],
                dx:rnd(3)-1, dy:-1,
                driftTimer:2+rnd(3),
                life:40+rnd(50),
                herd:herdIdx,
              });
            }
          }
        }
      }
    }
  }

  // -- Geyser eruptions -----------------------------------------
  if(hazards.includes('GEYSER') && pdata.geyserTimers){
    for(const k2 in pdata.geyserTimers){
      pdata.geyserTimers[k2]--;
      if(pdata.geyserTimers[k2] <= 0){
        const [gx,gy] = k2.split(',').map(Number);
        const cell = grid[gy]?.[gx];
        if(!cell) continue;
        if(cell.type === 'GEYSER'){
          // Erupt
          cell.type = 'GEYSER_ACTIVE';
          pdata.geyserTimers[k2] = 2; // stays active for 2 turns
          addLog('A toxic vent erupts nearby!','lw');
          // Damage crew if within 2 tiles
          const dist = Math.abs(G.player.x-gx)+Math.abs(G.player.y-gy);
          if(dist <= 2){
            const dmg = 3 + rnd(4);
            G.crew.filter(c=>c.hp>0).forEach(c=>{ c.hp=Math.max(0,c.hp-dmg); });
            addLog('Toxic gas hits the crew for '+dmg+' damage!','lc');
          }
        } else if(cell.type === 'GEYSER_ACTIVE'){
          // Cool down
          cell.type = 'GEYSER';
          pdata.geyserTimers[k2] = 6 + rnd(10); // wait before next eruption
        }
      }
    }
  }

  // -- Meteor rain (asteroid/frozen) ----------------------------
  if(hazards.includes('METEOR')){
    if(pdata.meteorTurnsUntilRain === undefined) pdata.meteorTurnsUntilRain = 10+rnd(81);
    pdata.meteorTurnsUntilRain--;

    if(pdata.meteorRainTurnsLeft > 0){
      // Rain is active — drop 3-5 impacts
      const impacts = 3 + rnd(3);
      if(!pdata.meteorFlashes) pdata.meteorFlashes = [];
      for(let i=0;i<impacts;i++){
        const ix = 1+rnd(PW(pdata)-2), iy = 1+rnd(PH(pdata)-2);
        const dist = Math.abs(G.player.x-ix)+Math.abs(G.player.y-iy);
        // Store flash for rendering (expires after 1 render frame via Date.now)
        pdata.meteorFlashes.push({ x:ix, y:iy, born:Date.now() });
        if(dist <= 1){
          const dmg = 4 + rnd(6);
          G.crew.filter(c=>c.hp>0).forEach(c=>{ c.hp=Math.max(0,c.hp-dmg); });
          addLog('Meteor impact! Crew takes '+dmg+' damage!','lc');
          SFX.hullHit();
        }
        // Crater — convert floor to rock
        if(( grid[iy]?.[ix]?.type === B.floor || grid[iy]?.[ix]?.type === 'VOLCANIC_FLOOR2' || grid[iy]?.[ix]?.type === 'TOXIC_FLOOR2' || grid[iy]?.[ix]?.type === 'TOXIC_FLOOR3' )){
          grid[iy][ix].type = Math.random()<0.5 ? B.rock : B.rock2;
        }
      }
      pdata.meteorRainTurnsLeft--;

    } else if(pdata.meteorTurnsUntilRain <= 0){
      // Start rain
      pdata.meteorRainTurnsLeft = 3;
      pdata.meteorTurnsUntilRain = 10 + rnd(81); // 10-90 turns — fully re-randomised each cycle
      addLog('Meteors begin striking the surface!','lw');
    }
  }

  // -- Smoke cloud herds -----------------------------------------
  if(pdata.smokeClouds){
    const variants = ['smoke_cloud_a','smoke_cloud_b','smoke_cloud_c'];

    // Update herd directions
    if(pdata.smokeHerdDirs){
      pdata.smokeHerdDirs.forEach(h=>{
        h.timer--;
        if(h.timer<=0){ h.dx=rnd(3)-1; h.dy=rnd(3)-1; h.timer=5+rnd(8); }
      });
    }

    // Move each cloud with its herd direction + small jitter
    pdata.smokeClouds.forEach(c=>{
      const herd = pdata.smokeHerdDirs?.[c.herd];
      c.driftTimer--;
      if(c.driftTimer<=0){
        // Small individual jitter around herd direction
        c.dx = herd ? herd.dx + (rnd(3)-1 > 0 ? 0 : rnd(3)-1) : rnd(3)-1;
        c.dy = herd ? herd.dy + (rnd(3)-1 > 0 ? 0 : rnd(3)-1) : rnd(3)-1;
        c.dx = Math.max(-1, Math.min(1, c.dx));
        c.dy = Math.max(-1, Math.min(1, c.dy));
        c.driftTimer = 2 + rnd(3); // move every 2-4 turns
      }
      c.x = (c.x + c.dx + PW(pdata)) % PW(pdata);
      c.y = (c.y + c.dy + PH(pdata)) % PH(pdata);
      // Age the cloud
      if(c.life !== undefined) c.life--;
    });

    // Remove dissipated clouds
    const before = pdata.smokeClouds.length;
    pdata.smokeClouds = pdata.smokeClouds.filter(c => c.life === undefined || c.life > 0);

    // Spawn new clouds from heat/gas sources to replace dissipated ones
    const isVolcanicBiome = biomeKey === 'VOLCANIC';
    const target = isVolcanicBiome ? 250 + rnd(50) : 30 + rnd(20);
    if(pdata.smokeClouds.length < target){
      const sourceTiles = [];
      for(let y=1;y<PH(pdata)-1;y++)
        for(let x=1;x<PW(pdata)-1;x++){
          const t = grid[y][x].type;
          if(isVolcanicBiome && (t==='LAVA_FLOOR'||t==='LAVA')) sourceTiles.push({x,y});
          if(!isVolcanicBiome && (t==='GEYSER_ACTIVE'||t==='GEYSER')) sourceTiles.push({x,y});
        }
      if(!sourceTiles.length) for(let i=0;i<5;i++) sourceTiles.push({x:rnd(PW(pdata)),y:rnd(PH(pdata))});
      const toSpawn = Math.min(isVolcanicBiome ? 3 : 2, target - pdata.smokeClouds.length);
      for(let i=0;i<toSpawn;i++){
        const src = sourceTiles[rnd(sourceTiles.length)];
        const herdIdx = pdata.smokeHerdDirs ? rnd(pdata.smokeHerdDirs.length) : 0;
        pdata.smokeClouds.push({
          x:(src.x+rnd(3)-1+PW(pdata))%PW(pdata),
          y:(src.y+rnd(3)-1+PH(pdata))%PH(pdata),
          sprite:variants[rnd(variants.length)],
          dx:0, dy:-1,
          driftTimer:2+rnd(3),
          life: isVolcanicBiome ? 50+rnd(60) : 20+rnd(30),
          herd:herdIdx,
          biome:biomeKey,
        });
      }
    }
  }

  // ── Mist cloud drift (ancient ruins) ─────────────────────────
  if(pdata.mistClouds && pdata.mistClouds.length){
    const W = PW(pdata), H = PH(pdata);
    const mistVariants = ['smoke_cloud_a','smoke_cloud_b','smoke_cloud_c'];
    // Update patch headings — only change direction every ~60-100 turns (slow, persistent drift)
    if(pdata.mistPatchDirs){
      pdata.mistPatchDirs.forEach(p=>{
        p.timer = (p.timer||1) - 1;
        if(p.timer <= 0){
          // Pick a new non-zero direction; bias toward keeping current cardinal
          const newDx = rnd(3)-1, newDy = rnd(3)-1;
          p.dx = newDx || p.dx || (rnd(2)?1:-1);
          p.dy = newDy || p.dy || 0;
          p.timer = 60 + rnd(40);
        }
      });
    }
    // Drift whole patches together — each patch has one shared timer.
    // When it fires, every tile in that patch steps by the same (dx,dy), keeping shape intact.
    if(pdata.mistPatchDirs){
      pdata.mistPatchDirs.forEach((pd, pi)=>{
        pd.driftTimer = (pd.driftTimer || 25) - 1;
        if(pd.driftTimer <= 0){
          pd.driftTimer = 23 + rnd(5);  // next step in 23-27 turns
          if(!pd.dx && !pd.dy){ pd.dx = rnd(3)-1; pd.dy = rnd(3)-1; } // ensure non-zero
          // Move every tile in this patch by (dx, dy)
          pdata.mistClouds.forEach(c=>{
            if(c.patch !== pi) return;
            c.x = (c.x + pd.dx + W) % W;
            c.y = (c.y + pd.dy + H) % H;
          });
        }
      });
    }
    pdata.mistClouds = pdata.mistClouds.filter(c => c.life === undefined || c.life > 0);
    // Replenish — keep a healthy number of clouds on the map
    const mistTarget = 70 + rnd(20);
    if(pdata.mistClouds.length < mistTarget){
      const toSpawn = Math.min(3, mistTarget - pdata.mistClouds.length);
      for(let i=0;i<toSpawn;i++){
        const pi = rnd(pdata.mistPatchDirs?.length || 1);
        pdata.mistClouds.push({
          x: rnd(W), y: rnd(H),
          life: undefined,
          patch: pi,
        });
      }
    }
  }

  applyHallucinogenicExposure();
  tickCrewStatuses('planet');
}

