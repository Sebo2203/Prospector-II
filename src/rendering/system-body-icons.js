// Shared orbital-body artwork. Palette previews scale these exact drawing routines.
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

function drawSystemBodyIcon(p,px,py,pCol,scanned){
  const isAsteroid=p.biome==='ASTEROID',isGasGiant=p.biome==='GAS_GIANT';
  const isRingworld=p.biome==='RINGWORLD'||p.isRingworld;
  const isDestroyedRingworld=p.biome==='DESTROYED_RINGWORLD'||p.isDestroyedRingworld;
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
}
