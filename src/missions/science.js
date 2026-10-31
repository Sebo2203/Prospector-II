const SCIENCE_JOB_COOLDOWN_MIN = 55;
const SCIENCE_JOB_COOLDOWN_VAR = 36;
const SCIENCE_JOB_TYPES = [
  'artifact',
  'research_ship',
  'civilization',
  'alien_corpses',
  'biodata',
  'data_box',
];

function rollScienceJobCooldown(){
  return SCIENCE_JOB_COOLDOWN_MIN + rnd(SCIENCE_JOB_COOLDOWN_VAR);
}

function ensureScienceJobState(){
  if(!G.scienceJob) G.scienceJob = { active:null, cooldownUntil:0, nextIndex:0, completed:0, completedTypes:[] };
  if(G.scienceJob.cooldownUntil === undefined) G.scienceJob.cooldownUntil = 0;
  if(G.scienceJob.nextIndex === undefined) G.scienceJob.nextIndex = 0;
  if(G.scienceJob.completed === undefined) G.scienceJob.completed = 0;
  if(!Array.isArray(G.scienceJob.completedTypes)) G.scienceJob.completedTypes = [];
  if(!Array.isArray(G.scienceJob.reportedCivilizations)) G.scienceJob.reportedCivilizations = [];
  if(!G.scienceJob.serial) G.scienceJob.serial = 0;
  return G.scienceJob;
}

function remainingScienceJobTypes(){
  const state = ensureScienceJobState();
  const done = new Set(state.completedTypes || []);
  const eligible=SCIENCE_JOB_TYPES.filter(type=>{
    if(type==='data_box') return (G.shipStats?.cargoCapacity||0)>(G.cargo||[]).length;
    if(type==='artifact') return G.galaxy?.some(row=>row.some(cell=>cell.type==='SYSTEM' && cell.planets?.some(p=>p.biome==='ANCIENT')));
    return true;
  });
  const different=eligible.filter(type=>type!==state.lastType);
  const pool=different.length?different:eligible;
  return [...pool.filter(type=>!done.has(type)),...pool.filter(type=>done.has(type))];
}

function scienceJobName(job){
  if(!job) return 'Research job';
  return ({
    artifact:      'Recover ancient artifact',
    research_ship: 'Lost research ship',
    civilization:  'Intelligent civilization survey',
    alien_corpses: 'Alien corpse return',
    biodata:       'Biomass data return',
    data_box:      'Secured data delivery',
  })[job.type] || 'Research job';
}

function compassFromShip(tx, ty){
  const dx = tx - G.ship.x, dy = ty - G.ship.y;
  if(Math.abs(dx) < 2 && Math.abs(dy) < 2) return 'very close';
  const adx = Math.abs(dx), ady = Math.abs(dy);
  let dir = '';
  if(ady > adx * 0.4) dir += dy < 0 ? 'north' : 'south';
  if(adx > ady * 0.4) dir += (dir ? '-' : '') + (dx > 0 ? 'east' : 'west');
  return dir || 'nearby';
}

function scienceJobDistance(tx, ty){
  const d = Math.abs(tx - G.ship.x) + Math.abs(ty - G.ship.y);
  if(d < 8) return 'close, about '+d+' jumps';
  if(d < 20) return 'roughly '+d+' jumps out';
  return 'deep range, around '+d+' jumps';
}

function findScienceJobPlanet(filterFn){
  const found = [];
  for(let y=0;y<MAP_H;y++){
    for(let x=0;x<MAP_W;x++){
      const cell = G.galaxy?.[y]?.[x];
      if(!cell || cell.type !== 'SYSTEM' || !cell.planets) continue;
      cell.planets.forEach((p, idx)=>{
        if(filterFn(p, cell, idx)) found.push({ x, y, system:cell, planet:p, planetIdx:idx });
      });
    }
  }
  return found.length ? found[rnd(found.length)] : null;
}

