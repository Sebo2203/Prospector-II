function drawPlanet(){
  const pdata=G.planets[G.curPlanet];
  if(!pdata) return;
  const W=PW(pdata), H=PH(pdata);
  const enemies=G.enemies[G.curPlanet]||[];
  const B=BIOMES[pdata.biome]||{floor:'EARTH_FLOOR'};
  const floorTileType=B.floor || 'EARTH_FLOOR';
  const floorSprite=TILE[floorTileType]?.sprite||'earth_floor';
  const floorAscii=ASCII[floorTileType]||ASCII[floorSprite]||{bg:'#0a1a08',fg:'#2a5a1a'};
  // bgFloor / bgAscii depend only on map type — hoist to function scope so
  // both the tile loop and the enemy overlay loop can reference them.
  const _isAncientSt  = !!pdata.isAncientStation;
  const _isDerelict   = !!pdata.isDerelict;
  const _isCave       = !!pdata.isCave;
  const _isRingworld  = !!pdata.isRingworld;
  const _isDRW        = !!pdata.isDestroyedRingworld;
  const _isNukeWar    = !!pdata.isNuclearWar;
  const bgFloor = _isAncientSt ? 'ancient_st_floor' : _isDerelict ? 'station_floor' : _isCave ? 'cave_floor' : (_isRingworld||_isDRW) ? 'rw_floor' : _isNukeWar ? 'nuke_dirt' : floorTileType;
  const bgAscii = _isAncientSt ? (ASCII['ancient_st_floor']||floorAscii) : _isDerelict ? (ASCII['station_floor']||floorAscii) : _isCave ? (ASCII['cave_floor']||floorAscii) : _isNukeWar ? (ASCII['nuke_dirt']||floorAscii) : floorAscii;
  const phase = planetPhase(G.curPlanet);
  const px = G.player.x, py = G.player.y;
  const hallucinationPower = hallucinationActivePower();

  // Camera — centre on player, clamped to map bounds
  const camX = Math.max(0, Math.min(W - VIEW_W, px - Math.floor(VIEW_W/2)));
  const camY = Math.max(0, Math.min(H - VIEW_H, py - Math.floor(VIEW_H/2)));

  // Continuous vision radius — 10 at peak day, 1 at peak night
  let vr = planetVisionRadius(G.curPlanet);
  // For darkness overlay: use raw vr WITHOUT floodlight/item bonuses so picking up
  // a light item doesn't brighten the whole ambient environment — it only extends
  // how far you can see, not how bright the world looks.
  const _floodBonus = (G.inventory||[]).some(i=>i.usable==='floodlight') ? 2 : 0;
  const vrDark = Math.max(1, vr - _floodBonus);
  // Ancient station has open-sky light; underwater should feel close, dark, and heavy.
  const _darkScale = pdata.isAncientStation ? 0.25 : pdata.isUnderwater ? 1.05 : 0.88;
  // Darkness alpha scales inversely with vision: 0 at full day, ~scale at night
  const darkAlpha = Math.max(0, (10 - vrDark) / 9 * _darkScale);
  // Check if player is inside smoke — tint colour depends on biome
  const inSmoke = pdata.smokeClouds?.some(c=>c.x===px && c.y===py);
  const inMist  = pdata.mistClouds?.some(c=>c.x===px && c.y===py);
  // Standing in mist reduces visible radius for rendering — but NOT for the HUD phase indicator
  if(inMist) vr = Math.min(vr, 3.5);
  const isToxicBiome   = pdata.biome === 'TOXIC';
  const isAncientBiome = pdata.biome === 'ANCIENT';
  const warmness = Math.max(0, (vrDark - 1) / 9);
  const darkR = pdata.isUnderwater ? 0  : inSmoke ? (isToxicBiome ? 12 : 30) : isAncientBiome ? Math.round(warmness * 10) : Math.round(warmness * 25);
  const darkG = pdata.isUnderwater ? 10 : inSmoke ? (isToxicBiome ? 28 : 20) : isAncientBiome ? Math.round(warmness * 5)  : Math.round(warmness * 5);
  const darkB = pdata.isUnderwater ? 24 : inSmoke ? (isToxicBiome ? 10 :  8) : isAncientBiome ? Math.round(20 + (1-warmness)*20) : Math.round((1-warmness)*15);

  function hasLOS(tx, ty){
    return hasPlanetLOS(pdata, px, py, tx, ty);
  }

  // Helper: map tile (mx,my) → screen pixel (sx,sy)
  function tileToScreen(mx, my){ return [(mx-camX)*TS, (my-camY)*TS]; }
  function drawBaseFloor(tileType, sx, sy, bg){
    const info = TILE[tileType];
    if(!OPTIONS.asciiMode && info?.drawFn && DRAW[info.drawFn]) DRAW[info.drawFn](ctx, sx, sy);
    else if(OPTIONS.asciiMode) drawAsciiTile(tileType, sx, sy, bg);
    else drawSprite(info?.sprite || tileType, sx, sy, bg);
  }

  for(let vy=0;vy<VIEW_H;vy++){
    const y = camY + vy;
    if(y<0||y>=H) continue;
    for(let vx=0;vx<VIEW_W;vx++){
      const x = camX + vx;
      if(x<0||x>=W) continue;
      const [sx,sy] = tileToScreen(x,y);
      // Fog of war
      if(!pdata.visited || !pdata.visited[y*W+x]){
        if(pdata.isAncientStation){
          const _t = Date.now() / 1800;
          const _phase = Math.sin(_t + x*0.37 + y*0.71) * 0.5 + 0.5;
          const _band  = Math.sin(_t*0.7 + y*0.55) * 0.5 + 0.5;
          const _r = Math.round(18 + _band*22 + _phase*10);
          const _g = Math.round(8  + _band*12 + _phase*5);
          const _b = Math.round(2  + _phase*4);
          ctx.fillStyle=`rgb(${_r},${_g},${_b})`;
          ctx.fillRect(sx,sy,TS,TS);
          const _swirl = Math.floor(Date.now()/600 + x*3.7 + y*2.3) % 6;
          if(_swirl===0){
            ctx.fillStyle=`rgba(${_r+30},${_g+20},${_b+5},0.4)`;
            ctx.font='bold '+(TS-2)+'px Courier New';
            ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText('~',sx+TS/2,sy+TS/2+1);
            ctx.textBaseline='alphabetic'; ctx.textAlign='left';
          }
        } else if(pdata.isDestroyedRingworld){
          // Unvisited tiles on destroyed ringworld — deep space black with stars
          ctx.fillStyle='#02020a'; ctx.fillRect(sx,sy,TS,TS);
          const starSeed=(x*7919+y*1049)%1000;
          if(starSeed<8){ const bri=40+starSeed*6; ctx.fillStyle=`rgb(${bri},${bri},${bri})`; ctx.fillRect(sx+(x*13+y*7)%TS,sy+(x*5+y*11)%TS,1,1); }
        } else if(pdata.isUnderwater){
          ctx.fillStyle='#01070d'; ctx.fillRect(sx,sy,TS,TS);
          const siltSeed=(x*9151+y*3571)%1000;
          if(siltSeed<18){
            ctx.fillStyle='rgba(30,90,120,0.18)';
            ctx.fillRect(sx+(x*7+y*11)%TS, sy+(x*13+y*5)%TS, 1, 1);
          }
        } else {
          ctx.fillStyle='#04040c'; ctx.fillRect(sx,sy,TS,TS);
        }
        continue;
      }
      const cell=pdata.grid[y][x];
      const tileInfo=TILE[cell.type];
      const isDerelict = !!pdata.isDerelict;
      const isAncientSt = !!pdata.isAncientStation;
      const isCave = !!pdata.isCave;
      const isRingworld = !!pdata.isRingworld;
      const isDRW = !!pdata.isDestroyedRingworld;
      const isNukeWar = !!pdata.isNuclearWar;
      const isSpecialMap = isDerelict || isAncientSt || isCave || isRingworld || isDRW || isNukeWar || !!pdata.isCasino;
      const bgFloor    = isAncientSt ? 'ancient_st_floor' : isDerelict ? 'station_floor' : isCave ? 'cave_floor' : (isRingworld||isDRW) ? 'rw_floor' : isNukeWar ? 'nuke_dirt' : floorTileType;
      const bgAscii    = isAncientSt ? (ASCII['ancient_st_floor']||floorAscii) : isDerelict ? (ASCII['station_floor']||floorAscii) : isCave ? (ASCII['cave_floor']||floorAscii) : isNukeWar ? (ASCII['nuke_dirt']||floorAscii) : floorAscii;

      if(['ARTIFACT','BIODATA','SHIP',
          'station_corpse','station_console','station_locker','station_door',
          'rw_locked_door','rw_console',
          'ancient_locked_door','ancient_statue',
          'ancient_st_fuel','ancient_st_trap','ancient_st_node','ancient_st_corner','ancient_st_edge',
          'ancient_st_glow','cave_exit','CAVE_ENTRANCE',
          'civ_hut','civ_fire_pit','civ_longhouse','civ_totem',
          'civ_stone_tower','civ_market','civ_factory','civ_tenement',
          'civ_office','civ_relay_tower'].includes(cell.type)){
        // Use stored _underFloor so tiles placed inside ancient buildings
        // (ARTIFACT, SHIP, etc.) draw the correct floor beneath them
        const _effectiveBg = cell._underFloor || bgFloor;
        const _effectiveBgDrawFn = TILE[_effectiveBg]?.drawFn;
        if(isSpecialMap && DRAW[bgFloor]){
          DRAW[bgFloor](ctx, sx, sy);
        } else if(cell._underFloor && _effectiveBgDrawFn && DRAW[_effectiveBgDrawFn]){
          DRAW[_effectiveBgDrawFn](ctx, sx, sy);
        } else {
          drawBaseFloor(_effectiveBg, sx, sy, bgAscii.bg);
        }
        if(OPTIONS.asciiMode){
          drawAsciiTile(cell.type, sx, sy, bgAscii.bg);
        } else if(tileInfo?.drawFn && DRAW[tileInfo.drawFn]){
          DRAW[tileInfo.drawFn](ctx, sx, sy, cell);
        } else if(tileInfo?.sprite){
          drawSpriteDarkMatteKeyed(tileInfo.sprite, sx, sy, '#aaaacc');
        }
      } else if(cell.type === 'MINERAL_SAMPLE'){
        const _msBg = cell._underFloor || bgFloor;
        const _msBgFn = TILE[_msBg]?.drawFn;
        if(isSpecialMap && DRAW[bgFloor]) DRAW[bgFloor](ctx, sx, sy);
        else if(cell._underFloor && _msBgFn && DRAW[_msBgFn]) DRAW[_msBgFn](ctx, sx, sy);
        else drawBaseFloor(_msBg, sx, sy, bgAscii.bg);
        if(OPTIONS.asciiMode) drawAsciiTile('MINERAL_SAMPLE', sx, sy, bgAscii.bg);
        else drawMineralSample(ctx, sx, sy, cell);
      } else if(cell.type === 'MINERAL'){
        if(isSpecialMap && DRAW[bgFloor]) DRAW[bgFloor](ctx, sx, sy);
        else drawBaseFloor(bgFloor, sx, sy, bgAscii.bg);
        if(cell.revealed){
          if(OPTIONS.asciiMode) drawAsciiTile('mineral', sx, sy, bgAscii.bg);
          else drawOreDeposit(ctx, sx, sy, cell.oreType||'fe');
        }
        // hidden/unscanned — plain floor; scanned ? drawn in second pass after darkness
      } else if(cell.type === 'NEST'){
        if(cell.revealed){
          drawBaseFloor(floorTileType, sx, sy, floorAscii.bg);
          if(OPTIONS.asciiMode){ drawAsciiTile('nest', sx, sy, floorAscii.bg); }
          else { DRAW.nest(ctx, sx, sy); }
        } else {
          drawBaseFloor(floorTileType, sx, sy, floorAscii.bg);
          if(OPTIONS.asciiMode){ drawAsciiTile('earth_forest', sx, sy, floorAscii.bg); }
          else { drawSpriteDarkMatteKeyed('earth_forest', sx, sy, '#224422'); }
        }
      } else if(cell.type === 'CAVE_NEST'){
        if(OPTIONS.asciiMode){
          drawAsciiTile('cave_floor', sx, sy, bgAscii.bg);
          if(cell.revealed) drawAsciiTile('cave_nest', sx, sy, bgAscii.bg);
        } else {
          DRAW.cave_floor(ctx, sx, sy);
          if(cell.revealed) DRAW.cave_nest(ctx, sx, sy);
        }
      } else {
        const sp = cell._sprite || tileInfo?.sprite || bgFloor;
        if(isAncientSt && cell.type==='ancient_st_void'){
          const _t2 = Date.now() / 1800;
          const _ph2 = Math.sin(_t2 + x*0.37 + y*0.71) * 0.5 + 0.5;
          const _bd2 = Math.sin(_t2*0.7 + y*0.55) * 0.5 + 0.5;
          const _r2 = Math.round(18 + _bd2*22 + _ph2*10);
          const _g2 = Math.round(8  + _bd2*12 + _ph2*5);
          const _b2 = Math.round(2  + _ph2*4);
          ctx.fillStyle=`rgb(${_r2},${_g2},${_b2})`;
          ctx.fillRect(sx,sy,TS,TS);
        } else if(cell.type==='rw_void'){
          ctx.fillStyle='#02020a'; ctx.fillRect(sx,sy,TS,TS);
          const starSeed=(x*7919+y*1049)%1000;
          if(starSeed<18){
            const bri=80+starSeed*8;
            ctx.fillStyle=`rgb(${bri},${bri},${Math.min(255,bri+30)})`;
            ctx.fillRect(sx+(x*13+y*7)%TS, sy+(x*5+y*11)%TS, 1, 1);
          }
        } else if(OPTIONS.asciiMode){
          drawAsciiTile(pdata.isCasino ? cell.type : sp, sx, sy, bgAscii.bg);
        } else if(cell.type === 'EARTH_FOREST' && tileInfo?.sprite){
          drawBaseFloor(floorTileType, sx, sy, floorAscii.bg);
          drawSpriteDarkMatteKeyed(tileInfo.sprite, sx, sy, '#224422');
        } else if(tileInfo?.drawFn && DRAW[tileInfo.drawFn]){
          DRAW[tileInfo.drawFn](ctx, sx, sy, cell);
        } else {
          // For non-passable tiles (rocks, boulders etc.), draw the
          // floor underneath first so the tile renders over terrain.
          // Passable tiles with drawFns fill the entire area themselves.
          if(tileInfo && !tileInfo.pass){
            if(isSpecialMap && DRAW[bgFloor]){
              DRAW[bgFloor](ctx, sx, sy);
            } else {
              drawBaseFloor(bgFloor, sx, sy, bgAscii.bg);
            }
          }
          if(tileInfo?.drawFn && DRAW[tileInfo.drawFn]){
            DRAW[tileInfo.drawFn](ctx, sx, sy, cell);
          } else if(tileInfo && !tileInfo.pass){
            // Canvas sprites (pre-rendered variants) draw directly; IMG sprites use matte
            if(IMG[sp] instanceof HTMLCanvasElement){
              ctx.drawImage(IMG[sp], sx, sy, TS, TS);
            } else {
              drawSpriteDarkMatteKeyed(sp, sx, sy, bgAscii.bg);
            }
          } else {
            drawSprite(sp, sx, sy, bgAscii.bg);
          }
        }
      }

      drawPlanetDrops(cell, sx, sy, bgAscii.bg);
      if(hallucinationPower > 0){
        const _hW = PW(pdata);
        if(pdata.lit && pdata.lit[y*_hW+x]){
          drawHallucinationFloorShift(x, y, sx, sy, hallucinationPower);
          drawHallucinationOverlay(hallucinationAt(pdata, x, y, hallucinationPower), sx, sy, bgAscii.bg);
        }
      }
      if(civilizationTileInBoundaryPromise(pdata, x, y)){
        const civPromise = ensureCivilizationState(pdata)?.boundaryPromise;
        const allowedZone = civPromise?.mode === 'allowed_zone';
        const edge = !civilizationTileInBoundaryPromise(pdata, x-1, y) ||
                     !civilizationTileInBoundaryPromise(pdata, x+1, y) ||
                     !civilizationTileInBoundaryPromise(pdata, x, y-1) ||
                     !civilizationTileInBoundaryPromise(pdata, x, y+1);
        ctx.save();
        ctx.fillStyle = allowedZone ? 'rgba(80,220,120,0.10)' : 'rgba(255,170,51,0.16)';
        ctx.fillRect(sx, sy, TS, TS);
        if(edge){
          ctx.strokeStyle = allowedZone ? 'rgba(120,255,160,0.52)' : 'rgba(255,210,90,0.72)';
          ctx.lineWidth = 2;
          ctx.strokeRect(sx+2, sy+2, TS-4, TS-4);
        } else {
          ctx.strokeStyle = allowedZone ? 'rgba(100,240,140,0.22)' : 'rgba(255,190,60,0.28)';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx+5, sy+5, TS-10, TS-10);
        }
        ctx.restore();
      }

      // Darkness overlay
      // Use pdata.lit[] (set by the shadowcaster each turn) as the single source
      // of truth for visibility. This eliminates the dark-column artefacts caused
      // by the old Bresenham hasLOS() disagreeing with the octant shadowcaster.
      const W2 = PW(pdata);
      const visible = pdata.lit ? pdata.lit[y*W2+x] : false;
      if(!visible){
        const alpha = darkAlpha;
        if(alpha > 0.02){
          ctx.fillStyle = `rgba(${darkR},${darkG},${darkB},${alpha.toFixed(2)})`;
          ctx.fillRect(sx, sy, TS, TS);
        }
      } else if(darkAlpha > 0.1){
        ctx.fillStyle = `rgba(${darkR},${darkG},${darkB},${(darkAlpha*0.15).toFixed(2)})`;
        ctx.fillRect(sx, sy, TS, TS);
      }
    }
  }

  // ── Scanner second pass — draw ? on top of darkness for scanned deposits ──
  if((G.inventory||[]).some(i => i.usable === 'ore_scanner')){
    for(let vy=0;vy<VIEW_H;vy++){
      const y = camY + vy;
      if(y<0||y>=H) continue;
      for(let vx=0;vx<VIEW_W;vx++){
        const x = camX + vx;
        if(x<0||x>=W) continue;
        if(!pdata.visited || !pdata.visited[y*W+x]) continue;
        const cell = pdata.grid[y][x];
        if(cell && cell.type === 'MINERAL' && !cell.revealed && cell._scanned){
          const [sx,sy] = tileToScreen(x,y);
          ctx.font = 'bold 11px Courier New';
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(136,255,68,0.7)';
          ctx.fillText('?', sx+12, sy+16);
          ctx.textAlign = 'left';
        }
      }
    }
  }

  enemies.forEach(e=>{
    if(!e.alive) return;
    if(e.hidden) return;
    const W2=PW(pdata);
    if(!pdata.visited || !pdata.visited[e.y*W2+e.x]) return;
    const edist = Math.sqrt((e.x-px)*(e.x-px)+(e.y-py)*(e.y-py));
    if(edist > vr) return;
    if(edist >= 1.5 && !hasLOS(e.x, e.y)) return;
    const [esx,esy] = tileToScreen(e.x, e.y);
    if(esx<0||esx>=canvas.width||esy<0||esy>=canvas.height) return;
    // Draw the actual tile underneath the enemy, not just the biome default floor,
    // so NPCs overlay on forests, civ buildings, etc. rather than erasing them.
    if(e.shipboardAlien){
      drawSprite('station_floor', esx, esy, ASCII['station_floor']?.bg);
    } else {
      const eTile = pdata.grid[e.y]?.[e.x];
      const eTileType = eTile?.type;
      const eTileInfo = eTileType ? TILE[eTileType] : null;
      const isCivTile = eTileType && [
        'civ_hut','civ_fire_pit','civ_longhouse','civ_totem',
        'civ_stone_tower','civ_market','civ_factory','civ_tenement',
        'civ_office','civ_relay_tower',
      ].includes(eTileType);
      if(isCivTile){
        // Draw the biome floor first, then the building on top, then the NPC will overlay
        drawBaseFloor(bgFloor, esx, esy, bgAscii.bg);
        if(!OPTIONS.asciiMode && eTileInfo?.drawFn && DRAW[eTileInfo.drawFn]){
          DRAW[eTileInfo.drawFn](ctx, esx, esy);
        } else if(!OPTIONS.asciiMode && eTileInfo?.sprite){
          drawSpriteDarkMatteKeyed(eTileInfo.sprite, esx, esy, '#aaaacc');
        } else if(OPTIONS.asciiMode){
          drawAsciiTile(eTileType, esx, esy, bgAscii.bg);
        }
      } else if(eTileType === 'EARTH_FOREST' && !OPTIONS.asciiMode){
        // Draw floor + forest canopy, NPC will be drawn on top
        drawBaseFloor(bgFloor, esx, esy, bgAscii.bg);
        drawSpriteDarkMatteKeyed('earth_forest', esx, esy, '#224422');
      } else if(eTileType && eTileInfo?.drawFn && DRAW[eTileInfo.drawFn] && eTileInfo.pass && !OPTIONS.asciiMode){
        // Passable tile with its own draw function (e.g. bloom floor) — draw it
        DRAW[eTileInfo.drawFn](ctx, esx, esy);
      } else {
        drawBaseFloor(bgFloor, esx, esy, bgAscii.bg);
      }
    }
    const sp = e.sprite || (e.civLocal && e.bodyLabel === 'ancient plant' ? 'walking_tree' : (e.type==='XALIEN' ? 'alien_boss' : 'alien'));
    if(OPTIONS.asciiMode){
      drawAsciiTile(sp, esx, esy, floorAscii.bg, e.colour);
    } else if(e.drawFn && DRAW[e.drawFn]){
      DRAW[e.drawFn](ctx, esx, esy);
    } else if(sp==='cave_bug' && DRAW.cave_bug){
      DRAW.cave_floor(ctx, esx, esy);
      DRAW.cave_bug(ctx, esx, esy);
    } else if(sp==='cave_queen' && DRAW.cave_queen){
      DRAW.cave_floor(ctx, esx, esy);
      DRAW.cave_queen(ctx, esx, esy);
    } else if(sp==='earth_forest'){
      DRAW.earth_forest(ctx, esx, esy);
    } else if(DRAW[sp]){
      DRAW[sp](ctx, esx, esy);
    } else if(e.shipboardAlien){
      drawSpriteChromaKeyed(sp, esx, esy, e.colour||'#882200');
    } else {
      drawSprite(sp, esx, esy, e.colour||'#882200');
    }
  });
  const [psx,psy] = tileToScreen(px,py);

  // ── Jetpack propellant trail ───────────────────────────────────
  if(pdata.jetTrail?.length){
    pdata.jetTrail.forEach(entry=>{
      if(!pdata.visited || !pdata.visited[entry.y*PW(pdata)+entry.x]) return;
      const dist = Math.sqrt((entry.x-px)*(entry.x-px)+(entry.y-py)*(entry.y-py));
      if(dist > vr) return;
      const [tsx,tsy] = tileToScreen(entry.x, entry.y);
      const fade = entry.life / entry.maxLife;  // 1.0 fresh, approaching 0 as it dies
      entry.sparks.forEach(s=>{
        const alpha = (fade * (0.55 + (s.size-1)*0.15)).toFixed(3);
        let r,g,b;
        if(s.hue===0){      r=255; g=255; b=255; }  // bright white
        else if(s.hue===1){ r=220; g=220; b=220; }  // slightly dimmer white
        else{               r=190; g=195; b=200; }  // faint cool white
        ctx.fillStyle=`rgba(${r},${g},${b},${alpha})`;
        ctx.fillRect(tsx+s.px, tsy+s.py, s.size, s.size);
      });
    });
  }

  drawPlayerPawn(psx, psy);

  // ── Smoke cloud sprites ────────────────────────────────────────
  if(pdata.smokeClouds){
    const W3=PW(pdata);
    pdata.smokeClouds.forEach(c=>{
      if(!pdata.visited || !pdata.visited[c.y*W3+c.x]) return;
      const sdist = Math.sqrt((c.x-px)*(c.x-px)+(c.y-py)*(c.y-py));
      if(sdist > vr) return;
      if(sdist >= 1.5 && !hasLOS(c.x, c.y)) return;
      const [csx,csy] = tileToScreen(c.x, c.y);
      drawSprite(c.sprite, csx, csy, null);
      if(darkAlpha > 0.1){
        ctx.fillStyle = `rgba(${darkR},${darkG},${darkB},${(darkAlpha*0.15).toFixed(2)})`;
        ctx.fillRect(csx, csy, TS, TS);
      }
    });
  }

  // ── Mist cloud rendering (ancient ruins) ─────────────────────
  if(pdata.mistClouds && pdata.mistClouds.length){
    const W3m = PW(pdata);
    // Build a set of occupied mist positions for seamless neighbour detection
    const mistSet = new Set();
    pdata.mistClouds.forEach(c => mistSet.add(c.x+','+c.y));

    pdata.mistClouds.forEach(c=>{
      if(!pdata.visited || !pdata.visited[c.y*W3m+c.x]) return;
      const mdist = Math.sqrt((c.x-px)*(c.x-px)+(c.y-py)*(c.y-py));
      if(mdist > vr) return;
      if(mdist >= 1.5 && !hasLOS(c.x, c.y)) return;
      const [msx,msy] = tileToScreen(c.x, c.y);

      // Seamless blending — detect which neighbours also have mist
      const nN = mistSet.has(c.x+','+(c.y-1));
      const nS = mistSet.has(c.x+','+(c.y+1));
      const nW = mistSet.has((c.x-1)+','+c.y);
      const nE = mistSet.has((c.x+1)+','+c.y);
      const nNW= mistSet.has((c.x-1)+','+(c.y-1));
      const nNE= mistSet.has((c.x+1)+','+(c.y-1));
      const nSW= mistSet.has((c.x-1)+','+(c.y+1));
      const nSE= mistSet.has((c.x+1)+','+(c.y+1));

      ctx.save();

      // Dark overcast ground mist — dense grey-green, not white
      const grad = ctx.createRadialGradient(
        msx + TS*0.5, msy + TS*0.5, 0,
        msx + TS*0.5, msy + TS*0.5, TS * 1.08
      );
      grad.addColorStop(0,   'rgba(110,120,105,0.88)');
      grad.addColorStop(0.35,'rgba(100,112,96,0.72)');
      grad.addColorStop(0.65,'rgba(88,100,84,0.38)');
      grad.addColorStop(1.0, 'rgba(76,88,72,0.00)');
      ctx.fillStyle = grad;
      ctx.fillRect(msx - TS, msy - TS, TS*3, TS*3);

      // Seam fill — same desaturated grey-green, keeps blobs solid in the interior
      ctx.globalAlpha = 0.50;
      ctx.fillStyle = '#6e7a68';
      if(nN)  ctx.fillRect(msx,        msy,        TS, TS*0.5);
      if(nS)  ctx.fillRect(msx,        msy+TS*0.5, TS, TS*0.5);
      if(nW)  ctx.fillRect(msx,        msy,        TS*0.5, TS);
      if(nE)  ctx.fillRect(msx+TS*0.5, msy,        TS*0.5, TS);

      ctx.restore();
    });
  }

  // ── Forest canopy overlay ─────────────────────────────────────
  const inForest = pdata.grid[py]?.[px]?.type === 'EARTH_FOREST';
  if(inForest){
    ctx.fillStyle = 'rgba(8,22,6,0.60)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawPlayerPawn(psx, psy);
  }

  // ── Smoke darkness overlay ────────────────────────────────────
  if(inSmoke){
    const overlayCol = isToxicBiome ? 'rgba(10,25,8,0.55)' : 'rgba(22,14,8,0.55)';
    ctx.fillStyle = overlayCol;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawPlayerPawn(psx, psy);
  }

  // ── Mist darkness overlay (standing in mist) ─────────────────
  if(inMist){
    ctx.fillStyle = 'rgba(80,90,76,0.35)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawPlayerPawn(psx, psy);
  }

  // ── Underwater pressure haze ──────────────────────────────────
  if(pdata.isUnderwater){
    const pulse = Math.sin(Date.now()/900) * 0.04;
    ctx.fillStyle = `rgba(0,18,34,${(0.32 + pulse).toFixed(2)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle='rgba(70,160,190,0.10)';
    ctx.lineWidth=1;
    for(let yy = -TS; yy < canvas.height + TS; yy += TS*2){
      const off = Math.sin(Date.now()/1200 + yy*0.02) * 10;
      ctx.beginPath();
      ctx.moveTo(off, yy);
      ctx.quadraticCurveTo(canvas.width*0.35, yy+6, canvas.width+off, yy-4);
      ctx.stroke();
    }
    drawPlayerPawn(psx, psy);
  }

  // ── Temporary muzzle flashes and tile projectiles ─────────────
  if(pdata.muzzleFlashes && pdata.muzzleFlashes.length){
    const now = Date.now();
    const TOTAL_MS = 220;
    pdata.muzzleFlashes = pdata.muzzleFlashes.filter(f => now - f.born < TOTAL_MS);
    pdata.muzzleFlashes.forEach(f=>{
      const age = now - f.born;
      const fade = Math.max(0, 1 - age / TOTAL_MS);
      const [fsx, fsy] = tileToScreen(f.x, f.y);
      if(fsx<-TS||fsy<-TS||fsx>canvas.width||fsy>canvas.height) return;
      ctx.save();
      ctx.globalAlpha = fade;
      if(OPTIONS.asciiMode){
        ctx.font='bold '+(TS-1)+'px Courier New';
        ctx.textAlign='center';
        ctx.textBaseline='middle';
        ctx.fillStyle=f.col || '#ffdd66';
        ctx.fillText('*', fsx+TS/2, fsy+TS/2+1);
        ctx.textBaseline='alphabetic';
        ctx.textAlign='left';
      } else {
        ctx.fillStyle='rgba(255,220,80,0.75)';
        ctx.fillRect(fsx+7, fsy+7, 10, 10);
        ctx.fillStyle='#ffffff';
        ctx.fillRect(fsx+10, fsy+10, 4, 4);
      }
      ctx.restore();
    });
  }

  if(pdata.bulletTracers && pdata.bulletTracers.length){
    const now = Date.now();
    const FRAME_MS = 45;
    const HOLD_MS = 90;
    pdata.bulletTracers = pdata.bulletTracers.filter(t => now - t.born < (((t.path||[]).length || 1) * FRAME_MS + HOLD_MS));
    pdata.bulletTracers.forEach(t=>{
      const age = now - t.born;
      const path = t.path || [];
      if(!path.length) return;
      const frame = Math.min(path.length-1, Math.floor(age / FRAME_MS));
      const fade = age > path.length * FRAME_MS ? Math.max(0, 1 - (age - path.length * FRAME_MS) / HOLD_MS) : 1;
      const p = path[frame];
      const [bsx, bsy] = tileToScreen(p.x, p.y);
      if(bsx<-TS||bsy<-TS||bsx>canvas.width||bsy>canvas.height) return;
      ctx.save();
      ctx.globalAlpha = fade;
      if(OPTIONS.asciiMode){
        ctx.font='bold '+(TS-1)+'px Courier New';
        ctx.textAlign='center';
        ctx.textBaseline='middle';
        ctx.fillStyle=t.col || '#ffdd66';
        ctx.fillText('•', bsx+TS/2, bsy+TS/2+1);
        ctx.textBaseline='alphabetic';
        ctx.textAlign='left';
      } else {
        ctx.fillStyle='rgba(0,0,0,0.45)';
        ctx.fillRect(bsx+9, bsy+11, 7, 4);
        ctx.fillStyle=t.col || '#ffdd66';
        ctx.fillRect(bsx+10, bsy+10, 5, 5);
        ctx.fillStyle='#ffffff';
        ctx.fillRect(bsx+12, bsy+11, 2, 2);
      }
      ctx.restore();
    });
  }

  // ── Meteor impact flashes ─────────────────────────────────────
  if(pdata.meteorFlashes && pdata.meteorFlashes.length){
    const now = Date.now();
    const FRAME_MS = 120;
    const TOTAL_MS = FRAME_MS * 3;
    const W4=PW(pdata);
    pdata.meteorFlashes = pdata.meteorFlashes.filter(f => now - f.born < TOTAL_MS);
    pdata.meteorFlashes.forEach(f => {
      if(!pdata.visited || !pdata.visited[f.y*W4+f.x]) return;
      const age = now - f.born;
      const frame = Math.min(2, Math.floor(age / FRAME_MS));
      const sprite = ['meteor_f1','meteor_f2','meteor_f3'][frame];
      const [fsx,fsy] = tileToScreen(f.x, f.y);
      drawSprite(sprite, fsx, fsy, null);
    });
  }
}

function drawPlayerPawn(px,py){
  const biomeKey = atmosphereBiomeKey(G.curPlanet);
  const oxyDrain = biomeKey ? (BIOMES[biomeKey]?.oxyDrain ?? 0) : 0;
  const sprite = !biomeKey     ? 'player_pawn' :
                 oxyDrain > 0  ? 'player_pawn_helmet' :
                                  'player_pawn_suit';

  // Check if standing on water
  const pdata = G.planets[G.curPlanet];
  const tileType = pdata?.grid[G.player.y]?.[G.player.x]?.type;
  const inWater = tileType === 'EARTH_WATER';

  if(inWater){
    const halfH = Math.floor(TS / 2);
    // Draw only top half of sprite using clip
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, TS, halfH);
    ctx.clip();
    drawSprite(sprite, px, py, '#aaaacc');
    ctx.restore();
    // Water surface overlay on bottom half — ripple tint
    ctx.fillStyle = 'rgba(25,70,145,0.72)';
    ctx.fillRect(px, py + halfH, TS, halfH);
    // Ripple line at waterline
    ctx.strokeStyle = 'rgba(80,140,210,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py + halfH);
    ctx.lineTo(px + TS, py + halfH);
    ctx.stroke();
  } else {
    drawSprite(sprite, px, py, '#aaaacc');
  }
}

// Returns true if tile (x,y) is enclosed by ANCIENT_WALL on all four cardinal sides
// (any wall or door in that direction), used to suppress scan penetration into buildings.
function isInsideAncientBuilding(pdata, x, y){
  const _W = PW(pdata), _H = PH(pdata);
  const wallTypes = new Set(['ANCIENT_WALL','ancient_locked_door']);
  function hasWallToward(dx, dy){
    let cx = x + dx, cy = y + dy;
    while(cx >= 0 && cx < _W && cy >= 0 && cy < _H){
      const t = pdata.grid?.[cy]?.[cx]?.type;
      if(wallTypes.has(t)) return true;
      if(t !== 'ANCIENT_OUTPOST' && t !== 'ARTIFACT' && t !== 'MINERAL' && t !== 'MINERAL_SAMPLE' && t !== 'BIODATA') return false;
      cx += dx; cy += dy;
    }
    return false;
  }
  return hasWallToward(1,0) && hasWallToward(-1,0) && hasWallToward(0,1) && hasWallToward(0,-1);
}

