// The quarantine rescue is a persistent story interior. Actions use position, ordinary items,
// crew skills, cargo space, line of sight and the existing planet turn loop.
const QUARANTINE_SHIP_NAMES=["Mercy of Dawn","Quiet Horizon","Last Lantern","Solace","Wayfarer's Hope",'Evening Star','Patient Voyager','Kindred Light','Aurora Passage','Second Sunrise','Gentle Horizon','Far Haven'];
// One eligibility/time roll per career, independent of player wealth or progress.
const STORY_EVENT_CATALOG={quarantine:{chance:0.6,initialChance:0.35,minDelay:80,maxDelay:600,spawn:placeQuarantineShip}};
function scheduleStoryEvents(){
  const state=ensureExpeditionState();state.storySchedule={};
  for(const [id,def] of Object.entries(STORY_EVENT_CATALOG)){
    const eligible=Math.random()<def.chance;
    state.storySchedule[id]={status:eligible?'pending':'absent',dueTurn:eligible?(Math.random()<def.initialChance?G.turn:G.turn+def.minDelay+rnd(def.maxDelay-def.minDelay+1)):null};
  }
  tickStoryEvents();
}
function tickStoryEvents(){
  if(!G || G.debugPalette || G.dead || G.retired)return;
  for(const [id,plan] of Object.entries(G.expedition?.storySchedule||{})){
    if(plan.status!=='pending'||G.turn<plan.dueTurn)continue;
    const def=STORY_EVENT_CATALOG[id];
    if(def && (G.expedition[id]||def.spawn()))plan.status='spawned';
    else plan.dueTurn=G.turn+25;
  }
  revealQuarantineShip();
}
function quarantineShipName(q=G?.expedition?.quarantine){return q?.name||'Distress vessel';}
function createQuarantineIncident(x,y,name=QUARANTINE_SHIP_NAMES[rnd(QUARANTINE_SHIP_NAMES.length)]){
  return {x,y,name,version:2,status:'unvisited',discovered:false,survivors:[],repaired:false,air:180,lastTick:null};
}
function placeQuarantineShip(){
  const state=ensureExpeditionState();
  if(!state || state.quarantine || G.debugPalette) return false;
  const candidates=[];
  const occupied=new Set([G.ship,...(G.pirates||[]),...(G.neutralShips||[]),
    ...(G.npcStranded||[]),...(G.nebulaLoot||[])].map(object=>object.x+','+object.y));
  // Choose once across the galaxy, outside the opening station reveals.
  for(let y=1;y<MAP_H-1;y++) for(let x=1;x<MAP_W-1;x++){
    if(G.galaxy[y]?.[x]?.type==='VOID' && !G.visited[y*MAP_W+x] &&
      !occupied.has(x+','+y)) candidates.push({x,y});
  }
  if(!candidates.length) return false;
  const {x,y}=candidates[rnd(candidates.length)];
  state.quarantine=createQuarantineIncident(x,y);
  G.galaxy[y][x]={type:'DERELICT',name:state.quarantine.name,storyEvent:'quarantine'};
  return true;
}

function quarantineSignalInRange(q){
  if(!G.ship || !['galaxy','radio'].includes(G.mode))return false;
  const dx=q.x-G.ship.x,dy=q.y-G.ship.y,range=Math.min(3,effectiveSensorRange());
  if(range<=0 || Math.hypot(dx,dy)>range)return false;
  const steps=Math.max(Math.abs(dx),Math.abs(dy));
  for(let i=1;i<steps;i++)if(G.galaxy[Math.round(G.ship.y+dy*i/steps)]?.[Math.round(G.ship.x+dx*i/steps)]?.type==='NEBULA')return false;
  return true;
}
function revealQuarantineShip(){
  const q=G?.expedition?.quarantine;
  if(!q || q.discovered!==false || G.debugPalette || DEBUG.on ||
    !G.visited[q.y*MAP_W+q.x] || !quarantineSignalInRange(q)) return;
  q.discovered=true;
  const text='Nearby distress transmission: '+quarantineShipName(q)+' at '+(q.x+1)+','+(q.y+1)+'. The caller mentions a sealed ward before the signal cuts out.';
  recordExpeditionEvent('quarantine:signal','lead',text);
  addLog(text+' Coordinates recorded in LOG.','lw');
}

