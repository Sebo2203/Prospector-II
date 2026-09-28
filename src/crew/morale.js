function ensureCrewMoraleState(){
  if(!G) return;
  ensureCrewStatusState();
  if(G.lastStarbaseTurn === undefined) G.lastStarbaseTurn = G.turn || 1;
  if(G.lastPayrollTurn === undefined) G.lastPayrollTurn = -9999;
  if(G.nextCrewTalkTurn === undefined) G.nextCrewTalkTurn = (G.turn || 1) + 12;
  if(G.nextCrewGalaxyTalkTurn === undefined) G.nextCrewGalaxyTalkTurn = (G.turn || 1) + 22;
  if(G.surveyCareerCredits === undefined) G.surveyCareerCredits = 0;
  if(G.surveyBonusTier === undefined) G.surveyBonusTier = 0;
  if(G.portStressPausedTurns === undefined) G.portStressPausedTurns = 0;
  if(G.portStressPauseStart === undefined) G.portStressPauseStart = null;
  (G.crew||[]).forEach(c=>{
    if(c.moraleBase === undefined) c.moraleBase = 55;
    if(c.grief === undefined) c.grief = 0;
    if(c.drinkGlow === undefined) c.drinkGlow = 0;
    if(c.drugRush === undefined) c.drugRush = 0;
    if(c.lowMoraleSince === undefined) c.lowMoraleSince = null;
    if(c.unpaidDocks === undefined) c.unpaidDocks = 0;
  });
}

function currentPlanetPausesPortStress(){
  if(!G || G.mode !== 'planet' || !G.curPlanet) return false;
  const pdata = G.planets?.[G.curPlanet];
  if(!pdata) return false;
  const biomeKey = atmosphereBiomeKey(G.curPlanet);
  return biomeKey === 'HABITABLE' || biomeKey === 'BLOOM' || pdata.biome === 'RINGWORLD' || pdata.isRingworld;
}

function syncPortStressPauseState(){
  if(!G) return;
  const turn = G.turn || 1;
  if(G.portStressPausedTurns === undefined) G.portStressPausedTurns = 0;
  if(G.portStressPauseStart === undefined) G.portStressPauseStart = null;
  if(currentPlanetPausesPortStress()){
    if(G.portStressPauseStart == null) G.portStressPauseStart = turn;
  } else if(G.portStressPauseStart != null){
    G.portStressPausedTurns += Math.max(0, turn - G.portStressPauseStart);
    G.portStressPauseStart = null;
  }
}

function effectiveTurnsAwayFromPort(){
  syncPortStressPauseState();
  const turn = G.turn || 1;
  const activePause = G.portStressPauseStart == null ? 0 : Math.max(0, turn - G.portStressPauseStart);
  return Math.max(0, turn - (G.lastStarbaseTurn || 1) - (G.portStressPausedTurns || 0) - activePause);
}

function timeAwayFromPortPenalty(){
  const effectiveAway = effectiveTurnsAwayFromPort();
  return effectiveAway <= 70 ? 0 : Math.min(42, Math.floor((effectiveAway - 70) / 18) * 6);
}

function crewMoraleScore(c){
  ensureCrewMoraleState();
  const awayPenalty = timeAwayFromPortPenalty();
  const score = (c.moraleBase || 55) + (c.drinkGlow || 0) + (c.drugRush || 0) - (c.grief || 0) - awayPenalty;
  return Math.max(0, Math.min(135, score));
}

function crewMoodFace(c){
  const s = crewMoraleScore(c);
  if(s >= 105) return ':D';
  if(s >= 72) return ':)';
  if(s >= 45) return ':|';
  if(s >= 22) return ':(';
  return ':{';
}

function updateCrewLowMoraleFlags(){
  ensureCrewMoraleState();
  (G.crew||[]).forEach(c=>{
    const low = crewMoraleScore(c) < 22;
    if(low && c.lowMoraleSince == null) c.lowMoraleSince = G.turn || 1;
    if(!low) c.lowMoraleSince = null;
  });
}

