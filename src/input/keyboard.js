// ─────────────────────────────────────────────────────────────────
//  KEYBOARD INPUT
//  All branches are wrapped in try-catch so a JS error in one
//  action can never silently break the event listener.
// ─────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e=>{
  // ── Debug item search mode — must intercept before ANY other routing ──
  if(DEBUG?.itemSubSearch !== undefined){
    e.preventDefault();
    e.stopPropagation();
    if(e.key === 'Escape'){ DEBUG.itemSubSearch = undefined; DEBUG.itemSubMenu = false; renderAll(); return; }
    if(e.key === 'ArrowUp' || e.key === 'ArrowDown'){
      if(!DEBUG.itemSubCol) DEBUG.itemSubCol = 'left';
      drawDebugItemSubMenu();
      const col = DEBUG.itemSubCol;
      const rows = col === 'right' ? (drawDebugItemSubMenu._rightRows||[]) : (drawDebugItemSubMenu._leftRows||[]);
      const selKey = col === 'right' ? 'itemSubSelR' : 'itemSubSel';
      const numRows = rows.length;
      if(numRows > 0){
        DEBUG[selKey] = ((DEBUG[selKey]||0) + (e.key==='ArrowUp' ? -1 : 1) + numRows) % numRows;
      }
      renderAll(); return;
    }
    if(e.key === 'Enter'){ debugItemSubMenuSpawn(); return; }
    // Update search string
    if(e.key === 'Backspace') DEBUG.itemSubSearch = (DEBUG.itemSubSearch||'').slice(0,-1);
    else if(e.key.length === 1) DEBUG.itemSubSearch += e.key;
    else { renderAll(); return; }
    // Jump selection to first match after every change
    if(!DEBUG.itemSubCol) DEBUG.itemSubCol = 'left';
    drawDebugItemSubMenu();
    const _col = DEBUG.itemSubCol;
    const _rows = _col === 'right' ? (drawDebugItemSubMenu._rightRows||[]) : (drawDebugItemSubMenu._leftRows||[]);
    const _selKey = _col === 'right' ? 'itemSubSelR' : 'itemSubSel';
    const _q = (DEBUG.itemSubSearch||'').toLowerCase().trim();
    if(_q){
      const _idx = _rows.findIndex(r => r.type !== 'header' && String(r.label||'').toLowerCase().includes(_q));
      if(_idx !== -1) DEBUG[_selKey] = _idx;
    }
    renderAll(); return;
  }
  // Block all game keys while feedback overlay is open
  if(document.getElementById('feedback-overlay').style.display==='flex') return;
  if(document.getElementById('minimap-overlay')?.classList.contains('visible')){
    if(e.key==='Escape' || e.key==='m' || e.key==='M'){
      e.preventDefault();
      closeGalaxyMinimapOverlay();
    }
    return;
  }
  // Route to barter handler — it consumes all keys while open
  if(document.getElementById('barter-overlay').style.display==='flex'){
    handleBarterKey(e);
    return;
  }

  // Menu mode — G is null, route to menu handler
  if(G===null){ handleMenuKey(e); return; }

  if(G.forcedMove?.active){
    e.preventDefault();
    renderAll();
    return;
  }

  try {

    // F5 — save to file from anywhere in-game
    if(e.key==='F5'){ e.preventDefault(); saveToFile(); return; }

    // M — open full galaxy minimap
    if((e.key==='m'||e.key==='M') && !DEBUG.on){
      e.preventDefault();
      openGalaxyMinimapOverlay();
      return;
    }

    // O — toggle in-game options overlay
    if(e.key==='o'||e.key==='O'){
      if(!G.dead && !G.retired){
        G.showOptions = !G.showOptions;
        MENU_STATE.optSel = 0;
        renderAll(); return;
      }
    }

    // Ship combat owns its action keys before WASD movement can swallow them.
    if(G.mode==='shipcombat'){
      if(e.key==='f'||e.key==='F'){ doShipFire(); return; }
      if(e.key==='r'||e.key==='R'){ doShipRetreat(); return; }
      if(e.key==='s'||e.key==='S'){ doShipSurrender(); return; }
      if(e.key==='Escape'){ const _eng=G.shipStats?.engineRating||1; addLog('Use [R] to retreat (costs '+Math.max(5,12-_eng*2)+' fuel), [S] to surrender, or [F] to fire.','li'); renderAll(); return; }
    }
    if(G.mode==='radio'){
      const rows = radioTradeRows();
      if(e.key==='ArrowUp'){ G.radio.sel=Math.max(0,(G.radio.sel||0)-1); renderAll(); return; }
      if(e.key==='ArrowDown'){ G.radio.sel=Math.min(rows.length-1,(G.radio.sel||0)+1); renderAll(); return; }
      if(e.key==='Enter'){ const row=rows[G.radio.sel||0]; if(row && !row.disabled) executeRadioTrade(row.id); else renderAll(); return; }
      if(e.key==='Escape'||e.key==='h'||e.key==='H'){ executeRadioTrade('close'); return; }
      return;
    }

    // In-game options overlay keys
    if(G.showOptions){
      if(G._kbScreen){
        // Keybindings sub-screen inside in-game options
        const BIND_LIST = ['nw','n','ne','w','e','sw','s','se','wait'];
        const totalRows = BIND_LIST.length + 1;
        if(MENU_STATE._rebinding){
          if(e.key==='Escape'){ e.preventDefault(); MENU_STATE._rebinding=null; renderAll(); return; }
          const blocked=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Escape','Enter','F5','Tab',' '];
          if(blocked.includes(e.key)){ e.preventDefault(); return; }
          if(!OPTIONS.keybinds) OPTIONS.keybinds = Object.assign({}, DEFAULT_KEYBINDS);
          e.preventDefault();
          Object.keys(OPTIONS.keybinds).forEach(k=>{ if(OPTIONS.keybinds[k]===e.code) OPTIONS.keybinds[k]=null; });
          OPTIONS.keybinds[MENU_STATE._rebinding] = e.code;
          saveOptions(OPTIONS);
          MENU_STATE._rebinding = null;
          if(KEYBIND_CONFLICTS[e.code]) addLog('Keybind warning: '+codeLabel(e.code)+' is also used for "'+KEYBIND_CONFLICTS[e.code]+'". Both actions share this key.','lw');
          renderAll(); return;
        }
        if(e.key==='Escape'){ e.preventDefault(); G._kbScreen=false; MENU_STATE._kbSel=0; renderAll(); return; }
        if(e.key==='ArrowUp'){ e.preventDefault(); MENU_STATE._kbSel=((MENU_STATE._kbSel||0)-1+totalRows)%totalRows; renderAll(); return; }
        if(e.key==='ArrowDown'){ e.preventDefault(); MENU_STATE._kbSel=((MENU_STATE._kbSel||0)+1)%totalRows; renderAll(); return; }
        if(e.key==='Enter'||e.key===' '){
          e.preventDefault();
          const sel = MENU_STATE._kbSel||0;
          if(sel===BIND_LIST.length){ OPTIONS.keybinds=Object.assign({},DEFAULT_KEYBINDS); saveOptions(OPTIONS); }
          else MENU_STATE._rebinding = BIND_LIST[sel];
          renderAll(); return;
        }
        return;
      }
      if(e.key==='Escape'){ G.showOptions=false; G._kbScreen=false; MENU_STATE._optHover=null; renderAll(); return; }
      if(e.key==='f'||e.key==='F'){ openFeedback(); return; }
      if(e.key==='s'||e.key==='S'){ saveToFile(); return; }
      if(e.key==='k'||e.key==='K'){ G._kbScreen=true; MENU_STATE._kbSel=0; MENU_STATE._rebinding=null; renderAll(); return; }
      if(e.key==='ArrowUp'||e.key==='ArrowDown'){
        e.preventDefault();
        const maxOpt = 3;
        MENU_STATE.optSel = Number.isInteger(MENU_STATE.optSel) ? MENU_STATE.optSel : 0;
        MENU_STATE.optSel = e.key==='ArrowUp'
          ? (MENU_STATE.optSel + maxOpt) % (maxOpt + 1)
          : (MENU_STATE.optSel + 1) % (maxOpt + 1);
        MENU_STATE._optHover = null;
        renderAll(); return;
      }
      if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
        e.preventDefault();
        if(MENU_STATE.optSel===0){ OPTIONS.asciiMode=!OPTIONS.asciiMode; saveOptions(OPTIONS); renderAll(); }
        return;
      }
      if(e.key===' '||e.key==='Enter'){
        if(MENU_STATE.optSel===0){ OPTIONS.asciiMode=!OPTIONS.asciiMode; saveOptions(OPTIONS); renderAll(); return; }
        if(MENU_STATE.optSel===1){ G._kbScreen=true; MENU_STATE._kbSel=0; MENU_STATE._rebinding=null; renderAll(); return; }
        if(MENU_STATE.optSel===2){ saveToFile(); return; }
        openFeedback(); return;
      }
      return;
    }

    // Branching dialogue overlay owns input while open.
    if(G.dialogue){
      const opts = dialogueVisibleOptions();
      if(e.key==='ArrowUp'){
        G.dialogue.sel = Math.max(0, (G.dialogue.sel || 0) - 1);
        if((G.dialogue.sel || 0) < (G.dialogue.optScroll || 0)) G.dialogue.optScroll = G.dialogue.sel || 0;
        renderAll(); return;
      }
      if(e.key==='ArrowDown'){
        G.dialogue.sel = Math.min(Math.max(0, opts.length - 1), (G.dialogue.sel || 0) + 1);
        const visibleOptCount = 4;
        if((G.dialogue.sel || 0) >= (G.dialogue.optScroll || 0) + visibleOptCount - 1) G.dialogue.optScroll = Math.max(0, (G.dialogue.sel || 0) - visibleOptCount + 2);
        renderAll(); return;
      }
      if(e.key==='Enter' || e.key===' '){
        chooseDialogueOption(G.dialogue.sel || 0);
        return;
      }
      if(e.key==='Escape'){
        if(!dialogueAllowsEscape()){
          const _wrap = dialogueCivilization();
          const _tier = _wrap?.civ?.tier || '';
          const _msg = _tier === 'industrial' ? 'The security cordon has not released you. You need to respond to them.'
            : _tier === 'information' ? 'The contact protocol is not resolved. You cannot simply walk away.'
            : _tier === 'medieval' ? 'The patrol has not given leave. You must answer them first.'
            : 'The delegation blocks the way. You need to answer them.';
          addLog(_msg,'lw');
          renderAll(); return;
        }
        G.dialogue = null;
        renderAll(); return;
      }
      const n = parseInt(e.key, 10);
      if(n >= 1 && n <= opts.length){
        chooseDialogueOption(n - 1);
        return;
      }
      return;
    }

    // Shift+B — toggle debug menu
    if(e.key==='B' && e.shiftKey){
      DEBUG.on = !DEBUG.on;
      renderAll();
      return;
    }
    // Debug hotkeys (only when debug menu is open)
    if(DEBUG.on){
      if(DEBUG.galaxyReport){
        if(e.key==='Escape'||e.key==='v'||e.key==='V'){
          DEBUG.galaxyReport = false;
          renderAll(); return;
        }
        return;
      }
      // ── Civ sub-menu — intercept all keys when open ──
      if(DEBUG.civSubMenu){
        e.preventDefault();
        const rows = debugCivSubMenuRows();
        const numRows = rows.length;
        if(e.key==='Escape'||e.key==='c'||e.key==='C'){ DEBUG.civSubMenu=false; renderAll(); return; }
        if(e.key==='ArrowUp'||e.key==='w'||e.key==='W'){
          DEBUG.civSubSel = (DEBUG.civSubSel - 1 + numRows) % numRows;
          renderAll(); return;
        }
        if(e.key==='ArrowDown'||e.key==='s'||e.key==='S'){
          DEBUG.civSubSel = (DEBUG.civSubSel + 1) % numRows;
          renderAll(); return;
        }
        const selRow = rows[DEBUG.civSubSel];
        if(e.key==='ArrowLeft'){ debugCivSubMenuApplyRow(selRow, -1); renderAll(); return; }
        if(e.key==='ArrowRight'){ debugCivSubMenuApplyRow(selRow, 1); renderAll(); return; }
        if(e.key==='Enter'){
          // Enter always spawns — arrow keys are the only way to change values
          e.stopPropagation();
          DEBUG.civSubMenu=false; debugSpawnCivilizationOnCurrentPlanet(); return;
        }
        if(e.key===' '){
          // Space closes if on close row, otherwise also spawns
          if(selRow?.key === 'close'){ DEBUG.civSubMenu=false; renderAll(); return; }
          DEBUG.civSubMenu=false; debugSpawnCivilizationOnCurrentPlanet(); return;
        }
        renderAll(); return;
      }
      // ── Item sub-menu — intercept all keys when open ──
      if(DEBUG.itemSubMenu){
        e.preventDefault();
        if(!DEBUG.itemSubCol) DEBUG.itemSubCol = 'left';
        // Ensure draw has run so row arrays exist
        drawDebugItemSubMenu();
        const col = DEBUG.itemSubCol;
        const rows = col === 'right' ? (drawDebugItemSubMenu._rightRows||[]) : (drawDebugItemSubMenu._leftRows||[]);
        const selKey = col === 'right' ? 'itemSubSelR' : 'itemSubSel';
        const numRows = rows.length;

        // ── Search mode active ──
        if(DEBUG.itemSubSearch !== undefined){
          // Handled at top of keydown listener — should not reach here
        }

        if(e.key==='Escape'||e.key==='i'||e.key==='I'){ DEBUG.itemSubMenu=false; renderAll(); return; }
        if(e.key==='f'||e.key==='F'){ DEBUG.itemSubSearch = ''; renderAll(); return; }
        if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){
          DEBUG.itemSubCol = 'left'; renderAll(); return;
        }
        if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){
          DEBUG.itemSubCol = 'right'; renderAll(); return;
        }
        if(e.key==='ArrowUp'||e.key==='w'||e.key==='W'){
          DEBUG[selKey] = ((DEBUG[selKey]||0) - 1 + numRows) % numRows;
          renderAll(); return;
        }
        if(e.key==='ArrowDown'||e.key==='s'||e.key==='S'){
          DEBUG[selKey] = ((DEBUG[selKey]||0) + 1) % numRows;
          renderAll(); return;
        }
        if(e.key==='Enter'||e.key===' '){
          debugItemSubMenuSpawn(); return;
        }
        renderAll(); return;
      }
      if(e.key==='Escape'){ DEBUG.on = false; renderAll(); return; }
      if(e.key==='1'){ DEBUG.infiniteFuel = !DEBUG.infiniteFuel; renderAll(); return; }
      if(e.key==='2'){ DEBUG.infiniteHull = !DEBUG.infiniteHull; renderAll(); return; }
      if(e.key==='3'){
        DEBUG.fullVision = !DEBUG.fullVision;
        if(DEBUG.fullVision) G.visited.fill(true);
        renderAll(); return;
      }
      if(e.key==='4'){ DEBUG.infiniteOxy = !DEBUG.infiniteOxy; renderAll(); return; }
      if(e.key==='7'){ DEBUG.infiniteCrewHp = !DEBUG.infiniteCrewHp; debugRestoreCrewHp(); addLog('DEBUG: Infinite crew HP '+(DEBUG.infiniteCrewHp?'ON':'OFF')+'.','lw'); renderAll(); return; }
      if(e.key==='9'){
        DEBUG.preScan = ((DEBUG.preScan||0) + 1) % 3;
        const _scanLabels = ['Pre-scan debug spawned planets','Pre-scan all planets (even non-debug)','Scan no planets'];
        addLog('DEBUG: '+_scanLabels[DEBUG.preScan]+'.','lw'); renderAll(); return;
      }
      if(e.key==='0'){ DEBUG.showFPS = !DEBUG.showFPS; renderAll(); return; }

      if(e.key==='v'||e.key==='V'){ DEBUG.galaxyReport = true; renderAll(); return; }

      if(e.key==='g'||e.key==='G'){ debugSpawnGunnerAlien(); return; }
      if(e.key==='n'||e.key==='N'){ debugRegenWithAncientRuins(); return; }
      if(e.key==='r'||e.key==='R'){ debugApplyCrewStatus('radiation'); return; }
      if(e.key==='d'||e.key==='D'){ debugApplyCrewStatus('disease'); return; }
      if(e.key==='h'||e.key==='H'){ debugApplyCrewStatus('hallucination'); return; }
      if(e.key==='m'||e.key==='M'){ G.credits+=1000; addLog('DEBUG: +1000 cr (total: '+G.credits+')','lw'); renderAll(); return; }
      if(e.key==='c'||e.key==='C'){ DEBUG.civSubMenu=true; DEBUG.civSubSel=0; renderAll(); return; }
      if(e.key==='i'||e.key==='I'){ DEBUG.itemSubMenu=true; DEBUG.itemSubSel=0; DEBUG.itemSubSearch=''; renderAll(); return; }
      if(e.key==='k'||e.key==='K'){ debugToggleCurrentCivHostile(); return; }
      // Cycle biome / galaxy object for spawn
      const biomeCount = Object.keys(BIOMES).length;
      const gObjCount = DEBUG_GALAXY_OBJ_TYPES.length;
      if(e.key==='x'||e.key==='X'){ DEBUG.spawnMode = DEBUG.spawnMode==='galaxy_obj' ? 'biome' : 'galaxy_obj'; renderAll(); return; }
      if(e.key==='ArrowLeft'){
        if(DEBUG.spawnMode==='galaxy_obj') DEBUG.spawnGalaxyObj=(DEBUG.spawnGalaxyObj-1+gObjCount)%gObjCount;
        else DEBUG.spawnBiome=(DEBUG.spawnBiome-1+biomeCount)%biomeCount;
        renderAll(); return;
      }
      if(e.key==='ArrowRight'){
        if(DEBUG.spawnMode==='galaxy_obj') DEBUG.spawnGalaxyObj=(DEBUG.spawnGalaxyObj+1)%gObjCount;
        else DEBUG.spawnBiome=(DEBUG.spawnBiome+1)%biomeCount;
        renderAll(); return;
      }
      if(e.key==='Enter' && G.mode==='galaxy'){
        if(DEBUG.spawnMode==='galaxy_obj') debugSpawnGalaxyObj();
        else debugSpawnSystem();
        return;
      }
      if(e.key==='6'){
        debugSpawnCivilizationOnCurrentPlanet();
        return;
      }
    }

    // Game over / retirement
    if(G.dead || G.retired){
      if(e.key==='Enter'||e.key===' ') showMenu();
      return;
    }

    // Casino menu
    if(G.mode==='casino'){
      handleCasinoKey(e);
      return;
    }

    // ── X — toggle examine mode (galaxy and planet only) ──────────
    if(e.key==='x'||e.key==='X'){
      if(G.examine){
        G.examine = null;
        G.msg = '';
        renderAll(); return;
      }
      if(G.mode==='galaxy'){
        G.examine = { x: G.ship.x, y: G.ship.y };
        renderAll(); return;
      }
      if(G.mode==='planet'){
        G.examine = { x: G.player.x, y: G.player.y };
        renderAll(); return;
      }
    }

    // ── Item Aim Mode (jetpack / grappling hook direction picker) ──
    if(G._itemAimMode && G.mode==='planet'){
      if(e.key==='Escape'){ G._itemAimMode=null; addLog('Cancelled.','lm'); renderAll(); return; }
      const aimDirs = {
        ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0],
        w:[0,-1], W:[0,-1], s:[0,1], S:[0,1], a:[-1,0], A:[-1,0], d:[1,0], D:[1,0],
        Numpad8:[0,-1], Numpad2:[0,1], Numpad4:[-1,0], Numpad6:[1,0],
        Numpad7:[-1,-1], Numpad9:[1,-1], Numpad1:[-1,1], Numpad3:[1,1],
      };
      const dd = aimDirs[e.key] || (e.code in aimDirs ? aimDirs[e.code] : null);
      if(dd){
        e.preventDefault();
        const aim = G._itemAimMode;
        G._itemAimMode = null;
        const lx = dd[0], ly = dd[1];
        const pdata = G.planets[G.curPlanet];
        if(aim.usable==='grapple'){
          const cx2 = G.player.x + lx, cy2 = G.player.y + ly;
          const beyond = { x: G.player.x + lx*2, y: G.player.y + ly*2 };
          const obstacle = pdata?.grid[cy2]?.[cx2];
          const landing  = pdata?.grid[beyond.y]?.[beyond.x];
          if(!obstacle || TILE[obstacle.type]?.pass !== false){
            addLog('Nothing to hook onto \u2014 aim at a rock face.','lw'); renderAll(); return;
          }
          if(!landing || TILE[landing.type]?.pass === false){
            addLog('No room to land beyond the obstacle.','lw'); renderAll(); return;
          }
          G.player.x = beyond.x; G.player.y = beyond.y;
          G.inventory.splice(aim.invIdx, 1);
          G._viewInvSel = Math.min(aim.invIdx, Math.max(0, G.inventory.length-1));
          addLog('Grappling Hook fires \u2014 you clear the rock face in one swing.','lg');
          G.turn++; pdata.planetTurn = (pdata.planetTurn||0)+1;
          revealPlanet(G.curPlanet, G.player.x, G.player.y, 2);
          moveEnemies();
        } else if(aim.usable==='jetpack'){
          const item = G.inventory[aim.invIdx];
          const jx = G.player.x + lx*2, jy = G.player.y + ly*2;
          if(jx < 0 || jx >= PW(pdata) || jy < 0 || jy >= PH(pdata)){
            addLog('Cannot jetpack off the map edge.','lw'); renderAll(); return;
          }
          const landingCell = pdata?.grid[jy]?.[jx];
          if(!landingCell || TILE[landingCell.type]?.pass === false){
            addLog('Landing zone blocked \u2014 pick a clear direction.','lw'); renderAll(); return;
          }
          if(item) item.fuel = (item.fuel||0) - 1;
          G.player.x = jx; G.player.y = jy;
          const fuelLeft = item?.fuel || 0;
          if(fuelLeft <= 0){
            G.inventory.splice(aim.invIdx, 1);
            G._viewInvSel = Math.min(aim.invIdx, Math.max(0, G.inventory.length-1));
            addLog('Jetpack boost \u2014 last charge spent. Jetpack discarded.','lw');
          } else {
            addLog('Jetpack boost \u2014 cleared 2 tiles! Fuel: '+fuelLeft+' charges left.','lg');
          }
          G.turn++; pdata.planetTurn = (pdata.planetTurn||0)+1;
          revealPlanet(G.curPlanet, G.player.x, G.player.y, 2);
          moveEnemies();
        }
        renderAll(); return;
      }
      return; // eat all other keys while in aim mode
    }

    // ── F — enter fire mode (planet only, requires ranged weapon) ──
    if((e.key==='f'||e.key==='F') && G.mode==='planet' && !G.examine){
      if(G.rangeTarget){
        // F pressed while in fire mode = fire
        doRangedFire(); return;
      }
      const best = getBestRangedWeapon();
      if(!best){ addLog('No ranged weapon equipped — open inventory to equip a gun.','lw'); renderAll(); return; }
      // Start fire mode on the nearest visible enemy, otherwise one tile north.
      const enemies = (G.enemies[G.curPlanet]||[]).filter(e=>e.alive && !e.hidden && canSeePlanetTile(e.x, e.y));
      let startX = G.player.x, startY = Math.max(0, G.player.y-1);
      if(enemies.length){
        const nearest = enemies.reduce((best,e)=>{
          const d = Math.abs(e.x-G.player.x)+Math.abs(e.y-G.player.y);
          return (!best||d < best.d) ? {e,d} : best;
        }, null);
        if(nearest){ startX = nearest.e.x; startY = nearest.e.y; }
      }
      G.rangeTarget = { x: startX, y: startY };
      G._rangeFireMode = 'all';
      renderAll(); return;
    }

    // ── Fire mode cursor movement ─────────────────────────────────
    if(G.rangeTarget && G.mode==='planet'){
      if(e.key==='Escape'){ G.rangeTarget=null; renderAll(); return; }
      if(e.key==='Enter'||e.key===' '){ doRangedFire(); return; }
      if(e.key==='Tab' || e.key==='q' || e.key==='Q' || e.key==='e' || e.key==='E'){
        e.preventDefault();
        if(cycleRangedShooter(e.key==='q' || e.key==='Q' ? -1 : 1)) renderAll();
        return;
      }
      const fireDirs = {
        ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0],
        w:[0,-1], W:[0,-1], s:[0,1], S:[0,1], a:[-1,0], A:[-1,0], d:[1,0], D:[1,0],
      };
      const numpadFire = {
        Numpad7:[-1,-1], Numpad8:[0,-1], Numpad9:[1,-1],
        Numpad4:[-1, 0],                 Numpad6:[1, 0],
        Numpad1:[-1, 1], Numpad2:[0, 1], Numpad3:[1, 1],
      };
      let dd = fireDirs[e.key] || (e.code in numpadFire ? numpadFire[e.code] : null);
      if(dd){
        e.preventDefault();
        const pdata = G.planets[G.curPlanet];
        G.rangeTarget.x = Math.max(0, Math.min(PW(pdata)-1, G.rangeTarget.x+dd[0]));
        G.rangeTarget.y = Math.max(0, Math.min(PH(pdata)-1, G.rangeTarget.y+dd[1]));
        renderAll(); return;
      }
      return; // eat all other keys while in fire mode
    }

    if((e.key==='t'||e.key==='T') && G.mode==='planet' && !G.examine){
      if(attemptPlanetCommunication()) return;
    }

    // ── Examine cursor movement ───────────────────────────────────
    if(G.examine){
      // Examine only makes sense in galaxy and planet modes — clear it in any other mode
      if(G.mode !== 'galaxy' && G.mode !== 'planet'){
        G.examine = null;
        G.msg = '';
        renderAll(); return;
      }
      const examDirs = {
        ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0],
        w:[0,-1], W:[0,-1], s:[0,1], S:[0,1], a:[-1,0], A:[-1,0], d:[1,0], D:[1,0],
      };
      const numpadExam = {
        Numpad7:[-1,-1], Numpad8:[0,-1], Numpad9:[1,-1],
        Numpad4:[-1, 0],                 Numpad6:[1, 0],
        Numpad1:[-1, 1], Numpad2:[0, 1], Numpad3:[1, 1],
      };
      if((e.key==='t'||e.key==='T') && G.mode==='planet'){
        if(attemptPlanetCommunication()) return;
      }
      if((e.key==='h'||e.key==='H') && G.mode==='galaxy'){
        const examData = G.visited?.[G.examine.y*MAP_W+G.examine.x] ? getExamineName(G.examine.x, G.examine.y) : null;
        if(examData && typeof examData === 'object' && examData.type === 'galaxy_ship'){
          if(examData.dist <= radioRange()){
            G.examine = null;
            startGalaxyShipDialogue(examData.ns);
          } else {
            addLog(examData.ns.name+' is out of radio range ('+examData.dist+'u — max '+radioRange()+'u).','lw');
            renderAll();
          }
          return;
        }
      }
      if(e.key==='Escape'){ G.examine=null; G.msg=''; renderAll(); return; }
      let dd = examDirs[e.key] || (e.code in numpadExam ? numpadExam[e.code] : null);
      if(dd){
        e.preventDefault();
        if(G.mode==='galaxy'){
          G.examine.x = Math.max(0, Math.min(MAP_W-1,   G.examine.x+dd[0]));
          G.examine.y = Math.max(0, Math.min(MAP_H-1,   G.examine.y+dd[1]));
        } else {
          G.examine.x = Math.max(0, Math.min(PW(G.planets[G.curPlanet])-1, G.examine.x+dd[0]));
          G.examine.y = Math.max(0, Math.min(PH(G.planets[G.curPlanet])-1, G.examine.y+dd[1]));
        }
        renderAll(); return;
      }
      return; // eat all other keys while examining
    }

    // Starbase menu
    if(G.mode==='base'){
      const b = G.base;
      // Retirement confirm screen
      if(b.confirm==='retire'){
        if(e.key==='Enter'||e.key===' '){
          b.confirm='retire_story';
          // Pick a random story variant now and lock it so redraws stay consistent
          const _tier = RETIREMENT_TIERS.find(t=>G.credits>=t.min&&G.credits<=t.max)||RETIREMENT_TIERS[0];
          G.retirementStoryIdx     = Math.floor(Math.random() * _tier.story.length);
          const _picked = _tier.story[G.retirementStoryIdx];
          G.retirementNoEpilogue  = !!(_picked && _picked.noEpilogue);
          G.retirementEpilogueIdx = Math.floor(Math.random() * RETIREMENT_EPILOGUES.length);
          // DEAD — pre-roll humanity arc indices ready for when the screen is wired in
          G.retirementHumanityIdx      = Math.floor(Math.random() * HUMANITY_OUTCOMES.length);
          G.retirementHumanityCodaIdx  = Math.floor(Math.random() * HUMANITY_CODAS_ALIVE.length);
          renderAll(); return;
        }
        if(e.key==='Escape'){ b.confirm=null; renderAll(); return; }
        return;
      }
      // Retirement story screen — press Enter to proceed to stats
      if(b.confirm==='retire_story'){
        if(e.key==='Enter'||e.key===' '){ G.retired=true; renderAll(); return; }
        return;
      }
      if(b.screen==='main'){
        if(e.key==='ArrowUp'){   b.sel=Math.max(0,b.sel-1); renderAll(); return; }
        if(e.key==='ArrowDown'){ b.sel=Math.min(STATION_BUILDINGS.length-1,b.sel+1); renderAll(); return; }
        if(e.key==='Enter'){ b.screen='sub'; b.subSel=0; b.subScroll=0; b.medbaySub=null; b.scienceCorpSub=false; renderAll(); return; }
        if(e.key==='Escape'){ G.mode='galaxy'; addLog('Undocked.','li'); renderAll(); return; }
      } else if(b.screen==='recruit'){
        const HIRE_COUNT = 6;
        if(e.key==='ArrowUp'){   b.recruitSel=Math.max(0,(b.recruitSel||0)-1); renderAll(); return; }
        if(e.key==='ArrowDown'){ b.recruitSel=Math.min(HIRE_COUNT-1,(b.recruitSel||0)+1); renderAll(); return; }
        if(e.key==='Enter'){ executeBaseAction('recruit_confirm'); renderAll(); return; }
        if(e.key==='Escape'){ b.screen='sub'; renderAll(); return; }
      } else if(b.screen==='installweapon'){
        const weapons3 = Object.values(SHIP_WEAPONS);
        if(e.key==='ArrowUp'){   b.weaponSel=Math.max(0,(b.weaponSel||0)-1); renderAll(); return; }
        if(e.key==='ArrowDown'){ b.weaponSel=Math.min(weapons3.length-1,(b.weaponSel||0)+1); renderAll(); return; }
        if(e.key==='Enter'){ executeBaseAction('confirminstall'); renderAll(); return; }
        if(e.key==='Escape'){ b.screen='sub'; renderAll(); return; }
      } else if(b.screen==='changehull'){
        const HULL_IDS = ['LIGHT_SCOUT','BULK_FREIGHTER','ATTACK_CORVETTE'];
        if(e.key==='ArrowLeft'){  b.hullSel=Math.max(0,(b.hullSel||0)-1); renderAll(); return; }
        if(e.key==='ArrowRight'){ b.hullSel=Math.min(HULL_IDS.length-1,(b.hullSel||0)+1); renderAll(); return; }
        if(e.key==='Enter'){ executeBaseAction('confirmhull'); renderAll(); return; }
        if(e.key==='Escape'){ b.screen='sub'; renderAll(); return; }
      } else if(b.screen==='sub'){
        const actions = STATION_BUILDINGS[b.sel].actions();
        // Skip over header rows and disabled rows when navigating
        function subStep(dir){
          let next = b.subSel + dir;
          while(next >= 0 && next < actions.length && (actions[next]._header || actions[next].disabled)){
            next += dir;
          }
          if(next >= 0 && next < actions.length) b.subSel = next;
        }
        if(e.key==='ArrowUp'){   subStep(-1); renderAll(); return; }
        if(e.key==='ArrowDown'){ subStep(1);  renderAll(); return; }
        if(e.key==='Enter'){
          const act = actions[b.subSel];
          if(act && !act.disabled && !act._header) executeBaseAction(act.id);
          return;
        }
        if(e.key==='Escape'){
          if(b.medbaySub === 'vend'){
            b.medbaySub = null;
            b.subSel = 0;
            b.subScroll = 0;
            renderAll(); return;
          }
          b.screen='main'; b.subScroll=0; b.medbaySub=null; b.scienceCorpSub=false; if(b.hangarSub) b.hangarSub='top'; renderAll(); return;
        }
      }
      return;
    }

    // System view — planet selection
    if(G.mode==='system'){
      const cell=G.galaxy[G.ship.y]?.[G.ship.x];
      const numP = cell?.planets?.length || 1;
      if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'||e.code==='Numpad4'){
        e.preventDefault();
        G.selPlanet = (G.selPlanet - 1 + numP) % numP;
        G.selMoon = -1;
        renderAll(); return;
      }
      if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'||e.code==='Numpad6'){
        e.preventDefault();
        G.selPlanet = (G.selPlanet + 1) % numP;
        G.selMoon = -1;
        renderAll(); return;
      }
      const n = parseInt(e.key);
      if(n>=1 && n<=numP){ G.selPlanet = n-1; G.selMoon = -1; renderAll(); return; }
      if(e.key==='ArrowUp'||e.key==='w'||e.key==='W'||e.code==='Numpad8'){
        const pDesc = cell?.planets?.[G.selPlanet];
        if(pDesc?.biome==='GAS_GIANT' && pDesc.moons?.length && pDesc.scanState==='full'){
          e.preventDefault();
          if(G.selMoon<0){
            G.selMoon = pDesc.moons.length - 1;
            addLog('Selected: '+pDesc.moons[G.selMoon].name+' ['+BIOMES[pDesc.moons[G.selMoon].biome].name+']','li');
          } else if(G.selMoon===0){
            G.selMoon = -1;
            addLog('Selected: '+pDesc.name+' ['+BIOMES[pDesc.biome].name+']','li');
          } else {
            G.selMoon--;
            addLog('Selected: '+pDesc.moons[G.selMoon].name+' ['+BIOMES[pDesc.moons[G.selMoon].biome].name+']','li');
          }
          renderAll();
          return;
        }
      }
      if(e.key==='ArrowDown'||e.code==='Numpad2'){
        const pDesc = cell?.planets?.[G.selPlanet];
        if(pDesc?.biome==='GAS_GIANT' && pDesc.moons?.length && pDesc.scanState==='full'){
          e.preventDefault();
          if(G.selMoon<0){
            G.selMoon = 0;
            addLog('Selected: '+pDesc.moons[G.selMoon].name+' ['+BIOMES[pDesc.moons[G.selMoon].biome].name+']','li');
          } else if(G.selMoon===pDesc.moons.length-1){
            G.selMoon = -1;
            addLog('Selected: '+pDesc.name+' ['+BIOMES[pDesc.biome].name+']','li');
          } else {
            G.selMoon++;
            addLog('Selected: '+pDesc.moons[G.selMoon].name+' ['+BIOMES[pDesc.moons[G.selMoon].biome].name+']','li');
          }
          renderAll();
          return;
        }
      }
      if(e.key==='Enter'){ doInteract(); return; }
      if(e.key==='u'||e.key==='U'){ doFuelScoop('gasgiant'); return; }
      if(e.key==='s'||e.key==='S'){ doScan(); return; }
      if(e.key==='v'||e.key==='V'){ doViewScan(); return; }
      if(e.key==='Escape'){
        G.mode='galaxy';
        G.curSystem='';
        addLog('Left the system.','li');
        renderAll(); return;
      }
      if(e.key==='i'||e.key==='I'){
        G._prevMode='system'; G.mode='inventory'; G._inventoryExamine=false; G._crewExamine=false; renderAll(); return;
      }
      return;
    }

    // I = inventory/crew overlay toggle
    if(e.key==='i'||e.key==='I'){
      if(G.mode==='inventory'){ G.mode=G._prevMode; G._inventoryExamine=false; G._crewExamine=false; }
      else { G._prevMode=G.mode; G.mode='inventory'; G._viewTab='inventory'; G._inventoryExamine=false; G._crewExamine=false; }
      renderAll(); return;
    }

    // Scan view — E to land, ESC to exit
    if(G.mode==='scanview'){
      const pdata = G.planets[G.scanViewKey];
      if(pdata){
        let moved = false;
        if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'||e.code==='Numpad4'){
          G.scanCursorX = Math.max(0, (G.scanCursorX ?? pdata.spawnX) - 1);
          G.scanCursorY = (G.scanCursorY ?? pdata.spawnY);
          moved = true;
        } else if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'||e.code==='Numpad6'){
          G.scanCursorX = Math.min(PW(pdata)-1, (G.scanCursorX ?? pdata.spawnX) + 1);
          G.scanCursorY = (G.scanCursorY ?? pdata.spawnY);
          moved = true;
        } else if(e.key==='ArrowUp'||e.key==='w'||e.key==='W'||e.code==='Numpad8'){
          G.scanCursorX = (G.scanCursorX ?? pdata.spawnX);
          G.scanCursorY = Math.max(0, (G.scanCursorY ?? pdata.spawnY) - 1);
          moved = true;
        } else if(e.key==='ArrowDown'||e.key==='s'||e.key==='S'||e.code==='Numpad2'){
          G.scanCursorX = (G.scanCursorX ?? pdata.spawnX);
          G.scanCursorY = Math.min(PH(pdata)-1, (G.scanCursorY ?? pdata.spawnY) + 1);
          moved = true;
        }
        if(moved){
          e.preventDefault();
          renderAll();
          return;
        }
      }
      if(e.key==='Enter'){
        const cell = G.galaxy[G.ship.y][G.ship.x];
        const pDesc = cell?.planets?.[G.selPlanet];
        const targetDesc = (G.selMoon>=0 && pDesc?.moons?.[G.selMoon]) ? pDesc.moons[G.selMoon] : pDesc;
        const pKey = G.scanViewKey;
        if(targetDesc && pKey){
          const targetPlanet = G.planets[pKey];
          const lx = G.scanCursorX ?? targetPlanet?.spawnX;
          const ly = G.scanCursorY ?? targetPlanet?.spawnY;
          if(targetPlanet && canLandAt(targetPlanet, lx, ly)) doLandOnPlanet(pKey, targetDesc, lx, ly);
          else { addLog('Choose explored, unobstructed terrain to land there.','lw'); renderAll(); }
        }
        return;
      }
      if(e.key==='Escape'){ G.mode='system'; renderAll(); return; }
      return;
    }

    // ESC
    if(e.key==='Escape'){
      if(G.mode==='shipcombat'){ const _eng=G.shipStats?.engineRating||1; addLog('Use [R] to retreat (costs '+Math.max(5,12-_eng*2)+' fuel), [S] to surrender, or [F] to fire.','li'); renderAll(); return; }
      if(G.mode==='inventory' && G._cargoExamine){ G._cargoExamine=false; renderAll(); return; }
      if(G.mode==='inventory' && G._crewExamine){ G._crewExamine=false; renderAll(); return; }
      if(G.mode==='inventory' && G._inventoryExamine){ G._inventoryExamine=false; renderAll(); return; }
      if(G.mode==='inventory'){ G.mode=G._prevMode; G._equipGunIdx=undefined; G._equipArmorIdx=undefined; G._equipImplantIdx=undefined; G._equipStimIdx=undefined; G._jettisonConfirm=false; G._inventoryExamine=false; G._cargoExamine=false; G._crewExamine=false; renderAll(); return; }
      if(G.mode==='galaxy' || G.mode==='planet'){ returnToMainMenuFromGame(); return; }
      return;
    }

    // Inventory/crew overlay navigation
    if(G.mode==='inventory'){
      if((e.key==='x'||e.key==='X') && G._viewTab==='inventory'){
        if(G.inventory.length){
          G._inventoryExamine = !G._inventoryExamine;
          
          renderAll(); return;
        }
        addLog('Inventory is empty.','li');
        renderAll(); return;
      }
      // ── D — drop item on planet floor ──────────────────────────
      if((e.key==='d'||e.key==='D') && G._viewTab==='inventory' && G._prevMode==='planet'){
        if(!G.inventory.length){ addLog('Inventory is empty.','li'); renderAll(); return; }
        const idx = Math.max(0, Math.min(G._viewInvSel||0, G.inventory.length-1));
        const item = G.inventory[idx];
        if(!item){ renderAll(); return; }
        G.inventory.splice(idx, 1);
        G._viewInvSel = Math.max(0, Math.min(idx, G.inventory.length-1));
        dropPlanetLoot(G.player.x, G.player.y, [item]);
        renderAll(); return;
      }
      if((e.key==='x'||e.key==='X') && G._viewTab==='ship'){
        if((G.cargo?.length||0) > 0){
          G._cargoExamine = !G._cargoExamine;
          renderAll(); return;
        }
        addLog('Cargo hold is empty.','li');
        renderAll(); return;
      }
      if((e.key==='x'||e.key==='X') && G._viewTab==='crew' && G._equipGunIdx===undefined && G._equipArmorIdx===undefined){
        if(selectedCrewMember()){
          startCrewDialogue('root');
          return;
        }
        addLog('No living crew selected.','li');
        renderAll(); return;
      }
      if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
        const tabOrder = ['inventory','crew','ship','log'];
        const cur = tabOrder.indexOf(G._viewTab||'inventory');
        const dir = e.key==='ArrowRight' ? 1 : -1;
        G._viewTab = tabOrder[(cur+dir+tabOrder.length)%tabOrder.length];
        G._viewCrewSel = 0;
        G._inventoryExamine = false;
        G._cargoExamine = false;
        G._crewExamine = false;
        G._logScroll = Infinity;
        G._jettisonConfirm = false;
        
        renderAll(); return;
      }
      // ── Ship tab — cargo navigation (Up/Down) and jettison ─────────
      if(G._viewTab==='ship' && G.mode !== 'base' && G.mode !== 'planet'){
        if((e.key==='ArrowUp'||e.key==='ArrowDown') && (G.cargo?.length||0) > 0){
          const dir = e.key==='ArrowDown' ? 1 : -1;
          G._cargoSel = ((G._cargoSel||0) + dir + G.cargo.length) % G.cargo.length;
          G._jettisonConfirm = false;
          // Leave _cargoExamine open so details update live
          renderAll(); return;
        }
        if(e.key==='j'||e.key==='J'){
          const cargo = G.cargo||[];
          if(!cargo.length){ addLog('Cargo hold is empty.','li'); renderAll(); return; }
          const sel = Math.max(0, Math.min(G._cargoSel||0, cargo.length-1));
          const item = cargo[sel];
          if(!item){ renderAll(); return; }
          if(!G._jettisonConfirm){
            G._jettisonConfirm = true;
            addLog('Jettison '+item.name+'? Press J again to confirm, ESC to cancel.','lw');
            renderAll(); return;
          }
          G.cargo.splice(sel, 1);
          G._cargoSel = Math.max(0, Math.min(G._cargoSel||0, G.cargo.length-1));
          G._jettisonConfirm = false;
          addLog(item.name+' jettisoned into space.','lw');
          renderAll(); return;
        }
        if(G._jettisonConfirm && e.key==='Escape'){
          G._jettisonConfirm = false;
          addLog('Jettison cancelled.','li');
          renderAll(); return;
        }
      }
      if(G._viewTab==='log'){
        const FILTER_IDS = ['all','mission','combat','crew','critical'];
        if(e.key==='ArrowUp')  { G._logScroll = Math.max(0,(G._logScroll||0)-(e.shiftKey?10:1)); renderAll(); return; }
        if(e.key==='ArrowDown'){ G._logScroll = (G._logScroll||0)+(e.shiftKey?10:1); renderAll(); return; }
        if(e.key>='1'&&e.key<='5'){ G._logFilter=FILTER_IDS[parseInt(e.key)-1]; G._logScroll=Infinity; renderAll(); return; }
        renderAll(); return;
      }
      if(G._viewTab==='crew'){
        const living = G.crew.filter(c=>c.hp>0);
        if(e.key==='ArrowUp')  { G._viewCrewSel=Math.max(0,G._viewCrewSel-1); renderAll(); return; }
        if(e.key==='ArrowDown'){ G._viewCrewSel=Math.min(living.length-1,G._viewCrewSel+1); renderAll(); return; }
        if(e.key==='Enter' && G._equipGunIdx !== undefined){
          const target = living[G._viewCrewSel||0];
          const gun = G.inventory[G._equipGunIdx];
          if(target && gun){
            // Unequip any existing gun from this crew member first
            const oldGun = target.weapon;
            if(oldGun && oldGun !== 'Bare hands'){
              const oldIsSniper = target.weaponUsable === 'gun_sniper';
              const oldIsKnife  = target.weaponUsable === 'knife';
              const oldUsable   = target.weaponUsable || 'gun';
              const oldDesc     = oldIsSniper ? '+5 ATK when equipped.' : oldIsKnife ? '+1 ATK when equipped.' : '+2 ATK when equipped.';
              const oldCol      = oldIsSniper ? '#ffaa44' : oldIsKnife ? '#ccccaa' : '#aaaaff';
              G.inventory.push({name:oldGun, col:oldCol, desc:oldDesc, value:0, usable:oldUsable});
              addLog(crewDisplayName(target)+' unequips '+oldGun+'.','li');
            }
            const atkBonus = gun.usable === 'gun_sniper' ? 5 : gun.usable === 'gun_breacher' ? 4 : gun.usable === 'vibroblade' ? 4 : gun.usable === 'knife' ? 1 : gun.usable === 'stun_baton' ? 2 : gun.usable === 'tranq_darts' ? 0 : (gun.usable === 'gun_shotgun' || gun.usable === 'gun_burst' || gun.usable === 'gun_plasma') ? 3 : 2;
            target.weapon = gun.name;
            target.weaponUsable = gun.usable;
            G.inventory.splice(G._equipGunIdx, 1);
            G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0,G.inventory.length-1));
            G._equipGunIdx = undefined;
            addLog(crewDisplayName(target)+' equipped '+gun.name+'. ATK +'+atkBonus+'.','lg');
          }
          renderAll(); return;
        }
        if(e.key==='Enter' && G._equipArmorIdx !== undefined){
          const target = living[G._viewCrewSel||0];
          const armor = G.inventory[G._equipArmorIdx];
          if(target && armor){
            // Return old armor to inventory if not naked
            if(target.armorUsable){
              const oldDef = armorDefBonus(target);
              const oldCol = target.armorUsable === 'armor_exosuit' ? '#ff8833' : target.armorUsable === 'armor_reinforced' ? '#ffcc44' : target.armorUsable === 'armor_plate' ? '#aaaacc' : '#88ddff';
              G.inventory.push({name:target.armor, col:oldCol, desc:'+'+oldDef+' DEF when equipped.', value:0, usable:target.armorUsable});
              addLog(crewDisplayName(target)+' removes '+target.armor+'.','li');
            }
            const defBonus = armor.usable === 'armor_exosuit' ? 3 : armor.usable === 'armor_reinforced' ? 2 : 1;
            target.armor = armor.name;
            target.armorUsable = armor.usable;
            G.inventory.splice(G._equipArmorIdx, 1);
            G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0,G.inventory.length-1));
            G._equipArmorIdx = undefined;
            addLog(crewDisplayName(target)+' equipped '+armor.name+'. DEF +'+defBonus+'.','lg');
          }
          renderAll(); return;
        }
        if(e.key==='Escape' && G._equipGunIdx !== undefined){
          G._equipGunIdx = undefined;
          G._viewTab = 'inventory';
          addLog('Equip cancelled.','li');
          renderAll(); return;
        }
        if(e.key==='Escape' && G._equipArmorIdx !== undefined){
          G._equipArmorIdx = undefined;
          G._viewTab = 'inventory';
          addLog('Equip cancelled.','li');
          renderAll(); return;
        }
        // Implant install — Enter confirms on selected crew member
        if(e.key==='Enter' && G._equipImplantIdx !== undefined){
          const target = living[G._viewCrewSel||0];
          const implantItem = G.inventory[G._equipImplantIdx];
          if(target && implantItem){
            if(!target.implants) target.implants = [];
            const MAX_IMPLANTS = 2;
            if(target.implants.length >= MAX_IMPLANTS){
              addLog(crewDisplayName(target)+' already has '+MAX_IMPLANTS+' implants (maximum). Remove one first.','lw');
            } else {
              const impId = implantItem.implantId || implantItem.usable.slice('implant_'.length);
              if(target.implants.includes(impId)){
                addLog(crewDisplayName(target)+' already has this implant installed.','lw');
              } else {
                const imp = IMPLANT_CATALOG.find(i=>i.id===impId);
                target.implants.push(impId);
                // Apply permanent stat effects
                if(imp?.effect?.maxHp) target.maxHp = (target.maxHp||10) + imp.effect.maxHp;
                G.inventory.splice(G._equipImplantIdx, 1);
                G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0, G.inventory.length-1));
                G._equipImplantIdx = undefined;
                addLog(crewDisplayName(target)+': '+imp.name+' installed. ['+(target.implants.length)+'/'+MAX_IMPLANTS+']','lg');
              }
            }
          }
          renderAll(); return;
        }
        if(e.key==='Escape' && G._equipImplantIdx !== undefined){
          G._equipImplantIdx = undefined;
          G._viewTab = 'inventory';
          addLog('Implant install cancelled.','li');
          renderAll(); return;
        }
        // ── Combat Stim — apply to selected crew member ────────
        if(e.key==='Enter' && G._equipStimIdx !== undefined){
          const target = living[G._viewCrewSel||0];
          const stimItem = G.inventory[G._equipStimIdx];
          if(target && stimItem){
            if((target._stimAtk||0) > 0 && G.turn <= (target._stimUntil||0)){
              addLog(crewDisplayName(target)+' is already stimmed — wait for it to wear off.','lw');
            } else {
              target._stimUntil = G.turn + 8;
              target._stimAtk = 3;
              G.inventory.splice(G._equipStimIdx, 1);
              G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0, G.inventory.length-1));
              G._equipStimIdx = undefined;
              addLog('Combat Stim administered to '+crewDisplayName(target)+'. +3 ATK for 8 turns.','lg');
            }
          }
          renderAll(); return;
        }
        if(e.key==='Escape' && G._equipStimIdx !== undefined){
          G._equipStimIdx = undefined;
          G._viewTab = 'inventory';
          addLog('Stim administration cancelled.','li');
          renderAll(); return;
        }
        // W — unequip weapon (changed from U to avoid conflict with fuel scoop), S — strip armor
        if((e.key==='w'||e.key==='W') && G._equipGunIdx===undefined && G._equipArmorIdx===undefined && G._equipStimIdx===undefined){
          const sc = living[G._viewCrewSel||0];
          if(sc && sc.weapon && sc.weapon !== 'Bare hands'){
            const oldIsSniper = sc.weaponUsable === 'gun_sniper';
            const oldIsKnife  = sc.weaponUsable === 'knife';
            const oldUsable   = sc.weaponUsable || 'gun';
            const oldDesc     = oldIsSniper ? '+5 ATK when equipped.' : oldIsKnife ? '+1 ATK when equipped.' : '+2 ATK when equipped.';
            const oldCol      = oldIsSniper ? '#ffaa44' : oldIsKnife ? '#ccccaa' : '#aaaaff';
            G.inventory.push({name:sc.weapon, col:oldCol, desc:oldDesc, value:0, usable:oldUsable});
            addLog(crewDisplayName(sc)+' unequips '+sc.weapon+'.','li');
            sc.weapon = 'Bare hands';
            sc.weaponUsable = null;
          } else addLog('No weapon to unequip.','li');
          renderAll(); return;
        }
        if((e.key==='s'||e.key==='S') && G._equipGunIdx===undefined && G._equipArmorIdx===undefined && G._equipStimIdx===undefined){
          const sc = living[G._viewCrewSel||0];
          if(sc && sc.armorUsable){
            const oldDef = armorDefBonus(sc);
            const oldCol = sc.armorUsable === 'armor_exosuit' ? '#ff8833' : sc.armorUsable === 'armor_reinforced' ? '#ffcc44' : sc.armorUsable === 'armor_plate' ? '#aaaacc' : '#88ddff';
            G.inventory.push({name:sc.armor, col:oldCol, desc:'+'+oldDef+' DEF when equipped.', value:0, usable:sc.armorUsable});
            addLog(crewDisplayName(sc)+' strips off '+sc.armor+'.','lw');
            sc.armor = 'Naked';
            sc.armorUsable = null;
          } else addLog('Already unarmored.','li');
          renderAll(); return;
        }
      }
      if(G._viewTab==='inventory'){
        if(e.key==='ArrowUp'||e.key==='ArrowDown'){
          // Navigate by the sorted display order, not raw G.inventory order
          // Re-derive the same category sort used in rendering
          const getCategory2 = (item) => {
            const u = item.usable || '';
            if(u.startsWith('gun')||u==='knife'||u==='stun_baton'||u==='vibroblade'||u==='tranq_darts') return 'Weapons';
            if(u.startsWith('armor_')) return 'Armour';
            if(u.startsWith('implant_')) return 'Implants';
            if(u==='medikit'||u==='trauma_kit'||u==='stim_pack'||u==='antibiotics'||u==='iodine_pills'||u==='rad_flush'||u==='mild_antidepressants'||u==='field_rations'||u==='morale_drug') return 'Medical';
            if(u==='oxytank'||u==='repair_kit') return 'Supplies';
            if(u==='mining_tool'||u==='ore_scanner'||u==='floodlight'||u==='jetpack'||u==='grapple'||u==='sensor_drone'||u==='capture_net'||u==='contain_crate') return 'Equipment';
            if(item.value > 0 && !u) return 'Valuables';
            return 'Misc';
          };
          const catOrder2 = ['Weapons','Armour','Implants','Medical','Supplies','Equipment','Valuables','Misc'];
          const stacks2 = [];
          const seen2 = {};
          G.inventory.forEach((item,idx)=>{ if(!seen2[item.name]){ seen2[item.name]=true; stacks2.push({name:item.name,idx}); } });
          const catsPresent2 = new Set(G.inventory.map(getCategory2));
          if(catsPresent2.size >= 2){
            stacks2.sort((a,b)=>{
              const ca = catOrder2.indexOf(getCategory2(G.inventory[a.idx]));
              const cb = catOrder2.indexOf(getCategory2(G.inventory[b.idx]));
              return ca !== cb ? ca - cb : a.name.localeCompare(b.name);
            });
          }
          const curName = G.inventory[G._viewInvSel||0]?.name;
          const stackPos = stacks2.findIndex(s=>s.name===curName);
          if(e.key==='ArrowUp'){
            G._viewInvSel = stacks2[Math.max(0, stackPos-1)]?.idx ?? 0;
          } else {
            G._viewInvSel = stacks2[Math.min(stacks2.length-1, stackPos+1)]?.idx ?? 0;
          }
          renderAll(); return;
        }
        if(G._inventoryExamine){
          renderAll(); return;
        }
        if(e.key==='Enter'){
          const item = G.inventory[G._viewInvSel||0];
          if(item?.usable==='c4'){
            if(item._armed){
              addLog('C4 is already armed — '+item._c4Timer+' turns remaining. Drop it!','lw');
            } else if(G.mode !== 'planet' && G._prevMode !== 'planet'){
              addLog('C4 can only be armed on a planet surface.','lw');
            } else {
              item._armed = true;
              item._c4Timer = 5;
              addLog('C4 armed. 5 turns until detonation — DROP IT before it blows!','lc');
            }
            renderAll(); return;
          }
          if(item?.usable==='medikit'){
            const injured = G.crew.filter(c=>c.hp>0&&c.hp<c.maxHp).sort((a,b)=>a.hp-b.hp);
            if(!injured.length){ addLog('All crew are at full health.','li'); }
            else {
              const target = injured[0];
              target.hp = Math.min(target.maxHp, target.hp+10);
              G.inventory.splice(G._viewInvSel||0, 1);
              G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0,G.inventory.length-1));
              addLog('Medikit used on '+target.name+'. +10 HP.','lg');
              // Best medic gains XP from the treatment
              const _medUser = G.crew.filter(c=>c.hp>0).sort((a,b)=>(b.skills?.med||0)-(a.skills?.med||0))[0];
              if(_medUser) giveSkillXP(_medUser, 'med', 2);
            }
            renderAll(); return;
          }
          if(item?.usable==='trauma_kit'){
            const candidates = G.crew.filter(c=>c.hp>0 && (c.hp<c.maxHp || hasCrewInjury(c)))
              .sort((a,b)=>{
                const bi = hasCrewInjury(b) ? 1 : 0;
                const ai = hasCrewInjury(a) ? 1 : 0;
                if(bi !== ai) return bi - ai;
                return a.hp - b.hp;
              });
            if(!candidates.length){ addLog('No crew member needs trauma care.','li'); renderAll(); return; }
            const target = candidates[0];
            const hadInjury = removeCrewInjuries(target, true) > 0;
            target.hp = Math.min(target.maxHp, target.hp + 20);
            G.inventory.splice(G._viewInvSel||0, 1);
            G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0,G.inventory.length-1));
            addLog('Advanced Trauma Kit used on '+target.name+'. '+(hadInjury ? 'Injury treated. ' : '')+'+20 HP.','lg');
            const _medUser = G.crew.filter(c=>c.hp>0).sort((a,b)=>(b.skills?.med||0)-(a.skills?.med||0))[0];
            if(_medUser) giveSkillXP(_medUser, 'med', 4);
            renderAll(); return;
          }
          if(item?.usable==='mild_antidepressants'){
            const livingCrew = G.crew.filter(c=>c.hp>0);
            if(!livingCrew.length){ addLog('No living crew can use that.','lw'); renderAll(); return; }
            boostCrewFromMildAntidepressants();
            G.inventory.splice(G._viewInvSel||0, 1);
            G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0,G.inventory.length-1));
            addLog('Mild Anti-depressants used. Crew morale steadies.','lg');
            renderAll(); return;
          }
          if(item?.usable==='iodine_pills'){
            const treated = reduceCrewRadiation(2);
            if(!treated){ addLog('No crew member has radiation sickness.','li'); renderAll(); return; }
            G.inventory.splice(G._viewInvSel||0, 1);
            G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0,G.inventory.length-1));
            addLog('Iodine Pills used. Radiation sickness reduced for '+treated+' crew.','lg');
            renderAll(); return;
          }
          if(item?.usable==='antibiotics'){
            let treated = 0;
            G.crew.forEach(c=>{
              if(c.hp>0 && removeCrewDiseases(c, true)>0) treated++;
            });
            if(!treated){ addLog('No crew member needs antibiotics.','li'); renderAll(); return; }
            G.inventory.splice(G._viewInvSel||0, 1);
            G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0,G.inventory.length-1));
            addLog('Antibiotics used. Disease treated for '+treated+' crew.','lg');
            const _medUser = G.crew.filter(c=>c.hp>0).sort((a,b)=>(b.skills?.med||0)-(a.skills?.med||0))[0];
            if(_medUser) giveSkillXP(_medUser, 'med', 4);
            renderAll(); return;
          }
          if(item?.usable==='oxytank'){
            const onPlanet = G.mode==='planet' || G._prevMode==='planet';
            if(!onPlanet){ addLog('Oxygen Tank can only be used on a planet surface.','lw'); renderAll(); return; }
            if(G.oxygen>=100){ addLog('Oxygen already full.','li'); renderAll(); return; }
            G.oxygen = 100;
            G.inventory.splice(G._viewInvSel||0, 1);
            G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0,G.inventory.length-1));
            addLog('Oxygen Tank used. O₂ refilled to 100%.','lg');
            renderAll(); return;
          }
          if(item?.usable==='morale_drug'){
            const livingCrew = G.crew.filter(c=>c.hp>0);
            if(!livingCrew.length){ addLog('No living crew can use that.','lw'); renderAll(); return; }
            boostCrewFromDrugs();
            G.inventory.splice(G._viewInvSel||0, 1);
            G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0,G.inventory.length-1));
            addLog(item.name+' used. Crew morale surges into dangerous good humor.','lg');
            renderAll(); return;
          }
          if(item?.usable==='gun' || item?.usable==='gun_sniper' || item?.usable==='knife' || item?.usable==='gun_shotgun' || item?.usable==='gun_burst' || item?.usable==='gun_plasma' || item?.usable==='stun_baton' || item?.usable==='vibroblade' || item?.usable==='tranq_darts'){
            G._viewTab = 'crew';
            G._viewCrewSel = 0;
            G._equipGunIdx = G._viewInvSel||0;
            addLog('Select a crew member to equip the '+item.name+'.','li');
            renderAll(); return;
          }
          if(item?.usable==='armor_flight' || item?.usable==='armor_reinforced' || item?.usable==='armor_diving' || item?.usable==='armor_exosuit' || item?.usable==='armor_plate'){
            G._viewTab = 'crew';
            G._viewCrewSel = 0;
            G._equipArmorIdx = G._viewInvSel||0;
            addLog('Select a crew member to equip the '+item.name+'.','li');
            renderAll(); return;
          }
          if(item?.usable?.startsWith('implant_')){
            G._viewTab = 'crew';
            G._viewCrewSel = 0;
            G._equipImplantIdx = G._viewInvSel||0;
            addLog('Select a crew member to install '+item.name+' (max 2 implants per crew).','li');
            renderAll(); return;
          }
          // ── Combat Stim — crew selection ───────────────────────
          if(item?.usable==='stim_pack'){
            const living2 = G.crew.filter(c=>c.hp>0);
            if(!living2.length){ addLog('No living crew to administer stim to.','lw'); renderAll(); return; }
            G._viewTab = 'crew';
            G._viewCrewSel = 0;
            G._equipStimIdx = G._viewInvSel||0;
            addLog('Select a crew member to administer the Combat Stim.','li');
            renderAll(); return;
          }
          // ── Grappling Hook ─────────────────────────────────────
          if(item?.usable==='grapple'){
            const onPlanet = G.mode==='planet' || G._prevMode==='planet';
            if(!onPlanet){ addLog('Grappling Hook can only be used on a planet surface.','lw'); renderAll(); return; }
            G._itemAimMode = { usable:'grapple', invIdx: G._viewInvSel||0 };
            G.mode = 'planet';
            addLog('GRAPPLE AIM \u2014 arrow keys to pick direction, [Esc] to cancel.','li');
            renderAll(); return;
          }
          // ── Jetpack ────────────────────────────────────────────
          if(item?.usable==='jetpack'){
            const onPlanetJ = G.mode==='planet' || G._prevMode==='planet';
            if(!onPlanetJ){ addLog('Jetpack can only be used on a planet surface.','lw'); renderAll(); return; }
            if((item.fuel||0) <= 0){ addLog('Jetpack is out of fuel \u2014 find a refuel station or buy a new one.','lw'); renderAll(); return; }
            G._itemAimMode = { usable:'jetpack', invIdx: G._viewInvSel||0 };
            G.mode = 'planet';
            addLog('JETPACK AIM \u2014 arrow keys to pick direction, [Esc] to cancel.','li');
            renderAll(); return;
          }

          // ── Capture Net ────────────────────────────────────────
          if(item?.usable==='capture_net'){
            const onPlanetC = G.mode==='planet' || G._prevMode==='planet'; if(!onPlanetC){ addLog('Capture Net can only be used on a planet surface.','lw'); renderAll(); return; }
            const pdata4 = G.planets[G.curPlanet];
            const nearEnemies2 = (G.enemies[G.curPlanet]||[]).filter(e=>e.alive && !e.hidden && Math.max(Math.abs(e.x-G.player.x),Math.abs(e.y-G.player.y)) <= 1);
            if(!nearEnemies2.length){ addLog('No creature adjacent (net requires melee range).','lw'); renderAll(); return; }
            const target3 = nearEnemies2.sort((a,b)=>(Math.abs(a.x-G.player.x)+Math.abs(a.y-G.player.y))-(Math.abs(b.x-G.player.x)+Math.abs(b.y-G.player.y)))[0];
            target3.stunTurns = (target3.stunTurns||0) + 5;
            target3.netted = true;
            addLog(target3.name+' tangled in capture net — stunned for 5 turns and ready for containment.','lg');
            G.inventory.splice(G._viewInvSel||0, 1);
            G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0, G.inventory.length-1));
            G.mode = G._prevMode;
            G.turn++; pdata4.planetTurn = (pdata4.planetTurn||0)+1; moveEnemies();
            renderAll(); return;
          }
          // ── Containment Crate ──────────────────────────────────
          if(item?.usable==='contain_crate'){
            const onPlanetCR = G.mode==='planet' || G._prevMode==='planet'; if(!onPlanetCR){ addLog('Containment Crate can only be used on a planet surface.','lw'); renderAll(); return; }
            const anyNetted = (G.enemies[G.curPlanet]||[]).find(e=>e.alive && e.netted);
            const nettedEnemy = (G.enemies[G.curPlanet]||[]).find(e=>e.alive && e.netted && Math.max(Math.abs(e.x-G.player.x),Math.abs(e.y-G.player.y)) <= 1);
            if(!anyNetted){ addLog('No netted creature on this planet. Use Capture Net on a creature first.','lw'); renderAll(); return; }
            if(!nettedEnemy){ addLog('Netted creature is too far — move adjacent to it first.','lw'); renderAll(); return; }
            const bounty = 150 + Math.floor(Math.random()*200);
            nettedEnemy.alive = false;
            G.mode = G._prevMode;
            G.inventory.push({ name:'Contained: '+nettedEnemy.name, isCapturedCreature:true, creatureName:nettedEnemy.name, bounty, boughtPrice:0, col:'#44ffcc', desc:'Live specimen secured. Deliver to Margo Security for '+bounty+' cr bounty.', value:bounty });
            G.inventory.splice(G._viewInvSel||0, 1);
            G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0, G.inventory.length-1));
            addLog(nettedEnemy.name+' secured in containment crate. Deliver to Margo Security for '+bounty+' cr bounty.','lg');
            renderAll(); return;
          }
          // ── Field Rations ──────────────────────────────────────
          if(item?.usable==='field_rations'){
            const injured2 = G.crew.filter(c=>c.hp>0&&c.hp<c.maxHp).sort((a,b)=>a.hp-b.hp);
            if(!injured2.length){ addLog('All crew are at full health.','li'); renderAll(); return; }
            injured2[0].hp = Math.min(injured2[0].maxHp, injured2[0].hp+5);
            G.inventory.splice(G._viewInvSel||0, 1);
            G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0, G.inventory.length-1));
            addLog('Field Rations used on '+injured2[0].name+'. +5 HP.','lg');
            renderAll(); return;
          }
          // ── Rad-Flush Tablet ───────────────────────────────────
          if(item?.usable==='rad_flush'){
            const treated2 = (typeof reduceCrewRadiation === 'function') ? reduceCrewRadiation(99) : 0;
            if(!treated2){ addLog('No crew member has radiation sickness.','li'); renderAll(); return; }
            G.inventory.splice(G._viewInvSel||0, 1);
            G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0, G.inventory.length-1));
            addLog('Rad-Flush Tablet used. Radiation cleared for '+treated2+' crew.','lg');
            renderAll(); return;
          }
          // ── Sensor Drone ───────────────────────────────────────
          // Galaxy-only: use Rovers for planetside scouting instead.
          if(item?.usable==='sensor_drone'){
            const inGalaxy = G.mode==='galaxy' || G._prevMode==='galaxy';
            if(!inGalaxy){
              addLog('Sensor Drone can only be launched from galaxy view. Use a Rover for planetside scouting.','lw'); renderAll(); return;
            }
            const facing = G.ship?.facing || { dx:0, dy:-1 };
            const fdx = facing.dx||0, fdy = facing.dy||0;
            if(fdx===0 && fdy===0){ addLog('Move the ship first to set a launch direction.','lw'); renderAll(); return; }
            if(!G._activeDrones) G._activeDrones = [];
            G._activeDrones.push({ x: G.ship.x, y: G.ship.y, dx: fdx, dy: fdy, turnsLeft: 4 + Math.floor(Math.random() * 4) });
            G.inventory.splice(G._viewInvSel||0, 1);
            G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0, G.inventory.length-1));
            addLog('Sensor Drone launched — flying ahead, revealing galaxy fog.','lg');
            G.mode = 'galaxy';
            renderAll(); return;
          }
          // ── Repair Kit ─────────────────────────────────────────
          if(item?.usable==='repair_kit'){
            if(G.ship.hp >= G.ship.maxHp){ addLog('Ship hull is already at full integrity.','li'); renderAll(); return; }
            G.ship.hp = Math.min(G.ship.maxHp, G.ship.hp + 15);
            G.inventory.splice(G._viewInvSel||0, 1);
            G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0, G.inventory.length-1));
            addLog('Repair Kit applied. Ship hull +15 HP.','lg');
            renderAll(); return;
          }
          // floodlight is passive — no activation needed
        }
      }
      return;
    }

    // Void step confirm — blocks ALL keys while waiting for Y/N
    if(G.mode==='planet' && G._voidPrompt){
      e.preventDefault();
      if(e.key==='y'||e.key==='Y'){
        const { dx, dy } = G._voidPrompt;
        G._voidPrompt = null;
        tryMove(dx, dy, true);  // confirmed=true bypasses re-prompt
      } else {
        G._voidPrompt = null;
        addLog('No.','lm');
        renderAll();
      }
      return;
    }

    // Rescue accept/decline — MUST be before movement dispatch so remapped keys can't swallow Y/N
    if(G.mode==='galaxy' && G.stranded?.rescuePhase==='offer'){
      if(e.key==='y'||e.key==='Y'||e.key==='Enter'){ doAcceptRescue(); return; }
      if(e.key==='n'||e.key==='N'||e.key==='Escape'){ doDeclineRescue(); return; }
    }

    // Movement — arrows always work; numpad always works; letter keys use remappable keybinds
    // All keybind checks use e.code (physical position, layout-independent)
    const kb = (OPTIONS.keybinds || DEFAULT_KEYBINDS);
    const numpad={
      Numpad7:[-1,-1], Numpad8:[0,-1], Numpad9:[1,-1],
      Numpad4:[-1, 0],                 Numpad6:[1, 0],
      Numpad1:[-1, 1], Numpad2:[0, 1], Numpad3:[1, 1],
      Numpad5:null, // wait
    };
    // Arrow keys — always cardinal, never remappable (UI navigation depends on them)
    if(e.key==='ArrowUp')   { e.preventDefault(); tryMove( 0,-1); return; }
    if(e.key==='ArrowDown') { e.preventDefault(); tryMove( 0, 1); return; }
    if(e.key==='ArrowLeft') { e.preventDefault(); tryMove(-1, 0); return; }
    if(e.key==='ArrowRight'){ e.preventDefault(); tryMove( 1, 0); return; }
    // Numpad — always 8-dir
    if(e.code in numpad){
      e.preventDefault();
      const d=numpad[e.code];
      if(d===null){ if(G.mode==='planet') doWaitPlanet(); else doWaitGalaxy(); }
      else tryMove(...d);
      return;
    }
    // Remappable keybinds (e.code = physical key, layout-independent)
    const kbDirs = {
      [kb.nw]:[-1,-1], [kb.n]:[0,-1], [kb.ne]:[1,-1],
      [kb.w]: [-1, 0],                 [kb.e]: [1, 0],
      [kb.sw]:[-1, 1], [kb.s]:[0, 1], [kb.se]:[1, 1],
    };
    const kbWait = kb.wait;
    if(e.code === kbWait){
      e.preventDefault();
      if(G.mode==='planet') doWaitPlanet(); else doWaitGalaxy();
      return;
    }
    // All 8 directions including NE — Enter handles interact/dock/land
    if(e.code in kbDirs){ e.preventDefault(); tryMove(...kbDirs[e.code]); return; }

    if(e.key==='h'||e.key==='H'){
      if(G.mode==='galaxy'){ doRadioHail(); return; }
    }
    // Enter on a revealed mineral deposit = drill press (extraction mini-loop)
    if(e.key==='Enter' && G.mode==='planet'){
      const _pdata = G.planets[G.curPlanet];
      const _cell  = _pdata?.grid?.[G.player.y]?.[G.player.x];
      if(_cell?.type === 'MINERAL' && _cell.revealed){
        const _biomeKey = _pdata.biome || 'HABITABLE';
        const _oreKey  = _cell.oreType || 'fe';
        const _oreDef  = ORE_TYPES[_oreKey] || ORE_TYPES.fe;
        const _comId   = _oreDef.id;
        const _com     = COMMODITIES[_comId];
        const _ss      = G.shipStats;
        const _tool    = (G.inventory||[]).find(i => i.usable === 'mining_tool');
        if(!_tool){
          addLog(_com.name+' deposit identified — you need a mining tool and cargo space to extract it.','lw');
          renderAll(); return;
        }
        if(_ss && _ss.cargoCapacity <= 0){
          addLog(_com.name+' — this ship has no cargo hold.','lw');
          renderAll(); return;
        }
        if(_ss && G.cargo.length >= _ss.cargoCapacity){
          addLog('Cargo hold full — leave something behind to collect '+_com.shortName+' ore.','lw');
          renderAll(); return;
        }
        if(_oreKey === 'ur'){
          applyRadiationExposureToCrew(1, 'uranium_extraction', 0.6);
        }
        const _bestEng = Math.max(...(G.crew||[]).filter(c=>c.hp>0).map(c=>c.skills?.eng||0), 0);
        const _mult    = _tool.miningMult || 1.0;
        const _totalNeeded = Math.max(2, Math.round((10 / _mult) - _bestEng * 0.5));
        if(!G._miningProgress || G._miningProgress.x !== G.player.x || G._miningProgress.y !== G.player.y){
          G._miningProgress = { x:G.player.x, y:G.player.y, progress:0, total:_totalNeeded, oreKey:_oreKey, comId:_comId };
        }
        G._miningProgress.progress++;
        G.turn++; _pdata.planetTurn = (_pdata.planetTurn||0)+1;
        moveEnemies();
        if(G._miningProgress.progress >= G._miningProgress.total){
          addCargo(makeCommodityItem(_comId, G.curPlanet, _com.basePrice));
          addLog('Extracted '+_com.name+'. (~'+_com.basePrice+' cr at stations)','lg');
          _cell.type = (BIOMES[_biomeKey]?.floor)||'EARTH_FLOOR';
          G._miningProgress = null;
        } else {
          const _left = G._miningProgress.total - G._miningProgress.progress;
          addLog('Drilling… '+G._miningProgress.progress+'/'+G._miningProgress.total+' ('+_left+' more press'+((_left===1)?'':'es')+')','li');
        }
        renderAll(); return;
      }
    }
    // Enter = interact/dock/land — but not when rescue offer is pending
    if(e.key==='Enter' && !(G.stranded?.rescuePhase==='offer')){ doInteract(); return; }
    if((e.key==='z'||e.key==='Z')&&G.mode==='planet'){ doToggleDive(); return; }
    if(e.key==='o'||e.key==='O'){ doRefillOxygen(); return; }
    if(e.key==='l'||e.key==='L'){ doLiftOff(); return; }
    if(e.key==='.'&&G.mode==='planet'){ doWaitPlanet(); return; }
    if(e.code==='Period'){ e.preventDefault(); if(G.mode==='planet') doWaitPlanet(); else doWaitGalaxy(); return; }
    if(e.key==='x'||e.key==='X'){
      if(G.mode==='galaxy' && G.towedShip){
        addLog('Tractor beam released. '+G.towedShip.name+' drifts free.','lw');
        G.towedShip = null;
        renderAll(); return;
      }
    }
    if(e.key==='t'||e.key==='T'){
      if(G.mode==='galaxy'){
        // Tractor beam — tow a dead stranded ship on current tile
        const hasTractor = (G.installedModules||[]).includes('tractor_beam');
        if(hasTractor && !G.towedShip){
          const towTarget = (G.npcStranded||[]).find(s=>s.x===G.ship.x&&s.y===G.ship.y&&s.type==='dead');
          if(towTarget){
            G.towedShip = { name: towTarget.name, saleValue: 300+rnd(300) };
            // Remove from stranded list — it's now in tow
            G.npcStranded = G.npcStranded.filter(s=>s!==towTarget);
            if(G.galaxy[towTarget.y]?.[towTarget.x]?._npcStranded===towTarget)
              delete G.galaxy[towTarget.y][towTarget.x]._npcStranded;
            addLog('Tractor beam locked onto '+towTarget.name+'. Towing to nearest station.','lg');
            addLog('Dock at any Starbase to sell it. [X] to release.','li');
            renderAll(); return;
          }
        }
        // Fallback: SOS toggle
        if(G.stranded){
          G.stranded.sos = !G.stranded.sos;
          if(G.stranded.sos){
            addLog('SOS beacon activated. Transmitting distress signal...','lw');
            addLog('WARNING: Signal may attract hostile vessels.','lc');
          } else {
            addLog('SOS beacon deactivated. Running silent.','li');
          }
          renderAll(); return;
        }
      }
    }

    if(e.key==='r'||e.key==='R'){
      if(G.mode==='shipcombat'){ doShipRetreat(); return; }
      return;
    }
    if((e.key==='s'||e.key==='S') && G.mode==='shipcombat'){
      doShipSurrender(); return;
    }
    if(e.key==='f'||e.key==='F'){
      if(G.mode==='shipcombat'){ doShipFire(); return; }
      if(G.mode==='galaxy'){
        const p=G.pirates.find(p=>p.alive&&p.x===G.ship.x&&p.y===G.ship.y);
        if(p){ startShipCombat(p); return; }
        const ns=nearestNeutralTarget(1);
        if(ns){ doFireAtNeutral(ns); return; }
        // Fire on pirate base if standing on it and no live pirate here
        const base=G.pirateBases&&G.pirateBases.find(pb=>pb.x===G.ship.x&&pb.y===G.ship.y&&!pb.destroyed);
        if(base){ doFireAtBase(base); return; }
      }
      return;
    }
    // L key: no floodlight toggle — it is always-on passive
    if(e.key==='u'||e.key==='U'){
      if(G.mode==='galaxy'){ doFuelScoop('nebula'); return; }
      if(G.mode==='system'){ doFuelScoop('gasgiant'); return; }
      return;
    }
    // Z key: void prompt removed — void is instant death on step

  } catch(err) {
    console.error('Prospector input error:', err);
  }
});