function quarantineAtShip(){
  const q=ensureExpeditionState()?.quarantine;
  return G?.mode==='galaxy' && q && q.x===G.ship.x && q.y===G.ship.y ? q : null;
}
function quarantineInterior(){ return G?.mode==='planet' && G.planets?.[G.curPlanet]?.isQuarantine; }
function quarantineAirContaminated(x=G?.player?.x,y=G?.player?.y,pd=G?.planets?.[G?.curPlanet]){
  return !!(pd?.isQuarantine&&!G.expedition?.quarantine?.filtered&&pd.grid[y]?.[x]?.type==='q_contamination');
}
function quarantineCrewAirProtected(c){
  return crewHelmetSealed(c);
}
function quarantinePeople(){ return ensureExpeditionState()?.quarantine?.survivors || []; }
function quarantineCrewSkill(skill){
  return Math.max(0,...G.crew.filter(c=>c.hp>0).map(c=>crewSkillValue(c,skill)));
}

function generateQuarantineShip(q){
  const W=32,H=20,key='quarantine:'+q.x+','+q.y;
  const grid=Array.from({length:H},()=>Array.from({length:W},()=>({type:'station_wall'})));
  const room=(x1,y1,x2,y2)=>{for(let y=y1;y<=y2;y++) for(let x=x1;x<=x2;x++) grid[y][x]={type:'station_floor'};};
  room(2,9,29,10); room(3,3,10,7); room(13,3,19,7); room(22,3,29,7);
  room(4,12,11,17); room(15,12,29,17);
  for(const [x,y] of [[6,8],[16,8],[25,8],[7,11]]) grid[y][x]={type:'rw_locked_door'};
  grid[11][22]={type:'rw_locked_door',wardSealed:true};
  for(let y=12;y<=17;y++) for(let x=23;x<=29;x++) grid[y][x]={type:'q_contamination'};
  const fixtures=[[3,9,'SHIP'],[5,4,'q_log'],[16,5,'q_medical'],[18,5,'q_pods'],
    [23,5,'q_parts'],[27,5,'q_salvage'],[7,15,'q_life_support'],[19,13,'q_filter']];
  fixtures.forEach(([x,y,type])=>grid[y][x]={type});
  // Positions vary within rooms; room connections and the return route remain fixed.
  q.survivors=[
    {id:'mira',name:'Mira Vale',x:8,y:4+rnd(3),hp:6,maxHp:6,injured:false,infectious:false},
    {id:'rowan',name:'Rowan Pell',x:16+rnd(3),y:15,hp:4,maxHp:6,injured:true,infectious:false},
    {id:'ilya',name:'Ilya Sen',x:26+rnd(3),y:15,hp:4,maxHp:6,injured:false,infectious:true},
  ].map(s=>({...s,status:'waiting',met:false,treated:false}));
  q.mapKey=key; q.version=2; q.status='boarding'; q.lastTick=G.turn; q.air=180;
  q.repaired=false; q.filtered=false; q.startedTurn=G.turn;
  G.planets[key]={grid,width:W,height:H,biome:'DERELICT',isDerelict:true,isQuarantine:true,
    spawnX:3,spawnY:9,visited:new Array(W*H).fill(false),explored:new Array(W*H).fill(false),
    planetTurn:0,spawnedAliens:0,surveySoldValue:0};
  G.enemies[key]=[];
  return G.planets[key];
}

function boardQuarantineShip(){
  const q=quarantineAtShip();
  if(!q) return;
    const pdata=G.planets[q.mapKey] || generateQuarantineShip(q);
  G.mode='planet'; G.curSystem=''; G.curPlanet=q.mapKey;
  G.examine=null; G.rangeTarget=null;
  G.player={x:pdata.spawnX,y:pdata.spawnY};
  revealPlanet(q.mapKey,G.player.x,G.player.y);
  recordExpeditionEvent('quarantine:boarding','discovery','Boarded '+quarantineShipName(q)+'. Emergency lights illuminate an empty passage; a sealed ward lies somewhere beyond.');
  addLog('Boarding '+quarantineShipName(q)+'. Emergency lighting only. Doors respond to [Enter] from beside them; [X] examines what you can see.','li');
  addLog('A docking placard marks bridge to port, stores forward, engineering aft. Return to this airlock to transfer passengers or depart.','li');
  discoverQuarantinePeople();
  SFX.land && SFX.land(); renderAll();
}