function findScienceJobVoidTile(){
  const candidates=[],range=Math.min(30,Math.max(10,Math.floor(G.maxFuel/3)));
  for(let y=Math.max(1,G.ship.y-range);y<Math.min(MAP_H-1,G.ship.y+range+1);y++){
    for(let x=Math.max(1,G.ship.x-range);x<Math.min(MAP_W-1,G.ship.x+range+1);x++){
      const distance=Math.abs(x-G.ship.x)+Math.abs(y-G.ship.y);
      if(distance<8 || distance>range || G.galaxy[y][x].type!=='VOID' || G.galaxy[y][x]._npcStranded) continue;
      if((G.npcStranded||[]).some(s=>Math.abs(s.x-x)+Math.abs(s.y-y)<5)) continue;
      candidates.push({x,y});
    }
  }
  return candidates.length?candidates[rnd(candidates.length)]:null;
}

function scienceJobDetail(){
  const state = ensureScienceJobState();
  const job = state.active;
  if(job) return scienceJobName(job)+' — '+(job.status || 'in progress')+' — '+job.reward+' cr';
  const remaining = remainingScienceJobTypes();
  if(!remaining.length) return 'No remaining field contracts';
  if(G.turn < state.cooldownUntil) return 'New field work in '+(state.cooldownUntil-G.turn)+' turns';
  const nextType = remaining[state.nextIndex % remaining.length];
  return 'Available: '+scienceJobName({type:nextType});
}

