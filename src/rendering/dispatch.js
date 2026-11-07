// ─────────────────────────────────────────────────────────────────
//  RENDER
// ─────────────────────────────────────────────────────────────────
function renderAll(){
  syncAnalyticsState();
  drawCanvas();
  renderHUD();
  renderSidebar();
  renderContextBar();
  renderActiveMissions();
  if(shipSystemsDialog.open) renderShipSystems();
  renderPointerKeys();
  renderGalaxyMinimap();
  renderCriticalBanner();
  checkAlarms();
  scheduleAutoSave();
  renderAutosaveStatus();
}

function drawCanvas(){
  document.getElementById('main').classList.toggle('orbital-display', G.mode==='system');
  resetCanvasMenu();
  canvasMapView=null;
  ctx.clearRect(0,0,canvasWidth,canvasHeight);

  if(G.mode==='planet'){
    drawPlanet();
  } else if(G.mode==='scanview'){
    drawScanView();
  } else if(G.mode==='system'){
    drawSystemView();
  } else if(G.mode==='shipcombat'){
    drawShipCombatOverlay();
  } else if(G.mode==='casino'){
    if(G.planets[G.curPlanet]?.isCasino) drawPlanet(); else drawGalaxy();
    drawCasinoOverlay();
  } else if(G.mode==='radio'){
    drawGalaxy();
    drawRadioOverlay();
  } else {
    drawGalaxy();
    if(G.mode==='base') drawBaseOverlay();
  }

  if(G.mode==='inventory'){
    ctx.fillStyle='rgba(0,0,0,0.75)';
    ctx.fillRect(0,0,canvasWidth,canvasHeight);
    drawInventoryOverlay();
  }

  if(G.dead || G.retired){
    resetCanvasMenu();
    if(G.dead) drawGameOverOverlay(); else drawRetirementScreen();
  }
  const strandedView=G.stranded && G.mode==='galaxy';
  if(strandedView || G.examine || G.rangeTarget || G._itemAimMode){
    resetCanvasMenu();
    if(strandedView) drawStrandedOverlay();
    if(G.examine) drawExamineCursor();
    if(G.rangeTarget) drawRangeCursor();
    if(G._itemAimMode) drawItemAimOverlay();
  }
  drawCivilizationBoundaryOverlay();
  if(G.dialogue){
    resetCanvasMenu();
    drawDialogueOverlay();
  }
  if(G.showOptions){
    resetCanvasMenu();
    drawInGameOptions();
  }
  if(DEBUG.on || G.forcedMove?.active) resetCanvasMenu();

  drawDebugPaletteLabels();
  const mapMode=canvasMapMode();
  if(mapMode!=='fire') pointerFireAim=null;
  canvas.classList.toggle('map-targeting',!!mapMode);
}