function quarantineSurvivorAt(x,y){
  return quarantinePeople().find(s=>['waiting','following','dead'].includes(s.status) && s.x===x && s.y===y);
}
function quarantineNearSurvivor(){
  if(!quarantineInterior()) return null;
  const pd=G.planets[G.curPlanet];
  return quarantinePeople().filter(s=>['waiting','following','carried'].includes(s.status) &&
    Math.abs(s.x-G.player.x)+Math.abs(s.y-G.player.y)<=1 &&
    hasPlanetLOS(pd,G.player.x,G.player.y,s.x,s.y))
    .sort((a,b)=>(Math.abs(a.x-G.player.x)+Math.abs(a.y-G.player.y))-(Math.abs(b.x-G.player.x)+Math.abs(b.y-G.player.y)))[0] || null;
}

function openInteriorHatch(cell,quarantine=false){
  if(cell?.type!=='rw_locked_door')return false;
  cell.type='rw_open_door';SFX.door();
  addLog(cell.wardSealed?'The quarantine hatch opens. Stale air escapes from the ward.':quarantine?'Pressure hatch opened.':'Maintenance hatch forced open. The hallway beyond is pressurised.','li');
  return true;
}
function quarantineAdjacentHatch(pd,x,y){
  return [[0,-1],[1,0],[0,1],[-1,0]]
    .map(([dx,dy])=>pd.grid[y+dy]?.[x+dx])
    .find(cell=>cell?.type==='rw_locked_door');
}

function quarantineEnterLabel(pd,cell,person){
  const q=G.expedition.quarantine;
  switch(cell?.type){
    case 'SHIP': return 'Transfer passengers';
    case 'q_log': return 'Read bridge terminal';
    case 'q_medical': return cell.looted?'':'Search medical locker';
    case 'q_pods': return cell.looted?'':'Collect isolation pods';
    case 'q_parts': return cell.looted?'':'Retrieve pump coupling';
    case 'q_salvage':
      return !cell.looted && G.cargo.length<(G.shipStats?.cargoCapacity??1)?'Load salvage':'';
    case 'q_life_support':
      if(q.repaired) return 'Check life support';
      if(G.inventory.some(item=>item.usable==='quarantine_coupling'||item.usable==='repair_kit')) return 'Repair life support';
      return quarantineCrewSkill('eng')>=3?'Rewire pump bypass':'';
    case 'q_filter': return q.filtered?'Check scrubber':'Reconnect scrubber';
  }
  const hatch=quarantineAdjacentHatch(pd,G.player.x,G.player.y);
  if(hatch) return hatch.wardSealed?'Open ward hatch':'Open pressure hatch';
  if(!person) return '';
  if(person.status==='carried') return 'Set down '+person.name;
  if(person.status==='following') return 'Ask '+person.name+' to wait';
  if(person.injured || person.pod){
    const twoCarriers=G.crew.filter(c=>c.hp>0).length>=2;
    return twoCarriers && !quarantinePeople().some(s=>s.status==='carried')?'Carry '+person.name:'';
  }
  return 'Ask '+person.name+' to follow';
}
function discoverQuarantinePeople(){
  if(!quarantineInterior()) return;
  for(const s of quarantinePeople()){
    if(['waiting','following','carried','dead'].includes(s.status) && canSeePlanetTile(s.x,s.y)){
      s.seenCondition=s.status==='dead'?'found dead':s.status==='carried'?'carried by the away team':
        s.status==='following'?'following the away team':s.injured?'last seen injured aboard the wreck':
        s.infectious?'last seen in the isolation ward, feverish':'last seen aboard the wreck';
      if(s.status==='dead') recordExpeditionEvent('quarantine:death:'+s.id,'discovery','Found '+s.name+' dead aboard '+quarantineShipName()+'.');
    }
    if(!s.met && ['waiting','following'].includes(s.status) && canSeePlanetTile(s.x,s.y)){
      s.met=true;
      recordExpeditionEvent('quarantine:met:'+s.id,'discovery','Found '+s.name+(s.injured?' pinned beside a collapsed bunk.':s.infectious?' coughing inside the isolation ward.':', alive on the bridge.'));
      addLog(s.name+(s.injured?' cannot walk unaided. Medical care or a carrier is needed.':
        s.infectious?' is coughing heavily. The ward carries a contamination warning.':': "The others are in the ward. I can walk. Please get us out."'),'lw');
    }
  }
  resolveQuarantineOutcome();
}

