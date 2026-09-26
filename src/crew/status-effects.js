const CREW_STATUS_DEFS = {
  radiation: {
    label:'Radiation',
    short:'RAD',
    col:'#aaff44',
    stack:'intensity',
    desc:'Persistent exposure. Can linger after leaving contaminated areas.',
  },
  disease: {
    label:'Disease',
    short:'DIS',
    col:'#70d8ff',
    stack:'severity',
    desc:'Medical condition that can worsen, fade, or be treated later.',
  },
  infection: {
    label:'Infection',
    short:'INF',
    col:'#88ccff',
    stack:'severity',
    desc:'Early infection. Can clear naturally or worsen into fever.',
  },
  fever: {
    label:'Fever',
    short:'FEV',
    col:'#ffaa44',
    stack:'severity',
    desc:'Active illness. Lowers performance and can worsen.',
  },
  sepsis: {
    label:'Sepsis',
    short:'SEP',
    col:'#ff5555',
    stack:'severity',
    desc:'Dangerous systemic infection. Rarely clears without treatment.',
  },
  alien_parasite: {
    label:'Alien Parasite',
    short:'PAR',
    col:'#b6ff66',
    stack:'severity',
    desc:'Foreign organism in the body. Can spread to other crew.',
  },
  hallucination: {
    label:'Sensory Drift',
    short:'DRF',
    col:'#d488ff',
    stack:'severity',
    desc:'Subtle perception instability. Clears quickly away from the source.',
    hiddenSummary:true,
    displaySeverity:[
      { min:6, label:'Fading Out' },
      { min:5, label:'Heavy-lidded' },
      { min:4, label:'Fraying' },
      { min:3, label:'Disoriented' },
      { min:2, label:'Distracted' },
      { min:1, label:'Uneasy' },
    ],
  },
  injury: {
    label:'Injury',
    short:'INJ',
    col:'#ff8844',
    stack:'severity',
    desc:'Lingering physical impairment separate from HP damage.',
  },
  bleeding: {
    label:'Bleeding',
    short:'BLD',
    col:'#ff4444',
    stack:'severity',
    desc:'Blood loss. Dangerous, but may clot on its own after enough time.',
  },
  heavy_bleeding: {
    label:'Heavy Bleeding',
    short:'HBLD',
    col:'#ff2222',
    stack:'severity',
    desc:'Severe blood loss. Usually fatal unless it slows or is treated.',
  },
  stunned: {
    label:'Stunned',
    short:'STN',
    col:'#ffe066',
    stack:'severity',
    desc:'Temporarily unable to contribute to ground combat.',
  },
  asleep: {
    label:'Asleep',
    short:'SLP',
    col:'#aaaaff',
    stack:'severity',
    desc:'Unconscious or deeply sedated. Cannot contribute until waking.',
  },
  broken_foot: {
    label:'Broken Foot',
    short:'FOOT',
    col:'#ff9955',
    stack:'severity',
    desc:'Painful movement injury. Hurts morale if left untreated.',
  },
  broken_leg: {
    label:'Broken Leg',
    short:'LEG',
    col:'#ff8844',
    stack:'severity',
    desc:'Severe movement injury. Hurts morale if left untreated.',
  },
  broken_arm: {
    label:'Broken Arm',
    short:'ARM',
    col:'#ffaa66',
    stack:'severity',
    desc:'Lowers combat contribution until treated.',
  },
  concussion: {
    label:'Concussion',
    short:'CON',
    col:'#ddaaff',
    stack:'severity',
    desc:'Lowers combat and social checks until treated.',
  },
  burns: {
    label:'Burns',
    short:'BRN',
    col:'#ff6633',
    stack:'severity',
    desc:'Painful burns. Hurts morale if left untreated.',
  },
  suit_puncture: {
    label:'Suit Puncture',
    short:'PUN',
    col:'#66ccff',
    stack:'severity',
    desc:'Suit leak. Drains oxygen on hostile worlds.',
  },
  toxin_poisoning: {
    label:'Toxin Poisoning',
    short:'TOX',
    col:'#88dd44',
    stack:'severity',
    desc:'Toxic exposure from atmosphere or suit breach.',
  },
};

