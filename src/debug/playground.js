// A disposable test world. The live career remains outside G and is never
// mutated, serialized into a nested save, or replaced by a playground autosave.
let debugPaletteReturn=null;

function debugBuildPaletteGalaxyObject(id,x,y){
  const name=id.replaceAll('_',' ');
  if(id==='BASE'||id==='WAYPOINT') return {type:'BASE',name:id==='BASE'?'Starbase Alpha':'Waypoint Omega'};
  if(id==='CASINO') return {type:'CASINO',name:'The Void Royale'};
  if(id.startsWith('NEBULA_')||id.startsWith('GAS_')){
    const variant=id==='NEBULA_BLUE'?'blue':'pink',massive=id==='GAS_DEVOURER';
    if(id.startsWith('GAS_')) G.gasEntities.push({x,y,alive:true,variant,isMassive:massive,hp:150,maxHp:150,atk:20,
      engineRating:3,shields:0,maxShields:0,guns:1,name:massive?'Void Devourer':'Nebula Wraith',_chaseTurns:0,_homeCluster:[{x,y}]});
    return {type:'NEBULA',name,nebulaVariant:variant,massive,expansive:false};
  }
  const neutral={TRADER:'trader',CARGO_SHIP:'cargo',SCIENCE_SHIP:'science',PATROL:'patrol'}[id];
  if(neutral) G.neutralShips.push({x,y,type:neutral,name,speed:1,rescueCost:0,fuelGift:40,destBase:0,destX:x,destY:y,
    homeX:x,homeY:y,patrolRoute:[{x,y}],patrolIdx:0,rescuing:false,alive:true});
  else if(id==='PIRATE') G.pirates.push({x,y,name:'Palette Pirate',alive:true,hp:50,maxHp:50,atk:6,engineRating:2,
    shields:0,maxShields:0,guns:1,pirateType:'guard',homeX:x,homeY:y,lastMove:0});
  else if(id.startsWith('STRANDED_')||id==='RESEARCH_SHIP'){
    const type=id==='STRANDED_ALIVE'?'alive':id==='RESEARCH_SHIP'?'research':'dead';
    const ship={x,y,type,name,mapKey:x+','+y+':palette-ship',fuel:0,fuelCost:20,credits:200,age:0};
    G.npcStranded.push(ship);
    if(type==='research'){
      if(G.debugPalette){
        G.debugPalette.researchShip=ship;
        G.scienceJob.active={id:'palette-research',type:'research_ship',target:{mapKey:ship.mapKey},reward:900,status:'retrieve research data'};
      }
    }
    return {type:'VOID',name,_npcStranded:ship};
  } else if(id==='NEBULA_LOOT') G.nebulaLoot.push({x,y,item:makeCommodityItem('ore_xc','palette',0)});
  else if(id==='QUARANTINE'){
    ensureExpeditionState().quarantine={x,y,version:2,status:'unvisited',survivors:[],repaired:false,air:180,lastTick:null};
    return {type:'DERELICT',name:'Mercy of Dawn'};
  } else throw new Error('No debug palette factory for '+id);
  return {type:'VOID',name};
}

function debugPaletteDescriptor(biome,name){
  const desc={name,biome,biomeName:BIOMES[biome]?.name||biome,orbitSlot:0,scanState:'full',
    avgTemp:15,gravity:'1.0',atmosphere:'Test environment',radius:'1.0'};
  if(biome==='GAS_GIANT') desc.moons=[debugPaletteDescriptor('MOON_ROCK','Rocky moon'),
    {...debugPaletteDescriptor('ANCIENT_STATION','Ancient refueling station'),isAncientStation:true}];
  return desc;
}