function quarantineExamine(x,y){
  if(!quarantineInterior()) return null;
  const pd=G.planets[G.curPlanet],q=ensureExpeditionState().quarantine;
  if(!canSeePlanetTile(x,y)) return 'Unobserved interior';
  const person=quarantineSurvivorAt(x,y);
  if(person)return {type:'creature',enemy:{...person,storySurvivor:true,alive:person.status!=='dead',bodyLabel:'human survivor',size:1,behaviour:'DOCILE',diet:'omnivore',
    desc:person.status==='dead'?'A crew member who did not survive the failure of life support.':
      (person.injured?'An injured leg prevents unaided walking. ':'Able to walk. ')+(person.infectious?'Fever and a wet cough. ':'No obvious respiratory symptoms. ')+
      (person.pod?'Sealed inside an isolation pod. ':'')+'Stand beside them to assist, treat or isolate; leave Examine to use the context controls.'}};
  const type=pd.grid[y]?.[x]?.type;
  const descriptions={
    q_log:['Bridge terminal','A damaged terminal holds the crew roster, ward notes and engineering report. Stand here and press Enter to read it.'],
    q_life_support:['Life-support pump',q.repaired?'A steady pressure gauge. The repaired pump keeps the remaining crew alive.':
      'Pump failing. Reserve: '+q.air+' turns. Enter repairs with a coupling or repair kit; an engineer can rewire it over several turns. R works the manual pump.'],
    q_medical:['Medical locker',pd.grid[y][x].looted?'The marked emergency supplies have been removed.':'Emergency medical supplies behind a latched panel. Enter searches it.'],
    q_pods:['Portable isolation pods',pd.grid[y][x].looted?'The pod rack is empty.':'Two folded isolation pods. Enter collects them. A pod needs two living crew to carry and one free cargo slot for transport.'],
    q_parts:['Maintenance stores',pd.grid[y][x].looted?'The spare coupling has been removed.':'A sealed replacement pump coupling. Enter retrieves it.'],
    q_salvage:['Cargo rack',pd.grid[y][x].looted?'The rack has been stripped.':'A crate of navigation instruments. Enter loads salvage if your ship has a free cargo slot.'],
    q_filter:['Isolation scrubber',q.filtered?'The scrubber is running. Contaminated ward air is being filtered.':'The filter motor is disconnected. Enter reconnects it; engineering skill reduces the work.'],
    rw_locked_door:[pd.grid[y][x].wardSealed?'Sealed ward hatch':'Pressure hatch',pd.grid[y][x].wardSealed?'A quarantine seal blocks sight into the ward. Enter from beside it opens the hatch. Broken suits can expose the crew inside.':'Closed pressure hatch. Enter from beside it or move into it to open it.'],
    rw_open_door:['Open pressure hatch','The open frame matches the ringworld maintenance hatches.'],
    q_contamination:['Contaminated deck','Unfiltered airborne contamination surrounds the isolation bunks. An intact environmental suit with a closed helmet protects against it. Open helmets, armor plates, missing suits and punctured suits do not.'],
  };
  const d=descriptions[type]; return d?{type:'tile',name:d[0],desc:d[1]}:null;
}

function quarantineActionTurn(){
  doWaitPlanet();
  if(!G.dead){ discoverQuarantinePeople(); renderAll(); }
}
function takeQuarantineItem(usable){
  const index=G.inventory.findIndex(item=>item.usable===usable);
  if(index<0) return false;
  G.inventory.splice(index,1); return true;
}
function quarantineBerths(){
  // An emergency berth is uncomfortable but permits small ships to ferry people.
  return Math.max(1,(G.shipStats?.maxCrew||0)-G.crew.filter(c=>c.hp>0).length+1);
}