const INJURY_STATUS_IDS = ['injury','bleeding','heavy_bleeding','stunned','broken_foot','broken_leg','broken_arm','concussion','burns','suit_puncture','toxin_poisoning'];
const DISEASE_STATUS_IDS = ['disease','infection','fever','sepsis','alien_parasite'];

function ensureCrewStatusState(){
  if(!G) return;
  (G.crew||[]).forEach(c=>{
    if(!c.statuses || typeof c.statuses !== 'object' || Array.isArray(c.statuses)) c.statuses = {};
    Object.keys(c.statuses).forEach(id=>{
      const s = c.statuses[id];
      if(!s || typeof s !== 'object'){ delete c.statuses[id]; return; }
      if(s.id === undefined) s.id = id;
      if(s.turnApplied === undefined) s.turnApplied = G.turn || 1;
      if(s.duration !== undefined && s.duration !== null) s.duration = Math.max(0, Math.floor(s.duration));
      if(s.intensity === undefined) s.intensity = s.severity !== undefined ? s.severity : 1;
      if(s.severity === undefined) s.severity = s.intensity !== undefined ? s.intensity : 1;
    });
  });
}

function getCrewStatus(c, id){
  ensureCrewStatusState();
  return c?.statuses?.[id] || null;
}

function crewStatusList(c){
  ensureCrewStatusState();
  return Object.values(c?.statuses || {}).filter(s=>s && (s.duration === undefined || s.duration === null || s.duration > 0));
}

function visibleCrewStatusList(c){
  return crewStatusList(c).filter(s=>!CREW_STATUS_DEFS[s.id]?.hiddenSummary);
}

function crewStatusSummary(c){
  const statuses = visibleCrewStatusList(c);
  if(!statuses.length) return '';
  return statuses.map(s=>{
    const def = CREW_STATUS_DEFS[s.id] || { short:(s.id||'?').slice(0,3).toUpperCase() };
    const val = s.intensity ?? s.severity ?? 1;
    return def.short + (val > 1 ? val : '');
  }).join(' ');
}

function crewStatusPower(id){
  ensureCrewStatusState();
  return (G.crew||[]).filter(c=>c.hp>0).reduce((max,c)=>{
    const s = c.statuses?.[id];
    if(!s) return max;
    return Math.max(max, s.intensity ?? s.severity ?? 1);
  }, 0);
}

function hasCrewInjury(c){
  return INJURY_STATUS_IDS.some(id=>!!c?.statuses?.[id]);
}

function hasCrewDisease(c){
  return DISEASE_STATUS_IDS.some(id=>!!c?.statuses?.[id]);
}

function removeCrewDiseases(c, silent=true){
  let removed = 0;
  DISEASE_STATUS_IDS.forEach(id=>{
    if(removeCrewStatus(c, id, silent)) removed++;
  });
  return removed;
}

function diseaseSeverity(c){
  return DISEASE_STATUS_IDS.reduce((max,id)=>{
    const s = c?.statuses?.[id];
    return Math.max(max, s ? (s.severity || s.intensity || 1) : 0);
  }, 0);
}

function removeCrewInjuries(c, silent=true){
  let removed = 0;
  INJURY_STATUS_IDS.forEach(id=>{
    if(removeCrewStatus(c, id, silent)) removed++;
  });
  return removed;
}

function applyCrewInjury(c, id, opts={}){
  return applyCrewStatus(c, id, Object.assign({ source:'injury' }, opts));
}

function maybeExposeCrewToInfection(c, chance, source, message){
  if(!c || c.hp <= 0 || Math.random() >= chance) return false;
  if(hasCrewDisease(c)) return false;
  applyCrewStatus(c, 'infection', { amount:1, source:source || 'exposure', silent:true });
  addLog(message || (crewDisplayName(c)+' may have picked up an infection.'),'lw');
  return true;
}

function maybeExposeRandomCrewToInfection(chance, source, message){
  const candidates = (G.crew||[]).filter(c=>c.hp>0 && !hasCrewDisease(c));
  if(!candidates.length || Math.random() >= chance) return false;
  const target = candidates[rnd(candidates.length)];
  applyCrewStatus(target, 'infection', { amount:1, source:source || 'exposure', silent:true });
  addLog(message || (crewDisplayName(target)+' may have picked up an infection.'),'lw');
  return true;
}

