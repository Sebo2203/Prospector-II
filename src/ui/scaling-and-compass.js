// ─────────────────────────────────────────────────────────────────
//  FULLSCREEN SCALING
//  Scales #root to fit the viewport while preserving aspect ratio.
//  The game's natural size is 1298×638. We calculate the scale
//  factor that fits it into the current window, then use
//  CSS transform + translate to centre it.
// ─────────────────────────────────────────────────────────────────
const GAME_W = 1400;
const GAME_H = 720;

function scaleToFit(){
  const root  = document.getElementById('root');
  const scaleX = window.innerWidth  / GAME_W;
  const scaleY = window.innerHeight / GAME_H;
  const scale  = Math.min(scaleX, scaleY);

  // Centre the scaled root in the viewport
  const tx = (window.innerWidth  - GAME_W * scale) / 2;
  const ty = (window.innerHeight - GAME_H * scale) / 2;

  root.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
}

window.addEventListener('resize', scaleToFit);
scaleToFit();

// Lightweight animation loop — only redraws when stranded (SOS pulse)
// ── FPS counter state ────────────────────────────────────────────
let _fpsFrames=0, _fpsLast=performance.now(), _fpsValue=0;

(function animLoop(){
  requestAnimationFrame(animLoop);

  // FPS tracking
  _fpsFrames++;
  const _now = performance.now();
  if(_now - _fpsLast >= 1000){
    _fpsValue = _fpsFrames;
    _fpsFrames = 0;
    _fpsLast = _now;
  }

  if(G && !G.dead && !G.retired){
    let needsDraw = false;

    if(G.shipAnim) needsDraw = true;
    else if(G.stranded && G.stranded.sos) needsDraw = true;
    else if(G.examine) needsDraw = true;
    else if(G.rangeTarget) needsDraw = true;
    else if(G._itemAimMode) needsDraw = true;
    else if(G.mode==='planet'){
      const pdata = G.planets?.[G.curPlanet];
      if(G.forcedMove?.active) needsDraw = true;
      else if(pdata?.meteorFlashes?.length) needsDraw = true;
      else if(pdata?.bulletTracers?.length) needsDraw = true;
      else if(pdata?.muzzleFlashes?.length) needsDraw = true;
      else if(pdata?.isAncientStation) needsDraw = true;
    }

    if(needsDraw) drawCanvas();

    // FPS overlay — drawn on top after canvas, doesn't force full redraw
    if(DEBUG.showFPS){
      ctx.font='bold 14px Courier New';
      ctx.fillStyle='rgba(0,0,0,0.6)';
      ctx.fillRect(canvas.width-58,2,56,18);
      ctx.fillStyle='#44ff88';
      ctx.textAlign='right';
      ctx.fillText(_fpsValue+' fps', canvas.width-4, 16);
      ctx.textAlign='left';
    }
  }
})();

// ── Compass click handlers ───────────────────────────────────────
(function(){
  const grid = document.getElementById('compass-grid');
  grid.addEventListener('mousedown', e=>{
    if(!G || G.dead || G.retired || G.examine || G.rangeTarget) return;
    if(G.forcedMove?.active){ e.preventDefault(); return; }
    if(G.mode !== 'galaxy' && G.mode !== 'planet') return;
    const btn = e.target.closest('.cmp-btn');
    if(!btn) return;
    e.preventDefault();
    const dx = btn.dataset.dx;
    const dy = btn.dataset.dy;
    if(dx === undefined){
      // centre "wait" button
      if(G.mode==='planet') doWaitPlanet();
      else doWaitGalaxy();
      return;
    }
    tryMove(parseInt(dx), parseInt(dy));
  });
})();

