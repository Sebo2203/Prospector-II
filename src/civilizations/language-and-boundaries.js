function civContactMethod(civ){
  if(!civ) return 'Unknown';
  if(civ.tier === 'primitive'){
    const traits = civ.traits || {};
    if(traits.curiosity === 'curious') return 'body language and proximity';
    if(traits.curiosity === 'isolated') return 'territorial signals and silence';
    if(traits.diet === 'carnivore') return 'dominance posture and scent';
    return 'gesture and careful distance';
  }
  if(civ.tier === 'information') return 'radio translation';
  if(civ.tier === 'industrial') return 'signal lamps and recorded speech';
  if(civ.tier === 'medieval') return 'gestures, sketches, and objects';
  return 'gestures and careful distance';
}

function getCrewScientist(){
  return (G.crew||[]).find(c=>c.hp>0 && c.role==='scientist') || null;
}

function scientistSciSkill(){
  const s = getCrewScientist();
  return s ? crewSkillValue(s,'sci') : 0;
}

function hasScientist(){
  return !!getCrewScientist();
}

const CIV_LANGUAGE_MAX = 10;

function civComprehension(civ, state){
  if(!civ || !state) return 'none';
  const progress = Math.max(0, Math.min(CIV_LANGUAGE_MAX, state.languageProgress || 0));
  // Without a scientist, comprehension is capped at fragmentary regardless of language progress.
  if(!hasScientist()) return progress >= 4 ? 'fragmentary' : 'uncertain';
  const base = { primitive:0, tribal:0, medieval:1, industrial:2, information:2 }[civ.tier] || 0;
  // Scientist SCI skill adds a small bonus — but experience with THIS civilization drives fluency.
  // High skill helps reach workable faster; fluency requires sustained contact.
  const sciBonus = Math.floor(scientistSciSkill() / 4);
  const score = base + progress + sciBonus;
  if(score >= 12) return 'fluent';
  if(score >= 7) return 'workable';
  if(score >= 3) return 'fragmentary';
  return 'uncertain';
}

function civGainLanguage(target, amount=1){
  const state = target?.state || target;
  if(!state || amount <= 0) return state?.languageProgress || 0;
  state.languageProgress = Math.max(0, Math.min(CIV_LANGUAGE_MAX, (state.languageProgress || 0) + amount));
  return state.languageProgress;
}

function civilizationHostileResponse(civ){
  if(!civ) return 'flee';
  if(civ.tier === 'primitive'){
    const traits = civ.traits || {};
    if(traits.diet === 'carnivore') return 'fight';
    if(traits.diet === 'herbivore') return 'flee';
    if(civ.aggression === 'Hostile' || civ.aggression === 'Territorial') return 'fight';
    // social collective: group courage — more likely to stand ground
    if(traits.social === 'collective') return Math.random() < 0.55 ? 'fight' : 'flee';
    return 'flee';
  }
  if(civ.aggression === 'Hostile' || civ.aggression === 'Territorial') return 'fight';
  if(civ.tier === 'industrial' || civ.tier === 'information') return 'fight';
  if(civ.tier === 'medieval') return civ.aggression === 'Passive' ? 'flee' : 'fight';
  return 'flee';
}

function civilizationTileName(type){
  return ({
    civ_hut: 'Civilian Hut',
    civ_fire_pit: 'Communal Fire Pit',
    civ_longhouse: 'Longhouse',
    civ_totem: 'Cultural Totem',
    civ_stone_tower: 'Stone Watchtower',
    civ_market: 'Local Market',
    civ_factory: 'Factory',
    civ_tenement: 'Tenement Block',
    civ_office: 'Administrative Office',
    civ_relay_tower: 'Communications Tower',
  })[type] || 'Civilization Structure';
}

function civilizationBuildingPositions(pdata){
  const spots = [];
  if(!pdata?.grid) return spots;
  for(let y=0;y<PH(pdata);y++) for(let x=0;x<PW(pdata);x++){
    if(CIV_TILE_TYPES.has(pdata.grid[y]?.[x]?.type)) spots.push({x,y,type:pdata.grid[y][x].type});
  }
  return spots;
}

