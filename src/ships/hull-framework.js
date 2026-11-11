const HULL_REFITS=[
  {id:'uphull',label:'Hull plating',field:'maxHp',cap:'maxUpgradeHp',step:20,price:200,space:1,onShip:true},
  {id:'upfuel',label:'Fuel tank',field:'maxFuel',cap:'maxUpgradeFuel',step:20,price:250,space:1},
  {id:'upsensor',label:'Sensors',field:'sensorRange',cap:'maxUpgradeSensor',step:1,price:400,space:1},
  {id:'upshield',label:'Shield generator',field:'shields',cap:'maxShields',step:1,price:350,space:2},
  {id:'upengine',label:'Engines',field:'engineRating',cap:'maxUpgradeEngine',step:1,price:450,space:2},
  {id:'upcargo',label:'Cargo hold',field:'cargoCapacity',cap:'maxUpgradeCargo',step:1,price:300,space:1},
  {id:'upcrew',label:'Crew berths',field:'maxCrew',cap:'maxUpgradeCrew',step:1,price:350,space:2},
  {id:'upwslot',label:'Weapon mount',field:'weaponSlots',cap:'maxWeaponSlots',step:1,price:500,space:3},
  {id:'upmodslot',label:'Module bay',field:'moduleSlots',cap:'maxModuleSlots',step:1,price:500,space:2},
  {id:'upreactor',label:'Reactor',field:'reactorRating',cap:'maxReactor',step:1,price:500,space:2},
  {id:'upcooling',label:'Cooling',field:'coolingRating',cap:'maxCooling',step:1,price:400,space:2},
];
const HULL_MODULES={tractor_beam:{name:'Tractor Beam',price:600},fuel_scoop:{name:'Fuel Scoop',price:500},mining_drill:{name:'Ship Mining Drill',price:700}};

function hullLimits(cls){
  return {maxUpgradeHp:cls.baseHp+20*Math.floor(cls.size*cls.structure),
    maxUpgradeFuel:20*Math.floor((cls.size*120+cls.precision*20)/20),
    maxUpgradeCargo:Math.ceil(cls.size*10*cls.cargoFraction),
    maxUpgradeSensor:Math.ceil(cls.precision*2),
    maxShields:Math.floor(cls.structure+cls.engineering),
    maxUpgradeEngine:Math.floor(cls.engineering*2),
    maxWeaponSlots:Math.floor(1+cls.size*cls.hardpointDensity),maxModuleSlots:Math.floor(cls.size*1.5),
    maxUpgradeCrew:Math.floor(cls.size*5),maxReactor:Math.ceil(cls.engineering),maxCooling:Math.ceil(cls.engineering),
    refitSpace:Math.round(cls.size*8+cls.engineering*2),frameSupport:Math.ceil(cls.size*cls.structure*3+1)};
}

function registerShipHull(definition){
  const cls={...definition};
  if(!/^[A-Z][A-Z0-9_]*$/.test(cls.id) || !['size','structure','engineering','precision','geometry','hardpointDensity','price'].every(key=>Number.isFinite(cls[key])&&cls[key]>0) ||
    !Number.isFinite(cls.cargoFraction) || cls.cargoFraction<0 || cls.cargoFraction>1)throw Error('Invalid hull blueprint');
  const limits=hullLimits(cls);
  const stockFields={baseHp:'maxUpgradeHp',baseFuel:'maxUpgradeFuel',cargoCapacity:'maxUpgradeCargo',sensorRange:'maxUpgradeSensor',shields:'maxShields',
    engineRating:'maxUpgradeEngine',weaponSlots:'maxWeaponSlots',moduleSlots:'maxModuleSlots',maxCrew:'maxUpgradeCrew'};
  if(!Object.entries(stockFields).every(([field,cap])=>Number.isSafeInteger(cls[field])&&cls[field]>=0&&cls[field]<=limits[cap]) || !cls.baseHp || !cls.baseFuel)throw Error('Factory outfit exceeds hull blueprint');
  Object.assign(cls,limits,{nebulaSignature:cls.size});SHIP_CLASSES[cls.id]=cls;return cls;
}
for(const cls of Object.values(SHIP_CLASSES))registerShipHull(cls);

function hangarHullIds(){return Object.values(SHIP_CLASSES).filter(cls=>cls.purchasable!==false).map(cls=>cls.id);}

