function initGame(chosenClass, captainName, shipName) {
  const cls = chosenClass || 'LIGHT_SCOUT';
  G = {
    mode:     'galaxy',   // galaxy | system | planet | base | inventory
    turn:     1,
    seed:     Math.floor(Math.random() * 0xFFFFFF), // per-run market price seed
    credits:  500,
    oxygen:   100,
    fuel:     100,
    maxFuel:  100,
    ship:     { hp:100, maxHp:100, x:0, y:0 },
    shipName: 'Unnamed Vessel',
    shipStats: null,  // populated below from SHIP_CLASSES
    base:     { screen:'main', sel:0, subSel:0 },
    crew: [],
    inventory:   [],
    cargo:       [],  // bulk cargo hold — separate from personal inventory
    npcStranded: [],  // NPC ships that are stranded in the galaxy
    towedShip:   null, // ship currently being towed by tractor beam
    galaxy:      null,
    planets:     {},   // key="sx,sy:pIdx" → { grid, spawnX, spawnY, biome }
    enemies:     {},
    player:      { x:0, y:0 },
    log:         [],
    msg:         '',
    visited:     new Array(MAP_W * MAP_H).fill(false),
    curPlanet:   '',       // current planet key
    curSystem:   '',       // current system key "x,y" when in system/planet mode
    selPlanet:   0,        // selected planet index in system view (0-based)
    selMoon:     -1,       // selected moon index (-1 = none)
    _viewInvSel: 0,        // selected inventory item index
    _inventoryExamine: false,
    _cargoExamine:     false,
    _crewExamine: false,
    dead:        false,
    deathCause:  '',
    retired:     false,
    showOptions: false,
    scanViewKey:  '',    // planet key being previewed in scan view
    _prevMode:   'galaxy',
    _oxyWarnedLow:  false,
    _oxyWarnedCrit: false,
    _viewTab:    'inventory', // 'inventory' | 'cargo' | 'crew' | 'ship' | 'log'
    _viewCrewSel: 0,
    _cargoSel:   0,        // selected crew index in crew tab
    _drinkCount:  0,        // drinks bought at current station visit
    weaponLevel: 1,        // legacy — kept for save compat, use installedWeapons
    installedWeapons: [], // array of weapon IDs, one per active slot
    pirates:     [],
    pirateBases: [],
    neutralShips:[],
    gasEntities: [],   // Nebula gas entities, predatory cloud beings
    nebulaLoot:  [],   // Uncollected nebula crystals left at combat sites
    scienceJob:  { active:null, cooldownUntil:0, nextIndex:rnd(SCIENCE_JOB_TYPES.length), completed:0, completedTypes:[] },
    shipCombat:  null,
    stranded:    null,   // null | { sos, turnsStranded, rescueShip, rescuePhase }
    _voidPrompt: null,   // null | { dx, dy } — pending Y/N before stepping into lethal void
    examine:     null,   // null | { x, y }  — cursor position when in examine mode
    rangeTarget: null,   // null | { x, y }  — fire mode aim cursor
    dialogue:    null,   // active branching dialogue overlay
    _alarmOxyWarn:  false,
    _alarmOxyCrit:  false,
    _alarmFuelWarn: false,
    _alarmFuelCrit: false,
    lastStarbaseTurn: 1,
    lastPayrollTurn: -9999,
    nextCrewTalkTurn: 16,
    nextCrewGalaxyTalkTurn: 28,
    surveyCareerCredits: 0,
    surveyBonusTier: 0,
  };
  // Load sprite images before generating galaxy
  // Build starting crew after G is fully initialized
  G.crew = [
    randomCrewMember('captain'),
    randomCrewMember('scout'),
    randomCrewMember('engineer'),
  ];
  if(cls === 'LIGHT_SCOUT') G.crew.push(randomCrewMember('scientist'));
  G.crewHired = G.crew.length;       // total crew ever hired (including starting crew)
  G.creditsEarned = 500; // track all credits received (starting credits count)
  // Special planets roll independently per planet at galaxy gen time (see generateGalaxy).
  // Assign a different corporation to each major station for this run.
  const _corpPool = CORPORATIONS.slice().sort(() => Math.random() - 0.5);
  G._stationCorps = {
    'Starbase Alpha': _corpPool[0].id,
    'Waypoint Omega':  _corpPool[1].id,
  };
  G.shipStats = buildShipStats(cls);
  G.ship.maxHp  = G.shipStats.maxHp;
  G.ship.hp     = G.ship.maxHp;
  G.maxFuel     = G.shipStats.maxFuel;
  G.fuel        = G.maxFuel;
  G.weaponLevel = G.shipStats.weaponSlots > 0 ? 1 : 0; // legacy
  // Default loadout by hull type
  G.installedWeapons = [];
  if(G.shipStats.weaponSlots > 0){
    // Corvette starts with a railgun — it's a combat ship
    G.installedWeapons[0] = (G.shipStats.classId === 'ATTACK_CORVETTE') ? 'railgun' : 'mass_driver';
  }
  G.installedModules = [];
  G.shipName    = shipName || 'Unnamed Vessel';
  trackEvent('new_game_started', analyticsBaseParams({
    ship_class: cls,
    captain_name_set: !!(captainName || '').trim(),
    ship_name_set: !!(shipName || '').trim(),
  }));
  // Apply captain name to the captain crew member
  if(captainName){
    const cap = G.crew.find(c=>c.role==='captain');
    if(cap){ cap.name = captainName; cap.firstName = captainName; cap.lastName = ''; }
  }
  G.cargo      = [];
  if(cls === 'BULK_FREIGHTER'){
    addCargo({ name:'Mysterious Package', shortName:'Mystery', symbol:'?', col:'#cc88ff', desc:'Deliver to Waypoint Omega. +300 cr.', value:0, questItem:'mystery_delivery' });
    addLog('A sealed package sits in your hold. Deliver it to Waypoint Omega for 300 cr.','lw');
  }
  loadSprites().then(()=>{ restoreGameUI(); generateGalaxy(); renderAll(); });

  // Build gauge tick marks (at 25%, 50%, 75%)
  ['fuel-ticks','oxy-ticks'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el) return;
    el.innerHTML='';
    [25,50,75].forEach(pct=>{
      const tick=document.createElement('div');
      tick.className='gauge-tick';
      tick.style.bottom=pct+'%';
      el.appendChild(tick);
    });
  });

}