function startScienceJob(){
  const state = ensureScienceJobState();
  if(state.active){
    return completeScienceJob();
  }
  if(G.turn < state.cooldownUntil){
    addLog('Science Office has no field work available right now. Check back later.','li');
    return false;
  }

  const remaining = remainingScienceJobTypes();
  if(!remaining.length){
    addLog('Science Office has no remaining field contracts for this sector.','li');
    return false;
  }
  const type = remaining[state.nextIndex % remaining.length];
  let job = { type, id:'science:'+(state.serial+1), startedTurn:G.turn, reward:0, status:'in progress' };

  if(type === 'artifact'){
    // Artifact contracts must point at a real ancient world: normal planet generation
    // only guarantees an artifact spawn on ANCIENT planets.
    const target = findScienceJobPlanet(p=>p.biome==='ANCIENT');
    job.reward = 650;
    if(target){
      job.target = { x:target.x, y:target.y, planetIdx:target.planetIdx, systemName:target.system.name, planetName:target.planet.name };
      job.status = 'recover the artifact from an ancient world';
      addLog('Science contract accepted: recover an ancient artifact from a confirmed ancient world.','lg');
      addLog('Intel is vague but solid: '+target.planet.name+' in '+target.system.name+' lies '+compassFromShip(target.x,target.y)+', '+scienceJobDistance(target.x,target.y)+'.','li');
    } else {
      addLog('No confirmed ancient worlds are currently on the sector charts. Science Office cannot issue that contract yet.','lw');
      return false;
    }
  } else if(type === 'research_ship'){
    const spot = findScienceJobVoidTile();
    if(!spot){ addLog('No suitable search area found for a lost research ship. Try later.','lw'); return false; }
    const name = 'RSV '+pick(['Kepler','Aster','Tsiolkovsky','Curie','Mendel','Sagan']);
    const mapKey = spot.x+','+spot.y+':research:'+job.id;
    const ship = { x:spot.x, y:spot.y, type:'research', name, mapKey, age:0, noSos:true, scienceJob:true };
    if(!G.npcStranded) G.npcStranded = [];
    G.npcStranded.push(ship);
    G.galaxy[spot.y][spot.x]._npcStranded = ship;
    job.reward = 900;
    // Last-known position may have drifted — ship was still moving when it sent its final fix.
    // Roll drift: 40% no drift, 35% 1-2 tiles, 25% 3-5 tiles.
    const driftRoll = Math.random();
    let driftMag = 0;
    if(driftRoll < 0.40) driftMag = 0;
    else if(driftRoll < 0.75) driftMag = 1 + rnd(2);   // 1 or 2
    else driftMag = 3 + rnd(3);                          // 3, 4, or 5
    const driftAngle = Math.random() * Math.PI * 2;
    const reportedX = Math.round(spot.x + Math.cos(driftAngle) * driftMag);
    const reportedY = Math.round(spot.y + Math.sin(driftAngle) * driftMag);
    job.target = { x:spot.x, y:spot.y, reportedX, reportedY, mapKey, shipName:name };
    job.status = 'retrieve research data';
    addLog('Science contract accepted: find the lost research ship '+name+'.','lg');
    if(driftMag === 0){
      addLog('Last fix: sector '+(reportedX+1)+','+(reportedY+1)+'. Signal was clean — position should be reliable. No SOS beacon detected.','li');
    } else if(driftMag <= 2){
      addLog('Last fix: sector '+(reportedX+1)+','+(reportedY+1)+' — ship was underway when signal cut out. Drift likely minor.','li');
      addLog('No SOS beacon detected. Check the reported sector and nearby tiles.','lw');
    } else {
      addLog('Last fix: sector '+(reportedX+1)+','+(reportedY+1)+' — but the beacon died mid-transit. Position confidence is low.','li');
      addLog('No SOS beacon detected. Conduct a wider search around the reported coordinates.','lw');
    }
  } else if(type === 'civilization'){
    job.reward = 750;
    job.status = 'locate a civilization and return survey data';
    addLog('Science contract accepted: locate an intelligent civilization and file the survey.','lg');
    addLog('Habitable worlds are the best candidates. A full scan or landing survey will confirm it.','li');
  } else if(type === 'alien_corpses'){
    job.reward = 700;
    job.required = 5;
    job.status = 'return 5 alien corpses';
    addLog('Science contract accepted: return 5 alien corpses. Combat crews will be useful.','lg');
  } else if(type === 'biodata'){
    job.reward = 800;
    job.required = 20;
    job.status = 'return 20 biomass data samples';
    addLog('Science contract accepted: return 20 biodata samples. Toxic and habitable worlds are promising.','lg');
  } else if(type === 'data_box'){
    const here = G.base?.stationName || 'Starbase Alpha';
    const targetStation = here === 'Starbase Alpha' ? 'Waypoint Omega' : 'Starbase Alpha';
    job.reward = 500;
    job.targetStation = targetStation;
    job.status = 'deliver data box to '+targetStation;
    if(!addCargo({ name:'Secured Data Box', shortName:'Data Box', symbol:'▣', col:'#66ccff', desc:'Science Office delivery to '+targetStation+'.', value:0, questItem:'science_data_box', targetStation })){
      addLog('Cargo hold full. Make room before accepting a secured data delivery.','lw');
      return false;
    }
    addLog('Science contract accepted: deliver secured data box to '+targetStation+'.','lg');
  }

  state.active = job;
  state.serial++;
  state.nextIndex = remaining.length > 1 ? rnd(remaining.length) : 0;
  recordExpeditionEvent(job.id+':accepted','contract','Accepted '+scienceJobName(job)+'. '+job.reward+' cr on completion.');
  trackEvent('science_job_taken', analyticsBaseParams({
    job_type: job.type,
    reward: job.reward || 0,
  }));
  return true;
}

function countInventoryByName(name){
  return (G.inventory||[]).filter(i=>i.name === name).length;
}

function scienceSaleItems(){
  const reserved=scienceJobReservedItemNames(ensureScienceJobState().active);
  return (G.inventory||[]).filter(item=>(item.value||0)>0 && !item.usable && !item.questItem &&
    !item.isCapturedCreature && !reserved.has(item.name));
}

function closeResearchShipContract(job){
  if(job?.type!=='research_ship') return;
  const ship=(G.npcStranded||[]).find(s=>s.mapKey===job.target?.mapKey);
  if(ship){ship.type='dead';ship.boarded=true;ship.boardedAge=0;ship.scienceJob=false;}
}

