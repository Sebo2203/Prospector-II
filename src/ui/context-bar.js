// ─────────────────────────────────────────────────────────────────
//  CONTEXTUAL ACTION BAR
//  Rebuilds the #ctx-bar based on current mode and player position.
//  Actions use the same shortcuts as the keyboard. Status text stays passive.
// ─────────────────────────────────────────────────────────────────
function renderContextBar(){
  const bar = document.getElementById('ctx-bar');
  const btns = [];
  document.getElementById('combat-shortcuts').hidden=G.mode!=='shipcombat';
  document.getElementById('travel-shortcuts').hidden=G.mode==='shipcombat';
  document.getElementById('combat-wait-key').textContent=codeLabel((OPTIONS.keybinds||DEFAULT_KEYBINDS).wait);

  const menuKeys=new Set(canvasMenuTargets.filter(target=>target.shortcut && target.mode===G.mode &&
    (G.mode!=='inventory' || target.view===G._viewTab)).map(target=>target.shortcut));
  const btn = (key,label,cls='',action=key==='ESC'?'Escape':key==='Enter'?key:/^[A-Z0-9]$/.test(key)?key.toLowerCase():null,disabled=false) => {
    if(action && menuKeys.has(action.length===1?action.toLowerCase():action)) return '';
    const content=`<span class="ck">[${htmlEsc(key)}]</span> ${htmlEsc(label)}`;
    return action
      ? `<button type="button" class="ctx-btn ${cls}" data-game-key="${htmlEsc(action)}" data-menu-control title="${htmlEsc(label)}" ${disabled?'disabled aria-disabled="true"':''}>${content}</button>`
      : `<div class="ctx-btn ${cls}">${content}</div>`;
  };
  const arrows = (label,horizontal=false) => {
    const keys=horizontal?['←','→','ArrowLeft','ArrowRight']:['↑','↓','ArrowUp','ArrowDown'];
    btns.push(btn(keys[0],label,'info',keys[2]),btn(keys[1],label,'info',keys[3]));
  };

  if(shipAttackConfirmationActive()){
    btns.push(btn('Y','Confirm attack','danger'),btn('N','Cancel','info'));
    bar.innerHTML=btns.join('');return;
  }

  if(shipSystemsActive()){
    arrows('Select system');
    if(shipSystemsActions().length>1) arrows('Select repair',true);
    btns.push(btn('ESC','Back','info'));
    bar.innerHTML=btns.join('');
    return;
  }

  if(G.showOptions && !G.dead && !G.retired){
    btns.push(btn('ESC',G._kbScreen?'Back':'Close options','info'));
  } else if(G.dead || G.retired){
    btns.push(btn('Enter','Main Menu','info'));

  } else if(BARTER.active){
    arrows('Select goods');
    arrows('Switch side',true);
    if(BARTER.side==='player' && BARTER.playerItems.length){
      btns.push(btn('Enter',BARTER.offered.has(BARTER.playerSel)?'Remove from offer':'Offer selected item','good'));
    } else if(BARTER.side==='civ' && BARTER.civItems.length){
      btns.push(btn('Enter',BARTER.wanted.has(BARTER.civSel)?'Remove from request':'Request selected good','good'));
    }
    btns.push(btn('ESC','Close barter','info'));

  } else if(G.dialogue){
    arrows('Select reply');
    const reply=dialogueVisibleOptions()[G.dialogue.sel||0];
    if(reply && !reply.disabled){
      const label=String(reply.label||'Choose reply');
      btns.push(btn('Enter',label.length>60 ? label.slice(0,57)+'…' : label,'good'));
    }
    btns.push(btn('1-9','Quick choose','info'));
    if(dialogueAllowsEscape()) btns.push(btn('ESC','Close dialogue','info'));

  } else if(G.rangeTarget){
    btns.push(btn('Click','Aim, then click the same tile to fire','info'));
    btns.push(btn('Enter','Fire','danger'));
    btns.push(btn('Tab','Next shooter','info','Tab'));
    btns.push(btn('ESC','Cancel','info'));
  } else if(G._itemAimMode){
    btns.push(btn('Compass','Choose direction','info'));
    btns.push(btn('ESC','Cancel','info'));
  } else if(G._voidPrompt){
    btns.push(btn('Y','Step into void','danger'),btn('N','Stay here','info'));
  } else if(G.examine){
    btns.push(btn('Click','Examine tile','info'));
    const creature = G.mode === 'planet' ? creatureExamineTarget() : null;
    const civTarget = G.mode === 'planet' ? civilizationExamineTarget() : null;
    if(creature && canCommunicateWithCreature(creature)) btns.push(btn('T','Communicate','good'));
    else if(civTarget && canCommunicateWithCivilization(civTarget)) btns.push(btn('T','Contact civilization','good'));
    else if(civTarget) btns.push(`<div class="ctx-btn" style="color:#555;border-color:#333"><span class="ck">[T]</span> Move adjacent to contact</div>`);
    if(G.mode === 'galaxy'){
      const target=galaxyAttackTarget();
      if(target)btns.push(btn('F',(target.pirateType || target._homeCluster?'Engage ':'Fire on ')+target.name,'danger'));
      const examData = G.visited?.[G.examine.y*MAP_W+G.examine.x] ? getExamineName(G.examine.x, G.examine.y) : null;
      if(examData && typeof examData === 'object' && examData.type === 'galaxy_ship'){
        const inRadioRange = examData.dist <= radioRange();
        if(inRadioRange) btns.push(btn('H','Hail '+examData.ns.name+' ('+examData.dist+'u)','good'));
        else btns.push(`<div class="ctx-btn" style="color:#555;border-color:#333">Out of radio range (${examData.dist}u / max ${radioRange()}u)</div>`);
      }
    }
    btns.push(btn('X / ESC','Exit examine','info','Escape'));

  } else if(G.mode==='shipcombat'){
    const combat = G.shipCombat;
    const entry = shipCombatWeapons()[combat.weapon];
    if(entry){
      const status=shipCombatWeaponStatus(combat,entry);
      btns.push(btn('F','Fire '+entry.weapon.name+(status==='Ready'?'':' · '+combatStatusText(status)),'danger','f',status!=='Ready'));
    }
    else btns.push(btn('!','Unarmed','warn'));
    const boost=shipCombatBoostStatus(combat);
    btns.push(btn('B',boost==='Ready'?'Boost forward 2 · '+(2*hullSize())+' fuel · '+(18+effectiveEngineRating()*2)+' heat':'Boost · '+boost+(boost==='Too hot'?' (+'+(18+effectiveEngineRating()*2)+' heat)':''),'info','b',boost!=='Ready'));
    if(livingShipCombatEnemies(combat).length>1) btns.push(btn('Tab','Next target','info','Tab'));
    if(shipCombatEdge(combat.player)){
      const safe = shipCombatEscapeReady(combat);
      btns.push(btn('R',(safe?'Disengage':'Disengage under fire')+' · 25% fail',safe?'info':'warn'));
    } else btns.push(btn('R','Disengage · Reach map edge','info','r',true));
    if(livingShipCombatEnemies(combat).length && combat.isNeutralTarget && combat.pirate.type==='patrol'){
      btns.push(btn('H',combat.surrenderWarned?'Confirm arrest':'Surrender to patrol','warn'));
    } else if(livingShipCombatEnemies(combat).length && !combat.isNeutralTarget && !combat.pirate._homeCluster){
      const terms = getShipCombatSurrenderTerms(combat);
      btns.push(btn('H','Surrender ('+terms.creditTake+' cr + '+terms.cargoCount+' cargo)','warn'));
    }

  } else if(G.mode==='galaxy'){
    const cell = G.galaxy[G.ship.y][G.ship.x];

    if(G.stranded){
      const st = G.stranded;
      if(st.rescuePhase==='offer'){
        btns.push(btn('Y / Enter','Accept rescue','good','y'));
        btns.push(btn('N','Decline','danger'));
      } else {
        btns.push(btn('Compass',strandedLifeSupportFailing()?'Wait one turn (crew drain)':'Wait (drive disabled)',strandedLifeSupportFailing()?'danger':'warn'));
        btns.push(btn('T', st.sos ? 'Disable SOS beacon' : 'Activate SOS beacon', st.sos?'danger':'good'));
      }
    } else {
      const lootHere=(G.nebulaLoot||[]).find(l=>l.x===G.ship.x&&l.y===G.ship.y);
      const npcStrandedHere=(G.npcStranded||[]).find(s=>s.x===G.ship.x&&s.y===G.ship.y);
      if(quarantineAtShip()){
        btns.push(btn('Enter','Board '+quarantineShipName(),'good'));
      } else if(lootHere && (G.cargo.length<(G.shipStats.cargoCapacity||0) || cell.type!=='BASE')){
        const ss = G.shipStats || buildShipStats('LIGHT_SCOUT');
        const cargoFull = (G.cargo||[]).length >= (ss.cargoCapacity||0);
        if(!cargoFull) btns.push(btn('Enter','Collect '+lootHere.item.name,'good'));
        else btns.push(`<div class="ctx-btn" style="color:#884499;border-color:#442266">✦ Salvage here, cargo hold full</div>`);
      } else if(cell.type==='BASE'){
        btns.push(btn('Enter','Dock at Starbase','good'));
      } else if(cell.type==='CASINO'){
        btns.push(btn('Enter','Dock at The Void Royale','good'));
      } else if(cell.type==='BLACK_HOLE'){
        btns.push(btn('!','WARNING: Singularity — entry is fatal','danger'));
      } else if(cell.type==='PULSAR'){
        btns.push(btn('Enter','Measure pulsar period','warn'));
      } else if(cell.type==='ROGUE_PLANET'){
        btns.push(btn('Enter','Enter rogue planet orbit','info'));
      } else if(npcStrandedHere){
        const label=npcStrandedHere.type==='alive'
          ? 'Offer '+npcStrandedHere.fuelCost+' fuel to '+npcStrandedHere.name
          : 'Board '+npcStrandedHere.name;
        btns.push(btn('Enter',label,'info'));
      } else if(cell.type==='DERELICT'){
        btns.push(btn('Enter','Board '+cell.name,'good'));
      } else if(cell.type==='SYSTEM'){
        btns.push(btn('Enter','Enter orbit — '+cell.name,'info'));
      }
      const attackTarget=galaxyAttackTarget();
      if(attackTarget)btns.push(btn('F',(attackTarget.pirateType || attackTarget._homeCluster?'Engage ':'Fire on ')+attackTarget.name,'danger'));
      // REP status removed from ctx bar
      const radioContact = nearestRadioContact();
      if(radioContact) btns.push(btn('H','Hail '+radioContact.name+' ('+neutralShipDistance(radioContact)+'u)','info'));
      const hasTractor = (G.installedModules||[]).includes('tractor_beam');
      if(hasTractor && npcStrandedHere?.type==='dead' && !G.towedShip){
        btns.push(btn('T','Tow '+npcStrandedHere.name+' (tractor beam)','good'));
      }
      // Show tow status if currently towing
      if(G.towedShip){
        btns.push(btn('Shift+X','Release tow — '+G.towedShip.name,'warn','Shift+X'));
      }
      // Pirate base on current tile
      const pirateBaseHere = G.pirateBases && G.pirateBases.find(pb=>pb.x===G.ship.x&&pb.y===G.ship.y&&!pb.destroyed);
      if(pirateBaseHere && !attackTarget){
        const pct = Math.round((pirateBaseHere.hp/pirateBaseHere.maxHp)*100);
        btns.push(btn('F','Fire on '+pirateBaseHere.name+'  ('+pct+'% integrity)','danger'));
      }
      // Pirate base adjacent warning (not on tile)
      const pirateBaseNear = G.pirateBases && G.pirateBases.find(pb=>!pb.destroyed&&!(pb.x===G.ship.x&&pb.y===G.ship.y)&&Math.abs(pb.x-G.ship.x)<=2&&Math.abs(pb.y-G.ship.y)<=2);
      if(pirateBaseNear) btns.push(btn('!','Hostile base: '+pirateBaseNear.name,'danger'));
      // Cave entrance hint
      if(G.mode==='planet' && G.curPlanet){
        const _pdata=G.planets[G.curPlanet];
        const _pcell=_pdata?.grid[G.player?.y]?.[G.player?.x];
        if(_pcell?.type==='CAVE_ENTRANCE') btns.push(btn('Move','Enter cave (step onto it)','info'));
        if(_pcell?.type==='cave_exit')     btns.push(btn('Move','Exit cave (step onto it)','info'));
      }
      // Floodlight is passive — no toggle button needed
      // Fuel scoop hint when on nebula
      const _hasScoopGalaxy = (G.installedModules||[]).includes('fuel_scoop');
      const _onNebula = G.galaxy && G.galaxy[G.ship.y]?.[G.ship.x]?.type==='NEBULA';
      if(_hasScoopGalaxy && _onNebula && G.fuel < G.maxFuel) btns.push(btn('U','Scoop nebula fuel','good'));
      // Engine advantage indicator
      if((G._bonusMoves||0) > 0){
        btns.push(`<div class="ctx-btn" style="color:#ffcc44;border-color:#443300">⚡ Engine boost — ${G._bonusMoves} free move${G._bonusMoves>1?'s':''}</div>`);
      }
    }

  } else if(G.mode==='system'){
    const cell = G.galaxy[G.ship.y]?.[G.ship.x];
    const numP = cell?.planets?.length||1;
    const pDesc = cell?.planets?.[G.selPlanet];
    const activeBody = (G.selMoon>=0 && pDesc?.moons?.[G.selMoon]) ? pDesc.moons[G.selMoon] : pDesc;
    const scanState = activeBody?.scanState||'none';
    const isGasGiant = pDesc?.biome==='GAS_GIANT';
    arrows('Select planet',true);
    if(isGasGiant){
      if(pDesc?.scanState==='full' && pDesc?.moons?.length)
        arrows('Select moon');
      else if(pDesc?.scanState!=='full')
        btns.push(btn('S','Scan gas giant to reveal moons','info'));
    }
    if(numP>1) btns.push(btn('1-'+numP,'Quick select'));
    if(scanState!=='full' && DEBUG.preScan !== 1) btns.push(btn('S','Scan (1 fuel)'));
    if(scanState==='full'||scanState==='partial'||DEBUG.preScan===1) btns.push(btn('V','View scan'));
    if(isGasGiant && G.selMoon>=0 && activeBody!==pDesc) btns.push(btn('Enter','Land on '+(activeBody.name||'moon'),'good'));
    else if(pDesc && !isGasGiant) btns.push(btn('Enter','Land on '+(pDesc.name||'planet'),'good'));
    // Fuel scoop on gas giant
    const _hasScoopSys = (G.installedModules||[]).includes('fuel_scoop');
    if(_hasScoopSys && isGasGiant && G.fuel < G.maxFuel) btns.push(btn('U','Scoop gas giant fuel','good'));
    btns.push(btn('ESC','Leave system','info'));

  } else if(G.mode==='scanview'){
    const pdata=G.planets[G.scanViewKey];
    btns.push(btn('Click / Arrows','Select landing site','info'));
    if(pdata && canLandAt(pdata,G.scanCursorX ?? pdata.spawnX,G.scanCursorY ?? pdata.spawnY)){
      btns.push(btn('Enter','Land at selected site','good'));
    }
    btns.push(btn('ESC','Return to orbit','info'));

  } else if(G.mode==='planet'){
    const pdata = G.planets[G.curPlanet];
    const cell  = pdata?.grid[G.player.y][G.player.x];
    const atShip = cell?.type==='SHIP';
    if(pdata?.isQuarantine){
      const person=quarantineNearSurvivor();
      const action=quarantineEnterLabel(pdata,cell,person);
      if(action) btns.push(btn('Enter',action,'good'));
      if(person){btns.push(btn('T','Give medical care','info'));btns.push(btn('P','Deploy isolation pod','info'));}
      if(cell?.type==='q_life_support' && !G.expedition.quarantine.repaired) btns.push(btn('R','Work manual pump','info'));
    }
    if(pdata?.isCasino){
      const labels={casino_host:'Talk to host',casino_info:'Read directory',casino_poker:'Play Void Poker',
        casino_bar:'Drinking contest',casino_arena:'Enter beast arena',casino_wrestle:'Arm wrestle',
        casino_slots:'Spin slots (25 cr)',casino_locker:'Inspect locker',casino_console:'Use terminal'};
      if(labels[cell?.type]) btns.push(btn('Enter',labels[cell.type],'good'));
    }
    const civContact = civilizationContactTargetAtPlayer();

    if(atShip){
      btns.push(btn('L','Lift off · '+hullSize()+' fuel','info','l'));
      if(G.oxygen<100) btns.push(btn('Shift+O','Refill oxygen','info','Shift+O'));
    } else if(!pdata?.isQuarantine){
      btns.push(btn('L','Lift off (go to ship first)','',null));
    }
    if(civContact) btns.push(btn('T', civContact.local ? 'Talk to local' : 'Contact civilization','good'));

    // Mineral deposit extraction hint
    if(cell?.type==='MINERAL' && cell.revealed){
      const _ctxTool = bestMiningTool();
      if(_ctxTool){
        const _ctxProg = (G._miningProgress?.x===G.player.x && G._miningProgress?.y===G.player.y) ? G._miningProgress.progress : 0;
        const _ctxOre  = ORE_TYPES[cell.oreType||'fe'] || ORE_TYPES.fe;
        const _ctxBestEng = Math.max(...(G.crew||[]).filter(c=>c.hp>0).map(c=>crewSkillValue(c,'eng')), 0);
        const _ctxTotal = Math.max(2, Math.round((10 / (_ctxTool.miningMult||1.0)) - _ctxBestEng * 0.5));
        btns.push(btn('Enter', 'Drill '+_ctxOre.sym+' ('+_ctxProg+'/'+_ctxTotal+')', 'good'));
      } else {
        btns.push(`<div class="ctx-btn" style="color:#555;border-color:#333"><span class="ck">[Enter]</span> Need a drill to extract</div>`);
      }
    } else if(cell?.type==='MINERAL' && !cell.revealed){
      const _hasSci = (G.crew||[]).some(c=>c.hp>0 && c.role==='scientist');
      if(!_hasSci){
        btns.push(`<div class="ctx-btn" style="color:#555;border-color:#333"><span class="ck">[Step]</span> Unknown deposit — need scientist</div>`);
      }
    }

    // nearby enemy hint
    const enemies = G.enemies[G.curPlanet]||[];
    const nearEnemy = enemies.some(e=>{
      return e.alive && Math.abs(e.x-G.player.x)<=1 && Math.abs(e.y-G.player.y)<=1;
    });
    if(nearEnemy) btns.push(btn('Move','Bump enemy to attack','danger'));

    // Ranged fire button — only if a crew member has a gun equipped
    const hasRangedWeapon = (G.crew||[]).some(c=>c.hp>0 && c.weaponUsable && GROUND_WEAPONS[c.weaponUsable] && GROUND_WEAPONS[c.weaponUsable].maxRange > 1);
    if(hasRangedWeapon) btns.push(btn('F','Fire ranged weapon','danger'));

    // Dive / Surface hint
    if(pdata?.isUnderwater){
      btns.push(btn('Shift+Z','Surface','info','Shift+Z'));
    } else if(cell?.type==='EARTH_WATER'){
      btns.push(btn('Shift+Z','Dive','info','Shift+Z'));
    }


  } else if(G.mode==='casino'){
    const cas = G.casino || {};
    if(cas.screen==='main'){
      btns.push(btn('Up/Down','Select','info'));
      const game=CASINO_GAMES[cas.sel||0];
      if(game) btns.push(btn('Enter',game.label,'good'));
      btns.push(btn('ESC',G.planets[G.curPlanet]?.isCasino?'Return to floor':'Undock','info'));
    } else if(cas.screen==='poker'){
      if(cas.poker && cas.poker.phase==='hold') btns.push(btn('1-5','Hold cards','info'));
      btns.push(btn('Up/Down','Select','info'));
      btns.push(btn('Enter', cas.poker ? 'Redraw' : 'Buy in','good'));
      btns.push(btn('ESC','Back','info'));
    } else if(cas.screen==='wrestle'||cas.screen==='drink'){
      if(cas.contest && cas.contest.kind==='drink'){
        btns.push(btn('Enter','Drink again','danger'));
        btns.push(btn('ESC','Back out','info'));
      } else if(cas.contest && cas.contest.kind==='wrestle'){
        btns.push(btn('1','Steady','info'));
        btns.push(btn('2','Surge','danger'));
        btns.push(btn('3','Feint','info'));
        btns.push(btn('ESC','Concede','info'));
      } else {
        btns.push(btn('Up/Down','Select rival','info'));
        btns.push(btn('Enter','Step up','good'));
        btns.push(btn('ESC','Back','info'));
      }
    } else if(cas.screen==='arena'){
      if(!cas.arena){
        btns.push(btn('Up/Down','Select beast','info'));
        btns.push(btn('Enter','Fight','danger'));
        btns.push(btn('ESC','Back','info'));
      } else if(cas.arena.result){
        btns.push(btn('Enter','Continue','good'));
      } else {
        btns.push(btn('Enter','Next round','danger'));
      }
    }

  } else if(G.mode==='radio'){
    const action=radioTradeRows()[G.radio?.sel||0];
    arrows('Select trade');
    if(action && !action.disabled) btns.push(btn('Enter',action.label,'good'));
    btns.push(btn('ESC','Close channel','info'));

  } else if(G.mode==='base'){
    const b = G.base;
    const building=STATION_BUILDINGS[b.sel];
    if(b.confirm==='retire'){
      btns.push(btn('Enter','Confirm retirement','warn'));
      btns.push(btn('ESC','Cancel','info'));
    } else if(b.confirm==='retire_story'){
      btns.push(btn('Enter','View career record','good'));
    } else if(b.screen==='main'){
      arrows('Select building');
      if(building){
        const name=typeof building.name==='function' ? building.name(b.stationName) : building.name;
        btns.push(btn('Enter','Open '+name,'good'));
      }
      btns.push(btn('ESC','Undock','info'));
    } else {
      arrows('Select action',b.screen==='changehull');
      const action=b.screen==='sub'?building?.actions()[b.subSel]:null;
      if(action && !action.disabled && !action._header) btns.push(btn('Enter',action.label,'good'));
      else if(b.screen==='recruit') btns.push(btn('Enter','Hire selected recruit','good'));
      else if(b.screen==='installweapon'){
        const weapon=Object.values(SHIP_WEAPONS)[b.weaponSel||0],reason=shipWeaponInstallReason(b.weaponSlot||0,weapon);
        btns.push(btn('Enter',reason||'Install selected weapon','good','Enter',!!reason||G.credits<shipWeaponInstallPrice(weapon)));
      }
      else if(b.screen==='changehull'){
        const quote=getHullPurchaseQuote(hangarHullIds()[b.hullSel||0]);
        btns.push(btn('Enter',b.hullQuoteKey===quote.key?'Confirm exchange':'Review exchange','good','Enter',!!quote.reason||G.credits<quote.net));
      }
      btns.push(btn('ESC','Back','info'));
    }

  } else if(G.mode==='inventory'){
    if(G._crewExamine){
      btns.push(btn('↑/↓','Select crew','info'));
      btns.push(btn('1-9','Choose','good'));
      btns.push(btn('X / ESC','Exit dialogue','info','Escape'));
      bar.innerHTML = btns.join('');
      return;
    }
    if(G._inventoryExamine){
      arrows('Browse items');
      btns.push(btn('X / ESC','Exit item examine','info','Escape'));
      bar.innerHTML = btns.join('');
      return;
    }
    arrows('Switch tab',true);
    if(G._viewTab==='crew'){
      arrows('Select crew');
      if(G._equipGunIdx !== undefined)   btns.push(btn('Enter','Equip weapon','good'));
      if(G._equipArmorIdx !== undefined) btns.push(btn('Enter','Equip armor','good'));
      if(G._equipImplantIdx !== undefined) btns.push(btn('Enter','Install implant','good'));
      if(G._equipStimIdx !== undefined)  btns.push(btn('Enter','Administer stim','good'));
      if(G._equipGunIdx === undefined && G._equipArmorIdx === undefined && G._equipImplantIdx === undefined && G._equipStimIdx === undefined){
        const sc = (G.crew.filter(c=>c.hp>0))[G._viewCrewSel||0];
        if(sc?.weapon && sc.weapon !== 'Bare hands') btns.push(btn('W','Unequip weapon','danger'));
        if(sc?.armorUsable) btns.push(btn('S','Strip armor','danger'));
        if(sc) btns.push(btn('X', sc.role === 'captain' ? 'Captain’s Log' : 'Open channel','info'));
      }
    }
    if(G._viewTab==='inventory' && G.inventory.length){
      arrows('Select item');
      const item = G.inventory[G._viewInvSel||0];
      const equipType=inventoryEquipType(item);
      if(equipType==='weapon' || equipType==='armor') btns.push(btn('Enter','Equip to crew','good'));
      else if(item?.usable==='stim_pack') btns.push(btn('Enter','Administer to crew','good'));
      else if(item?.usable?.startsWith('implant_')) btns.push(btn('Enter','Install implant','good'));
      else if(item?.usable==='c4') btns.push(item._armed ? btn('D','Drop now!','warn') : btn('Enter','Arm C4','warn'));
      else if(inventoryItemCanBeUsed(item)) btns.push(btn('Enter','Use '+item.name,'good'));
      btns.push(btn('X','Examine item','info'));
      if(G._prevMode==='planet' && !(item?.usable==='c4' && item._armed)) btns.push(btn('D','Drop item','warn'));
    }
    if(G._viewTab==='ship' && G.mode !== 'base' && G.mode !== 'planet' && (G.cargo?.length||0) > 0){
      arrows('Select cargo');
      if(G._jettisonConfirm) btns.push(btn('ESC','Cancel','info'));
    }
    btns.push(btn('ESC','Close','info'));
  }

  if(!G.dead && !G.retired && !G.showOptions && !G.dialogue && !BARTER.active &&
     !G.examine && !G.rangeTarget && !G._itemAimMode && !G._voidPrompt && !G.stranded){
    if(G.mode==='galaxy'||G.mode==='planet') btns.push(btn('X','Examine','routine'));
    if(canToggleInventoryMenu() && G.mode!=='inventory') btns.push(btn('I','Inventory','routine'));
    btns.push(btn('O','Options','routine'));
  }
  if(!G.dead && !G.retired && !G.showOptions && !G.dialogue && !BARTER.active &&
     !G.examine && !G.rangeTarget && !G._itemAimMode && !G._voidPrompt &&
     G.mode==='shipcombat'){
    btns.push(btn('F3','Ship systems','routine','F3'));
  }
  bar.innerHTML = btns.join('');
}
