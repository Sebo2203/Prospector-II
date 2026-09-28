// ── System View ──────────────────────────────────────────────────
function drawSystemView(){
  const cell = G.galaxy[G.ship.y][G.ship.x];
  if(!cell || (cell.type!=='SYSTEM' && cell.type!=='ROGUE_PLANET')) return;
  const isRogue = cell.type === 'ROGUE_PLANET';
  const ST = isRogue ? null : (STAR_TYPES[cell.starType] || STAR_TYPES.YELLOW);
  const cw = canvas.width, ch = canvas.height;
  const cx = cw/2;

  ctx.fillStyle='#03030a';
  ctx.fillRect(0,0,cw,ch);

  ctx.fillStyle='#ffffff';
  for(let i=0;i<80;i++){
    const sx=(Math.sin(i*137.5)*0.5+0.5)*cw;
    const sy=(Math.cos(i*97.3)*0.5+0.5)*ch;
    ctx.globalAlpha=0.2+((i*73)%100)/300;
    ctx.fillRect(sx,sy,(i%4===0)?2:1,(i%4===0)?2:1);
  }
  ctx.globalAlpha=1;

  ctx.textAlign='center';
  ctx.font='bold 21px Courier New';
  if(isRogue){
    ctx.fillStyle='#556677';
    ctx.fillText(cell.name, cx, 36);
    ctx.font='13px Courier New';
    ctx.fillStyle='#334455';
    ctx.fillText('Rogue Planet  ·  No Host Star', cx, 54);
  } else {
    ctx.fillStyle=ST.col;
    ctx.fillText(cell.name+' System  -  '+ST.label, cx, 36);
  }

  const starX = 96;
  const laneY = 218;
  const starY = laneY;
  const starR = isRogue ? 30 : 30 + ST.size*4;
  const laneStart = 210;
  const laneEnd = 530;
  const infoX = 610;
  const infoY = 82;
  const infoW = cw - infoX - 18;
  const infoH = 316;

  const PLANET_COLS = {
    HABITABLE:'#3399cc', DESERT:'#cc8833', FROZEN:'#88bbdd',
    VOLCANIC:'#cc3311', TOXIC:'#88cc22', ASTEROID:'#778899',
    ANCIENT:'#3366aa', GAS_GIANT:'#cc8844',
    MOON_ROCK:'#778899', MOON_ICE:'#aaccdd', MOON_TOXIC:'#99bb33',
    BLOOM:'#dd66cc',
    RINGWORLD:'#44ccaa',
    DESTROYED_RINGWORLD:'#664433',
    NUCLEAR_WAR:'#888844',
  };

  function drawAsteroid(ax, ay, size, col){
    const points = 8;
    ctx.beginPath();
    for(let k=0;k<points;k++){
      const a = (k/points)*Math.PI*2;
      const jitter = 0.55 + ((Math.sin(k*17.3+ax*0.1)*0.5+0.5)*0.45);
      const rx = ax + Math.cos(a)*size*jitter;
      const ry = ay + Math.sin(a)*size*(jitter*0.8+0.1);
      k===0 ? ctx.moveTo(rx,ry) : ctx.lineTo(rx,ry);
    }
    ctx.closePath();
    ctx.fillStyle=col+'bb';
    ctx.fill();
    ctx.strokeStyle=col;
    ctx.lineWidth=1;
    ctx.stroke();
  }

  function drawRingworldIcon(rx, ry, col, scanned){
    // Draw as a horizontal band / torus cross-section
    const rw = 28, rh = 8;
    // Outer ring glow
    ctx.save();
    ctx.translate(rx, ry);
    // Glow halo
    ctx.strokeStyle = col+'44';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(0, 0, rw+4, rh+4, 0, 0, Math.PI*2);
    ctx.stroke();
    // Main ring body
    ctx.fillStyle = col+'33';
    ctx.beginPath();
    ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI*2);
    ctx.stroke();
    // Inner dark hole
    ctx.fillStyle = '#03030a';
    ctx.beginPath();
    ctx.ellipse(0, 0, rw-5, rh-3, 0, 0, Math.PI*2);
    ctx.fill();
    // Inner rim
    ctx.strokeStyle = col+'88';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, rw-5, rh-3, 0, 0, Math.PI*2);
    ctx.stroke();
    // Tick marks suggesting habitable band
    if(scanned){
      ctx.strokeStyle = '#55ee8888';
      ctx.lineWidth = 2;
      for(let a=0; a<Math.PI*2; a+=Math.PI/6){
        const ox = Math.cos(a)*rw, oy = Math.sin(a)*rh;
        const ix = Math.cos(a)*(rw-5), iy = Math.sin(a)*(rh-3);
        ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ix,iy); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawGasGiant(gx, gy, col, scanned){
    const gr = 18;
    ctx.fillStyle=col+'33';
    ctx.beginPath();
    ctx.arc(gx,gy,gr+6,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle=col+'cc';
    ctx.beginPath();
    ctx.arc(gx,gy,gr,0,Math.PI*2);
    ctx.fill();
    if(scanned){
      ctx.save();
      ctx.beginPath();
      ctx.arc(gx,gy,gr,0,Math.PI*2);
      ctx.clip();
      const bandCols=['#ffffff18','#00000022','#ffffff15','#00000018'];
      bandCols.forEach((bc,bi)=>{
        ctx.fillStyle=bc;
        ctx.fillRect(gx-gr, gy-gr+(bi*gr*0.5), gr*2, gr*0.45);
      });
      ctx.restore();
      ctx.fillStyle='#ffffff22';
      ctx.beginPath();
      ctx.arc(gx-5,gy-5,7,0,Math.PI*2);
      ctx.fill();
    }
  }

  if(!isRogue){
    ctx.fillStyle=ST.glowCol+'18';
    ctx.beginPath();
    ctx.arc(starX,starY,starR+44,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle=ST.glowCol+'33';
    ctx.beginPath();
    ctx.arc(starX,starY,starR+18,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle=ST.glowCol+'66';
    ctx.beginPath();
    ctx.arc(starX,starY,starR+8,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle=ST.col;
    ctx.beginPath();
    ctx.arc(starX,starY,starR,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle='#ffffff';
    ctx.beginPath();
    ctx.arc(starX,starY,starR*0.6,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle=ST.col;
    ctx.beginPath();
    ctx.arc(starX,starY,starR*0.4,0,Math.PI*2);
    ctx.fill();
    ctx.font='bold 14px Courier New';
    ctx.fillStyle=ST.col;
    ctx.fillText('STAR', starX, starY + starR + 26);
  }

  ctx.fillStyle='#0b1020';
  ctx.fillRect(infoX, infoY, infoW, infoH);
  ctx.strokeStyle='#2a2a4a';
  ctx.lineWidth=1;
  ctx.strokeRect(infoX, infoY, infoW, infoH);

  const planetSpacing = cell.planets.length > 1 ? (laneEnd - laneStart) / (cell.planets.length - 1) : 0;
  const planetNodes = [];

  cell.planets.forEach((p,i)=>{
    const isAsteroid = p.biome==='ASTEROID';
    const isGasGiant = p.biome==='GAS_GIANT';
    const isRingworld = p.biome==='RINGWORLD' || p.isRingworld;
    const isDestroyedRingworld = p.biome==='DESTROYED_RINGWORLD' || p.isDestroyedRingworld;
    // Rogue planet: center the body in the left panel area, no orbit line
    const px = isRogue ? (laneStart + laneEnd) / 2
                       : (cell.planets.length===1 ? (laneStart + laneEnd) / 2 : laneStart + planetSpacing * i);
    const py = isRogue ? laneY
                       : laneY + (i % 2 === 0 ? -12 : 12);
    const isSelected = (i === G.selPlanet);
    const scanState = p.scanState || 'none';
    const scanned = scanState==='full'||scanState==='partial';
    const pCol = scanned ? (PLANET_COLS[p.biome]||'#888888') : '#444455';
    const bodyR = isAsteroid ? 8 : isGasGiant ? 18 : (isRingworld||isDestroyedRingworld) ? 10 : 12;
    const orbitR = Math.hypot(px - starX, py - starY);

    planetNodes.push({ p, i, px, py, isGasGiant, bodyR });

    // Orbit arc — only for real star systems
    if(!isRogue){
      ctx.strokeStyle = isSelected ? '#2f3d5a' : '#1f2940';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(starX, starY, orbitR, -Math.PI * 0.55, Math.PI * 0.55);
      ctx.stroke();
    }

    if(isSelected){
      const selR = isAsteroid ? 13 : isGasGiant ? 24 : (isRingworld||isDestroyedRingworld) ? 38 : 16;
      ctx.strokeStyle='#ffe066';
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.arc(px,py,selR,0,Math.PI*2);
      ctx.stroke();
    }

    if(isAsteroid){
      drawAsteroid(px, py, 7, pCol);
    } else if(isGasGiant){
      drawGasGiant(px, py, pCol, scanned);
      ctx.strokeStyle=pCol+'55';
      ctx.lineWidth=3;
      ctx.save();
      ctx.translate(px,py);
      ctx.scale(1,0.3);
      ctx.beginPath();
      ctx.arc(0,0,22,0,Math.PI*2);
      ctx.restore();
      ctx.strokeStyle=pCol+'44';
      ctx.lineWidth=2;
      ctx.save();
      ctx.translate(px,py);
      ctx.scale(1,0.28);
      ctx.beginPath();
      ctx.arc(0,0,24,Math.PI*1.1,Math.PI*1.9);
      ctx.stroke();
      ctx.restore();
    } else if(isRingworld){
      drawRingworldIcon(px, py, pCol, scanned);
    } else if(isDestroyedRingworld){
      // Broken ring — draw as a fragmented arc with gap
      ctx.save();
      ctx.translate(px, py);
      const rw=28, rh=8;
      // Glow
      ctx.strokeStyle=pCol+'33'; ctx.lineWidth=5;
      ctx.beginPath(); ctx.ellipse(0,0,rw+4,rh+4,0,0,Math.PI*2); ctx.stroke();
      // Broken ring — three arc segments with gaps
      ctx.strokeStyle=pCol; ctx.lineWidth=3;
      ctx.beginPath(); ctx.ellipse(0,0,rw,rh,0,0.1,1.1); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0,0,rw,rh,0,1.4,2.6); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0,0,rw,rh,0,2.9,Math.PI*2-0.1); ctx.stroke();
      // Floating debris fragments near gaps
      ctx.fillStyle=pCol+'aa';
      ctx.fillRect(-2,rh+2,3,2); ctx.fillRect(rw-4,-rh-3,2,3); ctx.fillRect(-rw+2,rh-1,2,2);
      ctx.restore();
    } else {
      ctx.fillStyle=pCol+'aa';
      ctx.beginPath();
      ctx.arc(px,py,12,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle=pCol;
      ctx.beginPath();
      ctx.arc(px,py,10,0,Math.PI*2);
      ctx.fill();
      if(scanned){
        ctx.fillStyle='#ffffff22';
        ctx.beginPath();
        ctx.arc(px-3,py-3,5,0,Math.PI*2);
        ctx.fill();
      }
      // Habitable planets: green continent snake, only after scanning
      if(p.biome==='HABITABLE' && scanned){
        ctx.save();
        ctx.beginPath();
        ctx.arc(px,py,10,0,Math.PI*2);
        ctx.clip();
        ctx.strokeStyle='#55ee66';
        ctx.lineWidth=2;
        ctx.lineCap='round';
        ctx.lineJoin='round';
        ctx.beginPath();
        ctx.moveTo(px-1, py-7);
        ctx.lineTo(px+3, py-4);
        ctx.lineTo(px+1, py-1);
        ctx.lineTo(px+5, py+2);
        ctx.lineTo(px+2, py+6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(px-5, py);
        ctx.lineTo(px-2, py+3);
        ctx.lineTo(px-4, py+6);
        ctx.stroke();
        ctx.restore();
      }
    }

    if(scanState==='partial'){
      ctx.strokeStyle='#ffaa44';
      ctx.lineWidth=1;
      ctx.beginPath();
      ctx.arc(px,py,isGasGiant?26:13,0,Math.PI*2);
      ctx.stroke();
    }

    ctx.font='bold 14px Courier New';
    ctx.fillStyle=isSelected ? '#ffe066' : '#888888';
    ctx.fillText('['+(i+1)+']', px, py - bodyR - 14);

    ctx.font=isSelected ? 'bold 13px Courier New' : '12px Courier New';
    if(scanState==='none' || scanState==='failed'){
      ctx.fillStyle=isSelected ? '#777788' : '#555566';
      ctx.fillText(isSelected ? '? Unknown' : p.name, px, py + bodyR + 18);
    } else {
      ctx.fillStyle=isSelected ? pCol : '#8f98ad';
      ctx.fillText(p.name, px, py + bodyR + 18);
    }

    if(isGasGiant && p.moons && p.scanState==='full'){
      const moonX = px;
      const baseY = py - bodyR - 18 - ((p.moons.length - 1) * 12);
      p.moons.forEach((moon,mi)=>{
        const mx2 = moonX;
        const my2 = baseY + mi * 24;
        const mCol = PLANET_COLS[moon.biome]||'#778899';
        const moonSelected = isSelected && G.selMoon===mi;
        if(moonSelected){
          ctx.strokeStyle='#88ddff';
          ctx.lineWidth=1.5;
          ctx.beginPath();
          ctx.arc(mx2,my2,8,0,Math.PI*2);
          ctx.stroke();
        }
        ctx.fillStyle=mCol+'bb';
        ctx.beginPath();
        ctx.arc(mx2,my2,5,0,Math.PI*2);
        ctx.fill();
        ctx.fillStyle=mCol;
        ctx.beginPath();
        ctx.arc(mx2,my2,4,0,Math.PI*2);
        ctx.fill();
      });
    }
  });

  {
    const selP = cell.planets[G.selPlanet];
    const activeBody = (G.selMoon>=0 && selP?.moons?.[G.selMoon]) ? selP.moons[G.selMoon] : selP;
    const activeBiome = activeBody ? BIOMES[activeBody.biome] : null;
    const ss = activeBody?.scanState || 'none';
    const isMoonSelection = !!(G.selMoon>=0 && selP?.moons?.[G.selMoon]);
    const activePKey = isMoonSelection
      ? (G.curSystem+':'+G.selPlanet+':m'+G.selMoon)
      : (G.curSystem+':'+G.selPlanet);
    const activePdata = G.planets[activePKey];

    ctx.textAlign='left';
    const lx = infoX + 14;
    const lh2 = 18;
    let ly = infoY + 22;

    ctx.font='bold 13px Courier New';
    ctx.fillStyle='#6e7894';
    ctx.fillText(isMoonSelection ? 'SELECTED MOON' : 'SELECTED BODY', lx, ly);
    ly += 22;

    if(!activeBody || ss==='none'){
      ctx.font='bold 15px Courier New';
      ctx.fillStyle='#555566';
      ctx.fillText('No scan data - press [S] to scan', lx, ly);
    } else if(ss==='failed'){
      ctx.font='bold 15px Courier New';
      ctx.fillStyle='#884444';
      ctx.fillText('Scan failed - interference detected', lx, ly);
    } else {
      const col = PLANET_COLS[activeBody.biome]||'#aaaaaa';
      ctx.font='bold 16px Courier New';
      ctx.fillStyle=col;
      ctx.fillText(activeBody.name, lx, ly);
      ly+=lh2+2;

      ctx.font='14px Courier New';
      ctx.fillStyle='#aaaaaa';
      const bLabel = (activeBiome?.name||'Unknown')+(activeBiome?.oxyDrain===0?' * Breathable':'');
      ctx.fillText(bLabel, lx, ly);
      ly+=lh2+4;

      ctx.fillStyle='#1a1a2e';
      ctx.fillRect(lx, ly, infoW-28, 1);
      ly+=10;

      if(ss==='full' || ss==='partial'){
        ctx.font='13px Courier New';
        if(ss==='partial'){
          ctx.fillStyle='#ffaa44';
          ctx.fillText('Partial scan - terrain still incomplete', lx, ly);
          ly+=lh2;
        }
        const rows=[
          ['Avg Temp',  activeBody.avgTemp!==undefined ? activeBody.avgTemp+' C' : '-'],
          ['Gravity',   activeBody.gravity ? activeBody.gravity+' m/s2' : '-'],
          ['Atmosphere',activeBody.atmosphere||'Unknown'],
          ['Radius',    activeBody.radius ? activeBody.radius+'x Earth' : '-'],
          ['Oxygen',    activeBiome?.oxyDrain===0 ? 'Breathable' : '-'+activeBiome?.oxyDrain+'%/step'],
          ['Minerals',  activeBiome?.minerals>=10?'Abundant':activeBiome?.minerals>=6?'Rich':activeBiome?.minerals>=3?'Moderate':'Scarce'],
          ['Lifeforms', (()=>{
            // Civilization overrides the alien lifeform reading
            const civ = activePdata?.civilization;
            if(civ) return civ.tierLabel+' '+civ.species;
            const chance = activeBiome?.alienChance ?? 1.0;
            const maxPop = activeBiome?.aliens ?? 0;
            if(maxPop === 0 || chance === 0) return 'None detected';
            // Use actual spawned count if planet has been generated, else estimate
            const actual = activePdata?.spawnedAliens;
            const count = actual !== undefined ? actual : chance * (1 + maxPop) / 2;
            const prefix = actual !== undefined ? '' : '~';
            if(chance <= 0.25 && actual === undefined) return 'Unlikely';
            if(count === 0)   return 'None detected';
            if(count >= 8)    return prefix+'Teeming';
            if(count >= 5)    return prefix+'Active';
            if(count >= 2)    return prefix+'Sparse';
            return prefix+'Unlikely';
          })()],
          ['Biodata',   activeBiome?.biodata>=7?'Abundant':activeBiome?.biodata>=4?'Rich':activeBiome?.biodata>=1?'Traces':'None'],
          ['Hazards',   (activeBiome?.hazards?.length ? activeBiome.hazards.map(h=>
                          h==='METEOR'?'Meteors':h==='LAVA_FLOOR'?'Lava':
                          h==='SMOKE'?'Gas vents':h==='AMMONIA'?'Ammonia':
                          h==='GEYSER'?'Geysers':h).join(', ') : 'None detected')],
        ];
        rows.forEach((r,ri)=>{
          ctx.fillStyle='#445566';
          ctx.fillText(r[0]+':', lx, ly+ri*lh2);
          const v = r[1];
          const drain = activeBiome?.oxyDrain ?? 0;
          const valCol =
            r[0]==='Oxygen'     ? (drain===0?'#70f090':drain>=2.5?'#ff4444':drain>=1.5?'#ff8844':'#ffcc44')
          : r[0]==='Minerals'   ? (activeBiome?.minerals>=10?'#ffe066':activeBiome?.minerals>=6?'#ffcc44':activeBiome?.minerals>=3?'#aaaaaa':'#556677')
          : r[0]==='Lifeforms'  ? (activePdata?.civilization ? '#88ffcc' : activeBiome?.aliens===0||activeBiome?.alienChance===0?'#334455':(activeBiome?.alienChance??1)*(activeBiome?.aliens??0)>=6?'#ff4444':(activeBiome?.alienChance??1)*(activeBiome?.aliens??0)>=3?'#ff8844':'#aaaaaa')
          : r[0]==='Biodata'    ? (activeBiome?.biodata>=7?'#70f090':activeBiome?.biodata>=4?'#44cc66':activeBiome?.biodata>=1?'#aaaaaa':'#334455')
          : r[0]==='Hazards'    ? (activeBiome?.hazards?.length?'#ff8844':'#445566')
          : '#cccccc';
          ctx.fillStyle=valCol;
          ctx.fillText(v, lx+116, ly+ri*lh2);
        });
        if(selP?.biome==='GAS_GIANT' && selP.moons?.length){
          ly += rows.length*lh2 + 4;
          ctx.fillStyle='#70d8ff';
          ctx.fillText(selP.moons.length+' moon'+(selP.moons.length>1?'s':'')+' in orbit - use Up/Down to select', lx, ly);
        }
      }
    }
    ctx.textAlign='center';
  }

  cell.planets.forEach((p,i)=>{
    const isAsteroid = p.biome==='ASTEROID';
    const isGasGiant = p.biome==='GAS_GIANT';
    const px = cell.planets.length===1 ? (laneStart + laneEnd) / 2 : laneStart + planetSpacing * i;
    const py = laneY + (i % 2 === 0 ? -12 : 12);
    const bodyR = isAsteroid ? 8 : isGasGiant ? 18 : 12;
    const pKey = G.curSystem+':'+i;
    const pdata = G.planets[pKey];
    const landed = !!pdata?.visited?.some(v=>v);
    if(landed){
      ctx.font='12px Courier New';
      ctx.fillStyle='#70d8ff';
      ctx.fillText('visited', px, py - bodyR - 28);
    }
    if(isGasGiant && p.moons){
      const moonX = px;
      const baseY = py - bodyR - 18 - ((p.moons.length - 1) * 12);
      p.moons.forEach((moon,mi)=>{
        const mx2 = moonX;
        const my2 = baseY + mi * 24;
        const mKey=G.curSystem+':'+i+':m'+mi;
        if(G.planets[mKey]){
          ctx.font='10px Courier New';
          ctx.fillStyle='#70d8ff';
          ctx.fillText('+', mx2 - 12, my2 + 4);
        }
      });
    }
  });

  ctx.textAlign='left';
}