function debugEnterPalette(area='galaxy',rebuild=false){
  if(!G) return;
  if(!debugPaletteReturn){autoSave();debugPaletteReturn={game:G,debug:JSON.parse(JSON.stringify(DEBUG))};}
  if(!G.debugPalette || rebuild){
    DEBUG.on=false;resetDebugSubMenus();
    G=JSON.parse(JSON.stringify(debugPaletteReturn.game));
    Object.assign(G,{mode:'galaxy',turn:1,dead:false,retired:false,deathCause:'',shipCombat:null,stranded:null,dialogue:null,
      forcedMove:null,examine:null,rangeTarget:null,_itemAimMode:null,_voidPrompt:null,showOptions:false,
      _caveReturn:null,_uwReturn:null,shipAnim:null,underwater:false,
      galaxy:Array.from({length:MAP_H},()=>Array.from({length:MAP_W},()=>({type:'VOID'}))),
      planets:{},enemies:{},visited:new Array(MAP_W*MAP_H).fill(true),pirates:[],pirateBases:[],neutralShips:[],
      gasEntities:[],npcStranded:[],nebulaLoot:[],derelicts:[],roguePlanets:[],pulsars:[],blackHoles:[],
      bases:[],inventory:[],cargo:[],towedShip:null,log:[],msg:'',curPlanet:'',curSystem:'',
      expedition:{version:1,events:[],surveys:{},quarantine:null},scienceJob:{active:null,completedTypes:[],cooldownUntil:0},
      debugPalette:{simulate:false,entries:[],surfaceKey:'debug:surface'}});
    G.crew=Object.keys(CREW_ROLES).map(role=>randomCrewMember(role));
    G.shipStats=buildShipStats('BULK_FREIGHTER');G.shipStats.cargoCapacity=100;G.shipStats.maxCrew=100;
    G.maxFuel=1000;G.fuel=1000;G.ship={x:3,y:3,hp:1000,maxHp:1000};G.oxygen=100;G.credits=100000;
    G.installedModules=['tractor_beam','fuel_scoop','mining_drill'];G.installedWeapons=['railgun'];
    Object.assign(DEBUG,{infiniteFuel:true,infiniteHull:true,infiniteOxy:true,infiniteCrewHp:true,fullVision:true,shipInvisible:true,preScan:1});
    debugBuildGalaxyPalette();debugBuildSurfacePalette();
    for(const entry of G.debugPalette.entries.filter(e=>e.kind==='civilization')) debugPrepareCivilization(entry);
  }
  debugPaletteNavigateHome(area);
}

function debugPaletteNavigateHome(area){
  G.dead=false;G.retired=false;G.dialogue=null;G.showOptions=false;G.forcedMove=null;G.shipCombat=null;
  G.examine=null;G.rangeTarget=null;G.stranded=null;G._voidPrompt=null;G._itemAimMode=null;G.underwater=false;
  G.curSystem='';G.ship.x=3;G.ship.y=3;G.fuel=G.maxFuel;G.oxygen=100;
  G.ship.hp=G.ship.maxHp;
  if(!G.crew.length)G.crew=Object.keys(CREW_ROLES).map(role=>randomCrewMember(role));
  G.crew.forEach(c=>{c.hp=c.maxHp;c.statuses={};});
  if(area==='surface'){
    G.mode='planet';G.curPlanet=G.debugPalette.surfaceKey;G.player={x:2,y:2};
    revealPlanet(G.curPlanet,2,2);
  } else {G.mode='galaxy';G.curPlanet='';}
  DEBUG.on=false;DEBUG.paletteMenu=false;resetDebugSubMenus();
  restoreGameUI();addLog('DEBUG PLAYGROUND — F4 returns to your career. Shift+B then F6 searches all samples. NPCs '+(G.debugPalette.simulate?'live.':'paused; F7 in debug enables simulation.'),'li');renderAll();
}

function debugReturnFromPalette(render=true){
  if(!debugPaletteReturn) return;
  for(const id of ['feedback-overlay','barter-overlay']){const el=document.getElementById(id);if(el)el.style.display='none';}
  document.getElementById('minimap-overlay')?.classList.remove('visible');
  const saved=debugPaletteReturn;debugPaletteReturn=null;G=saved.game;
  Object.keys(DEBUG).forEach(key=>delete DEBUG[key]);Object.assign(DEBUG,saved.debug);
  if(render){restoreGameUI();renderAll();}
}