function abandonScienceJob(){
  const state=ensureScienceJobState(),job=state.active;
  if(!job) return false;
  closeResearchShipContract(job);
  if(job.type==='data_box') G.cargo=G.cargo.filter(item=>item.questItem!=='science_data_box');
  state.active=null;state.lastType=job.type;state.cooldownUntil=G.turn+rollScienceJobCooldown();
  recordExpeditionEvent((job.id||'science:legacy:'+state.completed)+':abandoned','contract','Relinquished '+scienceJobName(job)+' at the Science Office. No payment received.');
  addLog('Contract relinquished. No payment received; replacement work follows the usual cooldown.','li');
  return true;
}

function removeInventoryByName(name, count){
  if(countInventoryByName(name) < count) return false;
  let left = count;
  G.inventory = (G.inventory||[]).filter(i=>{
    if(left > 0 && i.name === name){ left--; return false; }
    return true;
  });
  return left === 0;
}

function scienceJobReservedItemNames(job){
  if(!job) return new Set();
  if(job.type === 'artifact') return new Set(['Ancient Artifact']);
  if(job.type === 'research_ship') return new Set(['Research Ship Data']);
  if(job.type === 'alien_corpses') return new Set(['Alien Corpse']);
  if(job.type === 'biodata') return new Set(['Biodata Sample']);
  return new Set();
}

function completeScienceJob(){
  const state = ensureScienceJobState();
  const job = state.active;
  if(!job){ addLog('No active Science Office job.','li'); return false; }
  let done = false;

  if(job.type === 'artifact'){
    done = removeInventoryByName('Ancient Artifact', 1);
    if(!done) addLog('Science Office still needs an ancient artifact.','li');
  } else if(job.type === 'research_ship'){
    const index=G.inventory.findIndex(item=>item.name==='Research Ship Data' && (!job.id || item.scienceJobId===job.id));
    if(index>=0){G.inventory.splice(index,1);done=true;}
    if(!done) addLog('Science Office still needs the lost ship data.','li');
  } else if(job.type === 'civilization'){
    const civSurvey = Object.entries(G.planets||{}).find(([key,p])=>p.civilization &&
      !state.reportedCivilizations.includes(key) && p.visited?.some(Boolean) && getSurveySaleValue(p)>0);
    if(civSurvey){
      state.reportedCivilizations.push(civSurvey[0]);
      done = true;
    } else {
      addLog('Science Office needs documented survey data from a civilization not already reported under a contract.','li');
    }
  } else if(job.type === 'alien_corpses'){
    done = removeInventoryByName('Alien Corpse', job.required || 5);
    if(!done) addLog('Science Office needs '+(job.required||5)+' alien corpses. You have '+countInventoryByName('Alien Corpse')+'.','li');
  } else if(job.type === 'biodata'){
    done = removeInventoryByName('Biodata Sample', job.required || 20);
    if(!done) addLog('Science Office needs '+(job.required||20)+' biodata samples. You have '+countInventoryByName('Biodata Sample')+'.','li');
  } else if(job.type === 'data_box'){
    addLog('Deliver the secured data box to '+job.targetStation+'.','li');
    return false;
  }

  if(!done) return false;
  earnCredits(job.reward || 0);
  trackEvent('science_job_completed', analyticsBaseParams({
    job_type: job.type,
    reward: job.reward || 0,
    started_turn: job.startedTurn || 0,
    mission_turns: Math.max(0, (G.turn || 0) - (job.startedTurn || 0)),
  }));
  if(!(state.completedTypes||[]).includes(job.type)) state.completedTypes.push(job.type);
  state.lastType=job.type;
  closeResearchShipContract(job);
  recordExpeditionEvent((job.id||'science:legacy:'+state.completed)+':complete','contract','Completed '+scienceJobName(job)+'. Earned '+(job.reward||0)+' cr.');
  state.active = null;
  state.cooldownUntil = G.turn + rollScienceJobCooldown();
  state.completed = (state.completed||0) + 1;
  // Per-type debrief from the Science Office
  if(job.type === 'research_ship'){
    addLog('Science Office debrief: "These findings are distressing. It seems this sector is far more dangerous than we thought."','lg');
  } else if(job.type === 'civilization'){
    addLog('Science Office debrief: "Outstanding work. First contact documentation of this quality is rare. The academic community will be very pleased."','lg');
  } else if(job.type === 'artifact'){
    addLog('Science Office debrief: "Your services are of extreme use to us. We shall find you useful again next time."','lg');
  } else if(job.type === 'alien_corpses'){
    addLog('Science Office debrief: "Specimen condition is acceptable. Xenobiology will begin analysis immediately."','lg');
  } else if(job.type === 'biodata'){
    addLog('Science Office debrief: "Solid sample yield. This data will keep the lab busy for months."','lg');
  }
  addLog('Science Office job complete: '+scienceJobName(job)+'. +' +(job.reward||0)+' cr.','lg');
  if(remainingScienceJobTypes().length){
    addLog('Science Office says they may have more field work later.','li');
  } else {
    addLog('Science Office says that was the last open field contract in this sector.','li');
  }
  if(G.credits>=10000) addLog('10,000 cr reached visit the Science Office to retire.','lg');
  return true;
}

