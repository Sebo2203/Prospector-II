// Salvage uses existing cargo and equipment catalogs, never quest or installed items.
const SHIP_SALVAGE_PROFILES = {
  cargo:{weights:[20,10,10,60],cash:[20,80],cargo:['rations','parts','metal','fabric'],items:['repair_kit','field_rations','oxytank'],units:3},
  trader:{weights:[20,35,15,30],cash:[40,160],cargo:['parts','fabric','medicine','lenses'],items:['medikit','floodlight','sensor_drone'],units:2},
  science:{weights:[25,10,35,30],cash:[20,100],cargo:['instruments','datadrives','reagents','lenses'],items:['sensor_drone','floodlight','oxytank','rad_flush'],units:2},
  patrol:{weights:[35,10,40,15],cash:[20,80],cargo:['parts','metal'],items:['gun','gun_burst','armor_reinforced','repair_kit'],units:1},
  guard:{weights:[35,10,40,15],cash:[20,80],cargo:['parts','metal','rations'],items:['gun','gun_shotgun','armor_reinforced','repair_kit'],units:1},
  roamer:{weights:[25,20,25,30],cash:[30,120],cargo:['parts','rations','fabric','ore'],items:['gun','knife','repair_kit','stim_pack'],units:2},
};

function rollShipSalvage(ship){
  const profile=SHIP_SALVAGE_PROFILES[ship.pirateType||ship.type]||SHIP_SALVAGE_PROFILES.trader;
  let roll=rnd(100),kind=0;
  while(kind<3 && roll>=profile.weights[kind]){roll-=profile.weights[kind];kind++;}
  if(kind===0)return {kind:'none'};
  if(kind===1)return {kind:'credits',amount:profile.cash[0]+rnd(profile.cash[1]-profile.cash[0]+1)};
  if(kind===2){
    const usable=profile.items[rnd(profile.items.length)];
    const source=PAWN_ITEM_POOL.find(item=>item.usable===usable);
    return {kind:'equipment',item:{name:source.name,col:source.col,desc:source.detail,value:0,usable:source.usable}};
  }
  const id=profile.cargo[rnd(profile.cargo.length)];
  return {kind:'cargo',items:Array.from({length:1+rnd(profile.units)},()=>makeCommodityItem(id,'combat salvage',0))};
}

function awardShipSalvage(ship,pirate){
  const reward=rollShipSalvage(ship);
  if(reward.kind==='none'){addCombatLog('No usable salvage remains from '+ship.name+'.','li');return;}
  if(reward.kind==='credits'){
    if(pirate){
      G.pirateBounties.credits+=reward.amount;
      addCombatLog('Recovered pirate assets worth '+reward.amount+' cr. Added to the station claim.','lg');
    } else {earnCredits(reward.amount);addCombatLog('Recovered '+reward.amount+' cr from '+ship.name+'.','lg');}
  } else if(reward.kind==='equipment'){
    G.inventory.push(reward.item);
    addCombatLog('Salvaged '+reward.item.name+' from '+ship.name+'. Added to inventory.','lg');
  } else {
    let stored=0;
    for(const item of reward.items){
      if(addCargo(item))stored++;
      else {G.nebulaLoot??=[];G.nebulaLoot.push({x:G.ship.x,y:G.ship.y,item});}
    }
    addCombatLog('Salvaged '+reward.items.length+' × '+reward.items[0].name+': '+stored+' loaded'+
      (stored<reward.items.length?'; '+(reward.items.length-stored)+' left at the encounter coordinates':'')+'.','lg');
  }
}

function settlePirateBountiesAtStation(stationName){
  if(G.mode!=='base' || (G.stationReputation||0)<=-40 || G.base?.stationName!==stationName)return;
  const pending=G.pirateBounties;
  if(!pending?.kills)return;
  const {credits,kills}=pending;
  G.pirateBounties={credits:0,kills:0};
  earnCredits(credits);
  addLog(stationName+' pays '+credits+' cr for '+kills+' confirmed pirate kill'+(kills===1?'':'s')+' and recovered assets.','lg');
}