function nearestCivilizationBuilding(pdata, origin){
  const buildings = civilizationBuildingPositions(pdata);
  if(!buildings.length) return null;
  const ox = Number.isFinite(origin?.x) ? origin.x : G?.player?.x;
  const oy = Number.isFinite(origin?.y) ? origin.y : G?.player?.y;
  return buildings
    .map(b=>({ ...b, d:Math.max(Math.abs(b.x-ox), Math.abs(b.y-oy)) }))
    .sort((a,b)=>a.d-b.d)[0] || null;
}

function activateCivilizationBoundaryPromise(wrap, ctx){
  if(!wrap?.pdata || !wrap?.state || isLocalContact()) return;
  const civ = wrap.civ;
  let focus;
  const pdata = wrap.pdata;

  if(civ.tier === 'primitive'){
    // Primitive: boundary is around the roam center
    focus = civ.roamCenter ? { x:civ.roamCenter.x, y:civ.roamCenter.y } : null;
  } else if(civ.tier === 'tribal'){
    // Tribal: find nearest totem structure — the sacred centre of their territory
    const totems = civilizationBuildingPositions(pdata).filter(b=>b.type==='civ_totem');
    if(totems.length){
      // Use centroid of all totems
      const cx = Math.round(totems.reduce((s,t)=>s+t.x,0)/totems.length);
      const cy = Math.round(totems.reduce((s,t)=>s+t.y,0)/totems.length);
      focus = { x:cx, y:cy };
    } else {
      focus = nearestCivilizationBuilding(pdata, { x:ctx?.x, y:ctx?.y }) || nearestCivilizationBuilding(pdata, G.player);
    }
  } else if(civ.tier === 'information'){
    // Information age: boundary is the ship landing site + a few tiles
    // The crew should stay near their ship — the civ controls everything else
    focus = { x:pdata.spawnX, y:pdata.spawnY };
  } else {
    focus = nearestCivilizationBuilding(pdata, { x:ctx?.x, y:ctx?.y }) || nearestCivilizationBuilding(pdata, G.player);
  }
  if(!focus) return;

  const radius = ({
    primitive: civ.roamRadius || 10,
    tribal: 5,
    medieval: 3,
    industrial: 4,
    information: 4,
  })[civ.tier] || 3;

  const label = ({
    primitive:'ranging territory',
    tribal:'sacred ground',
    medieval:'restricted civic ground',
    industrial:'quarantine perimeter',
    information:'designated contact area',
  })[civ.tier] || 'protected ground';

  wrap.state.boundaryPromise = {
    active:true,
    broken:false,
    warned:false,
    x:focus.x,
    y:focus.y,
    radius,
    label,
    mode:civ.tier === 'information' ? 'allowed_zone' : 'forbidden_zone',
    turn:G.turn || 1,
  };
  const isTerritorial = civ.aggression === 'Territorial';
  const infoNote = civ.tier === 'information'
    ? ' You are allowed to move only inside the marked landing zone.'
    : civ.tier === 'tribal'
    ? ' The totem ground is off-limits.'
    : '';
  const msg = isTerritorial
    ? (civ.tier === 'information'
      ? 'Boundary established: the '+label+' is the only permitted area. They will respond if you leave it.'
      : 'Boundary established: the '+label+' is off-limits. They will respond if you enter it.')+infoNote
    : 'Boundary established: stay clear of the '+label+'.'+infoNote;
  addLog(msg,'li');
}

function nearestCivilizationBoundaryDistance(pdata){
  if(!G?.player) return Infinity;
  const civ = pdata?.civilization;
  if(civ?.tier === 'primitive'){
    if(!civ.roamCenter) return Infinity;
    return Math.max(Math.abs(civ.roamCenter.x-G.player.x), Math.abs(civ.roamCenter.y-G.player.y));
  }
  const buildings = civilizationBuildingPositions(pdata);
  if(!buildings.length) return Infinity;
  return Math.min(...buildings.map(b=>Math.max(Math.abs(b.x-G.player.x), Math.abs(b.y-G.player.y))));
}

function civilizationPromiseDistance(promise){
  if(!promise || !G?.player) return Infinity;
  return Math.max(Math.abs(G.player.x - promise.x), Math.abs(G.player.y - promise.y));
}

