function drawGalaxy(){
  // Camera: centre the viewport on the ship, clamped to map edges
  const camX = Math.max(0, Math.min(MAP_W - VIEW_W, G.ship.x - Math.floor(VIEW_W/2)));
  const camY = Math.max(0, Math.min(MAP_H - VIEW_H, G.ship.y - Math.floor(VIEW_H/2)));

  for(let vy=0; vy<VIEW_H; vy++){
    for(let vx=0; vx<VIEW_W; vx++){
      const mx = camX + vx;
      const my = camY + vy;
      const px = vx*TS, py = vy*TS;
      if(!DEBUG.fullVision && !G.visited[my*MAP_W+mx]){
        const bestNav = Math.max(0, ...(G.crew||[]).filter(c=>c.hp>0).map(c=>c.skills?.nav||0));
        ctx.fillStyle = bestNav >= 2 ? '#14141e' : '#04040c';
        ctx.fillRect(px,py,TS,TS);
        continue;
      }
      const cell=G.galaxy[my][mx];
      if(OPTIONS.asciiMode){
        ctx.fillStyle='#04040c'; ctx.fillRect(px,py,TS,TS);
        ctx.font='bold '+(TS-1)+'px Courier New';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        if(cell.type==='SYSTEM'){
          const ST=STAR_TYPES[cell.starType]||STAR_TYPES.YELLOW;
          ctx.fillStyle=ST.col; ctx.fillText('*',px+TS/2,py+TS/2+1);
        } else if(cell.type==='BASE'){
          ctx.fillStyle='#ffe066'; ctx.fillText('B',px+TS/2,py+TS/2+1);
        } else if(cell.type==='PIRATE_BASE'){
          ctx.fillStyle='#04040c'; ctx.fillRect(px,py,TS,TS);
          const _pb = (G.pirateBases||[]).find(b=>b.x===mx&&b.y===my);
          if(_pb&&_pb.destroyed){ ctx.fillStyle='#444433'; ctx.fillText('×',px+TS/2,py+TS/2+1); }
          else { ctx.fillStyle='#882200'; ctx.fillText('☠',px+TS/2,py+TS/2+1); }
        } else if(cell.type==='NEBULA'){
          ctx.fillStyle='#2a1a4a'; ctx.fillRect(px,py,TS,TS);
          ctx.fillStyle=cell.nebulaVariant==='blue' ? '#44aaff' : '#cc44cc';
          ctx.globalAlpha=0.7; ctx.fillText('≈',px+TS/2,py+TS/2+1); ctx.globalAlpha=1;
        } else if(cell.type==='ROGUE_PLANET'){
          ctx.fillStyle='#04040c'; ctx.fillRect(px,py,TS,TS);
          ctx.fillStyle='#2a3050'; ctx.fillText('○',px+TS/2,py+TS/2+1);
        } else if(cell.type==='PULSAR'){
          ctx.fillStyle='#000000'; ctx.fillRect(px,py,TS,TS);
          ctx.fillStyle='#00ddaa'; ctx.fillText('※',px+TS/2,py+TS/2+1);
        }
        ctx.textBaseline='alphabetic'; ctx.textAlign='left';
      } else {
        if(cell.type==='SYSTEM'){
          drawSystemTile(ctx, px, py, cell.starType);
        } else if(cell.type==='BASE'){
          drawSprite('starbase', px, py, '#445500');
        } else if(cell.type==='PIRATE_BASE'){
          const _pb2 = (G.pirateBases||[]).find(b=>b.x===mx&&b.y===my);
          if(_pb2&&_pb2.destroyed){
            // Rubble: dark ruin glyph
            ctx.fillStyle='#0d0d0a'; ctx.fillRect(px,py,TS,TS);
            ctx.font='bold '+(TS-4)+'px Courier New'; ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillStyle='#554433'; ctx.fillText('✕',px+TS/2,py+TS/2+1);
            ctx.textBaseline='alphabetic'; ctx.textAlign='left';
          } else {
            // Draw HP bar above base when damaged
            DRAW.pirate_base(ctx, px, py);
            if(_pb2&&_pb2.hp<_pb2.maxHp){
              const hpPct = _pb2.hp/_pb2.maxHp;
              ctx.fillStyle='#330000'; ctx.fillRect(px,py-4,TS,3);
              ctx.fillStyle= hpPct>0.5?'#cc4400':'#ff2200';
              ctx.fillRect(px,py-4,Math.round(TS*hpPct),3);
            }
          }
        } else if(cell.type==='CASINO'){
          if(OPTIONS.asciiMode){
            ctx.fillStyle='#04040c'; ctx.fillRect(px,py,TS,TS);
            ctx.font='bold '+(TS-1)+'px Courier New';
            ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillStyle='#cc44ff'; ctx.fillText('$',px+TS/2,py+TS/2+1);
            ctx.textBaseline='alphabetic'; ctx.textAlign='left';
          } else {
            DRAW.casino(ctx, px, py);
          }
        } else if(cell.type==='DERELICT'){
          ctx.fillStyle='#08080f'; ctx.fillRect(px,py,TS,TS);
          ctx.strokeStyle='#334455'; ctx.lineWidth=1; ctx.strokeRect(px+2,py+2,TS-4,TS-4);
          ctx.fillStyle='#556677';
          ctx.font='bold '+(TS-1)+'px Courier New';
          ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText('†',px+TS/2,py+TS/2+1);
          ctx.textBaseline='alphabetic'; ctx.textAlign='left';
        } else if(cell.type==='BLACK_HOLE'){
          DRAW.black_hole(ctx, px, py);
        } else if(cell.type==='ROGUE_PLANET'){
          DRAW.rogue_planet(ctx, px, py);
        } else if(cell.type==='PULSAR'){
          DRAW.pulsar(ctx, px, py);
        } else if(cell.type==='NEBULA'){
          DRAW.nebula(ctx, px, py, cell.nebulaVariant, mx, my);
        } else if(DRAW[cell.type]){
          DRAW[cell.type](ctx,px,py);
        } else {
          DRAW.void(ctx,px,py);
        }
      }
    }
  }
  // Draw pirates. Radio contacts beyond sensor range appear as unknown pings.
  const SENSOR_RANGE = (G.shipStats?.sensorRange ?? 3);
  G.pirates.forEach(p=>{
    if(!p.alive) return;
    const vx = p.x - camX;
    const vy = p.y - camY;
    if(vx<0||vx>=VIEW_W||vy<0||vy>=VIEW_H) return;
    const dist = Math.abs(p.x-G.ship.x) + Math.abs(p.y-G.ship.y);
    const rr = radioRange();
    if(!DEBUG.fullVision && dist > rr) return;
    const px = vx*TS, py = vy*TS;
    if(!DEBUG.fullVision && dist > SENSOR_RANGE){
      ctx.fillStyle='rgba(10,20,35,0.78)'; ctx.fillRect(px+4, py+4, TS-8, TS-8);
      ctx.strokeStyle='#2a5a88'; ctx.strokeRect(px+4, py+4, TS-8, TS-8);
      ctx.font='bold 16px Courier New'; ctx.textAlign='center'; ctx.fillStyle='#70d8ff';
      ctx.fillText('?', px+TS/2, py+17);
      ctx.textAlign='left';
      return;
    }
    if(!DEBUG.fullVision && !G.visited[p.y*MAP_W+p.x]) return;
    const _ptint = p.pirateType==='roamer' ? '#aa0066' : '#882200';
    drawSprite('pirate_ship', px, py, _ptint);
  });
  // Draw NPC stranded ships — visible within sensor range
  (G.npcStranded||[]).forEach(ss=>{
    if(!DEBUG.fullVision && !G.visited[ss.y*MAP_W+ss.x]) return;
    const svx=ss.x-camX, svy=ss.y-camY;
    if(svx<0||svx>=VIEW_W||svy<0||svy>=VIEW_H) return;
    const sdist=Math.abs(ss.x-G.ship.x)+Math.abs(ss.y-G.ship.y);
    if(!DEBUG.fullVision && sdist > SENSOR_RANGE) return;
    const spx=svx*TS, spy=svy*TS;
    if(ss.type==='alive'){
      // Living stranded — pulse glow like player SOS
      const pulse=(Date.now()%1400)/1400;
      const glowR=16+pulse*12;
      ctx.globalAlpha=Math.max(0,0.5-pulse*0.45);
      ctx.strokeStyle='#ffcc00'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(spx+TS/2,spy+TS/2,glowR,0,Math.PI*2); ctx.stroke();
      ctx.globalAlpha=1; ctx.lineWidth=1;
      drawSpriteTinted('ship_freighter',spx,spy,'#ffcc00',0.9);
    } else {
      // Dead stranded — dim, no glow, dark tint
      drawSpriteTinted('ship_freighter',spx,spy,'#445566',0.6);
      // Static SOS flicker — skip for research/science-job ships whose beacon is off
      if(!ss.noSos && ss.type!=='research' && Math.floor(Date.now()/500)%2===0){
        ctx.globalAlpha=0.5; ctx.strokeStyle='#ff4400'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.arc(spx+TS/2,spy+TS/2,10,0,Math.PI*2); ctx.stroke();
        ctx.globalAlpha=1; ctx.lineWidth=1;
      }
    }
  });

  // Draw neutral ships. Radio contacts beyond sensor range appear as unknown pings.
  (G.neutralShips||[]).forEach(ns=>{
    if(ns.alive===false) return;  // destroyed — don't render wreck
    const vx2 = ns.x - camX, vy2 = ns.y - camY;
    if(vx2<0||vx2>=VIEW_W||vy2<0||vy2>=VIEW_H) return;
    const dist2 = Math.abs(ns.x-G.ship.x) + Math.abs(ns.y-G.ship.y);
    const rr = radioRange();
    if(!DEBUG.fullVision && dist2 > rr) return;
    const px2 = vx2*TS, py2 = vy2*TS;
    if(!DEBUG.fullVision && dist2 > SENSOR_RANGE){
      ctx.fillStyle='rgba(10,20,35,0.78)'; ctx.fillRect(px2+4, py2+4, TS-8, TS-8);
      ctx.strokeStyle='#2a5a88'; ctx.strokeRect(px2+4, py2+4, TS-8, TS-8);
      ctx.font='bold 16px Courier New'; ctx.textAlign='center'; ctx.fillStyle='#70d8ff';
      ctx.fillText('?', px2+TS/2, py2+17);
      ctx.textAlign='left';
      return;
    }
    if(!DEBUG.fullVision && !G.visited[ns.y*MAP_W+ns.x]) return;
    const tintCol =
      ns.type==='patrol'  ? '#0044ff' :
      ns.type==='trader'  ? '#ffcc00' :
      ns.type==='cargo'   ? '#888888' :
                            '#44ddff';
    drawSpriteTinted('pirate_ship', px2, py2, tintCol, 0.78);
  });

  // Draw gas entities — visible within sensor range when player is in/near a nebula
  (G.gasEntities||[]).forEach(ge=>{
    if(!ge.alive) return;
    const gvx = ge.x - camX, gvy = ge.y - camY;
    if(gvx<0||gvx>=VIEW_W||gvy<0||gvy>=VIEW_H) return;
    const gdist = Math.abs(ge.x-G.ship.x)+Math.abs(ge.y-G.ship.y);
    if(!DEBUG.fullVision && gdist > (G.shipStats?.sensorRange ?? 3) + 2) return;
    if(!DEBUG.fullVision && !G.visited[ge.y*MAP_W+ge.x]) return;
    const gpx = gvx*TS, gpy = gvy*TS;
    DRAW.gas_entity(ctx, gpx, gpy, ge.variant);
    // Menacing pulse ring when close
    if(gdist <= 4){
      const pulse = (Date.now() % 900) / 900;
      ctx.globalAlpha = Math.max(0, 0.55 - pulse * 0.55);
      ctx.strokeStyle = ge.variant==='blue' ? '#44aaff' : '#dd44ff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(gpx+TS/2, gpy+TS/2, 10+pulse*8, 0, Math.PI*2); ctx.stroke();
      ctx.globalAlpha = 1; ctx.lineWidth = 1;
    }
  });

  // Draw floating nebula loot crystals — persistent loot left when cargo was full
  (G.nebulaLoot||[]).forEach(loot=>{
    if(!G.visited[loot.y*MAP_W+loot.x] && !DEBUG.fullVision) return;
    const lvx = loot.x - camX, lvy = loot.y - camY;
    if(lvx<0||lvx>=VIEW_W||lvy<0||lvy>=VIEW_H) return;
    const lpx = lvx*TS, lpy = lvy*TS;
    // Gentle slow spin effect using time
    const t = (Date.now() % 3000) / 3000;
    const spin = t * Math.PI * 2;
    const cx2 = lpx + TS/2, cy2 = lpy + TS/2;
    const r = 5;
    ctx.save();
    // Soft outer glow
    ctx.globalAlpha = 0.25 + Math.sin(spin)*0.1;
    ctx.fillStyle = '#cc88ff';
    ctx.beginPath(); ctx.arc(cx2, cy2, 8, 0, Math.PI*2); ctx.fill();
    // Crystal facets — a diamond / octagon shape rotated by time
    ctx.globalAlpha = 0.90;
    ctx.strokeStyle = '#ffaaff';
    ctx.fillStyle = '#884499';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=0;i<6;i++){
      const a = spin + (i/6)*Math.PI*2;
      const rx = cx2 + Math.cos(a)*r, ry = cy2 + Math.sin(a)*r;
      i===0 ? ctx.moveTo(rx,ry) : ctx.lineTo(rx,ry);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Bright centre spark
    ctx.globalAlpha = 0.80;
    ctx.fillStyle = '#ffddff';
    ctx.beginPath(); ctx.arc(cx2, cy2, 1.5, 0, Math.PI*2); ctx.fill();
    // Small ✦ label below
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = '#cc88ff';
    ctx.font = 'bold 8px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('✦', cx2, lpy + TS - 2);
    ctx.textAlign = 'left';
    ctx.restore();
  });

  // Draw player ship
  const shipPos = getAnimatedShipMapPosition();
  const shipVx = shipPos.x - camX;
  const shipVy = shipPos.y - camY;
  // Draw player ship with directional rotation
  (function drawPlayerShipDirectional(){
    const f = G.ship.facing || {dx:0, dy:-1};
    const angle = Math.atan2(f.dy, f.dx) + Math.PI/2;
    const cx = shipVx*TS + TS/2;
    const cy = shipVy*TS + TS/2;
    const spriteKey = G.shipStats?.sprite || 'player_ship';
    if(OPTIONS.asciiMode){
      drawAsciiTile(spriteKey, Math.round(shipVx*TS), Math.round(shipVy*TS), null);
    } else if(IMG[spriteKey] && IMG[spriteKey].complete && IMG[spriteKey].naturalWidth>0){
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(IMG[spriteKey], -TS/2, -TS/2, TS, TS);
      ctx.restore();
    } else {
      ctx.fillStyle='#aaaaff';
      ctx.fillRect(shipVx*TS, shipVy*TS, TS, TS);
    }
  })();

  // SOS pulse ring — drawn AFTER player ship so shipVx/shipVy are defined
  if(G.stranded && G.stranded.sos){
    const pulse = (Date.now()%1200)/1200;
    const r = 18 + pulse*14;
    ctx.globalAlpha = Math.max(0, 0.6 - pulse*0.5);
    ctx.strokeStyle='#ff4400';
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.arc(shipVx*TS+12, shipVy*TS+12, r, 0, Math.PI*2);
    ctx.stroke();
    ctx.globalAlpha=1;
    ctx.lineWidth=1;
  }

  // Draw active sensor drones
  if(G._activeDrones && G._activeDrones.length){
    G._activeDrones.forEach(d=>{
      const dvx = d.x - camX, dvy = d.y - camY;
      if(dvx<0||dvx>=VIEW_W||dvy<0||dvy>=VIEW_H) return;
      const dpx = dvx*TS, dpy = dvy*TS;
      const cx = dpx + TS/2, cy = dpy + TS/2;
      const r = 4;
      // Teal diamond
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#44ffcc';
      ctx.beginPath();
      ctx.moveTo(cx,   cy-r);
      ctx.lineTo(cx+r, cy);
      ctx.lineTo(cx,   cy+r);
      ctx.lineTo(cx-r, cy);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#003322';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.restore();
    });
  }
}

// Draw a star system tile on the galaxy map — colour based on star type
function drawSystemTile(c, x, y, starType) {
  const ST = STAR_TYPES[starType] || STAR_TYPES.YELLOW;
  c.fillStyle='#04040c'; c.fillRect(x,y,TS,TS);
  c.fillStyle=ST.glowCol+'44';
  c.beginPath(); c.arc(x+12,y+12, ST.size+5, 0, Math.PI*2); c.fill();
  c.fillStyle=ST.glowCol+'88';
  c.beginPath(); c.arc(x+12,y+12, ST.size+3, 0, Math.PI*2); c.fill();
  c.fillStyle=ST.col;
  c.beginPath(); c.arc(x+12,y+12, ST.size+1, 0, Math.PI*2); c.fill();
  c.fillStyle='#ffffff';
  c.beginPath(); c.arc(x+12,y+12, Math.max(1,ST.size-1), 0, Math.PI*2); c.fill();
  c.fillStyle=ST.col;
  c.beginPath(); c.arc(x+12,y+12, Math.max(1,ST.size-2), 0, Math.PI*2); c.fill();
}

