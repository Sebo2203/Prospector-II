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
    append('h2',"CAPTAIN'S EXPEDITION JOURNAL");
    append('p','Turn '+G.turn+' · '+G.shipName+' · Survey work awaiting sale: '+getPendingSurveySaleValue()+' cr');
    append('h3','LEADS & FOLLOW-UP');
    const incident = state.quarantine;
    append('p',!incident ? 'No distress lead recorded for this expedition.' :
      'Mercy of Dawn at '+(incident.x+1)+','+(incident.y+1)+'. '+(incident.startedTurn ?
        'Boarding route charted. '+(incident.repaired?'Life support restored.':incident.rosterKnown?'Engineering reported a failing pump.':'Interior not fully investigated.') :
        'Broken distress transmission mentions a sealed ward. No survivors confirmed yet.'));
    if(incident?.version===2){
      for(const person of incident.survivors){
        if(!person.met && !incident.rosterKnown) continue;
        const known=['onboard','delivered','lost'].includes(person.status) ? person.status :
          person.seenCondition || (person.met?'last seen aboard the wreck':'listed in the bridge roster; not located');
        append('p',person.name+' · '+known+(person.status==='onboard'&&person.pod?' · isolated in cargo':''));
      }
    }
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
  button('Close [Esc]',closeExpeditionPanel);
}
