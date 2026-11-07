// ── Canvas ────────────────────────────────────────────────────────
const canvas = document.getElementById('gc');
const ctx    = canvas.getContext('2d');
let canvasWidth = VIEW_W * TS;
let canvasHeight = VIEW_H * TS;

// Render text at the displayed pixel density while keeping draw and input coordinates logical.
function fitCanvasToDisplay(surface,paint,width,height){
  const bounds=surface.getBoundingClientRect();
  const pixelWidth=Math.max(1,Math.round(bounds.width*window.devicePixelRatio));
  const pixelHeight=Math.max(1,Math.round(bounds.height*window.devicePixelRatio));
  const resized=surface.width!==pixelWidth||surface.height!==pixelHeight;
  if(surface.width!==pixelWidth) surface.width=pixelWidth;
  if(surface.height!==pixelHeight) surface.height=pixelHeight;
  paint.setTransform(pixelWidth/width,0,0,pixelHeight/height,0,0);
  paint.imageSmoothingEnabled=false;
  return resized;
}

// Both terrain views share device-pixel edges without changing logical tile coordinates.
function terrainTileGrid(paint){
  const frame = paint.getTransform();
  const xEdges = Array.from({length:VIEW_W+1}, (_,i)=>Math.round(i*TS*frame.a+frame.e));
  const yEdges = Array.from({length:VIEW_H+1}, (_,i)=>Math.round(i*TS*frame.d+frame.f));
  return {
    align(vx, vy){
      const left = xEdges[vx], top = yEdges[vy];
      const scaleX = (xEdges[vx+1]-left)/TS;
      const scaleY = (yEdges[vy+1]-top)/TS;
      paint.setTransform(scaleX,0,0,scaleY,left-vx*TS*scaleX,top-vy*TS*scaleY);
    },
    restore(){ paint.setTransform(frame); },
  };
}

// ── Log font size control ─────────────────────────────────────
let _logFontSize = 13;
function adjustLogFont(delta){
  _logFontSize = Math.max(9, Math.min(20, _logFontSize + delta));
  document.documentElement.style.setProperty('--log-font', _logFontSize+'px');
}

// The full-width banner is driven by current, actionable emergencies.
// Routine dialogue, discoveries and log entries stay in the sidebar and LOG.
function showMsg(text, color){
  const bar = document.getElementById('msg-bar');
  const span = document.getElementById('msg-bar-text');
  if(span.textContent!==text) span.textContent = text;
  bar.style.color = color;
  bar.classList.add('visible');
}

function hideMsg(){
  document.getElementById('msg-bar').classList.remove('visible');
}

function dismissMsg(){ hideMsg(); if(G) G.msg=''; }

function renderCriticalBanner(){
  if(!G || G.dead || G.retired){ hideMsg(); return; }
  if(G.stranded){
    if(G.stranded.rescuePhase==='offer') showMsg('⚡ RESCUE OFFERED — [Y] Accept  [N] Decline','#44ff88');
    else showMsg(strandedLifeSupportFailing()?'⚠ STRANDED — Crew suffocating. [T] SOS beacon.':'⚠ DRIVE DISABLED — [F3] Engineer repair / bypass or [T] SOS.','#ff4400');
    return;
  }

  const mode=G.mode==='inventory'?G._prevMode:G.mode;
  if(mode==='planet'){
    const armed=(G.inventory||[]).filter(item=>item?.usable==='c4' && item._armed);
    if(armed.length){
      const fuse=Math.min(...armed.map(item=>item._c4Timer));
      showMsg('⚠ C4 ARMED — '+fuse+' turn'+(fuse===1?'':'s')+' left. Select it in inventory, drop [D] and move clear.','#ff3300');
      return;
    }
    const grid=G.planets[G.curPlanet]?.grid;
    const {x,y}=G.player;
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
      const imminent=grid?.[y+dy]?.[x+dx]?.drops?.some(item=>item?.usable==='c4' && item._armed && item._c4Timer<=2);
      if(imminent){ showMsg('⚠ C4 NEARBY — move clear of the blast now.','#ff3300'); return; }
    }
    if(G.oxygen<=25 && !DEBUG.infiniteOxy && grid?.[y]?.[x]?.type!=='SHIP' &&
       (atmosphereBiome(G.curPlanet).oxyDrain>0 || G.underwater)){
      showMsg(G.underwater?'⚠ OXYGEN CRITICAL — surface now [Z]!':'⚠ OXYGEN CRITICAL — return to your ship now!','#ff3300');
      return;
    }
  }
  if(mode==='galaxy' && (G.blackHoles||[]).some(hole=>Math.abs(hole.x-G.ship.x)+Math.abs(hole.y-G.ship.y)===1)){
    showMsg('⚠ SINGULARITY ADJACENT — steer away from the black hole.','#ff3300');
    return;
  }
  if((mode==='galaxy'||mode==='system') && G.fuel>0 && G.fuel/G.maxFuel<=0.25){
    showMsg('⚠ FUEL CRITICAL — return to Starbase immediately!','#ff3300');
    return;
  }
  hideMsg();
}
