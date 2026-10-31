function drawScanView(){
  const pKey = G.scanViewKey;
  const pdata = G.planets[pKey];
  if(!pdata){ return; }
  ensureScanCursor(pKey);

  const B = BIOMES[pdata.biome] || {floor:'EARTH_FLOOR'};
  const floorTileType = B.floor || 'EARTH_FLOOR';
  const floorSprite = TILE[floorTileType]?.sprite || 'earth_floor';
  const floorAscii  = ASCII[floorSprite] || {bg:'#0a1a08', fg:'#2a5a1a'};
  function drawScanBaseFloor(tileType, sx, sy, bg){
    const info = TILE[tileType];
    if(!OPTIONS.asciiMode && info?.drawFn && DRAW[info.drawFn]) DRAW[info.drawFn](ctx, sx, sy);
    else if(OPTIONS.asciiMode) drawAsciiTile(tileType, sx, sy, bg);
    else drawSprite(info?.sprite || tileType, sx, sy, bg);
  }

  // Draw all tiles, using scanMask for visibility
  const mask = pdata.scanMask;
  const _W = PW(pdata), _H = PH(pdata);
  const hasLanded = !!pdata.visited?.some(Boolean);
  // Camera centred on scan cursor, clamped to map
  const scx = G.scanCursorX ?? pdata.spawnX;
  const scy = G.scanCursorY ?? pdata.spawnY;
  const scCamX = Math.max(0, Math.min(_W - VIEW_W, scx - Math.floor(VIEW_W/2)));
  const scCamY = Math.max(0, Math.min(_H - VIEW_H, scy - Math.floor(VIEW_H/2)));
  for(let vy=0;vy<VIEW_H;vy++){
    const y = scCamY+vy;
    if(y<0||y>=_H) continue;
    for(let vx=0;vx<VIEW_W;vx++){
      const x = scCamX+vx;
      if(x<0||x>=_W) continue;
      const sx=(x-scCamX)*TS, sy=(y-scCamY)*TS;
      if(!mask || !mask[y*_W+x]){
        ctx.fillStyle='#04040c'; ctx.fillRect(sx,sy,TS,TS);
        continue;
      }
      // Rogue planets are perpetually dark — show only a dim floor, no detail
      if(pdata.isRoguePlanet){
        ctx.fillStyle='#080810'; ctx.fillRect(sx,sy,TS,TS);
        // Faint star-like grain so it doesn't look like unscanned fog
        const rSeed=(x*3571+y*2749)&0xffff;
        if(rSeed%80===0){ ctx.fillStyle='rgba(80,80,120,0.4)'; ctx.fillRect(sx+(rSeed%TS),sy+((rSeed>>8)%TS),1,1); }
        continue;
      }
      const cell = pdata.grid[y][x];
      const tileInfo = TILE[cell.type];
      const isSpecial = pdata.isRingworld || pdata.isDestroyedRingworld || pdata.isAncientStation || pdata.isDerelict || pdata.isCave || pdata.isNuclearWar || pdata.biome === 'ANCIENT';
      const bgFloorFn = pdata.isAncientStation ? 'ancient_st_floor' : pdata.isDerelict ? 'station_floor' : pdata.isCave ? 'cave_floor' : (pdata.isRingworld||pdata.isDestroyedRingworld) ? 'rw_floor' : pdata.isNuclearWar ? 'nuke_dirt' : floorTileType;

      // Helper: draw the correct background under a cell, honouring _underFloor
      function drawScanCellBg(){
        // Use _underFloor if stored (e.g. ARTIFACT/SHIP on outpost floor),
        // otherwise use the map-type bgFloor for special enclosed maps,
        // otherwise use the natural biome floor
        const _under = cell._underFloor || bgFloorFn;
        const _underDrawFn = TILE[_under]?.drawFn;
        if(isSpecial && _underDrawFn && DRAW[_underDrawFn]) DRAW[_underDrawFn](ctx, sx, sy);
        else drawScanBaseFloor(_under, sx, sy, floorAscii.bg);
      }

      // Ancient building interiors are opaque to orbital scanners.
      // ANCIENT_WALL and ancient_locked_door render as solid walls regardless of scan.
      // ANCIENT_OUTPOST (interior floor) and any loot inside a building only reveal
      // once the player has physically walked there (visited flag).
      // This applies to any planet that has ancient tiles — not just the ANCIENT biome,
      // since scattered ruins can appear on DESERT, FROZEN, HABITABLE etc. too.
      {
        const ct = cell.type;
        const _isAncientTile = ct === 'ANCIENT_WALL' || ct === 'ancient_locked_door' ||
          ct === 'ANCIENT_OUTPOST' || ct === 'ANCIENT_ROAD' || ct === 'ancient_statue';
        if(_isAncientTile || (
          ['MINERAL','ARTIFACT','BIODATA','MINERAL_SAMPLE'].includes(ct) &&
          isInsideAncientBuilding(pdata, x, y)
        )){
          const physVisited = pdata.visited && pdata.visited[y*_W+x];
          if(ct === 'ANCIENT_WALL' || ct === 'ancient_locked_door'){
            if(!OPTIONS.asciiMode && tileInfo?.drawFn && DRAW[tileInfo.drawFn]){
              const _savedPlanet = G.curPlanet;
              G.curPlanet = pKey;
              DRAW[tileInfo.drawFn](ctx, sx, sy, cell);
              G.curPlanet = _savedPlanet;
            } else {
              ctx.fillStyle='#0d1520'; ctx.fillRect(sx,sy,TS,TS);
            }
            continue;
          }
          if(ct === 'ANCIENT_OUTPOST'){
            if(!physVisited){
              ctx.fillStyle='#0a1018'; ctx.fillRect(sx,sy,TS,TS);
              continue;
            }
            // Visited — fall through to standard render below
          }
          if(ct === 'ANCIENT_ROAD' || ct === 'ancient_statue'){
            // Surface-visible to scanners — render with drawFn directly
            if(!OPTIONS.asciiMode && tileInfo?.drawFn && DRAW[tileInfo.drawFn]){
              const _savedPlanet = G.curPlanet;
              G.curPlanet = pKey;
              DRAW[tileInfo.drawFn](ctx, sx, sy, cell);
              G.curPlanet = _savedPlanet;
            } else {
              drawScanBaseFloor(ct, sx, sy, floorAscii.bg);
            }
            continue;
          }
          if(['MINERAL','ARTIFACT','BIODATA','MINERAL_SAMPLE'].includes(ct) && isInsideAncientBuilding(pdata, x, y)){
            if(!physVisited){
              ctx.fillStyle='#0a1018'; ctx.fillRect(sx,sy,TS,TS);
              continue;
            }
            // Visited interior loot — fall through to standard render below
          }
        }
      }
      if(['MINERAL','ARTIFACT','BIODATA','MINERAL_SAMPLE'].includes(cell.type)){
        drawScanCellBg();
        if(tileInfo?.sprite) drawSpriteDarkMatteKeyed(tileInfo.sprite, sx, sy, '#888');
        else if(cell.type==='MINERAL'){
          // Only show ore on minimap once the player has stepped on it
          if(cell.revealed){ const _oc=(ORE_TYPES[cell.oreType||'fe']||ORE_TYPES.fe).col; ctx.fillStyle=_oc; ctx.fillRect(sx+4,sy+6,16,11); ctx.fillStyle='#ffffff'; ctx.fillRect(sx+6,sy+7,4,3); ctx.fillRect(sx+12,sy+8,3,3); }
          else if(cell._scanned){ ctx.fillStyle='rgba(136,255,68,0.4)'; ctx.font='bold 9px Courier New'; ctx.textAlign='center'; ctx.fillText('?',sx+12,sy+15); ctx.textAlign='left'; }
        }
        else if(cell.type==='BIODATA') { ctx.fillStyle='#70f090'; ctx.fillRect(sx+8,sy+8,8,8); }
        else if(cell.type==='MINERAL_SAMPLE') { ctx.fillStyle='#cc8800'; ctx.fillRect(sx+9,sy+9,7,7); ctx.fillStyle='#ffe066'; ctx.fillRect(sx+10,sy+10,4,4); }
      } else if(cell.type==='SHIP'){
        drawScanCellBg();
        if(hasLanded){
          if(!OPTIONS.asciiMode) drawSpriteDarkMatteKeyed('ship_tile', sx, sy, '#aaaacc');
          else drawAsciiTile('SHIP', sx, sy, floorAscii.bg);
        }
      } else if(cell.type==='rw_void'){
        ctx.fillStyle='#02020a'; ctx.fillRect(sx,sy,TS,TS);
        const starSeed=(x*7919+y*1049)%1000;
        if(starSeed<18){ const bri=60+starSeed*6; ctx.fillStyle=`rgb(${bri},${bri},${bri})`; ctx.fillRect(sx+(x*13+y*7)%TS,sy+(x*5+y*11)%TS,1,1); }
      } else if(isSpecial && tileInfo?.drawFn && DRAW[tileInfo.drawFn]){
        DRAW[tileInfo.drawFn](ctx, sx, sy, cell);
      } else if(tileInfo?.sprite || cell._sprite){
        const sp = cell._sprite || tileInfo?.sprite;
        if(cell.type === 'EARTH_FOREST' || !tileInfo?.pass){
          drawScanCellBg();
          if(IMG[sp] instanceof HTMLCanvasElement){
            ctx.drawImage(IMG[sp], sx, sy, TS, TS);
          } else {
            drawSpriteDarkMatteKeyed(sp, sx, sy, floorAscii.bg);
          }
        } else {
          drawSprite(sp, sx, sy, floorAscii.bg);
        }
      } else {
        drawScanBaseFloor(floorTileType, sx, sy, floorAscii.bg);
      }
    }
  }

  if(Number.isInteger(G.scanCursorX) && Number.isInteger(G.scanCursorY)){
    const valid = canLandAt(pdata, G.scanCursorX, G.scanCursorY);
    const cx = (G.scanCursorX - scCamX) * TS;
    const cy = (G.scanCursorY - scCamY) * TS;
    ctx.strokeStyle = valid ? '#70ffb0' : '#ff6677';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx + 2, cy + 2, TS - 4, TS - 4);
    ctx.strokeStyle = valid ? '#70ffb066' : '#ff667766';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx + 5, cy + 5, TS - 10, TS - 10);
  }

  // Semi-transparent scan overlay tint so it feels like satellite imagery
  ctx.fillStyle='rgba(0,30,60,0.18)'; ctx.fillRect(0,0,canvas.width,canvas.height);

  // Smoke clouds block scan view
  if(pdata.smokeClouds){
    pdata.smokeClouds.forEach(c=>{
      if(!pdata.scanMask || !pdata.scanMask[c.y*PW(pdata)+c.x]) return;
      ctx.fillStyle='rgba(20,14,8,0.85)';
      ctx.fillRect((c.x-scCamX)*TS, (c.y-scCamY)*TS, TS, TS);
    });
  }

  // HUD label
  const cw=canvas.width, ch=canvas.height;
  ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,cw,22);
  ctx.font='bold 15px Courier New'; ctx.fillStyle='#70d8ff'; ctx.textAlign='center';
  ctx.fillText('SATELLITE SCAN  -  '+pKey.split(':')[0].replace(',',' ').toUpperCase()+'  -  '+B.name.toUpperCase(), cw/2, 15);
  ctx.font='14px Courier New'; ctx.fillStyle='#334455';
  ctx.fillText('[ Arrows ] Move landing zone    [ Enter ] Land    [ ESC ] Back', cw/2, ch-8);
  ctx.textAlign='left';
}