function interactQuarantine(){
  if(!quarantineInterior() || G.dead || G.retired) return false;
  const q=ensureExpeditionState().quarantine,pd=G.planets[G.curPlanet];
  const x=G.player.x,y=G.player.y,cell=pd.grid[y][x];
  // Standing on a fixture takes precedence over a passenger beside it.
  if(cell.type==='q_log'){
    addLog('Roster: Mira Vale, Rowan Pell, Ilya Sen. Last message: "Rowan cannot walk. Ilya is in isolation. Pump coupling failed; spare is in cargo."','li');
    addLog('Engineering report: repair the pump to keep survivors breathing. Medical stores are across the passage. Intact suits protect from ward air, but untreated passengers need isolation aboard your ship.','lw');
    q.rosterKnown=true;
    recordExpeditionEvent('quarantine:roster','discovery','Bridge roster identifies three survivors. Engineering report points to a spare pump coupling in cargo and emergency medicine in stores.');
  } else if(cell.type==='q_medical'){
    if(cell.looted){addLog('Medical locker empty.','li');return true;}
    cell.looted=true;
    G.inventory.push({name:'Emergency Antibiotics',usable:'antibiotics',value:50,col:'#77ddaa',desc:'Antibiotics recovered from '+quarantineShipName()+'.'},
      {name:'Emergency Medikit',usable:'medikit',value:80,col:'#ff6688',desc:'Emergency supplies for wound stabilization.'});
    addLog('Recovered antibiotics and a medikit. These can be used on your crew or on a survivor beside you [T].','ll');
  } else if(cell.type==='q_pods'){
    if(cell.looted){addLog('Pod rack empty.','li');return true;}
    cell.looted=true;
    for(let i=0;i<2;i++) G.inventory.push({name:'Folded Isolation Pod',usable:'quarantine_pod',value:0,col:'#88ccee',desc:'Deploy beside a survivor with P. Needs two carriers and a free cargo slot aboard your ship.'});
    addLog('Two folded isolation pods recovered. Deploy beside a survivor with [P].','ll');
  } else if(cell.type==='q_parts'){
    if(cell.looted){addLog('Maintenance stores empty.','li');return true;}
    cell.looted=true; G.inventory.push({name:'Pump Coupling',usable:'quarantine_coupling',value:0,col:'#ddaa55',desc:'Replacement coupling for '+quarantineShipName()+' life support.'});
    addLog('Recovered a replacement pump coupling.','ll');
  } else if(cell.type==='q_life_support'){
    if(q.repaired){addLog('Life support holds steady.','lg');return true;}
    if(takeQuarantineItem('quarantine_coupling') || takeQuarantineItem('repair_kit')){
      q.repaired=true; addLog('Replacement fitted. Air pressure rises through the wreck.','lg');
    } else if(quarantineCrewSkill('eng')>=3){
      q.repairProgress=(q.repairProgress||0)+1;
      if(q.repairProgress>=3){q.repaired=true;addLog('The engineer completes a bypass. Life support is stable.','lg');}
      else addLog('The engineer rewires the pump bypass ('+q.repairProgress+'/3).','li');
    } else { addLog('A replacement coupling or repair kit is needed. A skilled engineer could build a bypass. [R] works the manual pump for temporary air.','lw');return true; }
    if(q.repaired) recordExpeditionEvent('quarantine:repair','action','Restored life support aboard '+quarantineShipName()+'. Survivors left aboard now have breathable air.');
  } else if(cell.type==='q_filter'){
    if(q.filtered){addLog('Isolation scrubber is running.','lg');return true;}
    q.filterProgress=(q.filterProgress||0)+1;
    if(q.filterProgress >= (quarantineCrewSkill('eng')>=3?1:3)){
      q.filtered=true; addLog('Scrubber motor reconnected. Filters begin clearing the ward air.','lg');
    } else addLog('Working on the scrubber wiring.','li');
  } else if(cell.type==='q_salvage'){
    if(cell.looted){addLog('Cargo rack empty.','li');return true;}
    if(!addCargo({name:'Recovered Navigation Instruments',isCommodity:true,commodityId:'instruments',boughtPrice:0,symbol:'N',shortName:'Instruments',col:'#ddbb77',value:180,
      desc:'Civilian instruments recovered from '+quarantineShipName()+'.'})) return true;
    cell.looted=true;
    recordExpeditionEvent('quarantine:salvage','action','Loaded navigation instruments from '+quarantineShipName()+' into the cargo hold.');
    addLog('Loaded the instrument crate. It occupies cargo space and can be sold or jettisoned like other salvage.','ll');
  } else if(cell.type==='SHIP'){
    for(const s of quarantinePeople()){
      if(s.status==='waiting' && s.x===x && s.y===y) s.status='following';
    }
    transferQuarantinePassengers();
    addLog('At your airlock. [L] departs. Emergency passenger capacity: '+quarantineBerths()+'. Isolation pods use cargo space.','li');
    renderAll(); return true;
  } else {
    const door=quarantineAdjacentHatch(pd,x,y);
    const survivor=quarantineNearSurvivor();
    if(door){
      openInteriorHatch(door,true);
      revealPlanet(G.curPlanet,x,y);
    } else if(survivor){
      survivor.met=true;
      if(survivor.status==='carried'){
        survivor.status='waiting'; survivor.x=x;survivor.y=y;
        addLog('Set '+survivor.name+' down.','li');
      } else if(survivor.status==='following'){
        survivor.status='waiting'; addLog(survivor.name+' waits here.','li');
      } else if(survivor.injured || survivor.pod){
        if(quarantinePeople().some(s=>s.status==='carried')){addLog('You already have a casualty or pod to carry.','lw');return true;}
        if(G.crew.filter(c=>c.hp>0).length<2){addLog('Two living crew are needed to carry this casualty or pod. Medical care may let an unsealed patient walk [T].','lw');return true;}
        survivor.status='carried'; addLog('Two crew lift '+survivor.name+'. Return to your airlock.','li');
      } else {survivor.status='following';addLog(survivor.name+' follows the away team.','li');}
    } else {
      addLog('Nothing to operate here. Examine nearby equipment with [X].','li');renderAll();return true;
    }
  }
  quarantineActionTurn(); return true;
}