function maybeExposeAnimalAttackInfection(enemy, target, dmg){
  if(!enemy || !target || dmg <= 0) return false;
  if(enemy.debugGunner || enemy.canCommunicate) return false;
  if(enemy.type !== 'CREATURE') return false;
  return maybeExposeCrewToInfection(target, 0.05, 'alien_attack',
    crewDisplayName(target)+' may have picked up an infection from the attack.');
}

function crewSkillValue(c, skill){
  let value = c?.skills?.[skill] || 0;
  if(getCrewStatus(c, 'concussion')) value -= 2;
  if(getCrewStatus(c, 'fever')) value -= 1;
  if(getCrewStatus(c, 'sepsis')) value -= 2;
  if(skill === 'soc' && getCrewStatus(c, 'alien_parasite')) value -= 1;
  if(skill === 'cbt' && getCrewStatus(c, 'broken_arm')) value -= 2;
  return Math.max(0, value);
}

function crewCanContributeCombat(c){
  return c && c.hp > 0 && !getCrewStatus(c, 'stunned') && !getCrewStatus(c, 'asleep');
}

function maybeApplyCombatInjury(c, dmg, source){
  if(!c || c.hp <= 0 || dmg <= 0) return;
  const chance = Math.min(0.55, 0.12 + dmg * 0.045);
  if(Math.random() > chance) return;
  const ranged = source === 'ranged';
  const bleedingId = dmg >= 5 || Math.random() < 0.35 ? 'heavy_bleeding' : 'bleeding';
  const pool = ranged
    ? [bleedingId,'suit_puncture','stunned','concussion','broken_arm']
    : [bleedingId,'stunned','broken_arm','broken_foot','concussion'];
  const id = pool[rnd(pool.length)];
  applyCrewInjury(c, id, {
    amount: id === 'stunned' ? 1 : Math.max(1, Math.min(3, Math.ceil(dmg / 4))),
    duration: id === 'stunned' ? 2 : null,
    source,
  });
}

function applyCrewMovementInjuryCosts(){
  const hurtMovers = (G.crew||[]).filter(c=>c.hp>0 && (getCrewStatus(c,'broken_foot') || getCrewStatus(c,'broken_leg')));
  if(!hurtMovers.length) return;
  if(Math.random() < 0.25){
    const c = hurtMovers[rnd(hurtMovers.length)];
    addLog(crewDisplayName(c)+' struggles through pain from a leg injury.','lw');
  }
  if(G.mode === 'planet'){
    G.oxygen = Math.max(0, DEBUG.infiniteOxy ? G.oxygen : G.oxygen - hurtMovers.length * 0.2);
  }
}

function crewPerceptionDistortion(){
  return {
    hallucination: crewStatusPower('hallucination'),
    disease: crewStatusPower('disease'),
    radiation: crewStatusPower('radiation'),
    until: G?.perception?.hallucinationUntil || 0,
  };
}

function isHallucinogenicWorld(pdata){
  if(!pdata) return false;
  return !!(pdata.hallucinogenic || BIOMES[pdata.biome]?.hallucinogenic);
}

function checkCrewSleepCollapse(){
  if(G?.mode !== 'planet' || G.dead) return false;
  const living = (G.crew||[]).filter(c=>c.hp>0);
  if(!living.length) return false;
  const allAsleep = living.every(c=>!!getCrewStatus(c, 'asleep'));
  if(!allAsleep) return false;
  G.dead = true;
  G.deathCause = 'The away team succumbed to the bloom world and never woke up.';
  addLog('All crew have fallen asleep on the surface. Mission failed.','lc');
  return true;
}

function allLivingCrewAtHallucinationLevel(minLevel, maxLevel=null){
  const living = (G.crew||[]).filter(c=>c.hp>0);
  if(!living.length) return false;
  return living.every(c=>{
    const s = getCrewStatus(c, 'hallucination');
    const v = Math.max(s?.intensity || 0, s?.severity || 0);
    return v >= minLevel && (maxLevel === null || v <= maxLevel);
  });
}

