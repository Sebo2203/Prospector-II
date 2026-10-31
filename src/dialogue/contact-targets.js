function examineTarget(){
  if(!G?.examine) return null;
  if(G.mode==='galaxy'){
    if(G.visited?.[G.examine.y*MAP_W+G.examine.x]) return getExamineName(G.examine.x, G.examine.y);
    return null;
  }
  if(G.mode==='planet'){
    const pdata = G.planets[G.curPlanet];
    if(pdata?.visited?.[G.examine.y*PW(pdata)+G.examine.x]) return getExamineName(G.examine.x, G.examine.y);
  }
  return null;
}

function communicableExamineTarget(){
  const target = examineTarget();
  if(target && typeof target === 'object' && target.type === 'creature' && target.enemy?.canCommunicate && !target.enemy?.commRefused) return target.enemy;
  return null;
}

function civilizationExamineTarget(){
  if(!G.examine || G.mode !== 'planet') return null;
  const pdata = G.planets?.[G.curPlanet];
  const cell = pdata?.grid?.[G.examine.y]?.[G.examine.x];
  if(!pdata?.civilization || !cell || !CIV_TILE_TYPES.has(cell.type)) return null;
  return { pdata, cell, x:G.examine.x, y:G.examine.y };
}

function civilizationContactTargetAtPlayer(){
  if(G.mode !== 'planet') return null;
  const pdata = G.planets?.[G.curPlanet];
  if(!pdata?.civilization) return null;
  let best = null;
  for(let dy=-1; dy<=1; dy++) for(let dx=-1; dx<=1; dx++){
    const x = (G.player?.x || 0) + dx;
    const y = (G.player?.y || 0) + dy;
    const cell = pdata.grid?.[y]?.[x];
    if(!cell || !CIV_TILE_TYPES.has(cell.type)) continue;
    const d = Math.max(Math.abs(dx), Math.abs(dy));
    if(!best || d < best.d) best = { pdata, cell, x, y, d };
  }
  if(best) return best;
  const local = (G.enemies?.[G.curPlanet] || []).find(e=>
    e.alive && !e.hidden && e.civLocal &&
    Math.max(Math.abs(e.x-(G.player?.x||0)), Math.abs(e.y-(G.player?.y||0))) <= 1
  );
  if(local) return { pdata, cell:{ type:'civ_local' }, x:local.x, y:local.y, local };
  return null;
}

function creatureExamineTarget(){
  const target = examineTarget();
  if(target && typeof target === 'object' && target.type === 'creature' && target.enemy?.alive) return target.enemy;
  return null;
}

function creaturePlayerDistance(e){
  if(!e || G.mode !== 'planet') return Infinity;
  return Math.max(Math.abs((G.player?.x || 0) - e.x), Math.abs((G.player?.y || 0) - e.y));
}

function canExamineCreatureDetails(e){
  return creaturePlayerDistance(e) <= 2;
}

function canCommunicateWithCreature(e){
  const d = creaturePlayerDistance(e);
  const range = e.commRange ?? 1;
  return d <= range;
}

function canCommunicateWithCivilization(target){
  if(!target || G.mode !== 'planet') return false;
  const d = Math.max(Math.abs((G.player?.x || 0) - target.x), Math.abs((G.player?.y || 0) - target.y));
  return d <= 1;
}

function creatureCommunicationFailure(e){
  if(!e) return 'There is nothing there to communicate with.';
  if(e.commRefused) return e.name+' refuses further contact.';
  if(e.behaviour === 'DOCILE') return e.name+' watches the signal, then returns to simple animal concerns.';
  if(e.behaviour === 'COWARD') return e.name+' recoils from the attempt. Fear drowns out any shared meaning.';
  if(e.behaviour === 'STALK') return e.name+' gives no sign of understanding. It is reading movement, not language.';
  return e.name+' does not respond to the signal. No shared language or intent comes through.';
}

