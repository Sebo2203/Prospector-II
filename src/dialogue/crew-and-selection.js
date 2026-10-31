function htmlEsc(v){
  return String(v ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[ch]));
}

function selectedInventoryItem(){
  if(!G?.inventory?.length) return null;
  const idx = Math.max(0, Math.min(G._viewInvSel || 0, G.inventory.length - 1));
  return G.inventory[idx] || null;
}

function selectedCrewMember(){
  const living = (G?.crew || []).filter(c=>c.hp>0);
  if(!living.length) return null;
  const idx = Math.max(0, Math.min(G._viewCrewSel || 0, living.length - 1));
  return living[idx] || null;
}

function crewMoraleBreakdown(c){
  ensureCrewMoraleState();
  if(!c) return [];
  const awayPenalty = timeAwayFromPortPenalty();
  const rows = [
    { label:'Base outlook', value:c.moraleBase || 55, col:'#88ccff' },
  ];
  if((c.drinkGlow || 0) > 0) rows.push({ label:'Recent drinks', value:'+'+c.drinkGlow, col:'#ffaa44' });
  if((c.drugRush || 0) > 0) rows.push({ label:'Chemical lift', value:'+'+c.drugRush, col:'#d488ff' });
  if((c.grief || 0) > 0) rows.push({ label:'Grief / stress', value:'-'+c.grief, col:'#ff7777' });
  if(awayPenalty > 0) rows.push({ label:'Time away from port', value:'-'+awayPenalty, col:'#ffaa44' });
  if((c.unpaidDocks || 0) > 0) rows.push({ label:'Unpaid dock visits', value:'-'+(c.unpaidDocks * 10), col:'#ff7777' });
  rows.push({ label:'Current morale', value:crewMoraleScore(c), col:crewMoraleScore(c) >= 45 ? '#88dd88' : crewMoraleScore(c) >= 22 ? '#ffaa44' : '#ff7777' });
  return rows;
}

function crewMedicalBreakdown(c){
  ensureCrewStatusState();
  if(!c) return [];
  const hpCol = c.hp/c.maxHp >= 0.6 ? '#88dd88' : c.hp/c.maxHp >= 0.3 ? '#ffaa44' : '#ff7777';
  const rows = [
    { label:'HP', value:c.hp+'/'+c.maxHp, col:hpCol },
  ];
  const statuses = crewStatusList(c);
  if(!statuses.length){
    rows.push({ label:'Conditions', value:'None', col:'#667788' });
    return rows;
  }
  statuses.forEach(s=>{
    const def = CREW_STATUS_DEFS[s.id] || { label:s.id || 'Status', col:'#d488ff' };
    const val = s.intensity ?? s.severity ?? 1;
    const display = def.displaySeverity
      ? (def.displaySeverity.find(row => val >= row.min)?.label || def.label || s.id)
      : (def.label || s.id);
    rows.push({
      label:display,
      value:def.displaySeverity ? 'active' : (val > 1 ? 'level '+val : 'active'),
      col:def.col || '#d488ff',
    });
  });
  return rows;
}

function crewDialogueLine(c, topic){
  ensureCrewMoraleState();
  const mood = crewMoraleScore(c);
  const role = CREW_ROLES[c.role]?.label || 'Crew';
  if(topic === 'ship'){
    if(c.role === 'engineer') return pick([
      '"Engines are holding. I would still sleep better after a proper dock inspection."',
      '"Ship has a few ugly noises, but ugly is not the same as fatal."',
      '"Give me parts, time, and nobody screaming over comms. I can keep her together."',
    ]);
    if(c.role === 'scout') return pick([
      '"Routes look open enough. I do not trust the quiet ones."',
      '"Sensors are giving us more questions than answers, which is normal."',
      '"If we keep fuel margin, I can keep us out of the worst of it."',
    ]);
    return pick([
      '"Ship still feels like home. A cramped, humming, judgmental home."',
      '"I know every bad sound this hull makes. That one was probably fine."',
      '"As long as the lights stay on, I am calling it operational."',
    ]);
  }
  if(topic === 'morale'){
    if(mood < 22) return pick([
      '"Honestly? I am near the end of my rope."',
      '"I need a station, a real meal, and a door that locks."',
      '"I am still here. That is the nicest answer I have."',
    ]);
    if(mood < 45) return pick([
      '"I am managing. Not thriving. Managing."',
      '"A little shore leave would do more than another motivational speech."',
      '"We can keep going, but people are feeling the miles."',
    ]);
    if(mood >= 85) return pick([
      '"Morale is good. Suspicious, but good."',
      '"Crew feels sharp. Let us enjoy that before space notices."',
      '"I have had worse jobs with better chairs. This one is winning today."',
    ]);
    return pick([
      '"Doing all right. Ask me again after the next landing."',
      '"Crew is steady enough. Keep the pay moving and the hull sealed."',
      '"Could be better, could be vacuum. I will take better."',
    ]);
  }
  if(mood < 22) return pick([
    '"Make it quick, Captain."',
    '"I am listening. I am not promising cheerful."',
    '"If this is about optimism, I am fresh out."',
  ]);
  if(mood >= 72 || (c.drinkGlow || 0) >= 6) return pick([
    '"What do you need, Captain?"',
    '"Ready when you are."',
    '"Crew is holding. '+role+' included."',
  ]);
  return pick([
    '"Yeah, Captain?"',
    '"Standing by."',
    '"I am here. What is the call?"',
  ]);
}

function crewDialogueAction(topic){
  if(topic === 'checkin') startCrewDialogue('checkin');
  else if(topic === 'ship') startCrewDialogue('ship');
  else if(topic === 'morale') startCrewDialogue('morale');
  else startCrewDialogue('root');
}

function dialogueCrew(){
  const dlg = G?.dialogue;
  if(!dlg || (dlg.id !== 'crew_basic' && dlg.id !== 'captain_log')) return null;
  const name = dlg.context?.crewName;
  return (G.crew||[]).find(c=>c.hp>0 && c.name===name) || selectedCrewMember();
}

