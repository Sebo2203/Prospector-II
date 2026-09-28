// ─────────────────────────────────────────────────────────────────
//  INTERACT  (E key)
// ─────────────────────────────────────────────────────────────────
function doInteract(){
  if(G.dead||G.retired) return;
  if(G.mode==='planet' && G.planets[G.curPlanet]?.isCasino){
    casinoInteractAtPlayer(); renderAll(); return;
  }

  // ── Galaxy → enter system or dock at base ──
  if(G.mode==='galaxy'){
    // Check for floating nebula loot at current tile first
    const lootHere = (G.nebulaLoot||[]).find(l=>l.x===G.ship.x&&l.y===G.ship.y);
    if(lootHere){
      collectNebulaLootAt(G.ship.x, G.ship.y);
      return;
    }
    const cell=G.galaxy[G.ship.y][G.ship.x];
    if(cell.type==='PULSAR'){
      addLog(cell.name+': rotating neutron star. Sensors overwhelmed by electromagnetic output.','lm');
      addLog('Science: pulsar period measured. Do NOT linger — radiation accumulates each turn.','lw');
      const sciCrew = G.crew.filter(c=>c.hp>0&&c.role==='scientist');
      if(sciCrew.length) sciCrew.forEach(c=>giveSkillXP(c,'sci',2));
      renderAll(); return;
    }
    if(cell.type==='ROGUE_PLANET'){
      // Enter orbit — behaves exactly like a 1-planet system but no star, no orrery
      G.mode = 'system';
      G.curSystem = G.ship.x+','+G.ship.y;
      G.selPlanet = 0;
      G.selMoon = -1;
      G.examine = null;
      addLog(cell.name+' — entering orbit. No star, no warmth. Press S to scan, Enter to land.','li');
      renderAll(); return;
    }
    if(cell.type==='BASE'){
      if((G.stationReputation||0) <= -40){
        addLog(cell.name+': "Hostile transponder detected. You are banned from this station!"','lc');
        const dmg = 10 + rnd(15);
        if(!DEBUG.infiniteHull) G.ship.hp = Math.max(0, G.ship.hp - dmg);
        if(dmg>0) SFX.hullHit && SFX.hullHit();
        addLog('Station defense turrets open fire! Hull takes '+dmg+' damage!','lc');
        if(G.ship.hp<=0){
          G.dead=true;
          G.deathCause='The ship was destroyed by defense turrets at '+cell.name+'.';
          renderAll(); return;
        }
        renderAll(); return;
      }
      G.mode='base';
      G.base = {
        screen:'main',
        sel:0,
        subSel:0,
        stationName: cell.name,
        confirm:null,
        pawnStock: generatePawnStock(cell.name),
        medbayStock: generateMedbayStock(cell.name),
      };
      G._drinkCount = 0;
      ensureCrewMoraleState();
      updateCrewLowMoraleFlags();
      processCrewPayrollAtStarbase(cell.name);
      updateCrewLowMoraleFlags();
      resolveCrewResignationsAtStarbase(cell.name);
      G.lastStarbaseTurn = G.turn;
      G.portStressPausedTurns = 0;
      G.portStressPauseStart = null;
      (G.crew||[]).forEach(c=>{
        if(c.hp <= 0) return;
        c.drinkGlow = Math.max(0, (c.drinkGlow || 0) - 2);
        c.drugRush = Math.max(0, (c.drugRush || 0) - 8);
        c.grief = Math.max(0, (c.grief || 0) - 1);
      });
      updateCrewLowMoraleFlags();
      SFX.dock();
      addLog('Docked at '+cell.name+'.','li');
      // Mystery package delivery
      if(cell.name === 'Waypoint Omega'){
        const pkgIdx = (G.cargo||[]).findIndex(i=>i.questItem==='mystery_delivery');
        if(pkgIdx !== -1){
          G.cargo.splice(pkgIdx, 1);
          earnCredits(300);
          addLog('Package delivered. The handler takes it without a word.','lg');
          addLog('300 cr deposited into your account.','lg');
        }
      }
      const sj = ensureScienceJobState();
      if(sj.active?.type === 'data_box' && sj.active.targetStation === cell.name){
        const boxIdx = (G.cargo||[]).findIndex(i=>i.questItem==='science_data_box' && i.targetStation===cell.name);
        if(boxIdx !== -1){
          G.cargo.splice(boxIdx, 1);
          const reward = sj.active.reward || 0;
          earnCredits(reward);
          trackEvent('science_job_completed', analyticsBaseParams({
            job_type: sj.active.type,
            reward,
            started_turn: sj.active.startedTurn || 0,
            mission_turns: Math.max(0, (G.turn || 0) - (sj.active.startedTurn || 0)),
            station_name: cell.name,
          }));
          addLog('Secured data box delivered to '+cell.name+'. +' + reward + ' cr.','lg');
          if(!(sj.completedTypes||[]).includes(sj.active.type)) sj.completedTypes.push(sj.active.type);
          sj.active = null;
          sj.cooldownUntil = G.turn + rollScienceJobCooldown();
          sj.completed = (sj.completed||0) + 1;
          if(remainingScienceJobTypes().length){
            addLog('Science Office says they may have more field work later.','li');
          } else {
            addLog('Science Office says that was the last open field contract in this sector.','li');
          }
        }
      }

    } else if(cell.type==='CASINO'){
      const key='casino:'+G.ship.x+','+G.ship.y;
      if(!G.planets[key]) generateCasinoStationMap(key);
      G.mode='planet'; G.curPlanet=key; G.curSystem='';
      G.player={x:5,y:10,hp:G.crew.filter(c=>c.hp>0)[0]?.hp||10};
      G.casino = { screen:'main', sel:0, arenaPhase:null, arenaEnemy:null, arenaLog:[], betSel:0 };
      ensureCasinoState();
      G.casinoStats.visits++;
      revealPlanet(key,5,10);
      SFX.dock();
      addLog('Docked at '+cell.name+'. Walk the deck; Enter uses a table or machine.','li');

    } else if((G.npcStranded||[]).some(s=>s.x===G.ship.x&&s.y===G.ship.y)){
      const ns2 = G.npcStranded.find(s=>s.x===G.ship.x&&s.y===G.ship.y);
      if(ns2.type==='alive'){
        // Fuel trade dialogue
        const needed = ns2.fuelCost;
        const payment = ns2.credits;
        if(G.fuel >= needed){
          G.fuel = Math.max(0, G.fuel - needed);
          earnCredits(payment);
          addLog(ns2.name+': "Thank you! We were almost dead." Gave you '+payment+' cr for '+needed+' fuel.','lg');
          // Remove from stranded list
          G.npcStranded = G.npcStranded.filter(s=>s!==ns2);
          delete G.galaxy[ns2.y][ns2.x]._npcStranded;
        } else {
          addLog(ns2.name+': "We need '+needed+' fuel — you only have '+Math.floor(G.fuel)+'."','lw');
          addLog('They\'ll pay '+payment+' cr if you can spare the fuel.','li');
        }
      } else {
        // Board dead ship — generate interior
        const dKey2 = ns2.mapKey || (ns2.x+','+ns2.y+':stranded');
        if(!G.planets[dKey2]) generateStrandedShipMap(dKey2);
        seedResearchShipJobMap(dKey2);
        // Start 50-turn despawn countdown from first boarding
        if(!ns2.boarded){ ns2.boarded = true; ns2.boardedAge = 0; }
        G.mode='planet'; G.examine=null; G.curPlanet=dKey2;
        const pd2=G.planets[dKey2];
        G.player={x:pd2.spawnX,y:pd2.spawnY,hp:G.crew.filter(c=>c.hp>0)[0]?.hp||10};
        revealPlanet(dKey2,pd2.spawnX,pd2.spawnY);
        SFX.land&&SFX.land();
        addLog('Cutting through the airlock of '+ns2.name+'. Silence inside.','li');
        if(ns2.type==='research') addLog('Interior sensors show hostile movement. Find the research console.','lw');
      }
    } else if(cell.type==='DERELICT'){
      const dKey = G.ship.x+','+G.ship.y;
      // Always regenerate — wipes any old map from previous code
      if(!G.planets[dKey] || !G.planets[dKey].isDerelict) generateDerelict(dKey);
      G.mode='planet';
      G.curPlanet = dKey;
      const pd = G.planets[dKey];
      G.player = { x:pd.spawnX, y:pd.spawnY, hp:G.crew.filter(c=>c.hp>0)[0]?.hp||10 };
      revealPlanet(dKey, pd.spawnX, pd.spawnY);
      SFX.land && SFX.land();
      addLog('You cut through an airlock into '+cell.name+'. Emergency lighting only. Silence.','li');

    } else if(cell.type==='SYSTEM'){
      G.mode='system';
      G.curSystem = G.ship.x+','+G.ship.y;
      G.selPlanet = 0;
      G.examine = null;
      addLog('Entered orbit around '+cell.name+'. Select a planet to land on.','li');
    }

  // ── System → land on selected planet (or moon) ──
  } else if(G.mode==='system'){
    const cell=G.galaxy[G.ship.y][G.ship.x];
    if(!cell||(cell.type!=='SYSTEM'&&cell.type!=='ROGUE_PLANET')) return;
    const pIdx = G.selPlanet;
    const pDesc = cell.planets[pIdx];
    if(!pDesc) return;

    // Gas giants cannot be landed on
    if(pDesc.biome==='GAS_GIANT'){
      // If a moon is selected, land on it instead
      if(G.selMoon>=0 && pDesc.moons && pDesc.moons[G.selMoon]){
        const moon = pDesc.moons[G.selMoon];
        const mKey = G.curSystem+':'+pIdx+':m'+G.selMoon;
        doLandOnPlanet(mKey, moon);
      } else {
        addLog('Cannot land on a gas giant.','lw');
        if(pDesc.moons&&pDesc.moons.length) addLog('Select a moon with Up/Down to land on it.','li');
      }
      renderAll(); return;
    }

    const pKey = G.curSystem+':'+pIdx;
    doLandOnPlanet(pKey, pDesc);
  }

  renderAll();
}