function civilizationTileInBoundaryPromise(pdata, x, y){
  const state = ensureCivilizationState(pdata);
  const promise = state?.boundaryPromise;
  if(!pdata?.civilization || !promise?.active || promise.broken || state.hostile) return false;
  const dist = Math.max(Math.abs(x - promise.x), Math.abs(y - promise.y));
  if(promise.mode === 'allowed_zone') return dist <= (promise.radius || 4);
  if(pdata.civilization.tier === 'primitive') return dist <= (promise.radius || 10);
  const tile = pdata.grid?.[y]?.[x]?.type;
  // If permit granted accessible types, those building zones are now open — not forbidden
  if(promise.accessibleTypes && tile && promise.accessibleTypes.includes(tile)) return false;
  if(promise.accessibleTypes){
    const nearAccessible = civilizationBuildingPositions(pdata)
      .filter(b=>promise.accessibleTypes.includes(b.type))
      .some(b=>Math.max(Math.abs(x-b.x),Math.abs(y-b.y))<=1);
    if(nearAccessible) return false;
  }
  // Each civ tile gets a 1-tile buffer so zones don't appear as single dots
  if(CIV_TILE_TYPES.has(tile)) return true;
  const buildingNearby = civilizationBuildingPositions(pdata).some(b=>Math.max(Math.abs(x-b.x),Math.abs(y-b.y))<=1);
  return buildingNearby || dist <= (promise.radius || 3);
}

function checkCivilizationBoundaryPromise(pdata){
  const state = ensureCivilizationState(pdata);
  const promise = state?.boundaryPromise;
  if(!pdata?.civilization || !promise?.active || promise.broken || state.hostile) return;
  const civ = pdata.civilization;
  const dist = civilizationPromiseDistance(promise);
  const tile = pdata.grid?.[G.player?.y]?.[G.player?.x]?.type;
  const isPrim = civ.tier === 'primitive';
  const allowedZone = promise.mode === 'allowed_zone';
  const inside = allowedZone
    ? dist <= (promise.radius || 4)
    : isPrim
    ? dist <= (promise.radius || 10)
    : (CIV_TILE_TYPES.has(tile) || dist <= (promise.radius || 3));
  const violating = allowedZone ? !inside : inside;
  if(!violating){
    promise.warned = false;
    promise.warnedDist = null;
    return;
  }
  if(!promise.warned){
    promise.warned = true;
    promise.warnedDist = dist;
    const label = promise.label || 'protected ground';
    const msg = allowedZone
      ? 'Perimeter warning: you are leaving the permitted '+label+'. Return to the marked landing zone.'
      : civ.tier === 'tribal'
      ? 'Warning: you are entering '+label+'. This will be seen as a violation. Turn back.'
      : civ.tier === 'primitive'
      ? 'You are inside the '+label+'. The group has noticed.'
      : 'Boundary warning: entering the '+label+' will be treated as a breach. Turn back.';
    addLog(msg,'lw');
    return;
  }
  const deeper = allowedZone ? dist > (promise.warnedDist ?? dist) : dist < (promise.warnedDist ?? dist);
  if(allowedZone && !deeper){
    if(dist < (promise.warnedDist ?? dist)) promise.warnedDist = dist;
    return;
  }
  if(!isPrim && !CIV_TILE_TYPES.has(tile) && !deeper){
    if(dist > (promise.warnedDist ?? dist)) promise.warnedDist = dist;
    return;
  }
  if(isPrim && !deeper) return;
  // Promise broken
  promise.broken = true;
  promise.active = false;
  state.relation = Math.max(-10, (state.relation||0) - 3);
  state.alert = 5;
  const key = Object.keys(G.planets||{}).find(k=>G.planets[k]===pdata) || G.curPlanet;
  if(civ.tier === 'tribal' || civ.tier === 'primitive'){
    addLog('The crew crosses the boundary. The '+civ.species.toLowerCase()+' react immediately.','lc');
    makeCivilizationHostile(pdata, 'Boundary crossed');
    // If they fight (not flee), spawn defenders now
    if(state.hostileResponse === 'fight' && !state.boundaryDefendersSpawned){
      state.boundaryDefendersSpawned = true;
      const n = spawnCivilizationDefenders(key, pdata, { origin:{ x:G.player.x, y:G.player.y } });
      if(n > 0) addLog(n+' '+civ.species.toLowerCase()+' move in.','lc');
    }
  } else {
    addLog(allowedZone
      ? 'The crew leaves the permitted landing zone. The settlement reacts with alarm.'
      : 'The crew enters the restricted area. The settlement reacts with alarm.','lc');
    if((state.alert||0) >= 5 || (state.relation||0) <= -4){
      makeCivilizationHostile(pdata, 'Restricted area entered');
    }
  }
}

