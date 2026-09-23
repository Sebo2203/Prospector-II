// ─────────────────────────────────────────────────────────────────
//  CONTEXTUAL ACTION BAR
//  Rebuilds the #ctx-bar based on current mode and player position.
//  Each btn() call creates a labelled key hint. Extend this function
//  whenever new context-sensitive actions are added to the game.
// ─────────────────────────────────────────────────────────────────
function renderContextBar(){
  const bar = document.getElementById('ctx-bar');
  const btns = [];

  // Helper: build a button string
  const btn = (key, label, cls='') =>
    `<div class="ctx-btn ${cls}"><span class="ck">[${key}]</span> ${label}</div>`;

  if(G.dead){
    btns.push(btn('Enter','Main Menu','info'));

  } else if(G.dialogue){
    btns.push(btn('↑/↓','Select reply','info'));
    btns.push(btn('Enter','Choose','good'));
    btns.push(btn('1-9','Quick choose','info'));
    if(dialogueAllowsEscape()) btns.push(btn('ESC','Close dialogue','info'));

  } else if(G.rangeTarget){
    btns.push(btn('WASD/Arrows','Aim cursor','info'));
    btns.push(btn('F / Enter','Fire','danger'));
    btns.push(btn('ESC','Cancel','info'));
  } else if(G.examine){
    btns.push(btn('Move','Move cursor','info'));
    const creature = G.mode === 'planet' ? creatureExamineTarget() : null;
    const civTarget = G.mode === 'planet' ? civilizationExamineTarget() : null;
    if(creature && canCommunicateWithCreature(creature)) btns.push(btn('T','Communicate','good'));
    else if(civTarget && canCommunicateWithCivilization(civTarget)) btns.push(btn('T','Contact civilization','good'));
    else if(civTarget) btns.push(`<div class="ctx-btn" style="color:#555;border-color:#333"><span class="ck">[T]</span> Move adjacent to contact</div>`);
    if(G.mode === 'galaxy'){
      const examData = G.visited?.[G.examine.y*MAP_W+G.examine.x] ? getExamineName(G.examine.x, G.examine.y) : null;
      if(examData && typeof examData === 'object' && examData.type === 'galaxy_ship'){
        const inRadioRange = examData.dist <= radioRange();
        if(inRadioRange) btns.push(btn('H','Hail '+examData.ns.name+' ('+examData.dist+'u)','good'));
        else btns.push(`<div class="ctx-btn" style="color:#555;border-color:#333">Out of radio range (${examData.dist}u / max ${radioRange()}u)</div>`);
      }
    }
    btns.push(btn('X / ESC','Exit examine','info'));

  } else if(G.mode==='shipcombat'){
    const combatSS = G.shipStats || buildShipStats('LIGHT_SCOUT');
    const combatWpns = (G.installedWeapons||[]).filter(id=>id&&SHIP_WEAPONS[id]&&!SHIP_WEAPONS[id].placeholder);
    if(combatWpns.length > 0){
      const label = combatWpns.map(id=>SHIP_WEAPONS[id].name).join('+');
      btns.push(btn('F','Fire '+label,'danger'));
    } else if(combatSS.weaponSlots === 0){
      btns.push(btn('!','No weapon slots — RETREAT','danger'));
    } else {
      btns.push(btn('!','No weapons installed — RETREAT','danger'));
    }
    const retreatFuel = Math.max(5, 12 - (combatSS.engineRating||1)*2);
    const retreatPct  = Math.round(Math.min(95, 35 + (combatSS.engineRating||1)*15));
    btns.push(btn('R','Retreat ('+retreatFuel+' fuel, '+retreatPct+'% chance)','info'));
    const terms = getPirateSurrenderTerms(G.shipCombat?.pirate || {});
    btns.push(btn('S','Surrender (50% credits + '+terms.cargoCount+' cargo)','warn'));

  } else if(G.mode==='galaxy'){
    const cell = G.galaxy[G.ship.y][G.ship.x];

    if(G.stranded){
      const st = G.stranded;
      if(st.rescuePhase==='offer'){
        btns.push(btn('Y','Accept rescue','good'));
        btns.push(btn('N','Decline','danger'));
      } else {
        btns.push(btn('Move key','Wait one turn (crew drain)','danger'));
        btns.push(btn('T', st.sos ? 'Disable SOS beacon' : 'Activate SOS beacon', st.sos?'danger':'good'));
      }
    } else {
      if(cell.type==='BASE'){
        btns.push(btn('Enter','Dock at Starbase','good'));
      } else if(cell.type==='CASINO'){
        btns.push(btn('Enter','Dock at The Void Royale','good'));
      } else if(cell.type==='BLACK_HOLE'){
        btns.push(btn('!','WARNING: Singularity — entry is fatal','danger'));
      } else if(cell.type==='SYSTEM'){
        btns.push(btn('Enter','Enter orbit — '+cell.name,'info'));
      }
      const pirateHere = G.pirates.find(p=>p.alive&&p.x===G.ship.x&&p.y===G.ship.y);
      if(pirateHere) btns.push(btn('F','Engage '+pirateHere.name,'danger'));
      const pirateNear = !pirateHere && G.pirates.find(p=>p.alive&&Math.abs(p.x-G.ship.x)<=1&&Math.abs(p.y-G.ship.y)<=1);
      if(pirateNear) btns.push(btn('!','Pirate nearby: '+pirateNear.name,'danger'));
      // Nebula loot at current tile
      const lootHere = (G.nebulaLoot||[]).find(l=>l.x===G.ship.x&&l.y===G.ship.y);
      if(lootHere){
        const ss2 = G.shipStats || buildShipStats('LIGHT_SCOUT');
        const cargoFull = (G.cargo||[]).length >= (ss2.cargoCapacity||0);
        if(!cargoFull) btns.push(btn('Enter','Collect Nebula Crystal','good'));
        else btns.push(`<div class="ctx-btn" style="color:#884499;border-color:#442266">✦ Nebula Crystal here, cargo hold full</div>`);
      }
      const neutralTarget = nearestNeutralTarget(1);
      if(neutralTarget) btns.push(btn('F','Fire on '+neutralTarget.name,'danger'));
      // REP status removed from ctx bar
      const radioContact = nearestRadioContact();
      if(radioContact) btns.push(btn('H','Hail '+radioContact.name+' ('+neutralShipDistance(radioContact)+'u)','info'));
      // NPC stranded ship on this tile
      const npcStrandedHere=(G.npcStranded||[]).find(s=>s.x===G.ship.x&&s.y===G.ship.y);
  if(npcStrandedHere){
    if(npcStrandedHere.type==='alive')
      btns.push(btn('Enter','Hail '+npcStrandedHere.name+' (stranded — needs fuel)','good'));
    else if(npcStrandedHere.type==='research')
      btns.push(btn('Enter','Board '+npcStrandedHere.name+' (silent research vessel)','info'));
    else
      btns.push(btn('Enter','Board '+npcStrandedHere.name+' (derelict)','info'));
    // Tractor beam — tow dead derelict ships
    const hasTractor = (G.installedModules||[]).includes('tractor_beam');
    if(hasTractor && npcStrandedHere.type==='dead' && !G.towedShip){
      btns.push(btn('T','Tow '+npcStrandedHere.name+' (tractor beam)','good'));
    }
  }
      // Show tow status if currently towing
      if(G.towedShip){
        btns.push(`<div class="ctx-btn" style="color:#cc88ff;border-color:#442266">⚓ Towing: ${G.towedShip.name} — dock at a station to sell  [X to release]</div>`);
      }
      // Pirate base on current tile
      const pirateBaseHere = G.pirateBases && G.pirateBases.find(pb=>pb.x===G.ship.x&&pb.y===G.ship.y&&!pb.destroyed);
      if(pirateBaseHere && !pirateHere){
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
    btns.push(btn('<-/->','Select planet'));
    if(isGasGiant){
      if(pDesc?.scanState==='full' && pDesc?.moons?.length)
        btns.push(btn('↑↓','Select moon ('+pDesc.moons.length+')','info'));
      else if(pDesc?.scanState!=='full')
        btns.push(btn('S','Scan gas giant to reveal moons','info'));
    }
    if(numP>1) btns.push(btn('1-'+numP,'Quick select'));
    if(scanState!=='full' && DEBUG.preScan !== 1) btns.push(btn('S','Scan (1 fuel)'));
    if(scanState==='full'||scanState==='partial'||DEBUG.preScan===1) btns.push(btn('V','View scan'));
    if(isGasGiant && pDesc?.moons?.length && pDesc?.scanState==='full'){
      if(G.selMoon>=0) btns.push(btn('Enter','Land on moon','good'));
    } else if(!isGasGiant){
      btns.push(btn('Enter','Land on planet','good'));
    }
    // Fuel scoop on gas giant
    const _hasScoopSys = (G.installedModules||[]).includes('fuel_scoop');
    if(_hasScoopSys && isGasGiant && G.fuel < G.maxFuel) btns.push(btn('U','Scoop gas giant fuel','good'));
    btns.push(btn('ESC','Leave system','info'));

  } else if(G.mode==='planet'){
    const pdata = G.planets[G.curPlanet];
    const cell  = pdata?.grid[G.player.y][G.player.x];
    const atShip = cell?.type==='SHIP';
    const civContact = civilizationContactTargetAtPlayer();

    if(atShip){
      btns.push(btn('L','Lift off','info'));
    } else {
      btns.push(btn('L','Lift off (go to ship first)',''));
    }
    if(civContact) btns.push(btn('T', civContact.local ? 'Talk to local' : 'Contact civilization','good'));

    // Mineral deposit extraction hint
    if(cell?.type==='MINERAL' && cell.revealed){
      const _ctxTool = (G.inventory||[]).find(i=>i.usable==='mining_tool');
      if(_ctxTool){
        const _ctxProg = (G._miningProgress?.x===G.player.x && G._miningProgress?.y===G.player.y) ? G._miningProgress.progress : 0;
        const _ctxOre  = ORE_TYPES[cell.oreType||'fe'] || ORE_TYPES.fe;
        const _ctxBestEng = Math.max(...(G.crew||[]).filter(c=>c.hp>0).map(c=>c.skills?.eng||0), 0);
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
      btns.push(btn('Z','Surface','info'));
    } else if(cell?.type==='EARTH_WATER'){
      btns.push(btn('Z','Dive','info'));
    }


  } else if(G.mode==='casino'){
    const cas = G.casino || {};
    if(cas.screen==='main'){
      btns.push(btn('Up/Down','Select','info'));
      btns.push(btn('Enter','Enter','good'));
      btns.push(btn('ESC','Undock','info'));
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

  } else if(G.mode==='base'){
    const b = G.base;
    if(b.screen==='main'){
      btns.push(btn('↑↓','Select building','info'));
      btns.push(btn('Enter','Enter','good'));
      btns.push(btn('ESC','Undock','info'));
    } else {
      btns.push(btn('↑↓','Select action','info'));
      btns.push(btn('Enter','Confirm','good'));
      btns.push(btn('ESC','Back','info'));
    }

  } else if(G.mode==='inventory'){
    if(G._crewExamine){
      btns.push(btn('↑/↓','Select crew','info'));
      btns.push(btn('1-9','Choose','good'));
      btns.push(btn('X / ESC','Exit dialogue','info'));
      bar.innerHTML = btns.join('');
      return;
    }
    if(G._inventoryExamine){
      btns.push(btn('↑/↓','Browse items','info'));
      btns.push(btn('X / ESC','Exit item examine','info'));
      bar.innerHTML = btns.join('');
      return;
    }
    btns.push(btn('←/→','Switch tab','info'));
    if(G._viewTab==='crew'){
      btns.push(btn('↑/↓','Select crew','info'));
      if(G._equipGunIdx !== undefined)   btns.push(btn('Enter','Equip weapon','good'));
      if(G._equipArmorIdx !== undefined) btns.push(btn('Enter','Equip armor','good'));
      if(G._equipStimIdx !== undefined)  btns.push(btn('Enter','Administer stim','good'));
      if(G._equipGunIdx === undefined && G._equipArmorIdx === undefined && G._equipStimIdx === undefined){
        const sc = (G.crew.filter(c=>c.hp>0))[G._viewCrewSel||0];
        if(sc?.weapon && sc.weapon !== 'Bare hands') btns.push(btn('W','Unequip weapon','danger'));
        if(sc?.armorUsable) btns.push(btn('S','Strip armor','danger'));
        if(sc) btns.push(btn('X', sc.role === 'captain' ? 'Captain’s Log' : 'Open channel','info'));
      }
    }
    if(G._viewTab==='inventory' && G.inventory.length){
      btns.push(btn('↑/↓','Select item','info'));
      const item = G.inventory[G._viewInvSel||0];
      if(item?.usable==='gun' || item?.usable==='gun_sniper' || item?.usable==='gun_shotgun' || item?.usable==='gun_burst' || item?.usable==='gun_plasma' || item?.usable==='knife' || item?.usable==='stun_baton' || item?.usable==='vibroblade' || item?.usable==='tranq_darts') btns.push(btn('Enter','Equip to crew','good'));
      else if(item?.usable==='armor_flight' || item?.usable==='armor_reinforced' || item?.usable==='armor_diving' || item?.usable==='armor_exosuit' || item?.usable==='armor_plate') btns.push(btn('Enter','Equip to crew','good'));
      else if(item?.usable==='stim_pack') btns.push(btn('Enter','Administer to crew','good'));
      else if(item?.usable?.startsWith('implant_')) btns.push(btn('Enter','Install implant','good'));
      else if(item?.usable==='c4') btns.push(item._armed ? btn('Drop','Drop now!','warn') : btn('Enter','Arm C4','warn'));
      btns.push(btn('X','Examine item','info'));
      if(G._prevMode==='planet') btns.push(btn('D','Drop item','warn'));
    }
    if(G._viewTab==='ship' && G.mode !== 'base' && G.mode !== 'planet' && (G.cargo?.length||0) > 0){
      btns.push(btn('↑/↓','Select cargo','info'));
      if(G._cargoExamine) btns.push(btn('X','Close examine','info'));
      else btns.push(btn('X','Examine cargo','info'));
      btns.push(btn('J', G._jettisonConfirm ? 'Confirm jettison' : 'Jettison', G._jettisonConfirm ? 'danger' : 'warn'));
      if(G._jettisonConfirm) btns.push(btn('ESC','Cancel','info'));
    }
    btns.push(btn('ESC','Close','info'));
  }

  bar.innerHTML = btns.join('');
}

// -----------------------------------------------------------------
//  HELPERS
// -----------------------------------------------------------------