function civilizationLocalExamineHtml(e, detailVisible){
  const pdata = G.planets?.[e.civPlanetKey || G.curPlanet];
  const civ = pdata?.civilization;
  const state = ensureCivilizationState(pdata);
  const tier = civ?.tierLabel || 'Unknown';
  const species = civ?.species || 'Local';
  const relation = civRelationLabel(state);
  const relationCol = state?.hostile ? '#ff6644' :
    relation === 'Friendly'  ? '#70f090' :
    relation === 'Receptive' ? '#90f0a0' :
    relation === 'Curious'   ? '#ffe066' :
    relation === 'Alarmed'   ? '#ff9955' :
    relation === 'Hostile'   ? '#ff6644' : '#aaaacc';
  const healthDesc = creatureHealthDesc(e.hp, e.maxHp);
  const healthCol  = e.hp/e.maxHp >= 0.5 ? '#88cc55' : e.hp/e.maxHp >= 0.25 ? '#ffaa44' : '#ff5533';
  const contactReady = Math.max(Math.abs(e.x-(G.player?.x||0)), Math.abs(e.y-(G.player?.y||0))) <= 1 && !state?.hostile;

  const isPrimitive    = civ?.tier === 'primitive';
  const isHostileAgg   = civ?.aggression === 'Hostile';
  const isTerritorial  = civ?.aggression === 'Territorial';

  let html = `<div style="color:#ffe066;font-size:14px;font-weight:bold;margin-bottom:4px">${detailVisible ? htmlEsc(e.name || (species+(isPrimitive?' Hunter-Gatherer':' Local'))) : 'Unidentified local'}</div>`;
  html += `<div style="color:#888899;font-size:12px;margin-bottom:8px;font-style:italic">${detailVisible ? htmlEsc(tier+' '+species+(isPrimitive ? '' : ' civilian')) : 'A settlement figure at the edge of reliable detail'}</div>`;
  html += `<div style="color:#334455;height:1px;background:#223344;margin-bottom:8px"></div>`;

  if(!detailVisible){
    html += `<div style="color:#aaaaaa;font-size:12px;line-height:1.5;margin-bottom:10px">Too far to read posture, tools, or social cues. Move within 2 tiles to examine details.</div>`;
    html += `<div style="font-size:12px;line-height:1.9">`;
    html += `<span style="color:#445566">Range: </span><span style="color:#aaaacc">${creaturePlayerDistance(e)} tiles</span><br>`;
    html += `<span style="color:#445566">Movement: </span><span style="color:#aaaacc">${e.stunTurns > 0 ? 'Stunned' : htmlEsc(planetCritterSpeedLabel(e))}</span>`;
    html += `</div>`;
    return html;
  }

  const roleText = state?.hostile
    ? 'Part of a group now responding as an enemy force.'
    : isHostileAgg
    ? 'Part of a group that attacks strangers on sight. No contact is possible.'
    : isPrimitive
    ? 'A hunter-gatherer of the '+htmlEsc(species)+' people.'
    : isTerritorial
    ? 'A local who will defend their territory. They may talk, but only to issue demands.'
    : 'A civilian inhabitant of the settlement.';
  html += `<div style="color:#aaaaaa;font-size:12px;line-height:1.5;margin-bottom:10px">${roleText}</div>`;
  html += `<div style="font-size:12px;line-height:1.9">`;
  html += `<span style="color:#445566">Civilization: </span><span style="color:#d8c48a">${htmlEsc(tier+' '+species)}</span><br>`;
  if(civ?.traits){
    html += `<span style="color:#556677;font-size:11px">${htmlEsc(civTraitSummary(civ))}</span><br>`;
  }
  if(civ?.aggression){
    const aggCol = isHostileAgg ? '#ff6644' : isTerritorial ? '#ff9944' : '#88cc88';
    html += `<span style="color:#445566">Disposition: </span><span style="color:${aggCol}">${isHostileAgg ? 'Hostile — attacks on sight' : isTerritorial ? 'Territorial — will confront intruders' : htmlEsc(civ.aggression)}</span><br>`;
  }
  html += `<span style="color:#445566">Relation: </span><span style="color:${relationCol}">${htmlEsc(relation)}</span><br>`;
  html += `<span style="color:#445566">Alert: </span><span style="color:${(state?.alert||0)>=4?'#ff6644':(state?.alert||0)>=2?'#ff9955':'#88cc88'}">${state?.alert || 0}/5</span><br>`;
  if(state?.hostile) html += `<span style="color:#445566">Response: </span><span style="color:${state.hostileResponse === 'fight' ? '#ff8866' : '#ffaa44'}">${state.hostileResponse === 'fight' ? 'mobilizing defenders' : 'panic flight'}</span><br>`;
  html += `<span style="color:#445566">Comprehension: </span><span style="color:#70d8ff">${htmlEsc(civComprehension(civ, state))}</span><br>`;
  html += `<span style="color:#445566">Contact: </span><span style="color:#70d8ff">${htmlEsc(civContactMethod(civ))}</span><br>`;
  html += `<span style="color:#445566">Movement: </span><span style="color:#aaaacc">${e.stunTurns > 0 ? 'Stunned' : htmlEsc(planetCritterSpeedLabel(e))}</span><br>`;
  html += `<span style="color:#445566">Intent: </span><span style="color:#aaaacc">${htmlEsc(e.intent || (state?.hostile ? 'Driving the crew away' : 'Watching the away team'))}</span><br>`;
  html += `<span style="color:#445566">Condition: </span><span style="color:${healthCol}">${healthDesc}</span>`;
  if(state?.tradeUnlocked && !state?.hostile) html += `<br><span style="color:#445566">Trade: </span><span style="color:#90f0a0">local exchange permitted</span>`;
  if(state?.guidanceUnlocked && !state?.hostile) html += `<br><span style="color:#445566">Guidance: </span><span style="color:#90f0a0">local knowledge available</span>`;
  if(state?.safeConductUnlocked && !state?.hostile) html += `<br><span style="color:#445566">Standing: </span><span style="color:#90f0a0">${state.boundaryLifted ? 'trusted visitor — full access' : state.permitGranted ? 'documented visitor' : 'safe conduct possible'}</span>`;
  if(state?.boundaryPromise?.active && !state?.boundaryPromise?.broken && !state?.boundaryLifted && !state?.hostile){
    const allowed = state.boundaryPromise.mode === 'allowed_zone';
    html += `<br><span style="color:${allowed?'#80dd88':'#ff9944'}">${allowed ? 'Landing zone active — stay inside the ' : 'Boundary active — stay clear of the '}${htmlEsc(state.boundaryPromise.label)}.</span>`;
  }
  if(state?.hostile || isHostileAgg) html += `<br><span style="color:#aa5544">No communication — attacks on sight.</span>`;
  else if(contactReady) html += `<br><div style="display:inline-block;margin-top:7px;background:${isTerritorial?'#2e1a1a':'#1a2e1a'};border:1px solid ${isTerritorial?'#7a3a3a':'#3a7a3a'};border-radius:3px;padding:3px 10px;color:${isTerritorial?'#f09090':'#90f0a0'};font-size:13px;font-weight:bold;letter-spacing:0.5px"><span style="color:${isTerritorial?'#f07070':'#70f090'}">[C]</span> ${isTerritorial ? 'Answer their challenge' : 'Talk to local'}</div>`;
  else html += `<br><span style="color:#667788">Move adjacent to ${isHostileAgg ? 'engage in combat' : isTerritorial ? 'answer their challenge' : 'communicate'}.</span>`;
  html += `</div>`;
  return html;
}

