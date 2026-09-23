function tryMove(dx,dy,confirmed){
  confirmed = !!confirmed;
  if(G.dead||G.retired) return;
  // Track last movement direction for sprite rotation
  if(dx!==0||dy!==0) G.ship.facing = {dx, dy};

  // -- Galaxy --------------------------------------------------
  if(G.mode==='galaxy'){
    if(G.fuel<=0){
      // Enter stranded state if not already in it
      if(!G.stranded){
        G.stranded = { sos:false, turnsStranded:0, rescueShip:null, rescuePhase:null };
        (G.neutralShips||[]).forEach(s=>{ s.rescuing = false; }); // fresh strand — reset all rescuers
        addLog('OUT OF FUEL — engines dead. Crew oxygen reserves depleting.','lc');
        addLog('Press [T] to toggle SOS beacon. Press any move key to wait a turn.','lw');
      } else {
        doStrandedWait();
      }
      renderAll(); return;
    }
    // Clear stranded if fuel was somehow restored
    if(G.stranded){ G.stranded = null; }
    const nx=G.ship.x+dx, ny=G.ship.y+dy;
    if(nx<0||nx>=MAP_W||ny<0||ny>=MAP_H) return;
    startGalaxyShipMoveAnimation(G.ship.x, G.ship.y, nx, ny);
    G.ship.x=nx; G.ship.y=ny;
    if(!DEBUG.infiniteFuel){ G.fuel=Math.max(0,G.fuel-1); G.fuelSpent=(G.fuelSpent||0)+1; }
    // One galaxy move always advances the world. Chase speed is handled inside
    // movePirates() by comparing pirate engine rating against the player's.
    G._bonusMoves = 0;
    G.turn++;
    // Tick active sensor drones
    if(G._activeDrones && G._activeDrones.length){
      G._activeDrones = G._activeDrones.filter(d=>{
        d.x = Math.max(0, Math.min(MAP_W-1, d.x + d.dx));
        d.y = Math.max(0, Math.min(MAP_H-1, d.y + d.dy));
        revealAround(d.x, d.y, 3);
        d.turnsLeft--;
        if(d.turnsLeft <= 0){ addLog('Sensor Drone signal lost.','lm'); return false; }
        return true;
      });
    }
    maybeCrewGalaxyTalk();
    const bestNavSkill = Math.max(0, ...(G.crew||[]).filter(c=>c.hp>0).map(c=>c.skills?.nav||0));
    const baseRange  = G.shipStats?.sensorRange ?? 3;
    const floodBonus = (G.inventory||[]).some(i=>i.usable==='floodlight') ? 2 : 0;
    revealAround(nx, ny, baseRange + (bestNavSkill >= 2 ? 1 : 0) + floodBonus);
    const cell=G.galaxy[ny][nx];
    // NPC stranded ship proximity log — fires regardless of cell type
      const _strandedHere=(G.npcStranded||[]).find(s=>s.x===nx&&s.y===ny);
      if(_strandedHere){
        if(_strandedHere.type==='alive') addLog(_strandedHere.name+': "MAYDAY — engines dead, need fuel! [Enter] to hail."','lg');
        else if(_strandedHere.type==='research') addLog(_strandedHere.name+' — transponder dark. No SOS. [Enter] to board.','lw');
        else addLog(_strandedHere.name+' — silent. SOS still transmitting. [E] to board.','lw');
      }
    if(cell.type==='SYSTEM') addLog('Approaching '+cell.name+' System.','li');
    else if(cell.type==='PULSAR') addLog(cell.name+' — PULSAR DETECTED. Radiation hazard at proximity. Approach with extreme caution.','lc');
    else if(cell.type==='ROGUE_PLANET') addLog(cell.name+' — rogue planet detected. Press Enter to enter orbit.','li');
    else if(cell.type==='CASINO') addLog('Approaching '+cell.name+'. Neon lights visible from here.','li');
    else if(cell.type==='DERELICT') addLog(cell.name+' — a dead station. No power, no response. You could board it.','li');
    else if(cell.type==='BLACK_HOLE'){
      addLog('GRAVITATIONAL ANOMALY — singularity detected! Hull stress critical!','lc');
      addLog('The ship crosses the event horizon. There is no return.','lc');
      G.dead = true;
      G.deathCause = 'The ship was torn apart crossing the event horizon of a black hole. Tidal forces shredded the hull in milliseconds.';
      renderAll(); return;
    }
    else if(cell.type==='PIRATE_BASE'){
      const _entryBase = (G.pirateBases||[]).find(b=>b.x===nx&&b.y===ny);
      if(_entryBase && _entryBase.destroyed){
        addLog('Drifting through the wreckage of '+cell.name+'.','li');
      } else {
        addLog('WARNING: '+cell.name+' — pirate stronghold. Weapons fire detected!','lc');
        const dmg = 15 + rnd(20);
        if(!DEBUG.infiniteHull) G.ship.hp = Math.max(0, G.ship.hp - dmg);
        if(dmg>0) SFX.hullHit && SFX.hullHit();
        addLog('Defense turrets hit your hull for '+dmg+' damage!','lc');
        if(G.ship.hp<=0){
          G.dead=true;
          G.deathCause='The ship was destroyed by defense turrets at '+cell.name+'.';
          renderAll(); return;
        }
      }
    }
    else if(cell.name) addLog('Approaching '+cell.name+'.','li');

    if(cell.type==='NEBULA'){
      const bestNav = Math.max(0, ...(G.crew.filter(c=>c.hp>0).map(c=>c.skills?.nav||0)));
      const navMitigation = bestNav * 0.04;
      const severityMult  = Math.max(0.2, 1 - bestNav * 0.05);
      const roll = Math.random();
      const navCrew = G.crew.filter(c=>c.hp>0).sort((a,b)=>(b.skills?.nav||0)-(a.skills?.nav||0))[0];
      if(roll < Math.max(0.03, 0.25 - navMitigation)){
        const lost = Math.max(1, Math.round((1 + rnd(3)) * severityMult));
        if(!DEBUG.infiniteFuel){ G.fuel = Math.max(0, G.fuel - lost); }
        const navNote = bestNav >= 5 ? ' (navigator reduced impact)' : '';
        addLog('Nebula interference! Navigation disrupted — lost '+lost+' extra fuel.'+navNote,'lw');
        if(navCrew) giveSkillXP(navCrew, 'nav', 1);
      } else if(roll < Math.max(0.05, 0.40 - navMitigation)){
        const dmg = Math.max(1, Math.round((2 + rnd(5)) * severityMult));
        if(!DEBUG.infiniteHull) G.ship.hp = Math.max(0, G.ship.hp - dmg);
        const navNote = bestNav >= 5 ? ' (navigator reduced impact)' : '';
        addLog('Charged nebula gas damages hull! -'+dmg+' HP.'+navNote,'lc');
        if(navCrew) giveSkillXP(navCrew, 'nav', 1);
        if(G.ship.hp<=0){ G.dead=true; G.deathCause='The ship was destroyed by a nebula.'; renderAll(); return; }
      } else {
        if(bestNav >= 3) addLog('Navigating through nebula cloud. Route plotted safely.','li');
        else addLog('Navigating through nebula cloud.','li');
      }
    }

    if(G.fuel<=Math.round(G.maxFuel*0.5)&&G.fuel>Math.round(G.maxFuel*0.25)&&!G._alarmFuelWarn){
      addLog('Fuel below 50% — consider returning to Starbase.','lw');
    }
    if(G.fuel<=Math.round(G.maxFuel*0.25)&&G.fuel>0&&!G._alarmFuelCrit){
      addLog('FUEL CRITICAL — return to Starbase immediately!','lc');
    }

    // Radio chatter near stations (within 6 tiles, ~5% chance per move)
    const nearBase = G.galaxy.some((row,gy)=>row.some((c,gx)=>
      (c.type==='BASE'||c.type==='CASINO') && Math.abs(gx-nx)<=6 && Math.abs(gy-ny)<=6
    ));
    if(nearBase && Math.random()<0.05){
      addLog('[Radio] '+RADIO_CHATTER[Math.floor(Math.random()*RADIO_CHATTER.length)],'li');
    }

    // Black hole proximity warning (within 3 tiles)
    const nearestBH = (G.blackHoles||[]).reduce((closest,h)=>{
      const d = Math.abs(nx-h.x)+Math.abs(ny-h.y);
      return d < closest.d ? { d, h } : closest;
    }, { d:Infinity, h:null });
    if(nearestBH.d <= 3 && nearestBH.d > 0){
      if(nearestBH.d === 1){
        addLog('⚠ SINGULARITY ON EDGE OF GRID — one more step and the ship will be destroyed!','lc');
      } else if(nearestBH.d === 2){
        addLog('WARNING: Singularity detected at extreme close range. Gravitational stress on hull!','lc');
      } else {
        addLog('CAUTION: Black hole detected nearby. Recommend course correction.','lw');
      }
    }

    // Pulsar radiation proximity (within 4 tiles = hazard; 5+ = safe)
    (G.pulsars||[]).forEach(pu=>{
      const d = Math.abs(nx-pu.x)+Math.abs(ny-pu.y);
      if(d === 0){
        // Direct tile — lethal dose
        addLog('PULSAR DIRECT EXPOSURE — LETHAL RADIATION DOSE!','lc');
        applyRadiationExposureToCrew(4, 'pulsar_direct');
        const dmg = 20 + rnd(15);
        if(!DEBUG.infiniteHull) G.ship.hp = Math.max(0, G.ship.hp - dmg);
        if(dmg>0) SFX.hullHit && SFX.hullHit();
        addLog('Electromagnetic pulse strips '+dmg+' hull integrity!','lc');
        if(G.ship.hp<=0){
          G.dead=true;
          G.deathCause='The ship was destroyed by a lethal radiation burst from '+pu.name+'.';
        }
      } else if(d <= 2){
        addLog('PULSAR PROXIMITY — intense radiation bombardment! ('+pu.name+')','lc');
        applyRadiationExposureToCrew(2, 'pulsar_close');
      } else if(d <= 4){
        if(Math.random() < 0.65){
          addLog('Elevated radiation from nearby pulsar '+pu.name+'. Crew exposure detected.','lw');
          applyRadiationExposureToCrew(1, 'pulsar_near');
        }
      }
    });

    moveNeutralShips();
    movePirates();
    moveGasEntities();
    tickNpcStranded();
    // 0.6% chance per turn a new stranded ship appears somewhere in the galaxy
    if(Math.random()<0.006) spawnNpcStrandedShip();

    tickCrewStatuses('galaxy');
    checkDeath();
    if(G.dead){ renderAll(); return; }

    // -- Passive skill effects — once per galaxy move -------------
    // Medic: small chance to heal one injured crewmember by 1–3 HP
    // Chance = 2% per MED skill point of the best medic alive
    const bestMedic = G.crew.filter(c=>c.hp>0).reduce((best,c)=>{
      const m = c.skills?.med||0; return m > (best?.skills?.med||0) ? c : best;
    }, null);
    if(bestMedic && (bestMedic.skills?.med||0) > 0){
      const medChance = (bestMedic.skills.med) * 0.02;
      if(Math.random() < medChance){
        // Pick a random injured crewmember (not the medic themselves if others hurt)
        const injured = G.crew.filter(c=>c.hp>0 && c.hp<c.maxHp);
        if(injured.length){
          const target = injured[rnd(injured.length)];
          const heal = 1 + rnd(3);
          target.hp = Math.min(target.maxHp, target.hp + heal);
          addLog(crewDisplayName(bestMedic)+' patches up '+crewDisplayName(target)+'. +'+heal+' HP.','lg');
          giveSkillXP(bestMedic, 'med', 3);
        }
      }
    }

    // Engineer: small chance to repair 1 HP of ship hull
    // Chance = 1.5% per ENG skill point of the best engineer alive
    const bestEngineer = G.crew.filter(c=>c.hp>0).reduce((best,c)=>{
      const e = c.skills?.eng||0; return e > (best?.skills?.eng||0) ? c : best;
    }, null);
    if(bestEngineer && (bestEngineer.skills?.eng||0) > 0 && G.ship.hp < G.ship.maxHp){
      const engChance = (bestEngineer.skills.eng) * 0.015;
      if(Math.random() < engChance){
        G.ship.hp = Math.min(G.ship.maxHp, G.ship.hp + 1);
        addLog(crewDisplayName(bestEngineer)+' patches the hull. +1 HP.','lg');
        giveSkillXP(bestEngineer, 'eng', 2);
      }
    }

    // Check if we moved onto a pirate tile ? forced combat
    const pirateHere = G.pirates.find(p=>p.alive&&p.x===nx&&p.y===ny);
    if(pirateHere){
      startShipCombat(pirateHere);
      return;
    }
    const hostilePatrolHere = (G.neutralShips||[]).find(ns=>ns.alive!==false&&ns.type==='patrol'&&ns.hostile&&ns.x===nx&&ns.y===ny);
    if(hostilePatrolHere){
      startShipCombat(ensureNeutralCombatStats(hostilePatrolHere));
      return;
    }

    // Auto-collect any nebula loot drifting at this tile
    collectNebulaLootAt(nx, ny);

    // Warn if pirate adjacent
    const pirateNear = G.pirates.find(p=>p.alive && Math.abs(p.x-nx)<=1 && Math.abs(p.y-ny)<=1);
    if(pirateNear) addLog('WARNING: Pirate vessel nearby — '+pirateNear.name+'!','lw');
  }

  // -- Planet --------------------------------------------------
  else if(G.mode==='planet'){
    if(!crewAlive()){ addLog('No crew alive.','lc'); renderAll(); return; }
    const nx=G.player.x+dx, ny=G.player.y+dy;
    // Track last direction for grapple/jetpack aiming
    if(dx!==0||dy!==0){ G._lastDx=dx; G._lastDy=dy; }
    const pdata=G.planets[G.curPlanet];
    if(nx<0||nx>=PW(pdata)||ny<0||ny>=PH(pdata)) return;
    const cell=pdata.grid[ny][nx];

    // Blocked by terrain?
    if(!TILE[cell.type]?.pass){
      // Ringworld locked door — open with [E]
      if(cell.type==='rw_locked_door'){
        G.turn++;
        cell.type='rw_open_door';
        addLog('Maintenance hatch forced open. The hallway beyond is pressurised.','li');
        renderAll(); return;
      }
      // Ancient locked door — requires high SCI skill to decipher and open
      if(cell.type==='ancient_locked_door'){
        G.turn++;
        const bestSci = (G.crew||[]).filter(c=>c.hp>0)
          .reduce((best,c)=>crewSkillValue(c,'sci')>crewSkillValue(best,'sci')?c:best, G.crew[0]);
        const sciVal = bestSci ? crewSkillValue(bestSci,'sci') : 0;
        const SCI_THRESHOLD = 5;
        if(sciVal >= SCI_THRESHOLD){
          cell.type = 'ANCIENT_ROAD';
          addLog(crewDisplayName(bestSci)+' deciphers the lock sequence. The door sighs open.','lg');
          // Disturbing the lock may activate interior defences
          if(!cell._orbSpawned){ cell._orbSpawned = true; maybeSpawnAncientSentinel(pdata, nx, ny); }
        } else {
          addLog("The door is locked. A sufficiently skilled scientist could crack it.",'lw');
        }
        renderAll(); return;
      }
      // Underwater map — hitting a uw_wall means hitting the shore/land from below: surface here
      if(pdata.isUnderwater && cell.type==='uw_wall'){
        // Move player to the boundary tile that's still water before surfacing
        doUnderwaterSurface();
        return;
      }
      addLog('Blocked.'); renderAll(); return;
    }

    // Enemy at destination? → combat (move doesn't happen, doCombat handles its own turn)
    const enemy=(G.enemies[G.curPlanet]||[]).find(e=>e.x===nx&&e.y===ny&&e.alive&&!e.hidden);
    if(enemy){
      if(enemy.civLocal && enemy.canCommunicate && !enemy.commRefused){
        startCivilizationDialogue({ pdata, cell:{ type:'civ_local' }, x:enemy.x, y:enemy.y, local:enemy });
        return;
      }
      doCombat(enemy); return;
    }

    // Can't wade into open water — destination must be shore-adjacent (has a land neighbour)
    if(!pdata.isUnderwater && cell.type === 'EARTH_WATER'){
      const shoreAdjacent = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]].some(([sdx,sdy]) => {
        const t = pdata.grid[ny+sdy]?.[nx+sdx]?.type;
        return t && TILE[t]?.pass && t !== 'EARTH_WATER';
      });
      if(!shoreAdjacent){
        addLog('The water is too deep to wade further.','li');
        renderAll(); return;
      }
    }

    // Actual movement — all messages from here onward share this turn number
    G.turn++;

    // Void step: jetpack carriers fly through unprompted; everyone else gets a Y/N confirmation
    if(!confirmed && (cell.type==='ancient_st_void' || cell.type==='rw_void')){
      const jetpack = (G.inventory||[]).find(i=>i.usable==='jetpack' && (i.fuel||0)>0);
      if(!jetpack){
        const voidDesc = cell.type==='ancient_st_void'
          ? 'empty space, nothing but the gas giant below'
          : 'the void between ring fragments, hard vacuum';
        G._voidPrompt = { dx, dy };
        addLog('Step into '+voidDesc+'? [Y] to confirm, any other key to cancel.','lw');
        renderAll(); return;
      }
      // Has jetpack with fuel — fall through to move and let tile-entry logic handle the charge burn
    }

    // Actually move
    G.player.x=nx; G.player.y=ny;
    noteHallucinationMismatchAt(nx, ny);

    // -- Tile entry effects ----------------------------------------
    const landingTile = pdata.grid[G.player.y][G.player.x].type;
    if(pdata.civilization){
      checkCivilizationShipEscort(pdata);
      checkCivilizationBoundaryPromise(pdata);
      tickCivilizationDefenderRespawn(G.curPlanet, pdata);
    }

    if(landingTile === 'nuke_water'){
      applyRadiationExposureToCrew(2, 'contaminated_water', 1);
      if(Math.random() < 0.40){
        const dmg = 1 + rnd(3);
        const victim = G.crew.filter(c=>c.hp>0)[0];
        if(victim && !DEBUG.infiniteCrewHp){
          victim.hp = Math.max(0, victim.hp - dmg);
          addLog('Contaminated water! Radiation burns through the suit. -'+dmg+' HP.','lc');
        }
      }
    }

    if(landingTile === 'EARTH_WATER'){
      const waterRoll = Math.random();
      if(waterRoll < 0.15){
        pdata.planetTurn++;
        addLog('You lose your footing and struggle in the current!','lw');
        revealPlanet(G.curPlanet, nx, ny, 2);
        renderAll(); return;
      } else if(waterRoll < 0.30){
        const slipDirs = [[-1,0],[1,0],[0,-1],[0,1]].filter(([sdx,sdy])=>{
          const sx2=G.player.x+sdx, sy2=G.player.y+sdy;
          if(sx2<0||sx2>=PW(pdata)||sy2<0||sy2>=PH(pdata)) return false;
          return TILE[pdata.grid[sy2][sx2].type]?.pass;
        });
        if(slipDirs.length){
          const [sdx,sdy] = slipDirs[Math.floor(Math.random()*slipDirs.length)];
          G.player.x += sdx; G.player.y += sdy;
          addLog('The current pulls you off course!','lw');
        }
      }
    }

    // Reveal nest tile when player walks over it
    if((landingTile === 'NEST' || landingTile === 'CAVE_NEST') && !pdata.grid[G.player.y][G.player.x].revealed){
      pdata.grid[G.player.y][G.player.x].revealed = true;
      addLog(landingTile === 'CAVE_NEST' ? 'You find a brittle cave bug nest tucked into the rock.' : 'You stumble upon a creature nest hidden in the undergrowth.','lw');
      if(landingTile === 'CAVE_NEST'){
        maybeExposeRandomCrewToInfection(0.06, 'cave_nest',
          'Disturbed cave matter may have contaminated the suits.');
      }
    }
    // Ancient outpost entry — may activate sentinel orb defence (any biome with ruins)
    if(landingTile === 'ANCIENT_OUTPOST'){
      const _entryCell = pdata.grid[G.player.y][G.player.x];
      if(!_entryCell._orbTriggered){
        _entryCell._orbTriggered = true;
        maybeSpawnAncientSentinel(pdata, G.player.x, G.player.y);
      }
    }
    // Civilization structure — first-visit interaction placeholder
    if(CIV_TILE_TYPES.has(landingTile)){
      const civ = pdata.civilization;
      const civState = civ ? ensureCivilizationState(pdata) : null;
      const contactEstablished = !!civState?.contacted;
      const settlementCell = pdata.grid[G.player.y][G.player.x];
      // Mark first visit for discovery tracking
      if(!settlementCell._visited){
        settlementCell._visited = true;
        const tierLabel = civ?.tierLabel || 'unknown';
        const species   = civ?.species   || 'alien';
        trackPlanetDiscoveryOnce(G.curPlanet, 'civilization', 'civilization_found', {
          biome: pdata.biome || 'unknown', species, tier: tierLabel,
        });
        // Rich per-building examine is for pre-contact discovery. Once contact is
        // established, known structures should not lecture the player every step.
        const sl2 = species.toLowerCase();
        const hasSci = hasScientist();
        const sci2 = hasSci ? getCrewScientist() : null;
        const buildingObs = {
          civ_hut:         pick([sl2+' dwelling. Low ceiling, single entry, smoke residue — built for sleeping and warmth, not much else.',
                                 'A '+sl2+' hut. Cured hides and dried plants hang near the entrance. The interior smells of smoke and something organic.',
                                 'One of dozens of identical structures. The sameness is intentional — no dwelling announces higher status than another.']),
          civ_fire_pit:    pick(['A communal fire pit, recently used. Ash still warm. This is where the group gathers to eat and decide things.',
                                 'The fire pit is banked but not cold. Bones and husks around the edge suggest a meal completed in the last few hours.',
                                 'Circle of stones around a central pit. The positioning of discarded material suggests fixed seating — the same individuals occupy the same spots.']),
          civ_longhouse:   pick(['A '+sl2+' longhouse. Voices inside, movement, the smell of food. Multiple families share this space.',
                                 'Long communal structure with a single ridgeline. The door-frame is carved with repeated symbols — possibly clan or lineage markers.',
                                 'The longhouse is central to the cluster. Smaller structures radiate from it. This is the social core of the settlement.']),
          civ_totem:       pick(['A carved totem. The upper sections are older than the lower — additions accumulate over time, each recording something.',
                                 'The totem faces outward toward the approach. That orientation is probably a challenge or warning, not a welcome.',
                                 'Several totems form a loose perimeter. The carvings differ per pole — different events, different obligations. This is a record system.']),
          civ_stone_tower: pick(['A watchtower. Arrow slits cover the approach routes. Someone is in there — movement visible at the upper level.',
                                 'The tower\'s construction is older than the surrounding buildings. The '+sl2+' built around it rather than replacing it.',
                                 'Defensive structure with a commanding view. The crew is visible from every level. Whoever is watching has been watching since the crew arrived.']),
          civ_market:      pick(['Open market. Goods on rough tables, barter in progress. The '+sl2+' economy is visible here — what moves, what is hoarded, what has value.',
                                 'The market is quiet at the crew\'s arrival — not empty, but watchful. Transactions pause. The crew is being assessed as a commercial variable.',
                                 'Several stalls near the edge carry goods that do not match local production. Trade networks reach beyond this settlement.']),
          civ_factory:     pick(['Machinery hums inside. The '+sl2+' factory runs in shifts — workers entering and leaving through a side entrance on a cycle.',
                                 'The factory output stacks near a loading point. The production is standardised: every unit identical, labelled in a format the crew cannot read.',
                                 'A '+sl2+' industrial facility. The noise profile suggests multiple processes running in parallel. The scale of output exceeds what this settlement needs for itself.']),
          civ_tenement:    pick(['A densely packed housing block. Hundreds of '+sl2+' live here. The building is functional, maintained, and designed to hold as many as possible.',
                                 'The tenement\'s windows are uniform, the access points controlled. This is managed housing — the '+sl2+' state allocates residence.',
                                 'Off-shift workers visible at the tenement entrance. The movement in and out follows a schedule. This building\'s inhabitants live by the production cycle.']),
          civ_office:      pick(['A '+sl2+' administrative structure. Data terminals visible through the windows. Someone inside has noticed the crew.',
                                 'The office building\'s entrance has a checkpoint — access is controlled by documentation. The crew does not have the right documentation.',
                                 'Official vehicles parked outside. Personnel in uniform entering and leaving. This is where decisions about the crew\'s status are being made.']),
          civ_relay_tower: pick(['A communications tower transmitting on cycles the crew\'s equipment can detect but not decode. Range appears significant.',
                                 'The relay tower is the tallest structure in the settlement. It predates some of the buildings around it — infrastructure first, then the city.',
                                 'Signals pulse from the tower at regular intervals. The crew\'s presence is almost certainly part of what is being transmitted.']),
        };
        const baseCivTile = settlementCell.surfaceCivTile || landingTile;
        const lastFlavorTurn = civState?.lastSettlementFlavorTurn || -9999;
        const richFlavorDue = ((G.turn || 0) - lastFlavorTurn >= 24) && Math.random() < 0.12;
        const showRichFlavor = !settlementCell._flavorShown && (!contactEstablished ? Math.random() < 0.18 : richFlavorDue);
        if(showRichFlavor){
          const aquaticPrefix = pdata.isUnderwater && settlementCell.surfaceCivTile ? 'Underwater adaptation: ' : '';
          const baseMsg = aquaticPrefix + (buildingObs[baseCivTile] || 'A '+(civ?.tierLabel||'unknown').toLowerCase()+' structure.');
          addLog(baseMsg,'li');
          settlementCell._flavorShown = true;
          if(civState) civState.lastSettlementFlavorTurn = G.turn || 0;
        } else if(!contactEstablished && !settlementCell._plainNoted){
          settlementCell._plainNoted = true;
          addLog('Settlement structure. First contact imminent.','lm');
        }
        // Scientist bonus: extra observation + possible knowledge gain.
        if(!contactEstablished && hasSci && sci2){
          const sciObs = {
            civ_hut:         sci2.name+' notes domestic layout patterns — object placement encodes social hierarchy even without visible markers.',
            civ_fire_pit:    sci2.name+' estimates group size from consumption evidence. Bone count, fuel use. Roughly '+((civ.groupSize||4)+Math.floor(Math.random()*4))+' regular users.',
            civ_longhouse:   sci2.name+' records the internal partitioning logic. Space allocation reflects social structure: the partition closest to the central fire is oldest.',
            civ_totem:       sci2.name+' photographs and documents the carving sequence. The symbols match a stress-event pattern — conflict, migration, founding. This group has a history.',
            civ_stone_tower: sci2.name+' identifies construction phases in the stonework. At least three distinct build periods. This settlement has defended itself repeatedly.',
            civ_market:      sci2.name+' maps the commodity flow. At least two non-local goods visible, suggesting trade reach of several days\' travel or more.',
            civ_factory:     sci2.name+' identifies the production logic: standardised units, labelled batches, and a quality control station near the exit. This is industrial discipline.',
            civ_tenement:    sci2.name+' notes utility infrastructure — shared water access, ventilation design, fire-prevention spacing. The '+sl2+' state invests in its workers\' survival.',
            civ_office:      sci2.name+' observes document handling procedures through the window. Classified material is physically segregated. The '+sl2+' bureaucracy understands information risk.',
            civ_relay_tower: sci2.name+' intercepts the signal timing pattern. The cycle interval encodes something — possibly a status broadcast. Decoding would require more language progress.',
          };
          if(sciObs[baseCivTile]){
            archiveLog((pdata.isUnderwater && settlementCell.surfaceCivTile ? sci2.name+' notes the architecture is pressure-rated and grown into the reef. ' : '') + sciObs[baseCivTile],'li');
            giveSkillXP(sci2,'sci',1);
            if(Math.random()<0.35 && !settlementCell._sciBonus){
              settlementCell._sciBonus = true;
              if(civState) civGainLanguage(civState, 1);
              if(civ && civState) maybeCivReport({ civ, pdata, state:civState });
            }
          }
        }
      }
      // Force dialogue open on first contact only.
      // Once contact has been established (civState.contacted), the player can walk
      // freely through the settlement and press [C] to open dialogue voluntarily.
      // Hostile civs skip dialogue entirely and spawn attackers.
      if(civ && !G.dialogue){
        if(civState?.hostile || civ.aggression === 'Hostile'){
          // No dialogue — spawn assault response if not already done
          if(civilizationNeedsInitialDefenders(civState, G.curPlanet, pdata)){
            spawnCivilizationAssaultResponse(pdata, { x:G.player.x, y:G.player.y });
          }
          addLog('The '+civ.species.toLowerCase()+' respond with immediate aggression.','lc');
        } else if(!civState?.contacted){
          // First contact — auto-open dialogue as before
          startCivilizationDialogue({
            pdata,
            cell: { type: landingTile },
            x: G.player.x,
            y: G.player.y,
          });
          return;
        } else {
          // Already contacted — log a brief ambient reminder on the first tile of each visit
          const lastAmbient = civState.lastSettlementAmbientTurn || -9999;
          if((G.turn || 0) - lastAmbient >= 18 && Math.random() < 0.25){
            civState.lastSettlementAmbientTurn = G.turn || 0;
            addLog(pick([
              'Settlement structures nearby. [T] to open contact.',
              'The crew moves through known settlement ground.',
              'Locals keep their distance as the crew passes.',
            ]),'lm');
          }
        }
      }
    }
    if(landingTile === 'LAVA_FLOOR'){
      const dmg = 4 + rnd(4);
      G.crew.filter(c=>c.hp>0).forEach(c=>c.hp=Math.max(0,c.hp-dmg));
      G.crew.filter(c=>c.hp>0).forEach(c=>applyCrewInjury(c, 'burns', { amount:2, source:'lava', silent:true }));
      SFX.crewHit();
      addLog('Lava burns the crew for '+dmg+' damage!','lc');
    }
    if(landingTile === 'LAVA_CRUST' && Math.random()<0.2){
      const dmg = 2 + rnd(3);
      G.crew.filter(c=>c.hp>0).forEach(c=>c.hp=Math.max(0,c.hp-dmg));
      addLog('The crust cracks — heat scalds the crew for '+dmg+'!','lw');
    }
    if(landingTile === 'AMMONIA'){
      const dmg = 2 + rnd(3);
      G.crew.filter(c=>c.hp>0).forEach(c=>c.hp=Math.max(0,c.hp-dmg));
      G.crew.filter(c=>c.hp>0).forEach(c=>{
        applyCrewInjury(c, 'burns', { amount:1, source:'ammonia', silent:true });
        if(Math.random() < 0.25) applyCrewStatus(c, 'toxin_poisoning', { amount:1, stackMode:'add', max:5, source:'ammonia' });
      });
      const extraOxy = atmosphereBiome(G.curPlanet).oxyDrain || 1.5;
      G.oxygen = Math.max(0, DEBUG.infiniteOxy ? G.oxygen : G.oxygen - extraOxy*2);
      SFX.suffocate();
      addLog('Ammonia eats through the suit — '+dmg+' damage and O2 draining fast!','lc');
    }
    if(landingTile === 'TOXIC_FLOOR2'){
      const dmg = 1 + rnd(3);
      G.crew.filter(c=>c.hp>0).forEach(c=>c.hp=Math.max(0,c.hp-dmg));
      G.crew.filter(c=>c.hp>0).forEach(c=>{
        applyCrewInjury(c, 'burns', { amount:1, source:'acid', silent:true });
        if(Math.random() < 0.30) applyCrewStatus(c, 'toxin_poisoning', { amount:1, stackMode:'add', max:5, source:'acid_pool' });
      });
      SFX.crewHit();
      addLog('Acid pool burns through the suit — '+dmg+' damage!','lc');
      checkDeath(); if(G.dead){ renderAll(); return; }
    }
    if(landingTile === 'TOXIC_FLOOR3' && Math.random() < 0.15){
      const dmg = 1 + rnd(2);
      G.crew.filter(c=>c.hp>0).forEach(c=>c.hp=Math.max(0,c.hp-dmg));
      SFX.crewHit();
      addLog('A vent erupts underfoot — '+dmg+' damage!','lw');
      checkDeath(); if(G.dead){ renderAll(); return; }
    }
    // Advance planet day cycle
    const pdata2 = G.planets[G.curPlanet];
    if(pdata2){
      const _B2   = BIOMES[pdata2.biome] || {};
      const _cyc2 = (_B2.dayLength||20)*4;
      const _rawVr2 = (t2) => {
        if(_B2.tidalLock==='day') return 10;
        if(_B2.tidalLock==='night') return 1;
        const cv = Math.cos((t2/_cyc2)*2*Math.PI - Math.PI/2);
        let v = 1+(cv+1)/2*9;
        if(pdata2.biome==='ANCIENT') v=Math.min(v,6);
        return v;
      };
      const _vrBefore2 = _rawVr2(pdata2.planetTurn % _cyc2);
      pdata2.planetTurn++;
      const _vrAfter2  = _rawVr2(pdata2.planetTurn % _cyc2);
      _checkPhaseMessages(_vrBefore2, _vrAfter2, pdata2.biome);
    }
    // Reveal radius — shrink inside smoke or forest (foliage blocks vision)
    const _smokeHere = G.planets[G.curPlanet]?.smokeClouds?.some(c=>c.x===G.player.x&&c.y===G.player.y);
    const _forestHere = pdata.grid[G.player.y]?.[G.player.x]?.type === 'EARTH_FOREST';
    if(_forestHere && !G._lastInForest){
      addLog('You push through thick foliage. Visibility drops.','li');
    }
    if(!_forestHere) G._lastInForest = false;
    if(_forestHere) G._lastInForest = true;
    revealPlanet(G.curPlanet, G.player.x, G.player.y); // radius from planetVisionRadius()
    tickOreScanner();
    // Oxygen drain depends on the current map's atmosphere; caves inherit their surface biome.
    // Recover/drain, suit-breach penalty, and underwater drain+warning are
    // handled by the shared applyOxygenDrain() (also used by doWaitPlanet()/doCombat()).
    const biomeKey = G.planets[G.curPlanet]?.biome;
    const biome    = atmosphereBiome(G.curPlanet);
    if(applyOxygenDrain()){ renderAll(); return; }
    applyCrewMovementInjuryCosts();
    // Auto-surface / wading extras (movement-specific only)
    if(G.underwater){
      // Auto-surface if no longer on water tile (surface map only)
      if(!pdata.isUnderwater && pdata.grid[G.player.y][G.player.x].type !== 'EARTH_WATER'){
        G.underwater = false;
        G._underwaterWarned = false;
        addLog('You surface.','li');
      }
    } else {
      // Extra oxygen cost for wading through water on non-breathable planets (existing behaviour)
      if(pdata.grid[G.player.y][G.player.x].type === 'EARTH_WATER' && biome.oxyDrain > 0){
        const extraDrain = biome.oxyDrain;
        G.oxygen = Math.max(0, DEBUG.infiniteOxy ? G.oxygen : G.oxygen - extraDrain);
        if(!G._warnedWaterDrain){ addLog('Wading through liquid drains your suit faster!','lw'); G._warnedWaterDrain=true; }
      } else {
        G._warnedWaterDrain = false;
      }
    }
    collectPlanetDrops(cell);
    // Collect items — void check must happen before turn advance
    if(cell.type==='MINERAL'){
      const oreKey  = cell.oreType || 'fe';
      const oreDef  = ORE_TYPES[oreKey] || ORE_TYPES.fe;
      const comId   = oreDef.id;
      const com     = COMMODITIES[comId];
      const ss = G.shipStats;

      if(!cell.revealed){
        // ── Discovery gate: requires a Scientist ──────────────────────────
        const sci = (G.crew||[]).find(c => c.hp > 0 && c.role === 'scientist');
        if(!sci){
          addLog('Something in the ground here — the surface reading is ambiguous. A scientist could identify this.','lm');
        } else {
          cell.revealed = true;
          const surveyValue = Math.round(com.basePrice * 0.25);
          G.inventory.push({
            name: com.shortName+' Deposit Survey',
            col: oreDef.col,
            desc: 'Field coordinates and strata readings for a '+com.name.toLowerCase()+' deposit. Sell at any station commodity desk.',
            value: surveyValue,
            _oreKey: oreKey,
            _isSurvey: true,
          });
          addLog(crewDisplayName(sci)+' identifies a '+com.name+' deposit. Survey logged (~'+surveyValue+' cr). Use a drill to extract.','ll');
          awardSurveyMilestones(surveyValue);
        }
      } else {
        // ── Extraction: requires a mining tool ────────────────────────────
        const toolItem = (G.inventory||[]).find(i => i.usable === 'mining_tool');
        if(!toolItem){
          addLog(com.name+' deposit identified — you need a mining tool and cargo space to extract it.','lw');
        } else if(ss && ss.cargoCapacity <= 0){
          addLog(com.name+' — this ship has no cargo hold. Fly a freighter to extract bulk ore.','lw');
        } else if(ss && G.cargo.length >= ss.cargoCapacity){
          addLog('Cargo hold full — leave something behind to collect '+com.shortName+' ore.','lw');
        } else {
          // Uranium deposits irradiate crew during active extraction
          if(oreKey === 'ur'){
            applyRadiationExposureToCrew(1, 'uranium_extraction', 0.6);
          }
          // Init or reset progress state
          const bestEng = Math.max(...(G.crew||[]).filter(c=>c.hp>0).map(c=>c.skills?.eng||0), 0);
          const mult = toolItem.miningMult || 1.0;
          const totalNeeded = Math.max(2, Math.round((10 / mult) - bestEng * 0.5));
          if(!G._miningProgress || G._miningProgress.x !== G.player.x || G._miningProgress.y !== G.player.y){
            G._miningProgress = { x:G.player.x, y:G.player.y, progress:0, total:totalNeeded, oreKey, comId };
          }
          G._miningProgress.progress++;
          if(G._miningProgress.progress >= G._miningProgress.total){
            addCargo(makeCommodityItem(comId, G.curPlanet, com.basePrice));
            addLog('Extracted '+com.name+'. (~'+com.basePrice+' cr at stations)','lg');
            cell.type = BIOMES[biomeKey]?.floor||'EARTH_FLOOR';
            G._miningProgress = null;
          } else {
            const left = G._miningProgress.total - G._miningProgress.progress;
            addLog('Drilling… '+G._miningProgress.progress+'/'+G._miningProgress.total+' ('+left+' more press'+(left===1?'':'es')+')','li');
          }
        }
      }
    } else if(cell.type==='ARTIFACT'){
      G.inventory.push({name:'Ancient Artifact',col:'#e090ff',desc:'Worth 200 cr',value:200});
      trackPlanetDiscoveryOnce(G.curPlanet, 'artifact', 'artifact_found', {
        biome: biomeKey || 'unknown',
      });
      addLog('Found an ancient artifact!','ll'); cell.type=BIOMES[biomeKey]?.floor||'EARTH_FLOOR';
    } else if(cell.type==='BIODATA'){
      G.inventory.push({name:'Biodata Sample',col:'#70f090',desc:'Worth 60 cr',value:60});
      addLog('Collected biodata sample.','ll');
      scientistBiodataReaction();
      cell.type=BIOMES[biomeKey]?.floor||'EARTH_FLOOR';
    } else if(cell.type==='MINERAL_SAMPLE'){
      const ms = cell._sampleType || pickMineralSample(biomeKey);
      if(!cell._sampleType) cell._sampleType = ms;
      G.inventory.push({name:ms.name, col:ms.col, desc:ms.desc, value:ms.value, oreSymbol:ms.oreSymbol||null});
      addLog('Collected '+ms.name.toLowerCase()+'.','ll');
      cell.type=BIOMES[biomeKey]?.floor||'EARTH_FLOOR';
    }
    // -- Scientist passive forest yield ------------------------------------
    // On habitable planets, a scientist in the crew occasionally spots
    // seeds or flowers while moving through forest tiles.
    // Capped at 3 per planet — the useful specimens are finite.
    if(biomeKey === 'HABITABLE' && cell.type === 'EARTH_FOREST'){
      const sci = (G.crew||[]).find(c=>c.hp>0 && c.role==='scientist');
      const BOTANICAL_CAP = 3;
      if(sci && (pdata.botanicalYield||0) < BOTANICAL_CAP && Math.random() < 0.12){
        const find = Math.random() < 0.55
          ? { name:'Native Seeds',    col:'#88d860', desc:'Collected from local flora. Trade value on inhabited worlds.', value:15 }
          : { name:'Dried Flowers',   col:'#ffaad4', desc:'Pressed specimens from local plant life. Ornamental trade value.', value:20 };
        G.inventory.push(find);
        pdata.botanicalYield = (pdata.botanicalYield||0) + 1;
        addLog(crewDisplayName(sci)+' collects '+find.name.toLowerCase()+' from the undergrowth.', 'li');
      }
    }
    if(pdata.isAncientStation && cell.type==='ancient_st_void'){
      // Walked off the platform edge — jetpack saves if charged, otherwise instant death
      const jetpackJ = (G.inventory||[]).find(i=>i.usable==='jetpack' && (i.fuel||0)>0);
      if(jetpackJ){
        jetpackJ.fuel -= 1;
        const fuelLeft = jetpackJ.fuel;
        addJetTrail(pdata, G.player.x, G.player.y);
        if(fuelLeft <= 0){
          const _jIdx = G.inventory.indexOf(jetpackJ);
          if(_jIdx !== -1) G.inventory.splice(_jIdx, 1);
          addLog('Jetpack fires, hovering over the void. Last charge spent — jetpack discarded.', 'lw');
        } else {
          addLog('Jetpack fires, hovering over the void. '+fuelLeft+' charge'+(fuelLeft===1?'':'s')+' remaining.', 'lg');
          if(fuelLeft <= 3) addLog('Jetpack fuel is low. '+fuelLeft+' charge'+(fuelLeft===1?'':'s')+' left before the void claims you.','lw');
        }
        renderAll(); return;
      }
      G.dead = true;
      G.mode = 'galaxy';
      G.deathCause = 'Fell off the platform edge into the gas giant atmosphere below.';
      renderAll(); return;
    } else if(pdata.isDestroyedRingworld && cell.type==='rw_void'){
      // Fell into the void between ring fragments — jetpack saves if charged, otherwise instant death
      const jetpackR = (G.inventory||[]).find(i=>i.usable==='jetpack' && (i.fuel||0)>0);
      if(jetpackR){
        jetpackR.fuel -= 1;
        const fuelLeft = jetpackR.fuel;
        addJetTrail(pdata, G.player.x, G.player.y);
        if(fuelLeft <= 0){
          const _jIdx = G.inventory.indexOf(jetpackR);
          if(_jIdx !== -1) G.inventory.splice(_jIdx, 1);
          addLog('Jetpack fires, arrested the fall into vacuum. Last charge spent — jetpack discarded.', 'lw');
        } else {
          addLog('Jetpack fires, arrested the fall into vacuum. '+fuelLeft+' charge'+(fuelLeft===1?'':'s')+' remaining.', 'lg');
          if(fuelLeft <= 3) addLog('Jetpack fuel is low. '+fuelLeft+' charge'+(fuelLeft===1?'':'s')+' left before the void claims you.','lw');
        }
        renderAll(); return;
      }
      G.dead = true;
      G.mode = 'galaxy';
      G.deathCause = 'Fell into the void between ring fragments. The suit ruptured in hard vacuum.';
      renderAll(); return;
    } else if(cell.type==='ancient_st_fuel'){
      const gained = cell.fuelAmount || 50;
      const before = G.fuel;
      G.fuel = Math.min(G.maxFuel, G.fuel + gained);
      const actual = G.fuel - before;
      addLog('Ancient fuel conduit — still pressurised! +'+actual+' fuel harvested.','lg');
      cell.type = 'ancient_st_floor';
      cell.fuelAmount = 0;
    } else if(cell.type==='ancient_st_trap'){
      // One-time discharge — always fires on first step, visible as ?
      if(!cell.triggered){
        cell.triggered = true;
        const dmg = cell.trapDmg || 20;
        // Hits the away crew — pick the first living crew member
        const _alive = G.crew.filter(c=>c.hp>0);
        const victim = _alive[Math.floor(Math.random()*_alive.length)];
        if(victim){
          if(!DEBUG.infiniteCrewHp) victim.hp = Math.max(0, victim.hp - dmg); else victim.hp = victim.maxHp;
          addLog('Ancient energy node discharges! '+victim.name+' takes '+dmg+' damage.','lc');
          if(victim.hp<=0) addLog(victim.name+' is incapacitated.','lc');
        } else {
          addLog('Ancient energy node discharges! No crew to protect you.','lc');
        }
        SFX.hullHit && SFX.hullHit();
        cell.type = 'ancient_st_floor';
        // Check if all crew dead
        debugRestoreCrewHp();
        if(!G.crew.some(c=>c.hp>0)){ G.dead=true; G.deathCause='Entire crew killed by alien energy traps.'; }
      }
    } else if(cell.type==='station_corpse'){
      const cause = cell.deathCause || 'Cause of death: unknown.';
      addLog('Human remains. '+cause,'li');
      if(cell.credits && cell.credits > 0){
        earnCredits(cell.credits);
        addLog('Found '+cell.credits+' cr on the body.','ll');
        cell.credits = 0;
      }
      // Leave corpse tile but mark examined so it won't repeat
      if(!cell.examined){
        cell.examined = true;
        maybeExposeRandomCrewToInfection(0.05, 'derelict_corpse',
          'Handling the remains may have exposed the crew to infection.');
      }
    } else if(cell.type==='station_console'){
      // 60% chance of readable data (biodata value), 40% dead/blank
      if(!cell.looted){
        cell.looted = true;
        const isRingworldConsole = !!G.planets[G.curPlanet]?.isRingworld;
        if(cell.scienceJobData){
          G.inventory.push({name:'Research Ship Data',col:'#66ccff',desc:'Lost Science Office field data',value:0});
          trackPlanetDiscoveryOnce(G.curPlanet, 'research_data', 'research_ship_data_found', {
            biome: biomeKey || 'DERELICT',
          });
          addLog('Recovered the lost research ship data. Return it to the Science Office.','ll');
        } else if(Math.random() < 0.60){
          const dcName = isRingworldConsole ? 'Ringworld Datacore' : 'Station Datacore';
          G.inventory.push({name:dcName,col:'#44aaff',desc:'Worth 80 cr',value:80});
          addLog('Console still holds data. Extracted a datacore.','ll');
        } else {
          addLog('Console is dead. Memory wiped or corrupted.','li');
        }
      } else {
        addLog('Console already stripped.','li');
      }
    } else if(cell.type==='rw_console'){
      if(!cell.looted){
        cell.looted = true;
        if(Math.random() < 0.70){
          G.inventory.push({name:'Ringworld Datacore',col:'#cc44ff',desc:'Ancient alien data lattice. Worth 120 cr',value:120});
          addLog('The crystal pulses. You extract a data lattice from its core.','ll');
        } else {
          addLog('The crystal is inert. Whatever it held is gone.','li');
        }
      } else {
        addLog('Already extracted.','li');
      }
    } else if(cell.type==='station_locker'){
      if(!cell.looted){
        cell.looted = true;
        const isRW = pdata.isRingworld || pdata.isDestroyedRingworld;
        const roll = Math.random();
        if(isRW){
          // Ringworld lockers — no credits, alien artefacts and materials only
          if(roll < 0.30){
            G.inventory.push({name:'Alien Alloy Fragment',col:'#88ccff',desc:'Dense alien metal. Worth 60 cr',value:60});
            addLog('Storage unit holds a dense metallic fragment — alien alloy.','ll');
          } else if(roll < 0.55){
            G.inventory.push({name:'Ringworld Datacore',col:'#cc44ff',desc:'Ancient alien data lattice. Worth 120 cr',value:120});
            addLog('A data lattice is sealed inside. You extract it carefully.','ll');
          } else if(roll < 0.75){
            G.inventory.push({name:'Alien Compound',col:'#44ffcc',desc:'Unknown crystalline material. Worth 80 cr',value:80});
            addLog('Crystalline compound sealed in a containment sleeve.','ll');
          } else {
            addLog('Storage unit is empty. Contents long since removed.','li');
          }
        } else {
          if(roll < 0.35){
            G.inventory.push({name:'Emergency Medikit',col:'#ff6688',desc:'Worth 80 cr',value:80,usable:'medikit'});
            addLog('Locker contains an emergency medikit.','ll');
          } else if(roll < 0.60){
            const cr = 20 + rnd(40);
            earnCredits(cr);
            addLog('Locker holds '+cr+' cr in emergency scrip.','ll');
          } else if(roll < 0.80){
            const _ms1 = pickMineralSample(biomeKey);
            G.inventory.push({name:_ms1.name, col:_ms1.col, desc:_ms1.desc, value:_ms1.value});
            addLog('Locker holds equipment. Found a '+_ms1.name.toLowerCase()+'.','ll');
          } else if(roll < 0.95){
            addLog('Locker is empty.','li');
          } else {
            G.inventory.push({name:'C4 Charge',col:'#ff4400',desc:'Military explosive. Arm from inventory, then DROP it. Detonates in 5 turns. Destroys doors and weak walls in blast radius.',value:200,usable:'c4'});
            addLog('Locker contains a military-grade C4 charge. Handle with care.','ll');
          }
        }
      } else {
        addLog('Already searched.','li');
      }
    } else if(cell.type==='CAVE_ENTRANCE'){
      const caveKey = cell.caveKey || (G.curPlanet+':cave');
      if(!G.planets[caveKey] || G.planets[caveKey].caveGenVersion !== 2){
        const srcBiome = G.planets[G.curPlanet]?.biome||'HABITABLE';
        generateCave(caveKey, srcBiome);
      }
      // Save return position
      G._caveReturn = { planet: G.curPlanet, x: G.player.x, y: G.player.y };
      G.curPlanet = caveKey;
      const cd = G.planets[caveKey];
      G.player = { x:cd.spawnX, y:cd.spawnY, hp:G.player.hp };
      revealPlanet(caveKey, cd.spawnX, cd.spawnY);
      addLog('You squeeze through a narrow opening into the cave...','li');
      maybeExposeRandomCrewToInfection(0.03, 'cave_air',
        'Something in the cave air irritates the filters.');
      renderAll(); return;
    } else if(cell.type==='cave_exit'){
      // Return to surface
      if(G._caveReturn){
        G.curPlanet = G._caveReturn.planet;
        G.player.x  = G._caveReturn.x;
        G.player.y  = G._caveReturn.y;
        G._caveReturn = null;
        revealPlanet(G.curPlanet, G.player.x, G.player.y);
        addLog('You emerge back onto the surface.','li');
      } else {
        addLog('No way back registered. Lifting off instead.','lw');
      }
      renderAll(); return;
    } else if(cell.type==='uw_exit'){
      // Light shaft rising to the surface — [Z] to surface from anywhere underwater
      if(!cell._uwExitSeen){
        cell._uwExitSeen = true;
        addLog('A column of light filters down from above. The surface is up there. [Z] to surface.','li');
      }
    } else if(cell.type==='uw_wreck' && cell.hasLoot){
      cell.hasLoot = false;
      const kind = cell.wrecKind || 'wreck';
      const desc = cell.wrecDesc || 'The structure is heavily corroded, half-buried in silt.';
      addLog('You reach the '+kind+'.','ll');
      addLog(desc,'li');
      if(Math.random()<0.4){
        G.inventory.push({name:'Ancient Artifact',col:'#e090ff',desc:'Worth 200 cr',value:200});
        addLog('Sealed inside — an artifact, intact against the water and the years.','ll');
      } else {
        const _ms2 = pickMineralSample(biomeKey);
        G.inventory.push({name:_ms2.name, col:_ms2.col, desc:_ms2.desc, value:_ms2.value});
        addLog('You pull out what you can. Sediment-crusted ore, probably worth something.','li');
      }
    } else if(cell.type==='SHIP'){
      if(G.oxygen<100){
        G.oxygen=100;
        G._oxyWarnedLow=false;
        G._oxyWarnedCrit=false;
        G._alarmOxyWarn=false;
        G._alarmOxyCrit=false;
        addLog('Oxygen refilled from ship reserves.','lg');
      } else {
        addLog('At ship. [L] to lift off.','lg');
      }
    }

    tickJetTrail(pdata);
    maybeCrewPlanetTalk(pdata);

    // Oxygen warnings — fire once per threshold crossing (shared with doWaitPlanet()/doCombat())
    applyOxygenWarnings();

    if(maybeCivilizationInitiatesContact(pdata)){
      return;
    }
    moveEnemies();
    if(maybeCivilizationInitiatesContact(pdata)){
      return;
    }
    processPlanetHazards();
    checkDeath();
  }

  renderAll();
}

// -----------------------------------------------------------------
//  COMBAT
// -----------------------------------------------------------------
// Per-turn oxygen recover/drain core, shared by tryMove(), doWaitPlanet(), and
// doCombat() so every turn-consuming action (move, wait, or fight) handles
// oxygen identically: recover on breathable surfaces/the ship tile, drain on
// hostile atmospheres, apply the unprotected-crew suit-breach penalty, and
// drain heavily while submerged (with a one-time diving-suit warning).
// Returns true if this killed the crew — caller should renderAll(); return.