function hullSystemProfile(id){
  const cls=SHIP_CLASSES[id];if(!cls)return null;
  const limits=hullLimits(cls),largest=Math.min(3,Math.floor(1+cls.structure));
  return {mounts:Array.from({length:limits.maxWeaponSlots},(_,slot)=>Math.max(1,largest-(slot===limits.maxWeaponSlots-1?0:1))),
    reactor:Math.round(4+cls.engineering*2+(cls.structure-1)*2),cooling:Math.round(2+cls.engineering*2),heat:Math.round(60+cls.size*20)};
}

function hullSize(stats=G.shipStats){return (SHIP_CLASSES[stats.classId]||SHIP_CLASSES.LIGHT_SCOUT).size;}
function shipDrivePerformance(ship=G.ship){
  const rating=effectiveEngineRating(ship),stats=ship===G.ship?G.shipStats:ship.systemStats;
  const cls=SHIP_CLASSES[stats?.classId];
  return cls?Math.round(rating*cls.geometry/Math.sqrt(cls.size)*100)/100:rating;
}
function shipTravelFuelCost(stats=G.shipStats){
  const cls=SHIP_CLASSES[stats.classId]||SHIP_CLASSES.LIGHT_SCOUT;
  return Math.max(0.1,Math.round(cls.size*(0.8+stats.engineRating*0.1)/(1+cls.engineering*0.1)*10)/10);
}
function shipCanTravel(){return effectiveEngineRating()>0&&(DEBUG.infiniteFuel||G.fuel+1e-9>=shipTravelFuelCost());}
function spendShipFuel(amount){
  if(DEBUG.infiniteFuel)return 0;
  const before=G.fuel;G.fuel=Math.round(Math.max(0,before-amount)*100)/100;
  const spent=Math.round((before-G.fuel)*100)/100;G.fuelSpent=Math.round(((G.fuelSpent||0)+spent)*100)/100;return spent;
}

function hullRefitUsage(stats=G.shipStats,maxHp=G.ship.maxHp){
  const stock=buildShipStats(stats.classId);
  return HULL_REFITS.reduce((sum,refit)=>sum+Math.max(0,((refit.onShip?maxHp:stats[refit.field])-stock[refit.field])/refit.step)*refit.space,0);
}
function hullFittingReason(stats,maxHp,weapons=[]){
  const cls=SHIP_CLASSES[stats.classId];if(!Object.hasOwn(SHIP_CLASSES,stats.classId))return 'Unknown hull';const limits=hullLimits(cls),stock=buildShipStats(cls.id);
  for(const refit of HULL_REFITS){
    const value=refit.onShip?maxHp:stats[refit.field];
    if(!Number.isSafeInteger(value)||value<stock[refit.field]||value>limits[refit.cap])return refit.label+' exceeds the physical hull limit';
  }
  if(hullRefitUsage(stats,maxHp)>limits.refitSpace+1e-9)return 'Not enough refit space';
  const structure=weapons.reduce((sum,id)=>sum+(SHIP_WEAPONS[id]?.mountSize||0),0)+Math.max(0,(maxHp-cls.baseHp)/40);
  if(structure>limits.frameSupport)return 'Frame support exceeded';
  return '';
}

function hullRefitPreview(id,remove=false){
  const refit=HULL_REFITS.find(refit=>refit.id===id);if(!refit)return {reason:'Unknown refit'};
  const stats={...G.shipStats},stock=buildShipStats(stats.classId),limits=hullLimits(SHIP_CLASSES[stats.classId]);
  const before=refit.onShip?G.ship.maxHp:stats[refit.field];
  const after=remove?Math.max(stock[refit.field],before-refit.step):Math.min(limits[refit.cap],before+refit.step);
  const refund=remove&&(G.shipRefits[id]||0)>0?Math.floor(refit.price*0.25):0;
  let hp=G.ship.maxHp,reason='';
  if(refit.onShip){hp=after;stats.maxHp=after;}else stats[refit.field]=after;
  if(before===after)reason=remove?'No additional refit to remove':'At physical hull limit';
  if(remove&&id==='upwslot'&&(G.installedWeapons||[]).slice(after).some(Boolean))reason='Store weapons in the affected mounts first';
  if(remove&&id==='upmodslot'&&G.installedModules.length>after)reason='Store a utility module first';
  if(stats.cargoCapacity<G.cargo.length)reason='Unload cargo first';
  if(stats.maxCrew<G.crew.filter(crew=>crew.hp>0).length)reason='Insufficient crew berths';
  if(!reason)reason=hullFittingReason(stats,hp,G.installedWeapons);
  if(G.debugPalette&&!G.debugPalette.hullWorkshop&&!remove)reason=before===after?'At physical hull limit':'';
  return {refit,stats,hp,before,after,refund,reason,vented:id==='upfuel'&&remove?Math.max(0,G.fuel-after):0};
}

