// Observation-limited player policy. Only UI selections are assigned in G.
// All resources, movement, combat, shopping and outcomes use native actions.
window.installPlaythroughPilot=function(profile){
 const p=window.PILOT={profile,actions:0,events:[],decisions:[],checkpoints:[],visits:0,expeditions:0,
  systems:{},surfaces:{},prices:{},goal:null,returning:false,basePrepared:false,stop:null,combatRounds:0,
  initial:JSON.parse(JSON.stringify({credits:G.credits,fuel:G.fuel,hull:G.ship.hp,crew:G.crew.map(c=>({name:c.name,role:c.role,hp:c.hp,skills:c.skills}))}))};
 const originalAddLog=addLog,originalArchive=archiveLog;
 addLog=function(msg,cls){p.events.push({action:p.actions,turn:G.turn,mode:G.mode,msg,cls:cls||''});return originalAddLog(msg,cls);};
 archiveLog=function(msg,cls){p.events.push({action:p.actions,turn:G.turn,mode:G.mode,msg,cls:cls||'',archive:true});return originalArchive(msg,cls);};
 p.events.push(...G.log.slice().reverse().map(e=>({...e,mode:G.mode,action:0})));
 const key=k=>document.dispatchEvent(new KeyboardEvent('keydown',{key:k,code:{Escape:'Escape',Enter:'Enter',i:'KeyI',t:'KeyT'}[k]||k,bubbles:true,cancelable:true}));
 const dist=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
 const cardinal=[[0,-1],[1,0],[0,1],[-1,0]],dirs=[...cardinal,[1,1],[-1,1],[1,-1],[-1,-1]];
 const snap=label=>({label,action:p.actions,turn:G.turn,credits:G.credits,fuel:G.fuel,hull:G.ship.hp,
  crew:G.crew.map(c=>({name:c.name,role:c.role,hp:c.hp,maxHp:c.maxHp,statuses:Object.keys(c.statuses||{})})),
  samples:G.inventory.length,cargo:G.cargo.map(c=>c.name),scanned:G.planetsScanned||0,
  job:G.scienceJob?.active?.type||null,completedJobs:G.scienceJob?.completed||0,
  rescue:G.expedition?.quarantine?.survivors.filter(s=>s.met||['onboard','delivered'].includes(s.status)).map(s=>({name:s.name,status:s.status}))||[]});
 function act(label,fn){p.actions++;const before={turn:G.turn,credits:G.credits,hp:G.ship.hp,mode:G.mode};fn();
  p.decisions.push({action:p.actions,label,turn:G.turn,turnCost:G.turn-before.turn,credits:G.credits-before.credits,hull:G.ship.hp-before.hp,mode:G.mode});
 }
 function baseAction(building,id,sub){
  if(G.mode!=='base')return false;
  const index=STATION_BUILDINGS.findIndex(b=>b.id===building);if(index<0)return false;
  G.base.sel=index;G.base.screen='sub';G.base.subSel=0;G.base.medbaySub=null;G.base.scienceCorpSub=false;
  if(building==='hangar')G.base.hangarSub=sub||'maintenance';
  const option=STATION_BUILDINGS[index].actions().find(a=>a.id===id&&!a.disabled&&!a._header);if(!option)return false;
  act('Station: '+option.label,()=>{executeBaseAction(id);renderAll();});return true;
 }
 function useItem(usable){
  if(!['galaxy','planet','system','inventory'].includes(G.mode))return false;
  const index=G.inventory.findIndex(i=>i.usable===usable);if(index<0)return false;
  act('Use inventory: '+G.inventory[index].name,()=>{
   if(G.mode!=='inventory')key('i');G._viewTab='inventory';G._viewInvSel=index;key('Enter');
   if(G._equipGunIdx!==undefined||G._equipArmorIdx!==undefined){
    const living=G.crew.filter(c=>c.hp>0),score=c=>(c.skills?.cbt||0)-(c.weaponUsable?100:0);G._viewCrewSel=living.reduce((best,c,i)=>score(c)>score(living[best])?i:best,0);key('Enter');
   }
   if(G.mode==='inventory')key('Escape');
  });return true;
 }
 function knownGalaxy(){
  const cells=[];for(let y=0;y<MAP_H;y++)for(let x=0;x<MAP_W;x++)if(G.visited[y*MAP_W+x]){
   const cell=G.galaxy[y][x];cells.push({x,y,type:cell.type,name:cell.name});
  }return cells;
 }
 function bases(){return knownGalaxy().filter(c=>c.type==='BASE');}
 function nearestBase(){return bases().sort((a,b)=>dist(a,G.ship)-dist(b,G.ship))[0];}
 function route(start,target,W,H,cost){
  const open=[{x:start.x,y:start.y,g:0,f:0,first:null}],best=new Map([[start.x+','+start.y,0]]);
  let guard=0;
  while(open.length&&guard++<W*H){
   open.sort((a,b)=>b.f-a.f);const cur=open.pop();if(cur.x===target.x&&cur.y===target.y)return cur;
   if(cur.g>best.get(cur.x+','+cur.y))continue;
   for(const [dx,dy]of dirs){const x=cur.x+dx,y=cur.y+dy;if(x<0||y<0||x>=W||y>=H)continue;
    const c=cost(x,y);if(!Number.isFinite(c))continue;const g=cur.g+c,k=x+','+y;
    if(g>=(best.get(k)??Infinity))continue;best.set(k,g);open.push({x,y,g,f:g+dist({x,y},target),first:cur.first||[dx,dy]});
   }
  }return null;
 }
 function galaxyRoute(target){
  const known=knownGalaxy(),pulsars=known.filter(c=>c.type==='PULSAR');
  const enemies=G.pirates.filter(e=>e.alive&&dist(e,G.ship)<=8&&G.visited[e.y*MAP_W+e.x]);
  return route(G.ship,target,MAP_W,MAP_H,(x,y)=>{
   if(!G.visited[y*MAP_W+x])return 1.3;
   const cell=G.galaxy[y][x];if(['BLACK_HOLE','PIRATE_BASE','PULSAR'].includes(cell.type))return Infinity;
   if(pulsars.some(e=>Math.abs(e.x-x)+Math.abs(e.y-y)<=4))return 30;
   let cost=cell.type==='NEBULA'?9:1;
   for(const e of enemies)if(dist(e,{x,y})<=2&&!(target.kind==='pirate'&&target.x===e.x&&target.y===e.y))cost+=15;
   return cost;
  });
 }
 function walkGalaxy(target){
  const path=galaxyRoute(target);if(!path?.first){p.goal=null;return false;}
  act('Fly toward '+(target.name||target.kind||'charted destination'),()=>tryMove(...path.first));return true;
 }
 function planetMap(pd){
  const result=new Map();for(let y=0;y<PH(pd);y++)for(let x=0;x<PW(pd);x++){
   if(!pd.visited?.[y*PW(pd)+x]&&!pd.scanMask?.[y*PW(pd)+x])continue;
   const cell=pd.grid[y][x];let type=cell.type;
   if(type==='MINERAL'&&!cell.revealed&&!cell._scanned)type='hidden_ore_ground';
   result.set(x+','+y,{x,y,type,looted:cell.looted,pass:type==='hidden_ore_ground'||!!TILE[type]?.pass});
  }return result;
 }
 function surfaceRoute(pd,target,known){
  return route(G.player,target,PW(pd),PH(pd),(x,y)=>{
   const c=known.get(x+','+y);if(!c)return 2;
   if(['q_door','q_sealed_door'].includes(c.type))return 2;
   if(!c.pass||['LAVA_FLOOR','LAVA','AMMONIA','TOXIC_FLOOR2','TOXIC_FLOOR3','rw_void','ancient_st_void','EARTH_WATER','NEST','cave_nest'].includes(c.type))return Infinity;
   const enemy=G.enemies[G.curPlanet]?.find(e=>e.alive&&!e.hidden&&e.x===x&&e.y===y&&canSeePlanetTile(x,y));
   return enemy?12:1;
  });
 }
 function walkSurface(pd,target,known){
  const path=surfaceRoute(pd,target,known);if(!path?.first)return false;
  const [dx,dy]=path.first,c=known.get((G.player.x+dx)+','+(G.player.y+dy));
  if(c&&['q_door','q_sealed_door'].includes(c.type)){
   if(Math.abs(dx)+Math.abs(dy)===1)act('Open pressure hatch',()=>doInteract());
   else{const adjacent=cardinal.map(([ax,ay])=>({x:c.x+ax,y:c.y+ay})).filter(a=>known.get(a.x+','+a.y)?.pass).sort((a,b)=>dist(a,G.player)-dist(b,G.player));
    if(adjacent.length&&walkSurface(pd,adjacent[0],known))return true;return false;}
  }else act('Walk '+(p.surfaceGoal||'surface route'),()=>tryMove(dx,dy));
  return true;
 }
 function leaveBase(){G.base.screen='main';act('Undock',()=>key('Escape'));p.basePrepared=false;p.returning=false;p.goal=null;}
 function station(){
  if(p.basePrepared){leaveBase();return;}
  p.visits++;p.checkpoints.push(snap('Docked at '+G.base.stationName));
  baseAction('science','science_job');baseAction('science','sell');baseAction('market','market_sell_all');
  if(p.profile.retirementTarget){
   const active=G.scienceJob?.active;
   if(active&&((active.type==='alien_corpses'&&p.visits>=3&&!G.inventory.some(i=>i.name==='Alien Corpse'))||active.id===p.failedResearchID))baseAction('science','science_abandon');
  }
  if(G.ship.hp<G.ship.maxHp-8){for(let n=0;n<10&&G.ship.hp<G.ship.maxHp-5&&G.credits>=100;n++)baseAction('hangar','repair');}
  if(G.crew.some(c=>c.hp<c.maxHp*0.8||Object.keys(c.statuses||{}).some(s=>DISEASE_STATUS_IDS.includes(s)||INJURY_STATUS_IDS.includes(s))))baseAction('medbay','healcrew');
  if(G.fuel<G.maxFuel-2)baseAction('hangar','refuel');
  const prices={};G.base.sel=STATION_BUILDINGS.findIndex(b=>b.id==='market');G.base.screen='sub';
  for(const c of Object.values(COMMODITIES))prices[c.id]=getBuyPrice(G.base.stationName,c.id);p.prices[G.base.stationName]=prices;
  if(p.visits===1){
   const pawn=G.base.pawnStock||[],gun=pawn.findIndex(i=>i.usable?.startsWith('gun')&&i.cost<=200&&i.stock>0);
   if(gun>=0&&G.credits-pawn[gun].cost>=180){const usable=pawn[gun].usable;baseAction('pawn','pawn_'+gun);if(G.inventory.some(i=>i.usable===usable))p.pendingEquip=usable;}
   G.base.medbaySub='vend';G.base.sel=STATION_BUILDINGS.findIndex(b=>b.id==='medbay');const meds=G.base.medbayStock||[];
   const anti=meds.findIndex(i=>i.usable==='antibiotics'&&i.stock>0&&i.cost<120);
   if(p.profile.kind==='rescue'&&anti>=0&&G.credits>250){G.base.medbaySub='vend';G.base.screen='sub';const opt=STATION_BUILDINGS[G.base.sel].actions().find(a=>a.id==='medbuy_'+anti);if(opt&&!opt.disabled)act('Buy antibiotics',()=>{executeBaseAction(opt.id);renderAll();});}
  }
  const living=G.crew.filter(c=>c.hp>0),rescued=G.expedition.quarantine?.survivors.filter(s=>s.status==='delivered').length||0;
  const enough=p.profile.retirementTarget?G.credits>=p.profile.retirementTarget:(p.visits>=4&&p.actions>=350)||(p.visits>=3&&G.credits>=3000)||(p.profile.kind==='rescue'&&rescued>=2&&p.visits>=3&&p.actions>=200);
  if(enough||(!p.profile.retirementTarget&&p.visits>1&&(living.length<2||G.credits<100))){
   p.checkpoints.push(snap('Chose to retire'));if(baseAction('science','retire')){act('Confirm retirement',()=>key('Enter'));act('Read retirement and close career',()=>key('Enter'));}return;
  }
  if(p.profile.retirementTarget){
   if(G.credits>1400&&G.ship.hp<G.shipStats.maxUpgradeHp)baseAction('hangar','uphull','upgrades');
   if(G.credits>1500&&G.shipStats.engineRating<G.shipStats.maxUpgradeEngine)baseAction('hangar','upengine','upgrades');
   if(G.credits>1600&&G.shipStats.sensorRange<5)baseAction('hangar','upsensor','upgrades');
   if(G.credits>1700&&G.maxFuel<120)baseAction('hangar','upfuel','upgrades');
   if(G.credits>1700&&G.shipStats.shields<G.shipStats.maxShields)baseAction('hangar','upshield','upgrades');
   const pawn=G.base.pawnStock||[],gun=pawn.findIndex(i=>i.usable==='gun'&&i.cost<=200&&i.stock>0);
   if(G.credits>1400&&gun>=0&&G.crew.some(c=>!c.weaponUsable)){baseAction('pawn','pawn_'+gun);p.pendingEquip='gun';}
  }
  if(p.profile.kind==='trade'){
   const here=G.base.stationName,other=here==='Starbase Alpha'?'Waypoint Omega':'Starbase Alpha',destination=p.prices[other];
   let commodity='microelec';
   if(destination){const candidates=Object.keys(prices).map(id=>({id,margin:destination[id]-prices[id]})).sort((a,b)=>b.margin-a.margin);commodity=candidates[0].id;}
   while(G.cargo.length<G.shipStats.cargoCapacity&&G.credits-prices[commodity]>=160)if(!baseAction('market','market_buy_'+commodity))break;
  }
  p.checkpoints.push(snap('Prepared departure'));p.basePrepared=true;
 }
 function dialogue(){
  const options=dialogueVisibleOptions(),node=G.dialogue.id+':'+G.dialogue.node;p.dialogueCount=(p.dialogueNode===node?p.dialogueCount+1:1);p.dialogueNode=node;
  if(p.dialogueCount>15){p.stop='Pilot could not resolve this dialogue safely';return;}
  let index=options.findIndex(o=>!o.disabled&&o.action==='close'&&dialogueAllowsEscape());
  if(index<0)index=options.findIndex(o=>!o.disabled&&/observe|listen|open hands|peace|comply|stop|respect|withdraw|return to ship|accept.*boundary/i.test(o.label));
  if(index<0)index=options.findIndex(o=>!o.disabled&&!/attack|threat|intimidat|demand|force|loot|seize|pay|give|gift/i.test(o.label));
  if(index<0){p.stop='No safe dialogue choice matched the pilot policy';return;}
  act('Dialogue: '+options[index].label,()=>chooseDialogueOption(index));
 }
 function surface(){
  const pd=G.planets[G.curPlanet],state=p.surfaces[G.curPlanet]||(p.surfaces[G.curPlanet]={steps:0,touched:{},returning:false}),known=planetMap(pd);
  state.steps++;
  const here=G.player.x+','+G.player.y;state.touched[here]=(state.touched[here]||0)+1;
  const returnPath=surfaceRoute(pd,{x:pd.spawnX,y:pd.spawnY},known),returnDistance=returnPath?.g||dist(G.player,{x:pd.spawnX,y:pd.spawnY});
  const drain=atmosphereBiome(G.curPlanet).oxyDrain||0,injured=G.crew.some(c=>c.hp<c.maxHp*0.45);
  if(G.oxygen<Math.max(25,(returnDistance+5)*Math.max(1,drain)+15)||injured||state.steps>75)state.returning=true;
  if(G.crew.some(c=>c.hp<c.maxHp-10)&&G.inventory.some(i=>i.usable==='medikit')){useItem('medikit');return;}
  if(G.oxygen<25&&G.inventory.some(i=>i.usable==='oxytank')){useItem('oxytank');return;}
  const rescue=quarantineInterior(),q=rescue?G.expedition.quarantine:null;
  const people=rescue?quarantinePeople().filter(s=>canSeePlanetTile(s.x,s.y)&&!['onboard','delivered','dead','lost'].includes(s.status)):[];
  const carried=rescue&&quarantinePeople().some(s=>s.met&&['carried','following'].includes(s.status));
  if(carried)state.returning=true;
  if(rescue&&people.length&&!state.returning){
   const nearby=people.find(s=>Math.abs(s.x-G.player.x)+Math.abs(s.y-G.player.y)<=1);
   if(nearby){
    if((nearby.injured&&G.inventory.some(i=>i.usable==='medikit'))||(nearby.infectious&&G.inventory.some(i=>i.usable==='antibiotics'))){act('Treat '+nearby.name,()=>treatQuarantineSurvivor());return;}
    if(nearby.infectious&&G.inventory.some(i=>i.usable==='quarantine_pod')&&G.shipStats.cargoCapacity>G.cargo.length){act('Isolate '+nearby.name,()=>podQuarantineSurvivor());return;}
    act('Assist '+nearby.name,()=>doInteract());return;
   }
  }
  if(rescue){const cell=pd.grid[G.player.y][G.player.x];if(['q_log','q_medical','q_pods','q_parts','q_life_support','q_filter','q_salvage'].includes(cell.type)&&(state.touched[here]===1||(cell.type==='q_life_support'&&!q.repaired&&q.repairProgress)||(cell.type==='q_filter'&&!q.filtered&&q.filterProgress))){
   p.surfaceGoal='operate '+cell.type;act(p.surfaceGoal,()=>doInteract());return;
  }}
  if(state.returning){
   p.surfaceGoal='back to airlock';
   if(G.player.x===pd.spawnX&&G.player.y===pd.spawnY){
    if(rescue&&quarantinePeople().some(s=>s.met&&s.status==='following'&&dist(s,G.player)>0)&&state.shipWaits!==10){state.shipWaits=(state.shipWaits||0)+1;act('Wait for survivor at airlock',()=>doWaitPlanet());return;}
    p.expeditions++;act('Lift off',()=>doLiftOff());state.returning=false;state.steps=0;state.shipWaits=0;p.returning=true;p.goal=null;return;
   }
   if(walkSurface(pd,{x:pd.spawnX,y:pd.spawnY},known))return;
   p.stop='Pilot could not find a known route back to the ship';return;
  }
  const enemies=(G.enemies[G.curPlanet]||[]).filter(e=>e.alive&&!e.hidden&&!e.civLocal&&canSeePlanetTile(e.x,e.y)&&e.currentlyHostile);
  const nearest=enemies.sort((a,b)=>dist(a,G.player)-dist(b,G.player))[0];
  if(nearest&&dist(nearest,G.player)<=2){
   if(G.crew.some(c=>c.weaponUsable?.startsWith('gun'))&&dist(nearest,G.player)>1){act('Aim at '+nearest.name,()=>{G.rangeTarget={x:nearest.x,y:nearest.y};doRangedFire();});return;}
   if(dist(nearest,G.player)<=1){act('Defend against '+nearest.name,()=>tryMove(Math.sign(nearest.x-G.player.x),Math.sign(nearest.y-G.player.y)));return;}
  }
  let candidates=[];
  for(const c of known.values()){
   if(!c.pass&&!['q_door','q_sealed_door'].includes(c.type))continue;
   if(state.touched[c.x+','+c.y]&&!(rescue&&c.type==='q_life_support'&&!q.repaired&&G.inventory.some(i=>['quarantine_coupling','repair_kit'].includes(i.usable))))continue;
   const frontier=cardinal.some(([dx,dy])=>c.x+dx>=0&&c.y+dy>=0&&c.x+dx<PW(pd)&&c.y+dy<PH(pd)&&!known.has((c.x+dx)+','+(c.y+dy)));
   let value=frontier?8:0;
   if(['BIODATA','MINERAL_SAMPLE','ARTIFACT','station_locker','station_console','station_corpse'].includes(c.type)&&!c.looted)value=30;
   if(rescue&&['q_log','q_medical','q_parts','q_pods','q_filter'].includes(c.type)&&!c.looted)value=35;
   if(rescue&&c.type==='q_life_support'&&!q.repaired)value=45;
   if(value)candidates.push({...c,score:value-dist(c,G.player)});
  }
  if(rescue)for(const s of people)for(const [dx,dy]of cardinal){const c=known.get((s.x+dx)+','+(s.y+dy));if(c?.pass)candidates.push({...c,score:50-dist(c,G.player)});}
  candidates.sort((a,b)=>b.score-a.score);
  for(const target of candidates){p.surfaceGoal=target.type||'visible survivor';if(walkSurface(pd,target,known))return;}
  state.returning=true;
 }
 function system(){
  const id=G.ship.x+','+G.ship.y,state=p.systems[id]||(p.systems[id]={scans:{},landed:false,finished:false});
  if(p.returning){act('Leave orbit for station return',()=>key('Escape'));return;}
  const cell=G.galaxy[G.ship.y][G.ship.x];
  const candidate=cell.planets.findIndex((body,i)=>body.scanState!=='full'&&(state.scans[i]||0)<4);
  if(candidate>=0&&G.fuel>dist(G.ship,nearestBase())+12){
   while(G.selPlanet!==candidate)key('ArrowRight');state.scans[candidate]=(state.scans[candidate]||0)+1;
   act('Scan '+cell.planets[candidate].name,()=>doScan());return;
  }
  if(!state.landed&&p.profile.kind!=='trade'){
   const landOptions=cell.planets.map((b,i)=>({b,i})).filter(({b})=>['full','partial'].includes(b.scanState)&&['HABITABLE','DESERT','FROZEN','MOON_ROCK','ANCIENT','DERELICT'].includes(b.biome));
   if(p.profile.retirementTarget)landOptions.sort((a,b)=>['ANCIENT','HABITABLE','FROZEN','DESERT','MOON_ROCK','DERELICT'].indexOf(a.b.biome)-['ANCIENT','HABITABLE','FROZEN','DESERT','MOON_ROCK','DERELICT'].indexOf(b.b.biome));
   const land=landOptions[0]?.i??-1;
   if(land>=0){state.landed=true;while(G.selPlanet!==land)key('ArrowRight');act('Land on '+cell.planets[land].name,()=>doInteract());return;}
  }
  state.finished=true;act('Leave surveyed system',()=>key('Escape'));p.goal=null;
  if(Object.values(p.systems).filter(s=>s.finished).length%2===0)p.returning=true;
 }
 function galaxy(){
  const base=nearestBase();if(!base){p.stop='No known station to plan a return';return;}
  const active=G.scienceJob?.active;
  if(G.fuel<dist(G.ship,base)+16||G.ship.hp<G.ship.maxHp*0.55||G.crew.some(c=>c.hp<c.maxHp*0.45)||(p.profile.retirementTarget&&G.crew.some(c=>crewMoraleScore(c)<22)))p.returning=true;
  if(p.returning){p.goal={...base,kind:'base'};}
  else if(p.profile.kind==='trade'){
   const destination=bases().find(b=>b.name!==p.lastStation);p.goal=destination?{...destination,kind:'base'}:{...base,kind:'base'};
  }else if(p.profile.kind==='rescue'&&G.expedition.quarantine&&G.expedition.quarantine.discovered!==false&&G.expedition.quarantine?.status!=='closed'&&!(G.expedition.quarantine?.survivors?.length&&G.expedition.quarantine.survivors.every(s=>['delivered','dead','lost'].includes(s.status)))){
   // Only the distress transmission's published position is used here.
   const lead=G.expedition.quarantine;p.goal={x:lead.x,y:lead.y,kind:'rescue',name:'Mercy of Dawn distress coordinates'};
  }else if(active?.type==='research_ship'&&!G.inventory.some(i=>i.scienceJobId===active.id)){
   const visible=G.npcStranded.filter(s=>s.type==='research'&&G.visited[s.y*MAP_W+s.x]&&dist(s,G.ship)<=8)[0];
   const waypoints=[[0,0],[-3,-3],[3,-3],[3,3],[-3,3]],index=p.searchJob===active.id?(p.searchIndex||0):0;
   if(p.searchJob!==active.id){p.searchJob=active.id;p.searchIndex=0;}
   if(index>=waypoints.length){p.failedResearchID=active.id;p.returning=true;return;}
   const [ox,oy]=waypoints[index];
   p.goal=visible?{x:visible.x,y:visible.y,kind:'research',name:visible.name}:{x:Math.max(1,Math.min(MAP_W-2,active.target.reportedX+ox)),y:Math.max(1,Math.min(MAP_H-2,active.target.reportedY+oy)),kind:'research_search',name:'reported research-ship search area'};
  }else if(!p.goal||dist(G.ship,p.goal)===0){
   const radius=p.profile.retirementTarget?Math.min(48,Math.floor(G.maxFuel/2)-8):32;
   const choices=knownGalaxy().filter(c=>(['SYSTEM','DERELICT','ROGUE_PLANET'].includes(c.type))&&!p.systems[c.x+','+c.y]?.finished&&!p.surfaces[c.x+','+c.y]?.done&&dist(c,base)<radius);
   choices.sort((a,b)=>(dist(a,G.ship)+(a.type==='DERELICT'&&p.profile.kind==='rescue'?-5:0))-(dist(b,G.ship)+(b.type==='DERELICT'&&p.profile.kind==='rescue'?-5:0)));
   p.goal=choices.length?{...choices[0],kind:'explore'}:null;
   if(!p.goal){const frontier=knownGalaxy().filter(c=>c.type==='VOID'&&dist(c,base)<radius-2&&dist(c,G.ship)>0&&cardinal.some(([dx,dy])=>c.x+dx>=0&&c.x+dx<MAP_W&&c.y+dy>=0&&c.y+dy<MAP_H&&G.visited[(c.y+dy)*MAP_W+c.x+dx]===false));frontier.sort((a,b)=>dist(a,G.ship)-dist(b,G.ship));if(frontier[0])p.goal={...frontier[0],kind:'frontier'};}
  }
  if(!p.goal){p.returning=true;return;}
  if(dist(G.ship,p.goal)===0){
   if(p.goal.kind==='base'){act('Dock at '+p.goal.name,()=>doInteract());if(G.mode==='base')p.lastStation=G.base.stationName;p.goal=null;return;}
   if(p.goal.kind==='frontier'){p.goal=null;return;}
   if(p.goal.kind==='research_search'){p.searchIndex=(p.searchIndex||0)+1;p.goal=null;return;}
   if(p.goal.kind==='explore'&&G.galaxy[G.ship.y][G.ship.x].type==='DERELICT')p.systems[G.ship.x+','+G.ship.y]={finished:true};
   act('Interact with '+p.goal.name,()=>doInteract());p.goal=null;return;
  }
  if(!walkGalaxy(p.goal))p.returning=true;
 }
 window.playthroughStep=function(){
  if(G.dead||G.retired||p.stop)return;
  if(G.forcedMove?.active)return;
  if(G.dialogue){dialogue();return;}
  if(G.stranded){
   if(G.stranded.rescuePhase==='offer')act('Accept rescue offer',()=>doAcceptRescue());
   else if(!G.stranded.sos)act('Activate SOS beacon',()=>key('t'));
   else act('Await rescue',()=>doStrandedWait());return;
  }
  if(G.mode==='shipcombat'){
   p.combatRounds++;
   if(!G.installedWeapons.some(Boolean)||G.ship.hp<G.ship.maxHp*0.35){
    if(G.fuel>=Math.max(5,12-G.shipStats.engineRating*2))act('Attempt ship retreat',()=>doShipRetreat());
    else act('Offer surrender',()=>doShipSurrender());
   }else act('Fire ship weapons',()=>doShipFire());return;
  }
  if(G.mode==='base'){station();return;}
  if(G.mode==='system'){system();return;}
  if(G.mode==='planet'){surface();return;}
  if(G.mode==='inventory'||G.mode==='scanview'||G.mode==='radio'){act('Close current screen',()=>key('Escape'));return;}
  if(G.mode==='galaxy'){
   if(p.pendingEquip){const item=p.pendingEquip;p.pendingEquip=null;if(useItem(item))return;}
   if(p.visits===0){act('Enter starting station',()=>doInteract());if(G.mode==='base')p.lastStation=G.base.stationName;return;}
   if(G.fuel<=0){act('Attempt to engage engines',()=>tryMove(1,0));return;}
   galaxy();
  }
 };
 window.playthroughSummary=()=>({...snap(G.dead?'Death':G.retired?'Retirement':p.stop||'Simulation limit'),
  profile,initial:p.initial,actions:p.actions,visits:p.visits,expeditions:p.expeditions,combatActions:p.combatRounds,
  ending:G.dead?'dead':G.retired?'retired':'bounded stop',deathCause:G.deathCause||null,pilotStop:p.stop,
  retirementTitle:G.retired?(RETIREMENT_TIERS.find(t=>G.credits>=t.min&&G.credits<=t.max)||RETIREMENT_TIERS[0]).title:null,
  checkpoints:p.checkpoints,decisions:p.decisions,events:p.events});
};