function debugBuildGalaxyPalette(){
  let index=0;
  const slot=()=>{const cols=Math.floor((MAP_W-8)/5),x=8+(index%cols)*5,y=8+Math.floor(index++/cols)*4;
    if(y>=MAP_H-3)throw Error('Galaxy palette is full; extend its layout before adding exhibits');return{x,y};};
  G.galaxy[3][3]={type:'BASE',name:'Palette arrival'};
  DEBUG_GALAXY_OBJ_TYPES.forEach((definition,i)=>{
    const pos=slot();G.bases=[{x:pos.x-2,y:pos.y,name:'Starbase Alpha'}];
    DEBUG.spawnGalaxyObj=i;G.mode='galaxy';debugSpawnGalaxyObj();
    if(G.galaxy[pos.y][pos.x].type==='VOID' && !G.galaxy[pos.y][pos.x].name)throw Error('Missing galaxy factory: '+definition.id);
    G.debugPalette.entries.push({id:'galaxy:'+definition.id,kind:'galaxy',label:definition.label,...pos});
  });
  for(const [star,definition] of Object.entries(STAR_TYPES)){
    const pos=slot();G.galaxy[pos.y][pos.x]={type:'SYSTEM',name:definition.label,starType:star,planets:[debugPaletteDescriptor('HABITABLE',definition.label+' world')]};
    G.debugPalette.entries.push({id:'star:'+star,kind:'galaxy',label:definition.label,...pos});
  }
  for(const biome of Object.keys(BIOMES)){
    const pos=slot(),label=BIOMES[biome].name||biome;
    G.galaxy[pos.y][pos.x]=biome==='CASINO'?{type:'CASINO',name:label}:
      biome==='DERELICT'?{type:'DERELICT',name:label}:
      {type:'SYSTEM',name:label,starType:'YELLOW',planets:[debugPaletteDescriptor(biome,label)]};
    if(biome==='CASINO')generateCasinoStationMap('casino:'+pos.x+','+pos.y);
    else if(biome==='DERELICT')generateDerelict(pos.x+','+pos.y);
    else if(biome!=='GAS_GIANT')getOrCreateScanPlanetData(pos.x+','+pos.y+':0',biome,'full');
    G.debugPalette.entries.push({id:'biome:'+biome,kind:'biome',biome,label,...pos});
  }
  for(const tier of CIV_TIERS)for(const aggression of CIV_AGGRESSION){
    const pos=slot(),label=tier.label+' / '+aggression;
    G.galaxy[pos.y][pos.x]={type:'SYSTEM',name:label,starType:'YELLOW',planets:[debugPaletteDescriptor('HABITABLE',label)]};
    G.debugPalette.entries.push({id:'civ:'+tier.id+':'+aggression,kind:'civilization',tier:tier.id,aggression,species:'Mammalian',label,...pos});
  }
  for(const species of CIV_SPECIES_TYPES){
    const pos=slot(),label=species+' contact';
    G.galaxy[pos.y][pos.x]={type:'SYSTEM',name:label,starType:'YELLOW',planets:[debugPaletteDescriptor('HABITABLE',label)]};
    G.debugPalette.entries.push({id:'species:'+species,kind:'civilization',tier:'information',aggression:'Passive',species,label,...pos});
  }
  G.bases=[];for(let y=0;y<MAP_H;y++)for(let x=0;x<MAP_W;x++)if(G.galaxy[y][x].type==='BASE')G.bases.push({x,y,name:G.galaxy[y][x].name});
}

function debugSurfaceSampleDefinitions(){
  const galaxyTypes=new Set(['VOID','NEBULA','SYSTEM','BASE','CASINO','PIRATE_BASE']);
  const rows=Object.keys(TILE).filter(type=>!galaxyTypes.has(type)).map(type=>({id:'tile:'+type,kind:'tile',label:type,type}));
  for(const group of DEBUG_ITEM_CATALOG)for(const item of group.items)rows.push({id:'item:'+group.cat+':'+item.name,kind:'item',label:item.name,item});
  for(const item of IMPLANT_CATALOG)rows.push({id:'implant:'+item.id,kind:'item',label:item.name,item:{name:item.name,col:'#88bbff',value:0,usable:'implant_'+item.id,desc:item.desc||item.detail||'Implant'}});
  const known=new Set(rows.filter(e=>e.item).map(e=>(e.item.usable||'')+'|'+e.item.name));
  for(const item of [...Object.values(CORP_ITEM_POOLS).flat(),...PAWN_ITEM_POOL,...MEDBAY_ITEM_POOL]){
    const identity=(item.usable||'')+'|'+item.name;if(known.has(identity))continue;known.add(identity);
    rows.push({id:'shop:'+identity,kind:'item',label:item.name,item:{...item,desc:item.desc||item.detail||item.name,value:item.value||0}});
  }
  for(const id of Object.keys(COMMODITIES))rows.push({id:'cargo:'+id,kind:'cargo',label:COMMODITIES[id].name,commodity:id});
  for(const body of CREATURE_BODY_TYPES)rows.push({id:'creature:'+body.key,kind:'creature',label:body.label,body,hostile:false});
  for(const body of HOSTILE_BODY_TYPES)rows.push({id:'hostile:'+body.key,kind:'creature',label:body.label,body,hostile:true});
  rows.push({id:'npc:gunner',kind:'gunner',label:'Gunner alien'});
  return rows;
}