function adjustCrewMoraleBase(delta, livingOnly=true){
  ensureCrewMoraleState();
  (G.crew||[]).forEach(c=>{
    if(livingOnly && c.hp <= 0) return;
    c.moraleBase = Math.max(0, Math.min(100, (c.moraleBase || 55) + delta));
  });
  updateCrewLowMoraleFlags();
}

function applyCrewDeathMorale(deadCrew){
  ensureCrewMoraleState();
  (G.crew||[]).forEach(c=>{
    if(c.hp <= 0) return;
    c.grief = Math.min(45, (c.grief || 0) + 14);
    c.moraleBase = Math.max(0, (c.moraleBase || 55) - 8);
  });
  if(deadCrew?.length && G.crew.some(c=>c.hp>0)){
    const names = deadCrew.map(crewDisplayName).join(', ');
    addLog('The crew is shaken by the loss of '+names+'.','lw');
  }
  updateCrewLowMoraleFlags();
}

function boostCrewFromDrink(){
  ensureCrewMoraleState();
  (G.crew||[]).forEach(c=>{
    if(c.hp <= 0) return;
    c.drinkGlow = Math.min(16, (c.drinkGlow || 0) + 6);
    c.moraleBase = Math.min(100, (c.moraleBase || 55) + 3);
    c.grief = Math.max(0, (c.grief || 0) - 2);
  });
  updateCrewLowMoraleFlags();
}

function boostCrewFromDrugs(){
  ensureCrewMoraleState();
  (G.crew||[]).forEach(c=>{
    if(c.hp <= 0) return;
    c.drugRush = Math.min(60, (c.drugRush || 0) + 48);
    c.moraleBase = Math.min(100, (c.moraleBase || 55) + 6);
    c.grief = Math.max(0, (c.grief || 0) - 4);
  });
  updateCrewLowMoraleFlags();
}

function boostCrewFromMildAntidepressants(){
  ensureCrewMoraleState();
  (G.crew||[]).forEach(c=>{
    if(c.hp <= 0) return;
    c.drugRush = Math.min(28, (c.drugRush || 0) + 16);
    c.moraleBase = Math.min(100, (c.moraleBase || 55) + 2);
    c.grief = Math.max(0, (c.grief || 0) - 6);
  });
  updateCrewLowMoraleFlags();
}

function processCrewPayrollAtStarbase(stationName){
  ensureCrewMoraleState();
  const payable = (G.crew||[]).filter(c=>c.hp > 0 && c.role !== 'captain');
  if(!payable.length) return;
  if((G.turn || 1) - (G.lastPayrollTurn || -9999) < 30){
    return;
  }
  const payroll = payable.length * 10;
  if((G.credits || 0) >= payroll){
    G.credits -= payroll;
    G.lastPayrollTurn = G.turn || 1;
    payable.forEach(c=>{ c.unpaidDocks = 0; });
    addLog('Crew payroll paid at '+stationName+': '+payroll+' cr.','li');
    return;
  }
  payable.forEach(c=>{
    c.unpaidDocks = Math.min(4, (c.unpaidDocks || 0) + 1);
    c.moraleBase = Math.max(0, (c.moraleBase || 55) - 10);
  });
  G.lastPayrollTurn = G.turn || 1;
  addLog('You cannot cover crew payroll at '+stationName+'. Morale takes a hit.','lw');
  updateCrewLowMoraleFlags();
}

function resolveCrewResignationsAtStarbase(stationName){
  ensureCrewMoraleState();
  const quitters = (G.crew||[]).filter(c=>
    c.hp > 0 &&
    c.role !== 'captain' &&
    c.lowMoraleSince !== null &&
    (G.turn - c.lowMoraleSince) >= 80 &&
    crewMoraleScore(c) < 22 &&
    ((c.unpaidDocks || 0) >= 2 || (c.grief || 0) >= 20)
  );
  if(!quitters.length) return;
  quitters.forEach(c=>{
    addLog(crewDisplayName(c)+' terminates their contract at '+stationName+'.','lw');
  });
  const quitting = new Set(quitters);
  G.crew = G.crew.filter(c=>!quitting.has(c));
}

