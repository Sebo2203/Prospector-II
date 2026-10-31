// The existing LOG tab owns all history and reference records. Saved encounter
// facts remain separate from transient messages, then join them for display.
const LOG_FILTERS=[
  {id:'all',label:'ALL'},{id:'mission',label:'MISSION'},{id:'combat',label:'COMBAT'},
  {id:'crew',label:'CREW'},{id:'critical',label:'CRITICAL'},{id:'records',label:'RECORDS'},
];

function careerLogEntries(){
  return (G?.expedition?.events||[]).slice().reverse().map(event=>({
    msg:event.text,turn:event.turn,cls:event.kind==='consequence'?'lg':'li',
    category:'mission',recordId:event.id,
  }));
}

function currentLogRecords(){
  const state=ensureExpeditionState(),rows=[];
  const add=msg=>rows.push({msg,turn:G.turn,cls:'li'});
  add('CURRENT RECORDS — Survey work awaiting sale: '+getPendingSurveySaleValue()+' cr.');
  const science=ensureScienceJobState();
  if(science.active){
    const job=science.active;
    add('SCIENCE CONTRACT: '+scienceJobDetail()+'.');
    if(job.target?.reportedX!==undefined) add('Last reported sector: '+(job.target.reportedX+1)+','+(job.target.reportedY+1)+'. Position may have drifted.');
    if(job.targetStation) add('Delivery destination: '+job.targetStation+'.');
    if(job.target?.planetName) add('Reported world: '+job.target.planetName+' in '+job.target.systemName+'.');
    if(job.required){
      const name=job.type==='biodata'?'Biodata Sample':'Alien Corpse';
      add('Required specimens: '+countInventoryByName(name)+' / '+job.required+'.');
    }
    add('The Science Office can relinquish this contract if its cargo is lost or the expedition is no longer practical.');
  } else if(science.cooldownUntil>G.turn) add('SCIENCE OFFICE: replacement work in '+(science.cooldownUntil-G.turn)+' turns.');
  const incident=state.quarantine;
  if(incident){
    add('Mercy of Dawn at '+(incident.x+1)+','+(incident.y+1)+'. '+(incident.startedTurn?
      incident.repaired?'Life support restored.':incident.rosterKnown?'Engineering reported a failing pump.':'Interior not fully investigated.':
      'Broken distress transmission mentions a sealed ward. No survivors confirmed yet.'));
    if(incident.version===2) for(const person of incident.survivors){
      if(!person.met && !incident.rosterKnown) continue;
      const known=['onboard','delivered','lost'].includes(person.status)?person.status:
        person.seenCondition || (person.met?'last seen aboard the wreck':'listed in the bridge roster; not located');
      add(person.name+' — '+known+(person.status==='onboard'&&person.pod?' — isolated in cargo':''));
    }
  }
  const keys=new Set([...Object.keys(state.surveys),...Object.keys(G.planets||{})]);
  for(const key of keys){
    const finding=state.surveys[key],pd=G.planets?.[key];
    const coverage=pd?getScanCoverage(pd.scanMask):finding?.coverage||0;
    const explored=(pd?.explored||[]).filter(Boolean).length;
    if(!finding && !coverage && !explored) continue;
    if(pd?.isDerelict || pd?.isCasino || pd?.isAncientStation || key.includes(':stranded')) continue;
    const biome=finding?.biome||pd?.biome;
    add('SURVEY: '+(finding?.name||findBodyNameByKey(key))+' — '+(BIOMES[biome]?.name||biome||'Unclassified')+
      ' — '+Math.round(coverage*100)+'% scanned; '+explored+' surface tiles explored'+
      (finding?.civilization?'; recorded civilization: '+finding.civilization:'.'));
  }
  for(const [key,pd] of Object.entries(G.planets||{})){
    const civ=pd.civilization;
    if(!civ?.state?.contacted) continue;
    add('CONTACT: '+findBodyNameByKey(key)+' — '+civ.tierLabel+' '+civ.species+' — '+
      civRelationLabel(civ.state)+' ('+civ.state.relation+'); '+civAlertLabel(civ.state)+'.');
  }
  // Newest-first, as expected by the existing log renderer. The current
  // reference summary follows chronological history at the bottom of the view.
  return [...rows.reverse(),...careerLogEntries()];
}

function gameLogEntries(filter){
  if(filter==='records') return currentLogRecords();
  const messages=(G.log||[]).map(entry=>typeof entry==='string'?{msg:entry,turn:1}:entry);
  const present=new Set(messages.map(entry=>entry.turn+'\n'+entry.msg));
  return [...messages,...careerLogEntries().filter(entry=>!present.has(entry.turn+'\n'+entry.msg))]
    .sort((a,b)=>(b.turn||1)-(a.turn||1));
}

function wrapGameLog(entries,maxWidth,measure){
  const rows=[];
  for(const entry of entries){
    const text=String(entry.msg||'')+(entry.count>1?' (×'+entry.count+')':'');
    let line='',first=true;
    const push=()=>{rows.push({...entry,msg:line,continuation:!first});first=false;line='';};
    for(const word of text.split(/\s+/)){
      if(line && measure(line+' '+word)>maxWidth) push();
      if(measure(word)>maxWidth){
        for(const character of Array.from(word)){
          if(line && measure(line+character)>maxWidth) push();
          line+=character;
        }
      } else line+=(line?' ':'')+word;
    }
    if(line || first) push();
  }
  return rows;
}