function doLandOnPlanet(pKey, pDesc, landingX=null, landingY=null){
    // Generate terrain first time
    if(!G.planets[pKey] ||
       ((pDesc.biome==='ANCIENT_STATION'||pDesc.isAncientStation) && !G.planets[pKey].isAncientStation) ||
       (pDesc.biome==='CAVE' && !G.planets[pKey].isCave) ||
       ((pDesc.biome==='RINGWORLD'||pDesc.isRingworld) && !G.planets[pKey].isRingworld) ||
       ((pDesc.biome==='DESTROYED_RINGWORLD'||pDesc.isDestroyedRingworld) && !G.planets[pKey].isDestroyedRingworld) ||
       ((pDesc.biome==='NUCLEAR_WAR'||pDesc.isNuclearWar) && !G.planets[pKey].isNuclearWar) ||
       ((pDesc.biome==='BLOOM'||pDesc.isBloomWorld) && G.planets[pKey].biome !== 'BLOOM')){
      if(pDesc.biome==='ANCIENT_STATION' || pDesc.isAncientStation) generateAncientStation(pKey);
      else if(pDesc.biome==='DERELICT') generateDerelict(pKey);
      else if(pDesc.biome==='CAVE') generateCave(pKey, 'HABITABLE');
      else if(pDesc.biome==='RINGWORLD' || pDesc.isRingworld) generateRingworld(pKey);
      else if(pDesc.biome==='DESTROYED_RINGWORLD' || pDesc.isDestroyedRingworld) generateDestroyedRingworld(pKey);
      else if(pDesc.biome==='NUCLEAR_WAR' || pDesc.isNuclearWar) generateNuclearPlanet(pKey);
      else if(pDesc.biome==='BLOOM' || pDesc.isBloomWorld) generateBloomPlanet(pKey);
      else generatePlanet(pKey, pDesc.biome);
    }

    G.mode='planet';
    G.examine = null;
    G.rangeTarget = null;
    G._itemAimMode = null;
    G.curPlanet=pKey;
    syncPortStressPauseState();
    const pdata=G.planets[pKey];
    // Tag rogue planet surface so lighting knows there's no sun
    const _galaxyCell = G.galaxy[G.ship.y]?.[G.ship.x];
    if(_galaxyCell?.type === 'ROGUE_PLANET') pdata.isRoguePlanet = true;
    ensureCivilizationLocals(pKey);
    // Reset per-visit aid flag so civilizations can offer aid once per landing
    const _civEntry = G.planets[pKey]?.civilization;
    if(_civEntry?.state) _civEntry.state.aidGiven = false;
    resetCivVisitState(G.planets[pKey]);
    if(Number.isInteger(landingX) && Number.isInteger(landingY) && canLandAt(pdata, landingX, landingY)){
      const B = BIOMES[pDesc.biome]||{};
      const floorType = B.floor || 'EARTH_FLOOR';
      if(pdata.grid[pdata.spawnY]?.[pdata.spawnX]?.type === 'SHIP'){
        const _prevUnder = pdata.grid[pdata.spawnY][pdata.spawnX]._underFloor;
        pdata.grid[pdata.spawnY][pdata.spawnX] = { type: _prevUnder || floorType };
      }
      pdata.spawnX = landingX;
      pdata.spawnY = landingY;
      const _landingCell = pdata.grid[landingY][landingX];
      // If target is already a SHIP tile (e.g. spawn point from generation), preserve its _underFloor
      const _newUnder = _landingCell.type === 'SHIP' ? (_landingCell._underFloor || floorType) : _landingCell.type;
      pdata.grid[landingY][landingX] = { type: 'SHIP', _underFloor: _newUnder };
    }
    G.player.x=pdata.spawnX; G.player.y=pdata.spawnY;
    // Merge any scan view mask into fog of war
    if(pdata.scanMask){
      for(let i=0;i<pdata.scanMask.length;i++)
        if(pdata.scanMask[i]) pdata.visited[i]=true;
    }
    revealPlanet(pKey, pdata.spawnX, pdata.spawnY, 2);
    tickOreScanner();
    G.oxygen=100;
    G._oxyWarnedLow=false;
    G._oxyWarnedCrit=false;
    G._alarmOxyWarn=false;
    G._alarmOxyCrit=false;
    G._lastInForest=false;
    SFX.land();
    const B=BIOMES[pDesc.biome]||{};

    // ── Landing check — navigation skill reduces rough landing chance ──
    // Derelicts, ancient stations and caves don't require a landing approach
    const isInternalMap = pDesc.biome==='DERELICT' || pDesc.biome==='ANCIENT_STATION' ||
                          pDesc.isAncientStation || pDesc.biome==='CAVE';
    if(!isInternalMap){
      const bestNav = Math.max(0, ...(G.crew.filter(c=>c.hp>0).map(c=>c.skills?.nav||0)));
      const roughChance = Math.max(0, 0.25 - bestNav * 0.03);
      if(Math.random() < roughChance){
        const dmg = 3 + rnd(8);
        if(!DEBUG.infiniteHull) G.ship.hp = Math.max(0, G.ship.hp - dmg);
        if(dmg>0) SFX.hullHit && SFX.hullHit();
        addLog('Rough landing! Hull takes '+dmg+' damage.','lc');
        // Rough landing is a hard lesson — best navigator learns more
        const navCrew = G.crew.filter(c=>c.hp>0).sort((a,b)=>(b.skills?.nav||0)-(a.skills?.nav||0))[0];
        if(navCrew) giveSkillXP(navCrew, 'nav', 3);
        if(G.ship.hp<=0){
          G.dead=true; G.deathCause='The ship was destroyed in a crash landing on '+pDesc.name+'.';
          renderAll(); return;
        }
      } else {
        // Clean landing — 1 XP for best navigator
        const navCrew = G.crew.filter(c=>c.hp>0).sort((a,b)=>(b.skills?.nav||0)-(a.skills?.nav||0))[0];
        if(navCrew) giveSkillXP(navCrew, 'nav', 1);
        if(bestNav >= 5) addLog('Clean approach — smooth landing.','li');
      }
    }

    if(pDesc.scanState==='full'||pDesc.scanState==='partial'){
      addLog('Landing on '+pDesc.name+' ['+B.name+'].','lg');
      addLog(B.tempLabel||'','li');
      if(B.oxyDrain===0) addLog('Breathable atmosphere — no suit needed!','lg');
      else if(pDesc.biome==='ANCIENT_STATION'||pDesc.isAncientStation) addLog('Hard vacuum — suit integrity critical. Watch your oxygen.','lc');
      const _civLand = G.planets[G.curPlanet]?.civilization;
      if(_civLand){
        if(_civLand.tier === 'primitive'){
          addLog('Signs of a hunter-gatherer band — '+_civLand.species.toLowerCase()+' — somewhere on this world.','ll');
        } else {
          addLog('Signs of '+_civLand.tierLabel.toLowerCase()+' '+_civLand.species.toLowerCase()+' civilization visible from the surface.','ll');
        }
      }
    } else {
      addLog('Landing on unknown world. No scan data — proceed with caution.','lw');
      if(B.oxyDrain===0) addLog('Atmosphere is breathable.','lg');
      else if(pDesc.biome==='ANCIENT_STATION'||pDesc.isAncientStation) addLog('Hard vacuum — no breathable atmosphere detected.','lc');
    }
    if(B.tidalLock==='night') addLog('Tidally locked — permanent night. Visibility severely limited.','lw');
    else if(B.tidalLock==='day') addLog('Tidally locked — permanent day.','li');
    renderAll();
}