function debugBuildSurfacePalette(){
  const rows=debugSurfaceSampleDefinitions(),W=40,H=Math.ceil(rows.length/12)*3+6,key=G.debugPalette.surfaceKey;
  const grid=Array.from({length:H},()=>Array.from({length:W},()=>({type:'station_floor'})));
  grid[2][2]={type:'SHIP'};
  const pd={grid,width:W,height:H,biome:'DERELICT',isDerelict:true,isDebugPalette:true,spawnX:2,spawnY:2,
    visited:new Array(W*H).fill(true),explored:new Array(W*H).fill(false),planetTurn:0};
  G.planets[key]=pd;G.enemies[key]=[];
  rows.forEach((sample,index)=>{
    const x=4+(index%12)*3,y=4+Math.floor(index/12)*3,entry={...sample,x,y,key};
    if(sample.kind==='tile') grid[y][x]={type:sample.type,revealed:true,oreType:'fe',_underFloor:'station_floor'};
    else if(sample.kind==='item') grid[y][x].drops=[JSON.parse(JSON.stringify(sample.item))];
    else if(sample.kind==='cargo') grid[y][x].debugCommodity=sample.commodity;
    else if(sample.kind==='creature'){
      const template=sample.hostile?generateHostileCreatureTemplates('VOLCANIC')[0]:generateCreatureTemplates('HABITABLE')[0];
      const npc={...template,body:sample.body.key,sprite:sample.body.sprite,bodyLabel:sample.body.label,
        name:sample.label,x,y,nestX:x,nestY:y,hp:template.maxHp,type:'CREATURE',alive:true,hidden:false,
        currentlyHostile:sample.hostile,hostileByDefault:sample.hostile,behaviour:sample.hostile?'HUNT':'DOCILE'};
      npc.speedRating=planetCritterSpeedRating(npc);
      G.enemies[key].push(npc);
    } else if(sample.kind==='gunner'){
      G.mode='planet';G.curPlanet=key;G.player={x:x-1,y};
      const before=G.enemies[key].length;debugSpawnGunnerAlien();
      const npc=G.enemies[key][before];if(npc){npc.x=x;npc.y=y;}
    }
    G.debugPalette.entries.push(entry);
  });
}

function debugPaletteVisit(id){
  const entry=G?.debugPalette?.entries.find(e=>e.id===id);if(!entry)return;
  debugPaletteNavigateHome(entry.key?'surface':'galaxy');
  if(entry.key){G.curPlanet=entry.key;G.player={x:entry.x-1,y:entry.y};revealPlanet(entry.key,G.player.x,G.player.y);}
  else {
    G.ship.x=entry.x;G.ship.y=entry.y;
    if(entry.kind==='civilization'){
      const key=entry.x+','+entry.y+':0';
      debugPrepareCivilization(entry);
      let keyToVisit=entry.species==='Aquatic'?key+':uw':key;
      G.mode='planet';G.curPlanet=keyToVisit;G.curSystem=entry.x+','+entry.y;
      const pd=G.planets[keyToVisit];G.player=debugPaletteLandingPoint(pd);
      if(entry.species==='Aquatic'){G.underwater=true;G._uwReturn={planet:key,x:G.planets[key].spawnX,y:G.planets[key].spawnY};}
      revealPlanet(keyToVisit,G.player.x,G.player.y);
    }
  }
  addLog('PALETTE: '+entry.label+'. '+(entry.kind==='cargo'?'Step onto the sample and press Enter to load cargo.':
    entry.kind==='tile'?'Raw tile sample. Context-dependent fixtures also have their full biome, casino, civilization or quarantine scenarios in F6.':
    'Use the normal movement, examine and interaction controls.'),'li');renderAll();
}