function startForcedPlanetMove(path, msg){
  if(!path?.length || G?.mode !== 'planet') return false;
  const planetKey = G.curPlanet;
  G.forcedMove = { active:true, planetKey, path:path.slice(), index:0 };
  if(msg) addLog(msg, 'lw');

  const step = () => {
    const fm = G?.forcedMove;
    if(!fm?.active || fm.planetKey !== G.curPlanet || G.mode !== 'planet' || G.dead){
      if(G?.forcedMove) G.forcedMove.active = false;
      renderAll();
      return;
    }
    const next = fm.path[fm.index++];
    if(!next){
      G.forcedMove = null;
      renderAll();
      return;
    }
    G.player.x = next.x;
    G.player.y = next.y;
    noteHallucinationMismatchAt(next.x, next.y);
    revealPlanet(G.curPlanet, G.player.x, G.player.y);
    renderAll();
    setTimeout(step, 150);
  };

  setTimeout(step, 120);
  return true;
}

function tryFrayingPanicMove(pdata){
  if(!pdata || G?.mode !== 'planet' || G.dead) return false;
  const W = PW(pdata), H = PH(pdata);
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  const steps = 1 + rnd(4);
  const path = [];
  let x = G.player.x, y = G.player.y;
  for(let i=0;i<steps;i++){
    const shuffled = dirs.slice().sort(()=>Math.random()-0.5);
    let didStep = false;
    for(const [dx,dy] of shuffled){
      const nx = x + dx;
      const ny = y + dy;
      if(nx<0 || nx>=W || ny<0 || ny>=H) continue;
      const cell = pdata.grid?.[ny]?.[nx];
      if(!cell || !TILE[cell.type]?.pass) continue;
      const enemy = (G.enemies?.[G.curPlanet]||[]).find(e=>e.alive && !e.hidden && e.x===nx && e.y===ny);
      if(enemy) continue;
      x = nx;
      y = ny;
      path.push({x, y});
      didStep = true;
      break;
    }
    if(!didStep) break;
  }
  return startForcedPlanetMove(path, 'Panic scatters the away team '+path.length+' tile'+(path.length===1?'':'s')+' off course.');
}

function applyHallucinogenicExposure(){
  const pdata = G?.planets?.[G.curPlanet];
  if(!pdata || !isHallucinogenicWorld(pdata)) return;
  pdata.hallucinationExposure = (pdata.hallucinationExposure || 0) + 1;
  if(pdata.hallucinationExposure < 7) return;
  const exposure = pdata.hallucinationExposure;
  const strength = exposure >= 76 ? 6 : exposure >= 58 ? 5 : exposure >= 42 ? 4 : exposure >= 24 ? 3 : exposure >= 14 ? 2 : 1;
  (G.crew||[]).forEach(c=>{
    if(c.hp <= 0) return;
    applyCrewStatus(c, 'hallucination', {
      amount:strength,
      duration:6,
      source:'surface',
      silent:true,
    });
  });
  if(!G.perception) G.perception = {};
  G.perception.hallucinationUntil = Math.max(G.perception.hallucinationUntil || 0, (G.turn || 1) + 2);
  if(strength >= 2 && !pdata._hallucinationHinted && Math.random() < 0.35){
    pdata._hallucinationHinted = true;
    addLog(pick([
      'Colors seem to cling a little too long at the edge of vision.',
      'The surface feels strangely difficult to look away from.',
      'Someone reports movement where the instruments show nothing.',
    ]),'li');
  }
  if(strength >= 3 && !pdata._hallucinationSevereHinted && Math.random() < 0.25){
    pdata._hallucinationSevereHinted = true;
    addLog(pick([
      'The map refuses to stay still.',
      'The ground seems to rearrange itself between blinks.',
      'A crew channel opens, then carries only breathing.',
    ]),'lw');
  }
  if(exposure >= 32 && (G.turn || 1) >= (pdata.nextHallucinationBreakTurn || 0)){
    pdata.nextHallucinationBreakTurn = (G.turn || 1) + 5 + rnd(6);
    if(Math.random() < Math.min(0.65, 0.18 + (exposure - 32) * 0.012)){
      const living = (G.crew||[]).filter(c=>c.hp>0);
      const target = living.length ? living[rnd(living.length)] : null;
      if(target){
        if(Math.random() < 0.55){
          target.moraleBase = Math.max(0, (target.moraleBase || 55) - (1 + rnd(3)));
          addLog(crewDisplayName(target)+' nearly loses composure.','lw');
        } else {
          const dmg = 1 + rnd(strength);
          if(!DEBUG.infiniteCrewHp) target.hp = Math.max(1, target.hp - dmg);
          applyCrewStatus(target, 'stunned', { amount:1, duration:1, source:'panic', silent:true });
          addLog(crewDisplayName(target)+' panics and gets hurt in the confusion. -'+dmg+' HP.','lc');
        }
      }
    }
  }
  if(strength === 4 && allLivingCrewAtHallucinationLevel(4, 4) && (G.turn || 1) >= (pdata.nextFrayingPanicMoveTurn || 0)){
    pdata.nextFrayingPanicMoveTurn = (G.turn || 1) + 3 + rnd(5);
    if(Math.random() < 0.45) tryFrayingPanicMove(pdata);
  }
  if(strength >= 5 && (G.turn || 1) >= (pdata.nextHallucinationSleepTurn || 0)){
    pdata.nextHallucinationSleepTurn = (G.turn || 1) + 2 + rnd(4);
    const sleepChance = Math.min(0.88, 0.26 + (strength - 4) * 0.18 + Math.max(0, exposure - 58) * 0.01);
    if(Math.random() < sleepChance){
      const candidates = (G.crew||[]).filter(c=>c.hp>0 && !getCrewStatus(c, 'asleep'));
      const target = candidates.length ? candidates[rnd(candidates.length)] : null;
      if(target){
        applyCrewStatus(target, 'asleep', { amount:1, duration:8 + rnd(5), source:'bloom_overload', silent:true });
        addLog(crewDisplayName(target)+' sinks into a sudden sleep.','lc');
        checkCrewSleepCollapse();
      }
    }
  }
}