function seedResearchShipJobMap(mapKey){
  const job = ensureScienceJobState().active;
  if(!job || job.type !== 'research_ship' || job.target?.mapKey !== mapKey) return;
  const pdata = G.planets[mapKey];
  if(!pdata || pdata._scienceJobSeeded) return;
  pdata._scienceJobSeeded = true;
  // Damage can carve detached floor pockets into the hull. Objectives and
  // defenders must belong to the deck reachable from the boarding airlock.
  const reachable=new Set([pdata.spawnX+','+pdata.spawnY]),queue=[{x:pdata.spawnX,y:pdata.spawnY}];
  for(let i=0;i<queue.length;i++){
    const p=queue[i];
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const x=p.x+dx,y=p.y+dy,key=x+','+y;
      if(reachable.has(key)||!TILE[pdata.grid[y]?.[x]?.type]?.pass)continue;
      reachable.add(key);queue.push({x,y});
    }
  }
  const floors = [];
  for(let y=1;y<PH(pdata)-1;y++){
    for(let x=1;x<PW(pdata)-1;x++){
      const t = pdata.grid[y]?.[x]?.type;
      if(TILE[t]?.pass && reachable.has(x+','+y) && !(x===pdata.spawnX && y===pdata.spawnY)) floors.push({x,y});
    }
  }
  function takeFloor(){
    if(!floors.length) return null;
    return floors.splice(rnd(floors.length), 1)[0];
  }
  const consoleTile = takeFloor();
  if(consoleTile){
    pdata.grid[consoleTile.y][consoleTile.x] = { type:'station_console', scienceJobData:true, scienceJobId:job.id };
  }
  G.enemies[mapKey] = G.enemies[mapKey] || [];
  for(let i=0;i<3 && floors.length;i++){
    const p = takeFloor();
    G.enemies[mapKey].push({
      x:p.x, y:p.y, hp:i===0?28+rnd(8):14+rnd(8), maxHp:i===0?36:20, atk:i===0?6+rnd(3):4+rnd(3), def:i===0?2:1,
      type:'ALIEN',
      sprite:i===0?'alien_boss':'alien',
      name:i===0?'Nest Alpha':'Shipborne Alien',
      diet:'carnivore',
      behaviour:'HUNT',
      speedRating:i===0?3:2,
      hostileByDefault:true, currentlyHostile:true,
      territoryRange:12, calmRange:16,
      bodyLabel:i===0?'dominant alien predator':'alien drone organism',
      size:i===0?1.9:1.1,
      desc:i===0
        ? 'The largest of the ship\'s alien inhabitants. Its carapace is scarred from years aboard the derelict vessel. It moves with unsettling intelligence, and does not retreat.'
        : 'A smaller alien organism that has colonised the research vessel. It reacts with instinctive aggression to any intruder. Likely a worker or scout strain.',
      shipboardAlien:true,
      alive:true, hidden:false,
    });
  }
}