function treatQuarantinePatient(s){
  if(s.infectious && takeQuarantineItem('antibiotics')){
    s.infectious=false;s.treated=true;s.hp=Math.min(s.maxHp,s.hp+2);
    addLog('Antibiotics administered to '+s.name+'. The cough settles; continued transport is now safer.','lg');
  } else if(s.injured && takeQuarantineItem('medikit')){
    s.injured=false;s.treated=true;s.hp=Math.min(s.maxHp,s.hp+3);
    addLog('Splinted '+s.name+'\'s leg. They can walk with the team.','lg');
  } else if(s.injured && quarantineCrewSkill('med')>=3){
    s.careProgress=(s.careProgress||0)+1;
    if(s.careProgress>=3){s.injured=false;s.treated=true;addLog('The medic finishes an improvised splint. '+s.name+' can walk.','lg');}
    else addLog('The medic works on an improvised splint ('+s.careProgress+'/3).','li');
  } else {addLog(s.infectious?'Antibiotics are needed. An isolation pod is another way to transport this patient safely.':
    s.injured?'A medikit or a trained medic is needed. Two crew can also carry them.':'No field treatment is needed.','li');return false;}
  const medic=G.crew.filter(c=>c.hp>0).sort((a,b)=>crewSkillValue(b,'med')-crewSkillValue(a,'med'))[0];
  if(medic) giveSkillXP(medic,'med',2);
  return true;
}
function treatQuarantineSurvivor(){
  const s=quarantineNearSurvivor();
  if(!s){addLog('Stand beside a survivor to give medical care.','li');renderAll();return;}
  if(treatQuarantinePatient(s))quarantineActionTurn();else renderAll();
}

function podQuarantineSurvivor(){
  const s=quarantineNearSurvivor();
  if(!s){addLog('Stand beside a survivor to deploy a pod.','li');renderAll();return;}
  if(s.pod){addLog('This survivor is already isolated in a pod.','li');renderAll();return;}
  if(quarantinePeople().some(p=>p.status==='carried') || G.crew.filter(c=>c.hp>0).length<2){
    addLog('A pod needs two available carriers. Set down the current casualty first if necessary.','lw');renderAll();return;
  }
  if(!takeQuarantineItem('quarantine_pod')){addLog('You need a folded isolation pod.','lw');renderAll();return;}
  s.pod=true;s.status='carried';s.met=true;
  addLog('Sealed '+s.name+' inside a portable isolation pod. Bring it back to the airlock; it requires a free cargo slot.','li');
  quarantineActionTurn();
}