function performHullRefit(id,remove=false){
  if(G.mode!=='base'||G.dead||G.retired)return false;
  const quote=hullRefitPreview(id,remove),{refit}=quote;
  if(quote.reason){addLog(quote.reason+'.','lw');return false;}
  if(!remove&&G.credits<refit.price){addLog('Need '+refit.price+' cr for '+refit.label+'.','lw');return false;}
  G.credits+=remove?quote.refund:-refit.price;G.shipStats=quote.stats;G.ship.maxHp=quote.hp;
  if(id==='uphull')G.ship.hp=Math.min(G.ship.maxHp,G.ship.hp+(remove?0:quote.after-quote.before));
  if(id==='upfuel'&&!remove)G.fuel+=quote.after-quote.before;
  G.shipRefits[id]=Math.max(0,(G.shipRefits[id]||0)+(remove?-1:1));
  syncPlayerShipSystems();
  addLog(refit.label+(remove?' refit removed. Recovered '+quote.refund+' cr.':' upgraded to '+quote.after+'.')+
    (quote.vented?' '+quote.vented+' surplus fuel vented.':''),'lg');return true;
}

function hullRefitRows(remove=false){
  const limits=hullLimits(SHIP_CLASSES[G.shipStats.classId]),used=hullRefitUsage();
  const rows=[{label:'← Back',detail:'',id:'hangar_sub_top'},
    {label:'Shared refit space '+used.toFixed(1)+' / '+limits.refitSpace,detail:'Individual ceilings compete for this space.',id:'noop',_header:true}];
  for(const refit of HULL_REFITS){
    const quote=hullRefitPreview(refit.id,remove);
    if(remove&&quote.before===quote.after)continue;
    rows.push({label:(remove?'Remove ':'Upgrade ')+refit.label,
      detail:quote.reason || (remove?'Recover '+quote.refund+' cr · free '+refit.space+' space'+(quote.vented?' · vent '+quote.vented+' fuel':''):
        refit.price+' cr · '+quote.before+' → '+quote.after+' · '+refit.space+' space'),
      id:(remove?'remove_refit_':'')+refit.id,disabled:!!quote.reason});
  }
  return rows;
}

function stationEquipmentStore(create=false){
  const key=G.base?.stationName||'Starbase Alpha';
  const own=Object.prototype.hasOwnProperty.call(G.hangarStores,key);
  if(create&&!own)Object.defineProperty(G.hangarStores,key,{value:{weapons:[],modules:[]},enumerable:true,writable:true,configurable:true});
  return own||create?G.hangarStores[key]:{weapons:[],modules:[]};
}
function ownedShipWeaponCount(id){return stationEquipmentStore().weapons.filter(item=>item.id===id).length;}
function ownsShipWeapon(id){
  return G.installedWeapons.includes(id)||Object.values(G.hangarStores).some(store=>store.weapons.some(item=>item.id===id));
}
function shipWeaponInstallPrice(weapon){return ownedShipWeaponCount(weapon.id)?0:weapon.cost;}
function shipWeaponInstallReason(slot,weapon){
  if(G.installedWeapons[slot]===weapon.id)return 'Already installed in this mount';
  return shipWeaponFitReason(slot,weapon);
}

function storeShipWeapon(slot){
  const id=G.installedWeapons[slot],store=stationEquipmentStore(true);
  if(!id||store.weapons.length>=256)return false;
  store.weapons.push({id,readyAt:G.ship.weaponReadyAt[slot]||0});G.installedWeapons[slot]=null;G.ship.weaponReadyAt[slot]=0;
  addLog(SHIP_WEAPONS[id].name+' moved to this station’s stores.','li');return true;
}
function storeShipModule(id){
  const slot=G.installedModules.indexOf(id),store=stationEquipmentStore(true);
  if(slot<0||store.modules.length>=256)return false;
  if(id==='tractor_beam'&&G.towedShip){addLog('Sell or release the towed ship first.','lw');return false;}
  store.modules.push(id);G.installedModules.splice(slot,1);addLog(HULL_MODULES[id].name+' stored at this station.','li');return true;
}
function restoreShipModule(id){
  const store=stationEquipmentStore(true),slot=store.modules.indexOf(id);
  if(slot<0||G.installedModules.includes(id)||G.installedModules.length>=G.shipStats.moduleSlots)return false;
  G.installedModules.push(id);store.modules.splice(slot,1);addLog(HULL_MODULES[id].name+' fitted from station stores.','lg');return true;
}
function sellStoredEquipment(id,module=false){
  const store=stationEquipmentStore(true),items=module?store.modules:store.weapons;
  const slot=items.findIndex(item=>module?item===id:item.id===id);if(slot<0)return false;
  const value=module?HULL_MODULES[id]:SHIP_WEAPONS[id];items.splice(slot,1);
  const price=Math.floor((value.price??value.cost)*0.5);earnCredits(price);addLog('Sold stored '+value.name+' for '+price+' cr.','lg');return true;
}

