// ─────────────────────────────────────────────────────────────────
//  KEYBOARD INPUT
//  All branches are wrapped in try-catch so a JS error in one
//  action can never silently break the event listener.
// ─────────────────────────────────────────────────────────────────
function activateGameKey(key,code=''){
  // Pointer actions use the shortcut itself, independent of remapped movement keys.
  const shiftKey=key.startsWith('Shift+');
  if(shiftKey) key=key.slice(6);
  document.dispatchEvent(new KeyboardEvent('keydown',{key,code,shiftKey,bubbles:true,cancelable:true}));
}

document.addEventListener('click',event=>{
  const button=event.target.closest('button[data-game-key]');
  if(!button) return;
  button.blur();
  activateGameKey(button.dataset.gameKey);
});

document.addEventListener('keydown', e=>{
  if(AUTOSAVE_STATE.transition){e.preventDefault();return;}
  if(shipSystemsDialog.open) return;
  if(debugDialog.open){
    if(e.shiftKey && e.key.toLowerCase()==='b'){
      e.preventDefault();
      if(!e.repeat) dismissDebugMenu();
    }
    return;
  }
  if(e.target===debugPlaygroundButton) return;
  // Block all game keys while feedback overlay is open
  if(document.getElementById('feedback-overlay').style.display==='flex') return;
  if(document.getElementById('minimap-overlay')?.classList.contains('visible')){
    if(e.key==='Escape' || e.key==='m' || e.key==='M'){
      e.preventDefault();
      closeGalaxyMinimapOverlay();
    } else if(e.key==='Enter'||e.key===' '){
      e.preventDefault();
      if(e.target.id==='game-escape' && !e.repeat) e.target.click();
    }
    return;
  }
  // Route to barter handler — it consumes all keys while open
  if(document.getElementById('barter-overlay').style.display==='flex'){
    handleBarterKey(e);
    return;
  }
  const menuControl = e.target.closest?.('button[data-menu-control]');
  if(menuControl && (!G?.dialogue || menuControl.closest('#save-notice') || menuControl.dataset.gameKey || menuControl.id==='shortcut-toggle') && (e.key==='Enter'||e.key===' ')){
    e.preventDefault();
    if(!e.repeat) menuControl.click();
    return;
  }

  // Menu mode — G is null, route to menu handler
  if(G===null){ handleMenuKey(e); return; }
  if(e.key==='F3' && !e.repeat){e.preventDefault();openShipSystems();return;}
  if(e.key==='B' && e.shiftKey && !e.repeat){
    e.preventDefault();
    openDebugMenu();
    return;
  }

  if(G.forcedMove?.active){
    e.preventDefault();
    renderAll();
    return;
  }

  try {

    // F5 — save to file from anywhere in-game
    if(e.key==='F5'){ e.preventDefault(); saveToFile(); return; }

    if(e.shiftKey && !G.showOptions && !G.dialogue && !G.examine && !G.rangeTarget && !G._itemAimMode && !G._voidPrompt){
      const key=e.key.toLowerCase();
      if(G.mode==='planet' && key==='o'){ doRefillOxygen(); return; }
      if(G.mode==='planet' && key==='z'){ doToggleDive(); return; }
      if(G.mode==='galaxy' && key==='x' && G.towedShip){
        addLog('Tractor beam released. '+G.towedShip.name+' drifts free.','lw');
        G.towedShip=null;
        renderAll(); return;
      }
    }

    if(!G.showOptions && (e.key==='-'||e.key==='='||e.key==='+') && !e.ctrlKey && !e.metaKey){
      const step = e.key==='-'?-1:1;
      adjustLogFont(step);
      return;
    }

    // M — open full galaxy minimap
    if(e.key==='m'||e.key==='M'){
      e.preventDefault();
      openGalaxyMinimapOverlay();
      return;
    }

    // O — toggle in-game options overlay
    if(e.key==='o'||e.key==='O'){
      if(!G.dead && !G.retired){
        toggleGameOptions(); return;
      }
    }

    // Ship combat owns its action keys before WASD movement can swallow them.
    if(G.mode==='shipcombat' && !G.showOptions && !G.dialogue){
      const key=e.key.toLowerCase();
      if(key==='f'){ doShipFire(); return; }
      if(key==='b'){ boostShipInCombat(); return; }
      if(key==='r'){ doShipRetreat(); return; }
      if(key==='h'){ if(!e.repeat) doShipSurrender(); return; }
      if(e.key==='Tab'){ e.preventDefault(); cycleShipCombatTarget(e.shiftKey?-1:1); return; }
      if(/^[1-5]$/.test(e.key) && !e.code.startsWith('Numpad')){ selectShipCombatWeapon(Number(e.key)-1); return; }
      if(e.key==='Escape'){
        G.shipCombat.surrenderWarned = false;
        addLog('Use the compass or movement keys. Fire [F], select target [Tab], or disengage at the map edge [R].','li');
        renderAll();
        return;
      }
    }
    if(G.mode==='radio' && !G.showOptions && !G.dialogue){
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
        const totalRows = MOVEMENT_BINDING_IDS.length + 1;
        if(MENU_STATE._rebinding){
          if(e.key==='Escape'){ e.preventDefault(); closeOptionsMenu(); return; }
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
        if(e.key==='Escape'){ e.preventDefault(); closeOptionsMenu(); return; }
        if(e.key==='ArrowUp'){ e.preventDefault(); MENU_STATE._kbSel=((MENU_STATE._kbSel||0)-1+totalRows)%totalRows; renderAll(); return; }
        if(e.key==='ArrowDown'){ e.preventDefault(); MENU_STATE._kbSel=((MENU_STATE._kbSel||0)+1)%totalRows; renderAll(); return; }
        if(e.key==='Enter'||e.key===' '){
          e.preventDefault();
          activateKeybindingRow(MENU_STATE._kbSel||0); return;
        }
        return;
      }
      handleOptionsKey(e);
      return;
    }

    // Branching dialogue overlay owns input while open.
    if(G.dialogue){
      const opts = dialogueVisibleOptions();
      if(e.key==='ArrowUp'||e.key==='ArrowDown'){
        moveDialogueSelection(e.key==='ArrowUp'?-1:1); return;
      }
      if(e.key==='Enter' || e.key===' '){
        // A focused HUD button must not also receive this reply as a click.
        e.preventDefault();
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

    // Game over / retirement
    if(G.dead || G.retired){
      if(e.key==='Enter'||e.key===' ') void returnToMainMenuFromGame();
      return;
    }

    // Casino menu
    if(G.mode==='casino'){
      handleCasinoKey(e.key);
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
          completeSurfaceAction(2);
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
          completeSurfaceAction(2);
        }
        renderAll(); return;
      }
      return; // eat all other keys while in aim mode
    }

    // ── F — enter fire mode (planet only, requires ranged weapon) ──
    if((e.key==='f'||e.key==='F') && G.mode==='planet' && !G.examine){
      if(G.rangeTarget){
        // F pressed while in fire mode = fire
        pointerFireAim=null;
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
      if(e.key==='Enter'||e.key===' '){ pointerFireAim=null; doRangedFire(); return; }
      if(e.key==='Tab' || e.key==='q' || e.key==='Q' || e.key==='e' || e.key==='E'){
        e.preventDefault();
        pointerFireAim=null;
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
        pointerFireAim=null;
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

    if(G.mode==='base'){ handleStationKey(e.key); return; }

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
        toggleInventoryMenu(); return;
      }
      return;
    }

    // I = inventory/crew overlay toggle
    if(e.key==='i'||e.key==='I'){
      toggleInventoryMenu(); return;
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
      if(G.mode==='inventory'){ closeInventoryMenu(); return; }
      if(G.mode==='planet' && G._voidPrompt){ G._voidPrompt=null; addLog('No.','lm'); renderAll(); return; }
      if(G.mode==='galaxy' && G.stranded?.rescuePhase==='offer'){ doDeclineRescue(); return; }
      if(G.mode==='galaxy' || G.mode==='planet'){ returnToMainMenuFromGame(); return; }
      return;
    }

    if(G.mode==='inventory'){ handleInventoryKey(e.key,e.shiftKey); return; }

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
      if(e.key==='n'||e.key==='N'){ doDeclineRescue(); return; }
    }

    if(quarantineInterior()){
      if(e.key==='t'||e.key==='T'){e.preventDefault();treatQuarantineSurvivor();return;}
      if(e.key==='p'||e.key==='P'){e.preventDefault();podQuarantineSurvivor();return;}
      if(e.key==='r'||e.key==='R'){e.preventDefault();manualQuarantinePump();return;}
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
        if(G._miningProgress.progress >= G._miningProgress.total){
          addCargo(makeCommodityItem(_comId, G.curPlanet, _com.basePrice));
          addLog('Extracted '+_com.name+'. (~'+_com.basePrice+' cr at stations)','lg');
          _cell.type = (BIOMES[_biomeKey]?.floor)||'EARTH_FLOOR';
          G._miningProgress = null;
        } else {
          const _left = G._miningProgress.total - G._miningProgress.progress;
          addLog('Drilling… '+G._miningProgress.progress+'/'+G._miningProgress.total+' ('+_left+' more press'+((_left===1)?'':'es')+')','li');
        }
        completeSurfaceAction();
        renderAll(); return;
      }
    }
    // Enter = interact/dock/land — but not when rescue offer is pending
    if(e.key==='Enter' && !(G.stranded?.rescuePhase==='offer')){ doInteract(); return; }
    if((e.key==='z'||e.key==='Z')&&G.mode==='planet'){ doToggleDive(); return; }
    if(e.key==='l'||e.key==='L'){ doLiftOff(); return; }
    if(e.key==='.'&&G.mode==='planet'){ doWaitPlanet(); return; }
    if(e.code==='Period'){ e.preventDefault(); if(G.mode==='planet') doWaitPlanet(); else doWaitGalaxy(); return; }
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

    if(e.key==='f'||e.key==='F'){
      if(G.mode==='galaxy'){
        const p=G.pirates.find(p=>p.alive&&p.x===G.ship.x&&p.y===G.ship.y);
        if(p){ startShipCombat(p,true); return; }
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
  if(document.getElementById('feedback-overlay').style.display==='flex' || e.target.closest?.('button[data-menu-control]')) return;
  if(G===null && MENU_STATE.screen==='intro'){
    if(e.key==='Enter'||e.key===' '){
      if(MENU_STATE.introEntryKeyStillHeld){
        MENU_STATE.introEntryKeyStillHeld = false;
      } else {
        openShipSelection();
      }
    }
  }
  // Naming screen — capture typed characters
  if(G===null && MENU_STATE.screen==='naming'){
    if(e.key==='Backspace'){
      editVesselName('Backspace');
    } else if(e.key==='Enter'){
      if(MENU_STATE.namingEntryKeyStillHeld){
        MENU_STATE.namingEntryKeyStillHeld = false;
        drawMenuScreen();
      } else advanceVesselRegistration();
    } else if(e.key.length===1 && !e.ctrlKey && !e.metaKey){
      editVesselName(e.key);
    }
  }
});