function debugPaletteLandingPoint(pd){
  if(Number.isInteger(pd.spawnX)&&Number.isInteger(pd.spawnY)) return {x:pd.spawnX,y:pd.spawnY};
  for(let y=1;y<PH(pd)-1;y++)for(let x=1;x<PW(pd)-1;x++)if(TILE[pd.grid[y][x].type]?.pass)return{x,y};
  throw Error('Palette map has no landing point');
}

function debugPrepareCivilization(entry){
  const key=entry.x+','+entry.y+':0';if(G.planets[key])return;
  const pd=getOrCreateScanPlanetData(key,'HABITABLE','full');
  if(entry.species==='Aquatic')debugPrepareAquaticPaletteSurface(pd);
  G.mode='planet';G.curPlanet=key;G.player=debugPaletteLandingPoint(pd);
  DEBUG.debugCivTier=DEBUG_CIV_TIERS.findIndex(t=>t.id===entry.tier);
  DEBUG.debugCivAggression=CIV_AGGRESSION.indexOf(entry.aggression);DEBUG.debugCivSpecies=CIV_SPECIES_TYPES.indexOf(entry.species);
  debugSpawnCivilizationOnCurrentPlanet();
}

function debugPrepareAquaticPaletteSurface(pd){
  // A random habitable map can have no water. This authored contact exhibit
  // needs a connected sea large enough for its actual underwater settlement.
  for(let y=2;y<Math.min(PH(pd)-2,16);y++)for(let x=2;x<Math.min(PW(pd)-2,26);x++){
    if(x!==pd.spawnX||y!==pd.spawnY)pd.grid[y][x]={type:'EARTH_WATER'};
  }
}

function debugPaletteFilteredEntries(){
  const query=(DEBUG.paletteSearch||'').toLowerCase();
  return (G?.debugPalette?.entries||[]).filter(e=>(e.kind+' '+e.label+' '+e.id).toLowerCase().includes(query));
}

function handleDebugPaletteKey(e){
  if(e.key==='F4'&&debugPaletteReturn){e.preventDefault();debugReturnFromPalette();return true;}
  if(DEBUG.on && ['F2','F3','F6','F7'].includes(e.key)){
    e.preventDefault();
    if(e.key==='F7'){if(G.debugPalette){G.debugPalette.simulate=!G.debugPalette.simulate;renderAll();}return true;}
    if(e.key==='F2'||e.key==='F3'){debugEnterPalette(e.key==='F3'?'surface':'galaxy',e.shiftKey);return true;}
    if(!G.debugPalette)debugEnterPalette('galaxy');
    DEBUG.on=true;DEBUG.paletteMenu=true;DEBUG.paletteSearch='';DEBUG.paletteSel=0;renderAll();return true;
  }
  if(!DEBUG.paletteMenu)return false;
  e.preventDefault();
  if(e.key==='Escape'){DEBUG.paletteMenu=false;DEBUG.on=false;renderAll();return true;}
  const rows=debugPaletteFilteredEntries();
  if(e.key==='ArrowUp'||e.key==='ArrowDown')DEBUG.paletteSel=Math.max(0,Math.min(rows.length-1,(DEBUG.paletteSel||0)+(e.key==='ArrowUp'?-1:1)));
  else if(e.key==='Enter'){const entry=rows[DEBUG.paletteSel||0];if(entry)debugPaletteVisit(entry.id);return true;}
  else {if(e.key==='Backspace')DEBUG.paletteSearch=DEBUG.paletteSearch.slice(0,-1);
    else if(e.key.length===1&&!e.ctrlKey&&!e.altKey)DEBUG.paletteSearch+=e.key;DEBUG.paletteSel=0;}
  renderAll();return true;
}

