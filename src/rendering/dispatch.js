// ─────────────────────────────────────────────────────────────────
//  RENDER
// ─────────────────────────────────────────────────────────────────
function renderAll(){
  syncAnalyticsState();
  drawCanvas();
  renderHUD();
  renderSidebar();
  renderContextBar();
  renderPointerKeys();
  renderGalaxyMinimap();
  renderCriticalBanner();
  checkAlarms();
  scheduleAutoSave();
  renderAutosaveStatus();
}

function drawCanvas(){
  resetCanvasMenu();
  canvasMapView=null;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(G.mode==='planet'){
    drawPlanet();
  } else if(G.mode==='scanview'){
    drawScanView();
  } else if(G.mode==='system'){
    drawSystemView();
  } else if(G.mode==='shipcombat'){
    drawGalaxy();
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
    ctx.fillRect(0,0,canvas.width,canvas.height);
    drawInventoryOverlay();
  }

  if(G.dead || G.retired){
    resetCanvasMenu();
    if(G.dead) drawGameOverOverlay(); else drawRetirementScreen();
  }
  if(G.stranded || G.examine || G.rangeTarget || G._itemAimMode){
    resetCanvasMenu();
    if(G.stranded) drawStrandedOverlay();
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
  if(DEBUG.on) drawDebugOverlay();
  if(DEBUG.on && DEBUG.civSubMenu)  drawDebugCivSubMenu();
  if(DEBUG.on && DEBUG.itemSubMenu) drawDebugItemSubMenu();
  if(DEBUG.on && DEBUG.galaxyReport) drawDebugGalaxyReportPopup();
  drawDebugPaletteDirectory();
  const mapMode=canvasMapMode();
  if(mapMode!=='fire') pointerFireAim=null;
  canvas.classList.toggle('map-targeting',!!mapMode);
}