function softenHallucinationsAfterLiftOff(){
  let affected = 0;
  (G.crew||[]).forEach(c=>{
    const s = c.statuses?.hallucination;
    if(!s) return;
    affected++;
    s.duration = Math.min(s.duration ?? 2, 2);
    s.severity = Math.min(s.severity || 1, 1);
    s.intensity = Math.min(s.intensity || 1, 1);
  });
  if(affected && G.perception){
    G.perception.hallucinationUntil = Math.max(G.perception.hallucinationUntil || 0, (G.turn || 1) + 1);
  }
}

function applyCrewStatus(c, id, opts={}){
  if(!c || c.hp <= 0) return null;
  ensureCrewStatusState();
  const def = CREW_STATUS_DEFS[id] || { label:id, stack:'severity' };
  const current = c.statuses[id];
  const amount = Math.max(1, opts.amount ?? opts.intensity ?? opts.severity ?? 1);
  const duration = opts.duration ?? null;
  const field = def.stack || 'severity';
  if(current){
    if(opts.stackMode === 'add'){
      current[field] = Math.min(opts.max ?? 9, (current[field] || 0) + amount);
    } else {
      current[field] = Math.max(current[field] || 1, amount);
    }
    current.intensity = Math.max(current.intensity || 0, current[field] || 1);
    current.severity = Math.max(current.severity || 0, current[field] || 1);
    if(id === 'radiation'){
      current.severity = current.intensity;
    }
    if(duration !== null) current.duration = Math.max(current.duration || 0, duration);
    current.source = opts.source || current.source || null;
    current.turnUpdated = G.turn || 1;
    return current;
  }
  const status = {
    id,
    intensity: field === 'intensity' ? amount : (opts.intensity ?? amount),
    severity: field === 'severity' ? amount : (opts.severity ?? amount),
    duration,
    source: opts.source || null,
    turnApplied: G.turn || 1,
    turnUpdated: G.turn || 1,
  };
  c.statuses[id] = status;
  if(!opts.silent) addLog(crewDisplayName(c)+' gains '+(def.label || id)+'.','lw');
  return status;
}

function removeCrewStatus(c, id, silent=false){
  if(!c?.statuses?.[id]) return false;
  const def = CREW_STATUS_DEFS[id] || { label:id };
  delete c.statuses[id];
  if(!silent) addLog(crewDisplayName(c)+' recovers from '+(def.label || id)+'.','lg');
  return true;
}