function getHullPurchaseQuote(id){
  const cls=SHIP_CLASSES[id],old=SHIP_CLASSES[G.shipStats.classId];
  if(!cls||cls.purchasable===false)return {reason:'Hull unavailable'};
  const stats=buildShipStats(id),refits={},crew=G.crew.filter(crew=>crew.hp>0).length;
  let extras=0,reason=id===old.id?'Already flying this hull':'';
  for(const [action,needed]of[['upcrew',crew],['upcargo',G.cargo.length]]){
    const refit=HULL_REFITS.find(refit=>refit.id===action),count=Math.max(0,needed-stats[refit.field]);
    stats[refit.field]+=count;if(count)refits[action]=count;extras+=count*refit.price;
  }
  if(!reason)reason=hullFittingReason(stats,stats.maxHp);
  if(G.towedShip)reason='Sell or release the towed ship first';
  const store=stationEquipmentStore(),weapons=G.installedWeapons.filter(Boolean).length,modules=G.installedModules.length;
  if(store.weapons.length+weapons>256||store.modules.length+modules>256)reason='Station equipment storage is full';
  const hullCondition=Math.min(1,Math.max(0,G.ship.hp/G.ship.maxHp));
  const coreCondition=Object.keys(SHIP_SYSTEMS).reduce((sum,id)=>sum+G.ship.systems[id].condition,0)/600;
  const condition=0.6*hullCondition+0.4*coreCondition;
  const tradeHull=Math.floor(old.price*0.5*condition);
  const investment=HULL_REFITS.reduce((sum,refit)=>sum+(G.shipRefits[refit.id]||0)*refit.price,0);
  const tradeRefits=Math.floor(investment*0.25*condition),net=cls.price+500+extras-tradeHull-tradeRefits;
  const fuel=Math.min(G.fuel,stats.maxFuel),vented=Math.round((G.fuel-fuel)*100)/100;
  const key=JSON.stringify([id,cls,stats,G.ship,G.shipStats,G.shipRefits,G.credits,G.fuel,G.installedWeapons,G.installedModules,
    G.crew.map(crew=>[crew._careerId,crew.hp]),G.cargo,G.towedShip,store,G.base?.stationName,G.turn]);
  return {id,stats,refits,extras,tradeHull,tradeRefits,condition,net,fuel,vented,weapons,modules,reason,key};
}

function commitHullPurchase(id,key){
  if(G.mode!=='base'||G.dead||G.retired)return false;
  const quote=getHullPurchaseQuote(id);
  if(quote.reason||quote.key!==key||G.credits<quote.net){addLog(quote.reason||'Hull quote changed or funds are insufficient. Review it again.','lw');return false;}
  const store=stationEquipmentStore(true);
  G.installedWeapons.forEach((id,slot)=>{if(id)store.weapons.push({id,readyAt:G.ship.weaponReadyAt[slot]||0});});
  store.modules.push(...G.installedModules);
  G.credits-=quote.net;G.shipStats=quote.stats;G.shipRefits=quote.refits;
  const {x,y,ammo,facing}=G.ship;
  G.ship={x,y,ammo:{...ammo},facing,hp:quote.stats.maxHp,maxHp:quote.stats.maxHp};
  G.installedWeapons=[];G.installedModules=[];G.maxFuel=quote.stats.maxFuel;G.fuel=quote.fuel;
  G.weaponLevel=quote.stats.weaponSlots?1:0;
  ensureShipSystems();G._alarmFuelWarn=false;G._alarmFuelCrit=false;
  G.base.hullQuoteKey=null;G.base.screen='sub';G.base.hangarSub='armament';G.base.subSel=0;G.base.subScroll=0;
  addLog('Purchased '+SHIP_CLASSES[id].name+' for '+quote.net+' cr net. Factory hull and cores restored; weapons and utilities moved to this station’s stores.'+
    (quote.vented?' '+quote.vented+' surplus fuel vented.':''),'lg');return true;
}