// Intro screen dismiss — only accept a fresh keypress, not the release of the one that opened it
document.addEventListener('keyup', e=>{
  if(G===null && MENU_STATE.screen==='intro'){
    if(e.key==='Enter'||e.key===' '){
      if(MENU_STATE.introEntryKeyStillHeld){
        MENU_STATE.introEntryKeyStillHeld = false;
      } else {
        MENU_STATE.screen = 'ship_select';
        MENU_STATE.shipSel = 0;
        drawMenuScreen();
      }
    }
  }
  // Naming screen — capture typed characters
  if(G===null && MENU_STATE.screen==='naming'){
    if(e.key==='Backspace'){
      const f = MENU_STATE.namingField;
      if(f==='captain') MENU_STATE.captainName = (MENU_STATE.captainName||'').slice(0,-1);
      else              MENU_STATE.shipName    = (MENU_STATE.shipName||'').slice(0,-1);
      drawMenuScreen();
    } else if(e.key==='Enter'){
      const CAPTAIN_NAMES = ['Yara Voss','Deklan Mire','Sable Orin','Tev Hadra','Cass Weld',
        'Rook Solan','Lena Quist','Bren Falke','Ziva Thorn','Oskar Dune','Mira Stahl','Colt Vane'];
      const SHIP_NAMES = ['Pale Wanderer','Iron Meridian','Silent Drift','Vagrant Star',
        'Ashen Wake','The Long Haul','Ember Cross','Dustfall','Far Cry','Sable Wind',
        'Cold Horizon','The Forsaken','Rust & Glory','Unnamed Regret'];
      if(MENU_STATE.namingEntryKeyStillHeld){
        MENU_STATE.namingEntryKeyStillHeld = false;
        drawMenuScreen();
      } else if(MENU_STATE.namingField==='captain'){
        if(!(MENU_STATE.captainName||'').trim())
          MENU_STATE.captainName = CAPTAIN_NAMES[Math.floor(Math.random()*CAPTAIN_NAMES.length)];
        MENU_STATE.namingField = 'ship';
        drawMenuScreen();
      } else if(MENU_STATE.namingField==='ship'){
        if(!(MENU_STATE.shipName||'').trim())
          MENU_STATE.shipName = SHIP_NAMES[Math.floor(Math.random()*SHIP_NAMES.length)];
        initGame(MENU_STATE.chosenClass, MENU_STATE.captainName.trim(), MENU_STATE.shipName.trim());
      }
    } else if(e.key.length===1 && !e.ctrlKey && !e.metaKey){
      const f = MENU_STATE.namingField;
      if(f==='captain'){
        if((MENU_STATE.captainName||'').length < 20)
          MENU_STATE.captainName = (MENU_STATE.captainName||'') + e.key;
      } else {
        if((MENU_STATE.shipName||'').length < 20)
          MENU_STATE.shipName = (MENU_STATE.shipName||'') + e.key;
      }
      drawMenuScreen();
    }
  }
});

