// Saved facts, rather than parsed log messages, support the journal and endings.
function ensureExpeditionState(){
  if(!G) return null;
  if(!G.expedition) G.expedition = { version:1, events:[], surveys:{}, quarantine:null };
  const state = G.expedition;
  if(!Array.isArray(state.events)) state.events = [];
  if(!state.surveys) state.surveys = {};
  return state;
}

function recordExpeditionEvent(id, kind, text, details={}){
  const state = ensureExpeditionState();
  if(!state || state.events.some(event=>event.id===id)) return;
  state.events.push({ id, kind, text, turn:G.turn, ...details });
}

function recordSurveyFinding(body){
  if(!body || !['partial','full'].includes(body.targetDesc.scanState)) return;
  const state = ensureExpeditionState();
  const {pKey, targetDesc} = body;
  const pdata = G.planets?.[pKey];
  const coverage = pdata ? getScanCoverage(pdata.scanMask) : 0;
  state.surveys[pKey] = {
    name:targetDesc.name, biome:targetDesc.biome,
    scanState:targetDesc.scanState, coverage, turn:G.turn,
    civilization:coverage>0 && pdata?.civilization
      ? pdata.civilization.tierLabel+' '+pdata.civilization.species : null,
  };
  recordExpeditionEvent('survey:'+pKey, 'discovery', 'First scan recorded: '+targetDesc.name, {planetKey:pKey});
}

function placeQuarantineShip(){
  const state = ensureExpeditionState();
  if(state.quarantine) return;
  // A nearby empty tile gives the experiment an accessible first story without
  // overwriting a system, hazard, station, or another authored encounter.
  const candidates = [];
  for(let y=1;y<MAP_H-1;y++) for(let x=1;x<MAP_W-1;x++){
    const distance = Math.abs(x-G.ship.x)+Math.abs(y-G.ship.y);
    if(distance>=4 && distance<=7 && G.galaxy[y]?.[x]?.type==='VOID') candidates.push({x,y});
  }
  const position = candidates[rnd(candidates.length)];
  if(!position) return;
  state.quarantine = { ...position, status:'open', choice:null, settled:false };
  G.galaxy[position.y][position.x] = {type:'DERELICT', name:'Mercy of Dawn [quarantine]'};
  G.visited[position.y*MAP_W+position.x] = true; // coordinates came in the transmission
  recordExpeditionEvent('quarantine:signal', 'lead',
    'Distress transmission: Mercy of Dawn at '+position.x+','+position.y+'. Survivors report an unidentified fever.');
  addLog('Distress signal: Mercy of Dawn at '+position.x+','+position.y+'. [J] opens the expedition journal.','lw');
}

function quarantineAtShip(){
  const incident = ensureExpeditionState()?.quarantine;
  return G?.mode==='galaxy' && incident && incident.x===G.ship.x && incident.y===G.ship.y ? incident : null;
}

function openQuarantineReport(){
  const incident = quarantineAtShip();
  if(!incident) return;
  recordExpeditionEvent('quarantine:contact', 'discovery',
    'Mercy of Dawn: three survivors behind a sealed bulkhead; their fever has spread through the ship.');
  G._expeditionPanel = 'quarantine';
  renderAll();
}

function resolveQuarantine(choice){
  const incident = quarantineAtShip();
  if(!incident || incident.choice || !['isolated','open','beacon','salvage'].includes(choice)) return;
  const fuelCost = choice==='isolated' ? 20 : choice==='beacon' ? 5 : 0;
  if(G.fuel<fuelCost){ addLog('Insufficient fuel for that operation.','lw'); renderAll(); return; }
  // Rescue uses the vessel's life pod, not a normal cargo item that can be sold
  // or jettisoned. It needs neither a particular hull nor a rare equipment drop.
  G.fuel -= fuelCost;
  G.fuelSpent = (G.fuelSpent||0)+fuelCost;
  G.turn++;
  incident.choice = choice;
  incident.status = 'pending';
  incident.choiceTurn = G.turn;
  if(choice==='open'){
    const exposed = G.crew.find(c=>c.hp>0);
    if(exposed) applyCrewStatus(exposed, 'fever', {severity:1});
    adjustCrewMoraleBase(1);
  }
  if(choice==='isolated') adjustCrewMoraleBase(2);
  if(choice==='salvage'){ earnCredits(180); adjustCrewMoraleBase(-3); }
  const text = {
    isolated:'Transferred three survivors in a sealed life pod. Spent 20 fuel; take them to any major station for medical reception and a 300 cr rescue payment.',
    open:'Rescued three survivors through an open airlock. A crew member developed fever. Station screening will cost 120 cr from the 300 cr rescue payment.',
    beacon:'Spent 5 fuel powering a rescue beacon. The survivors remain sealed aboard. Ask at the next major station for the recovery report.',
    salvage:'Stripped emergency cargo for 180 cr, leaving the survivors without life support. Station inspection will assess an 80 cr penalty from these proceeds.',
  }[choice];
  recordExpeditionEvent('quarantine:choice', 'decision', text, {choice});
  addLog(text, choice==='salvage'?'lw':'lg');
  G._expeditionPanel = null;
  renderAll();
}

function settleQuarantineAtStation(stationName){
  const incident = ensureExpeditionState()?.quarantine;
  if(!incident?.choice || incident.settled) return;
  incident.settled = true;
  incident.status = 'closed';
  incident.stationName = stationName;
  const choice = incident.choice;
  let text;
  if(choice==='salvage'){
    // Never turn an inspection into debt or a station-access soft lock.
    const fine = Math.min(80, Math.max(0,G.credits));
    G.credits -= fine;
    G.stationReputation = (G.stationReputation||0)-2;
    text = stationName+': the Mercy of Dawn loss inquiry links your salvage to three deaths. Inspection penalty: '+fine+' cr. Station standing -2.';
  } else {
    const reward = choice==='beacon' ? 100 : choice==='open' ? 180 : 300;
    earnCredits(reward);
    const standing = choice==='isolated' ? 4 : choice==='open' ? 2 : 1;
    G.stationReputation = (G.stationReputation||0)+standing;
    text = stationName+': '+(choice==='beacon' ? 'recovery tug confirms all three survivors are safe.' :
      choice==='open' ? 'the survivors enter treatment. Screening deducted 120 cr; your crew still need fever care.' :
      'medical staff receive the sealed pod. All three survivors reach treatment without exposing your crew.')+
      ' Rescue payment: '+reward+' cr. Station standing +'+standing+'.';
  }
  recordExpeditionEvent('quarantine:aftermath', 'consequence', text, {stationName,choice});
  addLog(text, choice==='salvage'?'lw':'lg');
}

function expeditionLegacy(){
  const incident = ensureExpeditionState()?.quarantine;
  if(!incident) return 'The Mercy of Dawn distress call never reached this expedition.';
  if(!incident.choice) return 'The Mercy of Dawn distress call remained unanswered.';
  if(!incident.settled) return 'The Mercy of Dawn incident was still awaiting a station report.';
  return incident.choice==='salvage' ? 'Three lives lost aboard Mercy of Dawn; its cargo helped fund your career.' :
    incident.choice==='beacon' ? 'Your beacon brought a recovery tug to three stranded survivors.' :
    incident.choice==='isolated' ? 'Three survivors brought home safely in a sealed life pod.' :
    'Three survivors brought home; an open-airlock rescue exposed your crew to fever.';
}