function manualQuarantinePump(){
  const q=ensureExpeditionState().quarantine;
  const cell=G.planets[G.curPlanet]?.grid[G.player.y]?.[G.player.x];
  if(cell?.type!=='q_life_support'){addLog('The manual pump is in engineering.','li');renderAll();return;}
  if(q.repaired){addLog('The repaired pump does not need manual operation.','li');renderAll();return;}
  q.air=Math.min(180,q.air+30);addLog('You work the manual pump. Reserve pressure rises temporarily.','li');quarantineActionTurn();
}

function quarantineStepToward(s,target,pd){
  const queue=[[s.x,s.y,null]],seen=new Set([s.x+','+s.y]);
  for(let i=0;i<queue.length;i++){
    const [x,y,first]=queue[i];
    if(x===target.x && y===target.y){if(first){s.x=first[0];s.y=first[1];} return;}
    for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){
      const nx=x+dx,ny=y+dy,k=nx+','+ny;
      if(seen.has(k) || !TILE[pd.grid[ny]?.[nx]?.type]?.pass) continue;
      seen.add(k);queue.push([nx,ny,first||[nx,ny]]);
    }
  }
}

function transferQuarantinePassengers(){
  if(!quarantineInterior()) return;
  const pd=G.planets[G.curPlanet];
  if(pd.grid[G.player.y]?.[G.player.x]?.type!=='SHIP') return;
  for(const s of quarantinePeople()){
    if(!['following','carried'].includes(s.status) || s.x!==G.player.x || s.y!==G.player.y) continue;
    if(s.pod){
      if(!addCargo({name:'Isolation Pod: '+s.name,shortName:'Patient',symbol:'P',col:'#77ccee',value:0,
        questItem:'quarantine_patient',quarantinePatient:s.id,desc:'A living passenger in an isolation pod. Deliver to a major station. Jettisoning abandons them.'})) continue;
    } else if(quarantinePeople().filter(p=>p.status==='onboard'&&!p.pod).length>=quarantineBerths()){
      if(!s.capacityWarned){addLog('No passenger berth for '+s.name+'. They wait at the airlock; make a delivery and return, or use a pod if cargo space permits.','lw');s.capacityWarned=true;}
      s.status='waiting'; continue;
    }
    s.status='onboard';s.boardedTurn=G.turn;
    recordExpeditionEvent('quarantine:aboard:'+s.id,'rescue','Brought '+s.name+' aboard '+G.shipName+(s.pod?' in an isolation pod.':'.'));
    addLog(s.name+(s.pod?'\'s pod is secured in the cargo hold.':' is aboard your ship.'),'lg');
    if(s.infectious&&!s.pod) addLog('The untreated passenger is coughing in shared quarters. Antibiotics or prompt station treatment are advisable.','lw');
  }
}

function leaveQuarantineDeck(){
  if(!quarantineInterior()) return;
  for(const s of quarantinePeople()) if(['following','carried'].includes(s.status)) s.status='waiting';
}

function noteQuarantinePodLoss(item){
  if(!item?.quarantinePatient) return;
  const survivor=quarantinePeople().find(s=>s.id===item.quarantinePatient && s.status==='onboard');
  if(!survivor) return;
  survivor.status='lost';
  recordExpeditionEvent('quarantine:lost:'+survivor.id,'consequence',survivor.name+'\'s occupied isolation pod was jettisoned. Recovery is unconfirmed.');
  resolveQuarantineOutcome();
}