function attemptCreatureCommunication(){
  const target = creatureExamineTarget();
  if(!target) return false;
  if(!canCommunicateWithCreature(target)){
    const commRange = target.commRange ?? 1;
    const closeEnoughMsg = commRange <= 1 ? 'Move adjacent to' : 'Move within '+ commRange +' tiles of';
    addLog(closeEnoughMsg+' '+target.name+' to attempt communication.','li');
    renderAll();
    return true;
  }
  if(target.canCommunicate && !target.commRefused){
    if(target.civLocal) startCivilizationDialogue({ pdata:G.planets?.[G.curPlanet], cell:{ type:'civ_local' }, x:target.x, y:target.y, local:target });
    else startAlienDialogue(target);
  } else {
    addLog(creatureCommunicationFailure(target), 'li');
    renderAll();
  }
  return true;
}

function attemptPlanetCommunication(){
  if(attemptCreatureCommunication()) return true;
  const target = G.examine ? civilizationExamineTarget() : civilizationContactTargetAtPlayer();
  if(!target) return false;
  if(!canCommunicateWithCivilization(target)){
    addLog('Move adjacent to the '+civilizationTileName(target.cell.type).toLowerCase()+' to attempt contact.','li');
    renderAll();
    return true;
  }
  startCivilizationDialogue(target);
  return true;
}

function alienRefusesCommunication(e){
  return !!(e && e.canCommunicate && e.commRefused);
}

function makeCommunicableAlienHostile(e, intent, refuseCommunication=true){
  if(!e?.canCommunicate) return;
  e.pacifiedByComm = false;
  e.commRefused = !!refuseCommunication;
  e.backingOff = false;
  e.currentlyHostile = true;
  e.hostileByDefault = !!refuseCommunication;
  e.attitude = 'Hostile';
  e.intent = intent || 'Defending itself from the crew';
}

function makeCivilizationHostile(pdata, reason){
  if(!pdata?.civilization) return false;
  const civ = pdata.civilization;
  const state = ensureCivilizationState(pdata);
  if(state){
    state.relation = -5;
    state.alert = 5;
    state.hostile = true;
    state.tradeUnlocked = false;  // trade rapport is void once hostile
    if(!state.hostileResponse) state.hostileResponse = civilizationHostileResponse(civ);
  }
  const key = Object.keys(G.planets || {}).find(k=>G.planets[k] === pdata) || G.curPlanet;
  const response = state?.hostileResponse || 'flee';
  (G.enemies?.[key] || []).forEach(local=>{
    if(local.civLocal){
      local.currentlyHostile = response === 'fight';
      local.hostileByDefault = true;
      local.commRefused = true;
      local.attitude = 'Hostile';
      local.intent = response === 'fight' ? (reason || 'Driving the crew away') : 'Fleeing in terror';
    }
  });
  if(response === 'fight' && !state?.reinforcementsSpawned){
    const spawned = spawnCivilizationDefenders(key, pdata);
    if(state) state.reinforcementsSpawned = true;
    if(spawned > 0) addLog('Settlement alarm spreads. '+spawned+' local defenders move in!','lc');
  } else if(response === 'flee' && !state?.panicAnnounced){
    if(state) state.panicAnnounced = true;
    addLog('Panic spreads through the settlement. Locals scatter from the away team.','lw');
  }
  return true;
}

