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
  // Persistent danger status overrides normal msg when relevant
  if(G && !G.dead && !G.retired){
    if(G.stranded){
      const st = G.stranded;
      if(st.rescuePhase==='offer'){
        showMsg('⚡ RESCUE OFFERED — [Y] Accept  [N] Decline', '#44ff88', true);
      } else {
        showMsg('⚠ STRANDED — Crew suffocating. [T] SOS beacon. Move key = wait.', '#ff4400', true);
      }
    } else if(G.mode==='planet' && G.oxygen<=25 && G.oxygen>0 &&
              ((BIOMES[atmosphereBiomeKey(G.curPlanet)]?.oxyDrain ?? 1.5)>0 || G.underwater)){
      showMsg('⚠ OXYGEN CRITICAL — surface or return to ship!', '#ff3300', true);
    } else if(G.mode==='planet' && G.oxygen<=50 &&
              ((BIOMES[atmosphereBiomeKey(G.curPlanet)]?.oxyDrain ?? 1.5)>0 || G.underwater)){
      showMsg('⚠ Oxygen low — head back to ship.', '#ffaa00', true);
    } else if((G.mode==='galaxy'||G.mode==='system') && G.fuel/G.maxFuel<=0.25 && G.fuel>0){
      showMsg('⚠ FUEL CRITICAL — return to Starbase immediately!', '#ff3300', true);
    } else if((G.mode==='galaxy'||G.mode==='system') && G.fuel/G.maxFuel<=0.5){
      showMsg('⚠ Fuel below 50% — consider returning to Starbase.', '#ffaa00', true);
    } else if(G.msg){
      showMsg(G.msg, '');
    } else {
      hideMsg();
    }
  } else if(G && G.msg){
    showMsg(G.msg, '');
  } else {
    hideMsg();
  }
  checkAlarms();
  checkMsgDismiss();
  autoSave();
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

  if(DEBUG.on) drawDebugOverlay();
  if(DEBUG.on && DEBUG.civSubMenu)  drawDebugCivSubMenu();
  if(DEBUG.on && DEBUG.itemSubMenu) drawDebugItemSubMenu();
  if(DEBUG.on && DEBUG.galaxyReport) drawDebugGalaxyReportPopup();
}