function tickQuarantineIncident(){
  const q=G?.expedition?.quarantine;
  if(!q || q.version!==2 || q.lastTick===null || q.lastTick===undefined) return;
  const elapsed=Math.max(0,G.turn-q.lastTick);
  if(!elapsed) return;
  const previous=q.lastTick;q.lastTick=G.turn;
  const before=q.air;
  if(!q.repaired) q.air=Math.max(0,q.air-elapsed);
  const unsafeTurns=q.repaired?0:Math.max(0,elapsed-before);
  for(const s of q.survivors){
    if(s.status==='onboard' && s.pod && !G.cargo.some(item=>item.quarantinePatient===s.id)){
      noteQuarantinePodLoss({quarantinePatient:s.id});
    }
    if(['delivered','dead','lost'].includes(s.status)) continue;
    if(s.status!=='onboard' && !s.pod && unsafeTurns){
      s.asphyxia=(s.asphyxia||0)+unsafeTurns;
      while(s.asphyxia>=8){s.hp--;s.asphyxia-=8;}
      if(s.hp<=0){
        s.status='dead';
        if(quarantineInterior() && canSeePlanetTile(s.x,s.y)){s.seenCondition='found dead';addLog(s.name+' has died aboard the depressurizing wreck.','lc');}
        continue;
      }
    }
    if(s.status==='onboard' && s.infectious && !s.pod && Math.floor(G.turn/12)>Math.floor(previous/12)){
      maybeExposeRandomCrewToInfection(0.35,'quarantine_passenger','Close quarters with an untreated passenger may have spread the fever.');
    }
    if(quarantineInterior()){
      if(s.status==='carried'){
        if(G.crew.filter(c=>c.hp>0).length<2){s.status='waiting';addLog('Too few carriers remain. '+s.name+' must be set down.','lw');}
        else {s.x=G.player.x;s.y=G.player.y;}
      }
      if(s.status==='following') quarantineStepToward(s,G.player,G.planets[G.curPlanet]);
    }
  }
  resolveQuarantineOutcome();
  if(quarantineInterior()){
    const pd=G.planets[G.curPlanet];
    if(quarantineAirContaminated(G.player.x,G.player.y,pd)){
      for(const c of G.crew.filter(c=>c.hp>0&&!quarantineCrewAirProtected(c))){
        c._quarantineExposure=(c._quarantineExposure||0)+elapsed;
        if(c._quarantineExposure>=3){
          c._quarantineExposure=0;
          applyCrewStatus(c,'infection',{amount:1,source:'quarantine_ward'});
        }
      }
    }
    discoverQuarantinePeople();transferQuarantinePassengers();
    if(before>60 && q.air<=60) addLog('The wreck\'s air pressure alarm changes to red. Life support needs attention.','lw');
    if(before>0 && q.air===0) addLog('Life support has failed. Remaining survivors are losing air. Your suit reserves are now essential.','lc');
  }
}

function settleQuarantineAtStation(stationName){
  const q=ensureExpeditionState()?.quarantine;
  if(!q || q.version!==2) return; // earlier experimental saves keep their original history
  for(const s of q.survivors){
    if(s.status!=='onboard') continue;
    if(s.pod){
      const index=G.cargo.findIndex(item=>item.quarantinePatient===s.id);
      if(index<0){s.status='lost';continue;}
      G.cargo.splice(index,1);
    }
    s.status='delivered';s.stationName=stationName;
    earnCredits(100);G.stationReputation=(G.stationReputation||0)+1;adjustCrewMoraleBase(1);
    const text=stationName+' medical staff receive '+s.name+'. The survivor relief fund pays 100 cr.';
    addLog(text,'lg');recordExpeditionEvent('quarantine:delivered:'+s.id,'consequence',text);
  }
  resolveQuarantineOutcome();
}

function expeditionLegacy(){
  const q=ensureExpeditionState()?.quarantine;
  if(!q || q.discovered===false) return 'No quarantine rescue recorded.';
  if(q.version!==2) return 'No quarantine rescue recorded.';
  if(!q.survivors.length) return 'The '+quarantineShipName(q)+' distress call remained unexplored.';
  const rescued=q.survivors.filter(s=>s.status==='delivered').length;
  const aboard=q.survivors.filter(s=>s.status==='onboard').length;
  return quarantineShipName(q)+': '+rescued+' survivors delivered'+(aboard?', '+aboard+' still aboard':'')+
    (q.repaired?'; life support restored.':'; wreck life support unrepaired.');
}

function resolveQuarantineOutcome(){
  const q=G?.expedition?.quarantine;
  if(!q?.survivors.length || !q.survivors.every(s=>['delivered','dead','lost'].includes(s.status)))return false;
  q.status='closed';
  // A remote death must not disclose a fate the player has not observed.
  if(q.survivors.every(s=>s.status!=='dead'||s.seenCondition==='found dead')){
    const delivered=q.survivors.filter(s=>s.status==='delivered').length;
    const text=quarantineShipName(q)+': rescue concluded. '+delivered+' of '+q.survivors.length+' survivors delivered.';
    if(!G.expedition.events.some(e=>e.id==='quarantine:closed')){recordExpeditionEvent('quarantine:closed','consequence',text);addLog(text,delivered?'lg':'lw');}
  }
  return true;
}

function quarantineMissionActive(q){
  return q.status!=='closed'||q.survivors.some(s=>s.status==='dead'&&s.seenCondition!=='found dead');
}
