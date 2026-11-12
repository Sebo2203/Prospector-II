function missionStationDestination(name){
  for(let y=0;y<(G.galaxy||[]).length;y++){
    const x=G.galaxy[y].findIndex(cell=>cell.type==='BASE' && cell.name===name);
    if(x>=0) return name+' [X:'+(x+1)+' Y:'+(y+1)+']';
  }
  return name;
}

function activeMissionSummaries(){
  const missions=[], science=ensureScienceJobState(), job=science.active;
  if(job){
    const details=[];
    if(job.target?.reportedX!==undefined && job.target?.reportedY!==undefined){
      details.push('Last reported [X:'+(job.target.reportedX+1)+' Y:'+(job.target.reportedY+1)+']. Search nearby for drift.');
    } else if(Number.isInteger(job.target?.x) && Number.isInteger(job.target?.y)){
      details.push((job.target.planetName ? job.target.planetName+' · ' : '')+
        (job.target.systemName ? job.target.systemName+' ' : '')+
        '[X:'+(job.target.x+1)+' Y:'+(job.target.y+1)+']');
    }
    if(job.type==='alien_corpses' || job.type==='biodata'){
      const name=job.type==='biodata'?'Biodata Sample':'Alien Corpse';
      const required=job.required || (job.type==='biodata'?20:5);
      const collected=countInventoryByName(name);
      details.push(collected+' / '+required+' '+(job.type==='biodata'?'biodata samples':'alien corpses')+
        ' · '+Math.max(0,required-collected)+' remaining.');
      if(collected>=required) details.push('Ready to return to a Science Office.');
    } else if(job.type==='artifact'){
      details.push(countInventoryByName('Ancient Artifact')>0
        ? 'Artifact recovered. Return to a Science Office.'
        : 'Recover an ancient artifact and return it to a Science Office.');
    } else if(job.type==='research_ship'){
      const recovered=(G.inventory||[]).some(item=>item.name==='Research Ship Data' && (!job.id || item.scienceJobId===job.id));
      details.push(recovered ? 'Research data recovered. Return to a Science Office.' : 'Board the research ship and retrieve its data.');
    } else if(job.type==='data_box'){
      const carried=(G.cargo||[]).some(item=>item.questItem==='science_data_box' && item.targetStation===job.targetStation);
      details.push('Deliver to '+missionStationDestination(job.targetStation)+'.');
      details.push(carried ? 'Secured data box aboard.' : 'Data box missing. Recover it or relinquish the contract at a Science Office.');
    } else if(job.type==='civilization'){
      const ready=Object.entries(G.planets||{}).some(([key,planet])=>planet.civilization &&
        !science.reportedCivilizations.includes(key) && planet.visited?.some(Boolean) && getSurveySaleValue(planet)>0);
      details.push(ready ? 'Civilization documented. Return to a Science Office.' : 'Visit an intelligent civilization and return with its documentation.');
    } else details.push(job.status || 'Return to a Science Office for instructions.');
    missions.push({title:scienceJobName(job),details});
  }
  const incident=ensureExpeditionState().quarantine;
  if(incident && incident.discovered!==false && quarantineMissionActive(incident) && !incident.choice){
    const details=[quarantineShipName(incident)+' [X:'+(incident.x+1)+' Y:'+(incident.y+1)+']'];
    if(!incident.startedTurn) details.push('Board and investigate the distress call.');
    else{
      const people=incident.survivors||[];
      const aboard=people.filter(person=>person.status==='onboard').length;
      const delivered=people.filter(person=>person.status==='delivered').length;
      if(aboard) details.push(aboard+' passenger'+(aboard===1?'':'s')+' aboard. Deliver to a major station.');
      if(delivered) details.push(delivered+' delivered.');
      const waiting=people.filter(person=>(person.met || incident.rosterKnown) &&
        !['onboard','delivered','lost'].includes(person.status) && person.seenCondition!=='found dead').length;
      if(waiting) details.push(waiting+' known survivor'+(waiting===1?'':'s')+' still on the wreck.');
      else if(!aboard) details.push('Continue investigating the wreck.');
    }
    missions.push({title:quarantineShipName(incident)+' rescue',details});
  }
  if((G.cargo||[]).some(item=>item.questItem==='mystery_delivery')){
    missions.push({title:'Mysterious package',details:['Deliver to '+missionStationDestination('Waypoint Omega')+' · 300 cr.']});
  }
  if(G.pirateBounties?.kills)missions.push({title:'Pirate bounty claims',details:[G.pirateBounties.credits+' cr for '+G.pirateBounties.kills+' kills and recovered assets. Dock at any accessible major station.']});
  return missions;
}

let activeMissionsMarkup='';

function renderActiveMissions(){
  const panel=document.getElementById('active-missions-panel');
  if(panel.hidden || !G) return;
  const missions=activeMissionSummaries();
  const html=missions.length ? missions.map(mission=>
    '<section class="active-mission"><strong>'+htmlEsc(mission.title)+'</strong>'+
    mission.details.map(detail=>'<div>'+htmlEsc(detail)+'</div>').join('')+'</section>').join('')
    : '<div class="no-active-missions">No active missions or contracts.</div>';
  // Keep scroll position and keyboard focus while the objective text is stable.
  if(activeMissionsMarkup!==html){
    panel.innerHTML=html;
    activeMissionsMarkup=html;
  }
}

function toggleActiveMissions(open){
  const panel=document.getElementById('active-missions-panel');
  const expanded=typeof open==='boolean'?open:panel.hidden;
  panel.hidden=!expanded;
  document.getElementById('active-missions-toggle').setAttribute('aria-expanded',String(expanded));
  if(expanded){
    document.getElementById('persist-hints').hidden=true;
    document.getElementById('shortcut-toggle').setAttribute('aria-expanded','false');
    renderActiveMissions();
  }
}

document.getElementById('active-missions-panel').addEventListener('keydown',event=>{
  if(event.key==='Escape'){
    event.preventDefault();
    event.stopPropagation();
    toggleActiveMissions(false);
    document.getElementById('active-missions-toggle').focus();
  } else if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageUp','PageDown','Home','End',' ','Enter'].includes(event.key)){
    event.stopPropagation();
  } else if(!['Tab','Shift','Control','Alt','Meta'].includes(event.key)){
    event.currentTarget.blur();
  }
});