function startCivilizationShipEscort(wrap){
  if(!wrap?.pdata || !wrap?.state || G.mode !== 'planet') return false;
  const pdata = wrap.pdata;
  const sx = pdata.spawnX, sy = pdata.spawnY;
  if(!Number.isFinite(sx) || !Number.isFinite(sy)) return false;
  G.player.x = sx;
  G.player.y = sy;
  revealPlanet(G.curPlanet, sx, sy, 2);
  wrap.state.shipEscort = {
    active:true,
    warned:false,
    violated:false,
    until:(G.turn || 1) + 30,
    x:sx,
    y:sy,
    radius:1,
  };
  wrap.state.escortAccepted = true;
  wrap.state.nextProactiveContactTurn = (G.turn || 1) + 30;
  wrap.state.alert = Math.max(0, (wrap.state.alert||0) - 1);
  addLog('The information-age delegation escorts the crew back to the ship. Stay near the landing site or they may treat it as a breach.','lw');
  return true;
}

function checkCivilizationShipEscort(pdata){
  const state = ensureCivilizationState(pdata);
  const escort = state?.shipEscort;
  if(!pdata?.civilization || !escort?.active || escort.violated || state.hostile) return;
  if((G.turn || 1) > (escort.until || 0)){ escort.active = false; return; }
  const dist = Math.max(Math.abs((G.player?.x||0)-escort.x), Math.abs((G.player?.y||0)-escort.y));
  if(dist <= (escort.radius || 1)) return;
  if(!escort.warned){
    escort.warned = true;
    state.alert = Math.min(5, (state.alert||0) + 1);
    addLog('Escort warning: the settlement expects the crew to remain by the ship or lift off.','lw');
    return;
  }
  escort.violated = true;
  escort.active = false;
  state.relation = Math.max(-10, (state.relation||0) - 2);
  state.alert = Math.min(5, (state.alert||0) + 3);
  addLog('The crew leaves the escorted zone. The information-age settlement classifies the movement as non-compliance.','lc');
  makeCivilizationHostile(pdata, 'Escorted crew left the landing zone');
}

function civilizationActiveBoundaryNotice(){
  if(!G || G.mode !== 'planet') return null;
  const pdata = G.planets?.[G.curPlanet];
  const state = ensureCivilizationState(pdata);
  if(!pdata?.civilization || state?.hostile) return null;
  const promise = state?.boundaryPromise;
  if(promise?.active && promise.warned){
    const dist = civilizationPromiseDistance(promise);
    const tile = pdata.grid?.[G.player?.y]?.[G.player?.x]?.type;
    const allowedZone = promise.mode === 'allowed_zone';
    const inside = allowedZone ? dist <= (promise.radius || 4) : (CIV_TILE_TYPES.has(tile) || dist <= (promise.radius || 3));
    if(allowedZone ? !inside : inside){
      return {
        title:allowedZone ? 'LANDING ZONE' : 'BOUNDARY WARNING',
        body:allowedZone
          ? 'Return to the '+(promise.label || 'permitted area')+'. Moving farther will trigger a response.'
          : 'Turn back from the '+(promise.label || 'protected ground')+'. Moving deeper will be treated as a violation.',
        col:'#ffaa33',
      };
    }
  }
  const escort = state?.shipEscort;
  if(escort?.active && escort.warned){
    return {
      title:'ESCORT COMPLIANCE',
      body:'Return to the ship tile or lift off. Further movement away will be treated as hostile.',
      col:'#70d8ff',
    };
  }
  return null;
}

