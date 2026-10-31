function closeExpeditionPanel(){
  if(!G) return;
  G._expeditionPanel = null;
  renderAll();
}

function toggleExpeditionJournal(){
  if(!G || G.dead || G.retired) return;
  G._expeditionPanel = G._expeditionPanel ? null : 'journal';
  renderAll();
}

function renderExpeditionPanel(){
  let overlay = document.getElementById('expedition-overlay');
  if(!overlay){
    overlay = document.createElement('section');
    overlay.id = 'expedition-overlay';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-label','Expedition journal');
    document.getElementById('root').appendChild(overlay);
  }
  overlay.replaceChildren();
  overlay.style.display = G?._expeditionPanel ? 'flex' : 'none';
  if(!G?._expeditionPanel) return;
  const panel = document.createElement('div');
  panel.className = 'expedition-panel';
  overlay.appendChild(panel);
  const append = (tag,text,className) => {
    const element = document.createElement(tag);
    element.textContent = text;
    if(className) element.className = className;
    panel.appendChild(element);
    return element;
  };
  const button = (text,action,disabled=false) => {
    const element = append('button',text);
    element.type = 'button';
    element.disabled = disabled;
    element.onclick = action;
    return element;
  };
  const state = ensureExpeditionState();
  if(G._expeditionPanel==='quarantine'){
    append('h2','MERCY OF DAWN — QUARANTINE');
    append('p','Confirmed: three survivors, a spreading fever, and failing life support. Their sealed life pod can be powered using your fuel. No approach requires a particular hull.');
    if(!state.quarantine?.choice){
      append('p','Your choice takes one turn. Rescue payments arrive at the next major station. Fuel costs still apply with debug infinite fuel enabled.');
      button('[1] Transfer sealed pod — 20 fuel; 300 cr at station',()=>resolveQuarantine('isolated'),G.fuel<20);
      button('[2] Open-airlock rescue — crew fever; net 180 cr at station',()=>resolveQuarantine('open'));
      button('[3] Power rescue beacon — 5 fuel; 100 cr after recovery',()=>resolveQuarantine('beacon'),G.fuel<5);
      button('[4] Strip cargo — 180 cr now; 80 cr penalty, survivors die',()=>resolveQuarantine('salvage'));
      append('p','Opening your airlock exposes one living crew member to fever. Sealed transfer avoids that exposure. The beacon leaves recovery to a tug. Stripping the ship abandons its people.');
    } else {
      append('p',state.events.find(event=>event.id==='quarantine:choice')?.text || 'This incident has been resolved.');
      append('p',state.events.find(event=>event.id==='quarantine:aftermath')?.text || 'Follow-up pending at your next major station.');
    }
  } else {
    append('h2',"CAPTAIN'S EXPEDITION JOURNAL");
    append('p','Turn '+G.turn+' · '+G.shipName+' · Survey work awaiting sale: '+getPendingSurveySaleValue()+' cr');
    append('h3','LEADS & FOLLOW-UP');
    const incident = state.quarantine;
    append('p',!incident ? 'No distress lead recorded for this expedition.' : incident.settled ? expeditionLegacy() :
      incident.choice ? 'Mercy of Dawn: report to any major station for medical reception or recovery news.' :
      'Reported distress: Mercy of Dawn at '+incident.x+','+incident.y+'. Fever reported; survivors unverified until contact. Fly there and press Enter.');
    append('h3','SURVEY REGISTER');
    let count = 0;
    // Old saves can reconstruct only actual scanned/explored terrain. Generation
    // alone is not evidence: never list hidden worlds or unobserved civilizations.
    const keys = new Set([...Object.keys(state.surveys),...Object.keys(G.planets||{})]);
    for(const key of keys){
      const finding = state.surveys[key];
      const pdata = G.planets?.[key];
      const coverage = pdata ? getScanCoverage(pdata.scanMask) : finding?.coverage || 0;
      const explored = (pdata?.explored||[]).filter(Boolean).length;
      if(!finding && !coverage && !explored) continue;
      if(pdata?.isDerelict || pdata?.isCasino || pdata?.isAncientStation || key.includes(':stranded')) continue;
      count++;
      const name = finding?.name || findBodyNameByKey(key);
      const biome = finding?.biome || pdata?.biome;
      append('p',name+' ['+key+'] · '+(BIOMES[biome]?.name || biome || 'Unclassified')+
        ' · '+Math.round(coverage*100)+'% scanned · '+explored+' surface tiles explored'+
        (finding?.civilization ? ' · Recorded civilization: '+finding.civilization : ''));
    }
    if(!count) append('p','No survey findings yet. Enter a system and scan a body to begin.');
    append('h3','CIVILIZATION CONTACTS');
    let contacts = 0;
    for(const [key,pdata] of Object.entries(G.planets||{})){
      const civ = pdata.civilization;
      if(!civ?.state?.contacted) continue;
      contacts++;
      append('p',findBodyNameByKey(key)+' · '+civ.tierLabel+' '+civ.species+
        ' · '+civRelationLabel(civ.state)+' ('+civ.state.relation+') · '+civAlertLabel(civ.state));
    }
    if(!contacts) append('p','No established contacts yet. Orbital detections appear in the survey register.');
    append('h3','CAREER HISTORY');
    if(!state.events.length) append('p','No major events recorded yet.');
    state.events.slice().reverse().forEach(event=>append('p','T'+event.turn+' · '+event.kind.toUpperCase()+' · '+event.text));
  }
  button('Close [Esc]',closeExpeditionPanel);
}