function civilizationSettlementCluster(pdata, origin, radius=6){
  const buildings = civilizationBuildingPositions(pdata);
  if(!buildings.length) return [];
  const ox = Number.isFinite(origin?.x) ? origin.x : G?.player?.x;
  const oy = Number.isFinite(origin?.y) ? origin.y : G?.player?.y;
  if(!Number.isFinite(ox) || !Number.isFinite(oy)) return [];
  const direct = buildings.find(b=>b.x === ox && b.y === oy);
  if(direct) return [direct];
  const near = buildings
    .map(b=>({ ...b, d:Math.max(Math.abs(b.x-ox), Math.abs(b.y-oy)) }))
    .filter(b=>b.d <= radius)
    .sort((a,b)=>a.d-b.d);
  if(near.length) return [near[0]];
  const nearest = buildings
    .map(b=>({ ...b, d:Math.max(Math.abs(b.x-ox), Math.abs(b.y-oy)) }))
    .sort((a,b)=>a.d-b.d)[0];
  return nearest ? [nearest] : [];
}

function ruinCivilizationSettlement(pdata, origin, reason){
  if(!pdata?.civilization) return false;
  const state = ensureCivilizationState(pdata);
  const cluster = civilizationSettlementCluster(pdata, origin);
  const tier = pdata.civilization.tier;
  const ruinChance = { primitive:1, tribal:0.85, medieval:0.65, industrial:0.4, information:0.25 }[tier] ?? 0.7;
  let ruined = 0;
  cluster.forEach(pos=>{
    const cell = pdata.grid?.[pos.y]?.[pos.x];
    if(cell && CIV_TILE_TYPES.has(cell.type) && Math.random() < ruinChance){
      pdata.grid[pos.y][pos.x] = {
        type:'civ_ruin',
        formerType:cell.type,
        formerCivKey:cell.civKey,
        ruinReason:reason || 'settlement attacked',
      };
      ruined++;
    }
  });
  if(state && ruined > 0) state.ruinedSettlementCount = (state.ruinedSettlementCount || 0) + 1;
  if(ruined > 0) addLog('The settlement is left in ruins. '+ruined+' structure'+(ruined===1?'':'s')+' wrecked.','lc');
  else addLog('The attack damages the settlement, but its structures hold under the assault.','lw');
  return ruined > 0;
}

function spawnCivilizationAssaultResponse(pdata, origin){
  if(!pdata?.civilization) return;
  const key = Object.keys(G.planets || {}).find(k=>G.planets[k] === pdata) || G.curPlanet;
  const state = ensureCivilizationState(pdata);
  const response = state?.hostileResponse || civilizationHostileResponse(pdata.civilization);
  if(response === 'fight'){
    const spawned = spawnCivilizationDefenders(key, pdata, { assault:true, origin });
    if(spawned > 0) addLog('Settlement alarm surges. '+spawned+' defenders answer the attack.','lc');
  } else {
    const locals = (G.enemies?.[key] || []).filter(e=>e.alive && !e.hidden && e.civLocal && !e.civCombatant);
    const tierFlee = { primitive:3, tribal:4, medieval:5, industrial:6, information:7 }[pdata.civilization.tier] || 4;
    locals
      .map(e=>({ e, d:Number.isFinite(origin?.x) ? Math.max(Math.abs(e.x-origin.x), Math.abs(e.y-origin.y)) : 0 }))
      .sort((a,b)=>a.d-b.d)
      .slice(0, tierFlee)
      .forEach(({e})=>{
        e.currentlyHostile = false;
        e.hostileByDefault = true;
        e.commRefused = true;
        e.attitude = 'Panicked';
        e.intent = 'Fleeing the settlement attack';
      });
    if(locals.length) addLog('Locals scatter from the attack, fleeing between structures.','lw');
  }
}

function makeCivilizationHostileFromLocal(e, reason){
  if(!e?.civLocal) return false;
  const pdata = G.planets?.[e.civPlanetKey || G.curPlanet];
  return makeCivilizationHostile(pdata, reason);
}

