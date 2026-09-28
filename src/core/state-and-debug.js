let G = null;

const DEBUG = {
  on:           false,
  infiniteFuel: false,
  infiniteHull: false,
  fullVision:   false,
  infiniteOxy:  false,
  infiniteCrewHp: false,
  shipInvisible: false, // enemy ships cannot detect or intercept the player on the galaxy map
  preScan:      0,
  showFPS:      false,
  spawnBiome:   0,
  spawnGalaxyObj: 0,   // index into DEBUG_GALAXY_OBJ_TYPES
  spawnMode:    'biome', // 'biome' | 'galaxy_obj'
  debugCivTier: 0,
  debugCivAggression: 1,
  // Civ sub-menu
  civSubMenu:   false,
  civSubSel:    0,
  // Pinned primitive traits (index into array; -1 = random)
  civPrimDiet:      -1,
  civPrimSocial:    -1,
  civPrimCuriosity: -1,
  civPrimHonor:     -1,
  // Pinned non-primitive traits (string value; '' = random)
  civTraitGovernance:  '',
  civTraitDisposition: '',
  civTraitEconomy:     '',
  civTraitBureaucracy: '',
  civTraitMedia:       '',
  civTraitPolicy:      '',
  // Item sub-menu
  itemSubMenu: false,
  itemSubSel:  0,
  galaxyReport: false,
  // Combat logger
  combatLog:   false,
};

// ── DEBUG COMBAT LOGGER ──────────────────────────────────────────────────────
// When DEBUG.combatLog is ON every combat-relevant event is stamped with turn,
// entity stats, speed budget, and damage. Toggle with [P] in the debug menu.
// [L] downloads the full log as a .txt file for later review.
// The last 30 entries also appear live in the debug overlay panel.

const _COMBAT_LOG_ENTRIES = [];   // { turn, event, data }
const _COMBAT_LOG_MAX = 2000;     // ring-buffer cap

function debugCombatLog(event, data){
  if(!DEBUG.combatLog) return;
  _COMBAT_LOG_ENTRIES.push({ turn: G?.turn ?? 0, event, data });
  if(_COMBAT_LOG_ENTRIES.length > _COMBAT_LOG_MAX) _COMBAT_LOG_ENTRIES.shift();
}

function debugCombatLogDownload(){
  if(!_COMBAT_LOG_ENTRIES.length){ addLog('DEBUG: combat log is empty — enable it and play some turns first.','lw'); return; }
  const lines = [
    'PROSPECTOR II — COMBAT DEBUG LOG',
    'Generated: ' + new Date().toISOString(),
    'Total entries: ' + _COMBAT_LOG_ENTRIES.length,
    '='.repeat(72),
    '',
  ];
  _COMBAT_LOG_ENTRIES.forEach(e=>{
    const d = e.data;
    let detail = '';
    if(e.event === 'MOVE_BUDGET'){
      detail = 'entity="'+d.entity+'" behaviour='+d.behaviour+' speedRating='+d.speedRating+' budget='+d.budget+' energyLeft='+d.energyLeft;
    } else if(e.event === 'CREW_ATTACK'){
      detail = 'target="'+d.target+'" dmg='+d.dmg+' enemyHpAfter='+d.enemyHp+' hitters=['+(d.hitters||[]).join(', ')+']';
    } else if(e.event === 'ENEMY_ATTACK'){
      detail = 'attacker="'+d.attacker+'" behaviour='+d.behaviour+' speedRating='+d.speedRating+' moveBudget='+d.moveBudgetUsed+' target="'+d.target+'" dmg='+d.dmg+' crewHpAfter='+d.crewHp;
    } else {
      try{ detail = JSON.stringify(d); } catch(ex){ detail = String(d); }
    }
    lines.push('T'+String(e.turn).padStart(4,'0')+' | '+e.event.padEnd(14)+' | '+detail);
  });
  const blob = new Blob([lines.join('\n')], { type:'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'prospector_combat_log_t'+(G?.turn??0)+'.txt';
  a.click();
  URL.revokeObjectURL(a.href);
  addLog('DEBUG: combat log downloaded ('+_COMBAT_LOG_ENTRIES.length+' entries).','lw');
}

function resetDebugSubMenus(){
  DEBUG.civSubMenu = false;
  DEBUG.civSubSel = 0;
  DEBUG.itemSubMenu = false;
  DEBUG.itemSubSel = 0;
  DEBUG.itemSubSelR = 0;
  DEBUG.itemSubCol = 'left';
}