function drawDebugPaletteDirectory(){
  if(!DEBUG.paletteMenu)return;
  ctx.fillStyle='#07101b';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.textAlign='left';
  ctx.font='bold 18px Courier New';ctx.fillStyle='#ffe066';ctx.fillText('DEBUG PALETTE — SEARCH ALL CONTENT',20,30);
  ctx.font='13px Courier New';ctx.fillStyle='#88bbcc';ctx.fillText('Type to search: '+(DEBUG.paletteSearch||'all')+'  |  Enter visits  |  Esc closes',20,57);
  ctx.fillText('F2 galaxy · F3 surface · F4 career · Shift+F2 rebuild · F7 NPC simulation '+(G.debugPalette.simulate?'ON':'OFF'),20,79);
  const rows=debugPaletteFilteredEntries(),count=Math.max(1,Math.floor((canvas.height-120)/22));
  DEBUG.paletteSel=Math.max(0,Math.min(rows.length-1,DEBUG.paletteSel||0));
  const start=Math.max(0,Math.min(DEBUG.paletteSel-Math.floor(count/2),rows.length-count));
  rows.slice(start,start+count).forEach((e,i)=>{
    ctx.fillStyle=start+i===DEBUG.paletteSel?'#ffe066':'#aabbd0';
    ctx.fillText((start+i===DEBUG.paletteSel?'> ':'  ')+e.kind.toUpperCase()+' — '+e.label,20,109+i*22,canvas.width-40);
  });
  ctx.fillStyle='#88aabb';ctx.fillText(rows.length+' matching samples · Arrow keys select',20,canvas.height-12);
}

function drawDebugPaletteLabels(){
  if(!G.debugPalette||!['galaxy','planet'].includes(G.mode))return;
  const pd=G.planets[G.curPlanet],world=G.mode==='galaxy',W=world?MAP_W:PW(pd),H=world?MAP_H:PH(pd);
  const point=world?G.ship:G.player,camX=Math.max(0,Math.min(W-VIEW_W,point.x-Math.floor(VIEW_W/2))),
    camY=Math.max(0,Math.min(H-VIEW_H,point.y-Math.floor(VIEW_H/2)));
  ctx.font='10px Courier New';ctx.textAlign='center';
  for(const entry of G.debugPalette.entries){
    if(world?!!entry.key:entry.key!==G.curPlanet)continue;
    const vx=entry.x-camX,vy=entry.y-camY;
    if(vx<0||vx>=VIEW_W||vy<0||vy>=VIEW_H)continue;
    const labelWidth=(world?5:3)*TS-6;
    let label=entry.label;
    if(ctx.measureText(label).width>labelWidth){
      while(label.length && ctx.measureText(label+'…').width>labelWidth)label=label.slice(0,-1);
      label+='…';
    }
    ctx.fillStyle='#d0e4ef';ctx.fillText(label,(vx+.5)*TS,vy*TS-3);
  }
  ctx.textAlign='left';ctx.fillStyle='#ffe066';ctx.font='12px Courier New';
  ctx.fillText('TEST WORLD — F4 return · Shift+B / F6 directory',8,canvas.height-8);
}

function drawDebugPaletteBodyIcon(body,x,y){
  ctx.save();
  ctx.fillStyle='#04040c';ctx.fillRect(x,y,TS,TS);
  const color=PLANET_COLS[body.biome]||'#8899aa';
  if(OPTIONS.asciiMode){
    const glyph=body.biome==='ANCIENT_STATION'?'B':body.biome==='CAVE'?'>':
      body.biome==='ASTEROID'?'·':body.biome.includes('RINGWORLD')?'◎':'○';
    ctx.fillStyle=color;ctx.font='bold '+(TS-1)+'px Courier New';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(glyph,x+TS/2,y+TS/2+1);
  }else if(body.biome==='ANCIENT_STATION'){
    drawSpriteTinted('starbase',x,y,'#77bbaa');
  }else if(body.biome==='CAVE'){
    DRAW.cave_floor(ctx,x,y);DRAW.CAVE_ENTRANCE(ctx,x,y);
  }else{
    ctx.beginPath();ctx.rect(x,y,TS,TS);ctx.clip();
    const scale=body.biome.includes('RINGWORLD')?TS/76:body.biome==='GAS_GIANT'?TS/56:
      body.biome==='ASTEROID'?TS/20:TS/32;
    ctx.translate(x+TS/2,y+TS/2);ctx.scale(scale,scale);
    drawSystemBodyIcon(body,0,0,color,true);
  }
  ctx.restore();
}
