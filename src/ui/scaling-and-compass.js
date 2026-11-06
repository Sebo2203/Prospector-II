// ─────────────────────────────────────────────────────────────────
//  FULLSCREEN SCALING
//  Scales #root to fit the viewport while preserving aspect ratio.
//  The game's natural size is 1400×720. We calculate the scale
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
  if(canvas.classList.contains('menu-canvas')) drawMenuScreen();
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

// The compass is the only pointer control that can move or wait in the world.
document.getElementById('compass-grid').addEventListener('mousedown',event=>{
  if(event.button!==0 || !G || G.dead || G.retired || canvasMenuBlocked() ||
    G.showOptions || G.dialogue ||
    G._voidPrompt || G.stranded?.rescuePhase==='offer' || DEBUG.on) return;
  const direction = event.target.closest('.cmp-btn');
  if(!direction) return;
  event.preventDefault();
  const {dx,dy} = direction.dataset;
  if(G.examine || G.rangeTarget || G._itemAimMode || G.mode==='scanview' || G.mode==='system'){
    if(dx===undefined) return;
    activateGameKey('', 'Numpad'+(5-3*Number(dy)+Number(dx)));
    return;
  }
  if(G.mode!=='galaxy' && G.mode!=='planet') return;
  if(G.stranded) doStrandedWait();
  else if(dx!==undefined) tryMove(Number(dx),Number(dy));
  else if(G.mode==='planet') doWaitPlanet();
  else doWaitGalaxy();
});