function maybeSpreadDisease(source, id, chance){
  if(!source || source.hp <= 0 || Math.random() >= chance) return false;
  const candidates = (G.crew||[]).filter(c=>c.hp>0 && c !== source && !getCrewStatus(c, id));
  if(!candidates.length) return false;
  const target = candidates[rnd(candidates.length)];
  const sev = Math.max(1, Math.min(3, Math.floor((source.statuses?.[id]?.severity || 1) / 2) || 1));
  applyCrewStatus(target, id, { amount:sev, source:'spread', silent:true });
  addLog(crewDisplayName(target)+' may have caught '+CREW_STATUS_DEFS[id].label.toLowerCase()+'.','lw');
  return true;
}

function tickCrewStatuses(context){
  ensureCrewStatusState();
  if(!G?.crew) return;
  G.crew.forEach(c=>{
    if(c.hp <= 0) return;
    // Stim expiry — clear bonus once turns run out
    if((c._stimAtk||0) > 0 && G.turn > (c._stimUntil||0)){
      addLog(crewDisplayName(c)+'\'s combat stim wears off.','li');
      c._stimAtk = 0;
      c._stimUntil = 0;
    }
    const statuses = crewStatusList(c);
    statuses.forEach(s=>{
      if(s.duration !== null && s.duration !== undefined){
        s.duration = Math.max(0, s.duration - 1);
        if(s.duration <= 0){ removeCrewStatus(c, s.id, s.id === 'hallucination'); return; }
      }
      if(s.id === 'radiation'){
        const dose = s.intensity || 1;
        if(dose >= 4 && Math.random() < 0.18){
          const dmg = 1 + Math.floor(dose/3);
          if(!DEBUG.infiniteCrewHp) c.hp = Math.max(0, c.hp - dmg);
          addLog(crewDisplayName(c)+' suffers radiation sickness. -'+dmg+' HP.','lc');
        }
        s.decayCounter = (s.decayCounter || 0) + 1;
        const decayNeeded = Math.max(18, 54 - dose * 6);
        if(s.decayCounter >= decayNeeded){
          s.decayCounter = 0;
          s.intensity = Math.max(0, dose - 1);
          s.severity = Math.max(0, (s.severity || dose) - 1);
          if(s.intensity <= 0) removeCrewStatus(c, 'radiation');
          else addLog(crewDisplayName(c)+' radiation level falls to '+s.intensity+'.','li');
        }
      } else if(s.id === 'disease'){
        const sev = s.severity || 1;
        if(Math.random() < 0.06 * sev){
          if(!DEBUG.infiniteCrewHp) c.hp = Math.max(0, c.hp - 1);
          addLog(crewDisplayName(c)+' is weakened by disease.','lw');
        }
        if(Math.random() < 0.015 * sev) maybeSpreadDisease(c, 'disease', 1);
      } else if(s.id === 'infection'){
        const sev = s.severity || 1;
        s.progressCounter = (s.progressCounter || 0) + 1;
        if(s.progressCounter >= 14){
          s.progressCounter = 0;
          if(Math.random() < Math.max(0.16, 0.42 - sev * 0.08)){
            removeCrewStatus(c, 'infection', true);
            addLog(crewDisplayName(c)+' infection clears.','lg');
          } else if(Math.random() < 0.24 + sev * 0.08){
            removeCrewStatus(c, 'infection', true);
            applyCrewStatus(c, 'fever', { amount:Math.max(1, sev), source:'infection', silent:true });
            addLog(crewDisplayName(c)+' infection turns into fever.','lw');
          }
        }
        maybeSpreadDisease(c, 'infection', 0.015 * sev);
      } else if(s.id === 'fever'){
        const sev = s.severity || 1;
        s.tick = (s.tick || 0) + 1;
        if(s.tick >= 6){
          s.tick = 0;
          const dmg = Math.max(1, Math.floor(sev / 2));
          if(!DEBUG.infiniteCrewHp) c.hp = Math.max(0, c.hp - dmg);
          c.moraleBase = Math.max(0, (c.moraleBase || 55) - 1);
          addLog(crewDisplayName(c)+' is burning with fever. -'+dmg+' HP.','lw');
        }
        s.progressCounter = (s.progressCounter || 0) + 1;
        if(s.progressCounter >= 18){
          s.progressCounter = 0;
          if(Math.random() < 0.18){
            removeCrewStatus(c, 'fever', true);
            applyCrewStatus(c, 'infection', { amount:1, source:'fever_broke', silent:true });
            addLog(crewDisplayName(c)+' fever breaks, leaving a lingering infection.','li');
          } else if(Math.random() < 0.18 + sev * 0.05){
            removeCrewStatus(c, 'fever', true);
            applyCrewStatus(c, 'sepsis', { amount:Math.max(1, sev), source:'fever', silent:true });
            addLog(crewDisplayName(c)+' fever becomes systemic infection.','lc');
          }
        }
        maybeSpreadDisease(c, 'infection', 0.012 * sev);
      } else if(s.id === 'sepsis'){
        const sev = s.severity || 1;
        s.tick = (s.tick || 0) + 1;
        if(s.tick >= 4){
          s.tick = 0;
          const dmg = Math.max(1, sev);
          if(!DEBUG.infiniteCrewHp) c.hp = Math.max(0, c.hp - dmg);
          addLog(crewDisplayName(c)+' is crashing from systemic infection. -'+dmg+' HP.','lc');
        }
        if(Math.random() < 0.005) {
          removeCrewStatus(c, 'sepsis', true);
          applyCrewStatus(c, 'fever', { amount:Math.max(1, sev - 1), source:'sepsis_recovery', silent:true });
          addLog(crewDisplayName(c)+' systemic infection retreats into fever.','lw');
        }
      } else if(s.id === 'alien_parasite'){
        const sev = s.severity || 1;
        s.tick = (s.tick || 0) + 1;
        if(s.tick >= 7){
          s.tick = 0;
          const dmg = Math.max(1, Math.floor(sev / 2));
          if(!DEBUG.infiniteCrewHp) c.hp = Math.max(0, c.hp - dmg);
          addLog(crewDisplayName(c)+' convulses from something moving under the skin. -'+dmg+' HP.','lc');
        }
        maybeSpreadDisease(c, 'alien_parasite', 0.025 + sev * 0.012);
      } else if(s.id === 'hallucination'){
        s.lastContext = context || G.mode || 'unknown';
        if(!G.perception) G.perception = {};
        G.perception.hallucinationUntil = Math.max(G.perception.hallucinationUntil || 0, (G.turn || 1) + 1);
      } else if(s.id === 'heavy_bleeding'){
        s.tick = (s.tick || 0) + 1;
        if(s.tick >= 2){
          s.tick = 0;
          const dmg = Math.max(1, s.severity || 1);
          if(!DEBUG.infiniteCrewHp) c.hp = Math.max(0, c.hp - dmg);
          addLog(crewDisplayName(c)+' is losing blood fast. -'+dmg+' HP.','lc');
          maybeExposeCrewToInfection(c, 0.05, 'heavy_bleeding',
            crewDisplayName(c)+' wound shows signs of infection.');
        }
        s.clotCounter = (s.clotCounter || 0) + 1;
        if(s.clotCounter >= 10){
          s.clotCounter = 0;
          const sev = s.severity || 1;
          if(Math.random() < Math.max(0.20, 0.46 - sev * 0.08)){
            removeCrewStatus(c, 'heavy_bleeding', true);
            applyCrewStatus(c, 'bleeding', { amount:Math.max(1, sev - 1), source:'clotted', silent:true });
            addLog(crewDisplayName(c)+' heavy bleeding slows to a bleed.','lw');
          }
        }
      } else if(s.id === 'bleeding'){
        s.tick = (s.tick || 0) + 1;
        if(s.tick >= 5){
          s.tick = 0;
          const dmg = Math.max(1, Math.floor((s.severity || 1) / 2));
          if(!DEBUG.infiniteCrewHp) c.hp = Math.max(0, c.hp - dmg);
          addLog(crewDisplayName(c)+' is still bleeding. -'+dmg+' HP.','lc');
          maybeExposeCrewToInfection(c, 0.025, 'bleeding',
            crewDisplayName(c)+' wound may be getting infected.');
        }
        s.clotCounter = (s.clotCounter || 0) + 1;
        if(s.clotCounter >= 14){
          s.clotCounter = 0;
          const sev = s.severity || 1;
          if(Math.random() < Math.max(0.18, 0.48 - sev * 0.08)){
            removeCrewStatus(c, 'bleeding', true);
            addLog(crewDisplayName(c)+' bleeding finally clots.','lg');
          }
        }
      } else if(s.id === 'stunned' || s.id === 'asleep'){
        if(s.duration === null || s.duration === undefined) s.duration = 1;
      } else if(s.id === 'broken_foot' || s.id === 'broken_leg' || s.id === 'broken_arm' || s.id === 'burns'){
        s.painCounter = (s.painCounter || 0) + 1;
        if(s.painCounter >= 18){
          s.painCounter = 0;
          c.moraleBase = Math.max(0, (c.moraleBase || 55) - 1);
          const def = CREW_STATUS_DEFS[s.id] || { label:'injury' };
          addLog(crewDisplayName(c)+' is worn down by untreated '+def.label.toLowerCase()+'.','lw');
          if(s.id === 'burns') maybeExposeCrewToInfection(c, 0.02, 'burns',
            crewDisplayName(c)+' burns look contaminated.');
        }
      } else if(s.id === 'suit_puncture'){
        if((context || '').startsWith('planet')){
          const biome = atmosphereBiome(G.curPlanet);
          if((biome.oxyDrain || 0) > 0){
            const leak = 0.4 * (s.severity || 1);
            G.oxygen = Math.max(0, DEBUG.infiniteOxy ? G.oxygen : G.oxygen - leak);
            s.leakCounter = (s.leakCounter || 0) + 1;
            if(s.leakCounter >= 8){
              s.leakCounter = 0;
              addLog(crewDisplayName(c)+' suit puncture leaks oxygen.','lw');
              // Ranged punctures (bullets) are less likely to contaminate than claw/bite tears.
              const punctureInfectChance = s.source === 'ranged' ? 0.01 : 0.02;
              maybeExposeCrewToInfection(c, punctureInfectChance, 'suit_puncture',
                crewDisplayName(c)+' suit breach may have contaminated a wound.');
            }
            const bKey = atmosphereBiomeKey(G.curPlanet);
            if((bKey === 'TOXIC' || bKey === 'MOON_TOXIC') && Math.random() < 0.05 * (s.severity || 1)){
              applyCrewStatus(c, 'toxin_poisoning', { amount:1, stackMode:'add', max:5, source:'toxic_atmosphere' });
            }
          }
        }
      } else if(s.id === 'toxin_poisoning'){
        s.tick = (s.tick || 0) + 1;
        if(s.tick >= 6){
          s.tick = 0;
          const dmg = Math.max(1, Math.floor((s.severity || 1) / 2));
          if(!DEBUG.infiniteCrewHp) c.hp = Math.max(0, c.hp - dmg);
          addLog(crewDisplayName(c)+' suffers toxin poisoning. -'+dmg+' HP.','lc');
        }
      }
    });
  });
  updateCrewLowMoraleFlags();
}

function applyRadiationExposureToCrew(amount, source, chance=1){
  if(!amount || amount <= 0 || Math.random() > chance) return false;
  const living = (G.crew||[]).filter(c=>c.hp>0);
  if(!living.length) return false;
  living.forEach(c=>{
    const suitMitigation = c.armorUsable ? 0 : 1;
    applyCrewStatus(c, 'radiation', {
      amount: amount + suitMitigation,
      stackMode: 'add',
      max: 9,
      source,
      silent: true,
    });
  });
  const maxRad = crewStatusPower('radiation');
  addLog('Crew absorbs radiation exposure'+(maxRad ? ' (RAD '+maxRad+').' : '.'),'lw');
  return true;
}

function reduceCrewRadiation(amount){
  ensureCrewStatusState();
  let treated = 0;
  (G.crew||[]).forEach(c=>{
    if(c.hp <= 0) return;
    const rad = c.statuses?.radiation;
    if(!rad) return;
    rad.intensity = Math.max(0, (rad.intensity || rad.severity || 1) - amount);
    rad.severity = rad.intensity;
    rad.decayCounter = 0;
    treated++;
    if(rad.intensity <= 0) removeCrewStatus(c, 'radiation', true);
  });
  return treated;
}

