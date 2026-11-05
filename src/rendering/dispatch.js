// ─────────────────────────────────────────────────────────────────
//  RENDER
// ─────────────────────────────────────────────────────────────────
function renderAll(){
  syncAnalyticsState();
  drawCanvas();
  renderHUD();
  renderSidebar();
  renderContextBar();
  renderGalaxyMinimap();
  renderCriticalBanner();
  checkAlarms();
  scheduleAutoSave();
  renderAutosaveStatus();
}

function drawCanvas(){
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

  if(G.dead) drawGameOverOverlay();
  if(G.retired) drawRetirementScreen();
  if(G.showOptions) drawInGameOptions();
  if(G.stranded) drawStrandedOverlay();
  if(G.examine) drawExamineCursor();
  if(G.rangeTarget) drawRangeCursor();
  if(G._itemAimMode) drawItemAimOverlay();
  drawCivilizationBoundaryOverlay();
  if(G.dialogue) drawDialogueOverlay();

  drawDebugPaletteLabels();
  if(DEBUG.on) drawDebugOverlay();
  if(DEBUG.on && DEBUG.civSubMenu)  drawDebugCivSubMenu();
  if(DEBUG.on && DEBUG.itemSubMenu) drawDebugItemSubMenu();
  if(DEBUG.on && DEBUG.galaxyReport) drawDebugGalaxyReportPopup();
  drawDebugPaletteDirectory();
}