function maybeCrewPlanetTalk(pdata){
  ensureCrewMoraleState();
  if(!pdata || (G.turn || 1) < (G.nextCrewTalkTurn || 0)) return;
  if(Math.random() >= 0.055) return;
  const speakers = (G.crew||[]).filter(c=>c.hp > 0);
  if(!speakers.length) return;
  const c = pick(speakers);
  const mood = crewMoraleScore(c);
  const biome = pdata.isStrandedShip ? 'STRANDED_SHIP' : pdata.isDerelict ? 'DERELICT' : pdata.biome;
  let line = null;
  if(mood < 22){
    line = pick([
      '"We should wrap this up soon."',
      '"I am getting tired of living out of a suit."',
      '"Next dock, I need a real bed and a real wall between me and vacuum."',
    ]);
  } else if(mood > 72){
    line = pick([
      '"This is the kind of haul people brag about for years."',
      '"Not bad. We are actually making this work."',
    ]);
  } else if(biome === 'DERELICT' || biome === 'STRANDED_SHIP'){
    line = pick([
      '"Hear that? ...No, exactly. I hate this kind of quiet."',
      '"These dead ships always feel like they are still waiting for their crew."',
    ]);
  } else if(biome === 'ANCIENT' || pdata.isAncientStation){
    line = pick([
      '"Nobody built this for us, and somehow that is obvious from one glance."',
      '"If Science Office saw this with their own eyes, they would never let us leave."',
    ]);
  } else {
    line = pick([
      '"Readings are steady. For once."',
      '"Could be worse. At least the ground is mostly underneath us."',
      '"Keep moving. The ship coffee is not getting any warmer."',
    ]);
  }
  addLog(crewDisplayName(c)+': '+line,'li');
  G.nextCrewTalkTurn = (G.turn || 1) + 18 + rnd(18);
}

function maybeCrewGalaxyTalk(){
  ensureCrewMoraleState();
  if(G.mode !== 'galaxy' || (G.turn || 1) < (G.nextCrewGalaxyTalkTurn || 0)) return;
  const speakers = (G.crew||[]).filter(c=>c.hp > 0 && c.role !== 'captain');
  if(!speakers.length) return;
  const lowCrew = speakers.filter(c=>crewMoraleScore(c) < 45);
  const highCrew = speakers.filter(c=>crewMoraleScore(c) >= 72 || (c.drinkGlow || 0) >= 6);
  const drugHighCrew = speakers.filter(c=>(c.drugRush || 0) >= 18 || crewMoraleScore(c) >= 105);
  let pool = null;
  let line = null;
  if(lowCrew.length && Math.random() < 0.08){
    pool = lowCrew;
    line = pick([
      '"Another long stretch without decent shore leave."',
      '"Starting to forget what a station bunk feels like."',
      '"We should find somewhere civilized before this run gets any longer."',
      '"I am running out of ways to enjoy this view."',
      '"Feels like we have been between places longer than we have been anywhere."',
      '"Soon as we dock I am finding a seat that does not move."',
      '"Hard to stay sharp when every day tastes like recycled air."',
      '"I know this is the job. I still do not have to like it."',
    ]);
  } else if(drugHighCrew.length && Math.random() < 0.07){
    pool = drugHighCrew;
    line = pick([
      '"I can hear the engines thinking. They like us."',
      '"We should absolutely not be this confident right now."',
      '"Stars look close enough to reach out and rearrange."',
      '"I have solved space travel. Do not ask me to write it down."',
      '"Everything is under control. Suspiciously under control."',
      '"If a pirate shows up I am going to explain geometry to them."',
    ]);
  } else if(highCrew.length && Math.random() < 0.07){
    pool = highCrew;
    line = pick([
      '"Crew is holding together well. Keep it that way."',
      '"Not a bad run. Crew spirits are holding up."',
      '"Could get used to this kind of flying."',
      '"This is the kind of trip people pretend they always have."',
      '"Ship sounds good. Crew sounds good. I will take it."',
      '"For once, this actually feels sustainable."',
      '"Would not mind a few more days like this before the next disaster."',
      '"We are getting good at this, and that is a dangerous thing to enjoy."',
    ]);
  }
  if(!pool || !line) return;
  const c = pick(pool);
  addLog(crewDisplayName(c)+': '+line,'lm');
  G.nextCrewGalaxyTalkTurn = (G.turn || 1) + 28 + rnd(26);
}

