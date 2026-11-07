const SHIP_SYSTEMS = {
  engine:{name:'Engines',stat:'engineRating'},
  reactor:{name:'Reactor',stat:'reactorRating'},
  shields:{name:'Shield generator',stat:'shields'},
  cooling:{name:'Cooling',stat:'coolingRating'},
  sensors:{name:'Sensors',stat:'sensorRange'},
  fuelTank:{name:'Fuel tank',stat:'maxFuel'},
};
const SHIP_HULL_SYSTEMS = {
  LIGHT_SCOUT:{mounts:[1,2],reactor:6,cooling:6,heat:80},
  BULK_FREIGHTER:{mounts:[1,2],reactor:8,cooling:5,heat:120},
  ATTACK_CORVETTE:{mounts:[2,2,3],reactor:12,cooling:8,heat:100},
};

function shipSystemStats(ship=G.ship){
  if(ship===G.ship) return G.shipStats;
  if(!ship.systemStats){
    const guns=ship.guns??1;
    ship.systemStats={
      engineRating:ship.engineRating??2,sensorRange:ship.sensorRange??2,
      shields:ship.shields||0,reactorRating:1,coolingRating:1,
      reactorOutput:6+guns*3+(ship.shields||0),coolingRate:6,heatCapacity:80+guns*15,
      weaponSlots:guns,mountSizes:new Array(guns).fill(3),maxFuel:100,
    };
    ship.installedWeapons ??= Array.from({length:guns},(_,index)=>
      ship.atk>=8 ? ['railgun','laser_cannon','mass_driver'][index%3] : 'mass_driver');
  }
  return ship.systemStats;
}

function ensureShipSystems(ship=G.ship){
  if(!ship.systems){
    ship.systems=Object.fromEntries(Object.keys(SHIP_SYSTEMS).map(id=>[id,{condition:100,bypassUntil:0}]));
  }
  ship.heat ??= 0;
  ship.weaponReadyAt ??= [];
  ship.systemTurn ??= G.turn;
  const stats=shipSystemStats(ship);
  ship.shieldCharge ??= (stats.shields||0)*20;
  ship.shieldRechargeAt ??= G.turn;
  return ship.systems;
}

function shipSystemCondition(ship,id){
  const system=ensureShipSystems(ship)[id];
  return system.bypassUntil>G.turn ? Math.max(75,system.condition) : system.condition;
}

function shipSystemRating(ship,id){
  const stats=shipSystemStats(ship), systems=ensureShipSystems(ship);
  const base=stats[SHIP_SYSTEMS[id].stat]??1;
  if(id==='fuelTank') return Math.floor(base*(shipSystemCondition(ship,id)<=50?0.5:1));
  const condition=shipSystemCondition(ship,id);
  const value=condition<=0 ? 0 : Math.max(0,base-Math.floor((100-condition)/25));
  return systems[id].bypassUntil>G.turn && base>0 ? Math.max(1,value) : value;
}

function shipReactorOutput(ship=G.ship){
  const stats=shipSystemStats(ship);
  const hull=SHIP_HULL_SYSTEMS[stats.classId];
  const nominal=(stats.reactorOutput??hull?.reactor??6)+Math.max(0,(stats.reactorRating??1)-1)*3;
  return Math.floor(nominal*shipSystemCondition(ship,'reactor')/100);
}

function effectiveSensorRange(ship=G.ship){
  if(!ship) return 0;
  return shipReactorOutput(ship)<2 ? 0 : shipSystemRating(ship,'sensors');
}

function effectiveEngineRating(ship=G.ship){
  return shipReactorOutput(ship)<2 ? 0 : shipSystemRating(ship,'engine');
}

function shipHeatCapacity(ship=G.ship){
  const stats=shipSystemStats(ship), hull=SHIP_HULL_SYSTEMS[stats.classId];
  return (hull?.heat??stats.heatCapacity??80)+Math.max(0,(stats.coolingRating??1)-1)*10;
}

function shipCoolingRate(ship=G.ship){
  const stats=shipSystemStats(ship), hull=SHIP_HULL_SYSTEMS[stats.classId];
  const nominal=(hull?.cooling??stats.coolingRate??6)+Math.max(0,(stats.coolingRating??1)-1)*2;
  return Math.max(1,Math.floor(nominal*shipSystemCondition(ship,'cooling')/100));
}

function shipShieldCapacity(ship=G.ship){
  const stats=shipSystemStats(ship);
  if(shipReactorOutput(ship)<2+(stats.shields||0)) return 0;
  return Math.floor((stats.shields||0)*20*shipSystemCondition(ship,'shields')/100);
}

function syncPlayerShipSystems(){
  ensureShipSystems();
  const capacity=shipSystemRating(G.ship,'fuelTank');
  G.maxFuel=capacity;
  G.fuel=Math.min(G.fuel,capacity);
  G.ship.shieldCharge=Math.min(G.ship.shieldCharge,shipShieldCapacity());
}

function tickShipSystems(ship=G.ship,extraCooling=0){
  ensureShipSystems(ship);
  const elapsed=Math.max(0,G.turn-ship.systemTurn);
  if(!elapsed) return;
  const capacity=shipShieldCapacity(ship), cooling=shipCoolingRate(ship);
  ship.shieldCharge=Math.min(ship.shieldCharge,capacity);
  for(let turn=ship.systemTurn+1;turn<=G.turn;turn++){
    ship.heat=Math.max(0,ship.heat-cooling);
    if(turn>=ship.shieldRechargeAt && ship.shieldCharge<capacity && ship.heat+1<=shipHeatCapacity(ship)){
      ship.shieldCharge=Math.min(capacity,ship.shieldCharge+3);
      ship.heat++;
    }
    if(ship.heat===0 && ship.shieldCharge===capacity) break;
  }
  ship.heat=Math.max(0,ship.heat-extraCooling);
  ship.systemTurn=G.turn;
  if(ship===G.ship) syncPlayerShipSystems();
}

function shipEngineerSkill(){
  return Math.max(0,...(G.crew||[]).filter(crew=>crew.hp>0 && crew.role==='engineer')
    .map(crew=>crewSkillValue(crew,'eng')));
}

function damageShipSystem(ship,id,amount,source='combat'){
  const component=ensureShipSystems(ship)[id];
  const before=component.condition;
  component.condition=Math.max(0,before-Math.max(0,amount));
  component.bypassUntil=0;
  if(ship===G.ship){
    const oldFuel=G.fuel;
    syncPlayerShipSystems();
    addLog(SHIP_SYSTEMS[id].name+' damaged by '+source+'. Integrity '+component.condition+'%.','lw');
    if(id==='fuelTank' && before>50 && component.condition<=50){
      addLog('FUEL TANK RUPTURE — usable capacity halved to '+G.maxFuel+'. '+Math.max(0,oldFuel-G.fuel)+' fuel lost.','lc');
    }
    if(id==='engine' && effectiveEngineRating()===0) addLog('ENGINES OFFLINE — field repair, engineer bypass or SOS rescue required.','lc');
    if(id==='sensors' && effectiveSensorRange()===0){
      addLog('SENSORS OFFLINE — charts retained. New terrain and live contacts cannot be detected.','lc');
    }
  }
  const enemy=G.shipCombat?.enemies.find(enemy=>enemy.ship===ship);
  if(ship!==G.ship && enemy && shipCombatContactVisible(G.shipCombat,enemy)){
    addLog(ship.name+' — '+SHIP_SYSTEMS[id].name+' damaged. Integrity '+component.condition+'%.','lc');
  }
  ship.shieldCharge=Math.min(ship.shieldCharge,shipShieldCapacity(ship));
}

function rollShipSystemDamage(ship,hullDamage,source){
  if(hullDamage<=0 || ship._homeCluster) return;
  const engineer=ship===G.ship?shipEngineerSkill():ship.engineerSkill||0;
  const chance=Math.min(0.4,0.14+hullDamage*0.005)/(1+engineer*0.12);
  if(Math.random()>=chance) return;
  const stats=shipSystemStats(ship);
  const ids=Object.keys(SHIP_SYSTEMS).filter(id=>(stats[SHIP_SYSTEMS[id].stat]||0)>0);
  damageShipSystem(ship,ids[rnd(ids.length)],Math.max(10,25-engineer*2),source);
}

function damagePlayerShipHull(damage,source='weapons fire'){
  if(DEBUG.infiniteHull) return 0;
  const dealt=Math.min(G.ship.hp,Math.max(0,damage));
  G.ship.hp=Math.max(0,G.ship.hp-dealt);
  if(G.ship.hp>0) rollShipSystemDamage(G.ship,dealt,source);
  return dealt;
}

function shipMountSize(slot,ship=G.ship){
  const stats=shipSystemStats(ship);
  return (stats.mountSizes || SHIP_HULL_SYSTEMS[stats.classId]?.mounts || [3])[slot] || 1;
}

function shipWeaponPowerUsed(ship=G.ship,loadout=ship===G.ship?G.installedWeapons:ship.installedWeapons){
  return (loadout||[]).slice(0,shipSystemStats(ship).weaponSlots)
    .reduce((total,id)=>total+(SHIP_WEAPONS[id]?.power||0),0)+2+(shipSystemStats(ship).shields||0);
}

function shipWeaponFitReason(slot,weapon,ship=G.ship){
  const stats=shipSystemStats(ship);
  if(slot<0 || slot>=stats.weaponSlots) return 'Mount is locked';
  if((weapon.mountSize||1)>shipMountSize(slot,ship)) return 'Requires a larger mount';
  const loadout=[...(ship===G.ship?G.installedWeapons:ship.installedWeapons)||[]];
  loadout[slot]=weapon.id;
  if(shipWeaponPowerUsed(ship,loadout)>shipReactorOutput(ship)) return 'Reactor capacity exceeded';
  return '';
}

function shipWeaponOnline(ship,slot){
  const stats=shipSystemStats(ship);
  const loadout=ship===G.ship?G.installedWeapons:ship.installedWeapons;
  const weapon=SHIP_WEAPONS[loadout?.[slot]];
  if(!weapon || slot>=stats.weaponSlots || (weapon.mountSize||1)>shipMountSize(slot,ship)) return false;
  let budget=shipReactorOutput(ship)-2-(stats.shields||0);
  for(let index=0;index<=slot;index++){
    const fitted=SHIP_WEAPONS[loadout[index]];
    if(!fitted || (fitted.mountSize||1)>shipMountSize(index,ship)) continue;
    if(fitted.power>budget){
      if(index===slot) return false;
    } else budget-=fitted.power;
  }
  return true;
}

function shipSystemCanBypass(ship,id){
  const component=ensureShipSystems(ship)[id];
  return id!=='fuelTank' && component.bypassUntil<=G.turn &&
    (component.condition<75 || (component.condition===75 && ['engine','sensors'].includes(id) && shipSystemRating(ship,id)===0));
}

function shipRepairAccess(){
  const mode=G.mode==='inventory'?G._prevMode:G.mode;
  return ['galaxy','system','shipcombat','base'].includes(mode) ||
    (mode==='planet' && G.planets[G.curPlanet]?.grid[G.player.y]?.[G.player.x]?.type==='SHIP');
}

function repairShipSystem(id,method){
  const component=ensureShipSystems()[id];
  if(!component || !shipRepairAccess() || G.dead || G.retired) return false;
  const mode=G.mode==='inventory'?G._prevMode:G.mode;
  if(method==='station'){
    if(mode!=='base' || component.condition>=100) return false;
    const cost=(100-component.condition)*2;
    if(G.credits<cost){addLog('Core repair requires '+cost+' cr.','lw');return false;}
    G.credits-=cost;component.condition=100;component.bypassUntil=0;
  } else {
    const engineer=(G.crew||[]).find(crew=>crew.hp>0 && crew.role==='engineer');
    if(!engineer){addLog('A living engineer is required for field repairs.','lw');return false;}
    if(method==='kit'){
      const index=G.inventory.findIndex(item=>item.usable==='repair_kit');
      if(index<0 || component.condition>=85){addLog('Field repairs need a repair kit and stop at 85% integrity.','lw');return false;}
      G.inventory.splice(index,1);
      component.condition=Math.min(85,component.condition+25+shipEngineerSkill()*3);
      component.bypassUntil=0;
    } else if(method==='bypass'){
      if(!shipSystemCanBypass(G.ship,id)) return false;
      component.bypassUntil=G.turn+15;
    } else return false;
    giveSkillXP(engineer,'eng',2);
    addLog(crewDisplayName(engineer)+(method==='bypass'?' rigs a 15-turn bypass for ':' repairs ')+SHIP_SYSTEMS[id].name+'.','lg');
    if(mode==='shipcombat') advanceShipCombat(G.shipCombat,false,'repair');
    else{
      const previous=G.mode;
      G.mode=mode;
      if(mode==='planet') completeSurfaceAction();
      else if(mode==='galaxy'){
        if(G.stranded && effectiveEngineRating()>0 && G.fuel>0){
          G.stranded=null;
          (G.neutralShips||[]).forEach(ship=>ship.rescuing=false);
          addLog('Drive operational. Stranded alert cleared.','lg');
        }
        if(G.stranded){
          // Performing work still costs a turn when a rescue offer is open.
          if(G.stranded.rescuePhase==='offer') G.stranded.rescuePhase=null;
          doStrandedWait();
        } else doWaitGalaxy();
      } else {beginCareerTurn();finishCareerTurn();}
      if(G.mode===mode && previous==='inventory') G.mode=previous;
    }
  }
  syncPlayerShipSystems();
  if(mode==='galaxy' && effectiveSensorRange()>0) revealAround(G.ship.x,G.ship.y,effectiveSensorRange());
  if(G.shipCombat) syncShipCombatSystems(G.shipCombat);
  renderAll();
  return true;
}

// Weapon heat, absolute reload deadlines and shield damage belong to the ship,
// so retreating or serializing an encounter cannot reset them.
function shipWeaponAvailability(ship,slot){
  ensureShipSystems(ship);
  const id=(ship===G.ship?G.installedWeapons:ship.installedWeapons)?.[slot];
  const weapon=SHIP_WEAPONS[id];
  if(!weapon || weapon.placeholder) return 'Empty mount';
  if(!shipWeaponOnline(ship,slot)) return 'Mount offline';
  const reload=(ship.weaponReadyAt[slot]||0)-G.turn;
  if(reload>0) return 'Ready in '+reload;
  if(ship.heat+weapon.heat>shipHeatCapacity(ship)) return 'Too hot';
  return 'Ready';
}

function commitShipWeapon(ship,slot){
  const weapon=SHIP_WEAPONS[(ship===G.ship?G.installedWeapons:ship.installedWeapons)[slot]];
  ship.heat+=weapon.heat;
  ship.weaponReadyAt[slot]=G.turn+weapon.cooldown+1;
}

function absorbShipHit(ship,damage,source='weapons fire'){
  ensureShipSystems(ship);
  ship.shieldCharge=Math.min(ship.shieldCharge,shipShieldCapacity(ship));
  const blocked=Math.min(ship.shieldCharge,damage);
  ship.shieldCharge-=blocked;
  ship.shieldRechargeAt=G.turn+3;
  const hull=damage-blocked;
  if(ship===G.ship) return damagePlayerShipHull(hull,source);
  ship.hp=Math.max(0,ship.hp-hull);
  if(ship.hp>0) rollShipSystemDamage(ship,hull,source);
  return hull;
}

// Presentation derives from fitted equipment and the next normal system tick.
function shipShieldReadout(ship=G.ship){
  const stats=shipSystemStats(ship);
  if(!stats.shields || ship._homeCluster) return null;
  ensureShipSystems(ship);
  const capacity=shipShieldCapacity(ship), charge=Math.floor(Math.min(ship.shieldCharge,capacity));
  const condition=shipSystemCondition(ship,'shields');
  let state;
  if(condition<=0 || (capacity===0 && shipReactorOutput(ship)>=2+stats.shields)) state='Generator failed';
  else if(shipReactorOutput(ship)<2+stats.shields) state='Unpowered';
  else if(charge>=capacity) state='Full';
  else if(ship.shieldRechargeAt>G.turn) state='Recharge in '+(ship.shieldRechargeAt-G.turn)+' turn'+(ship.shieldRechargeAt-G.turn===1?'':'s');
  else if(Math.max(0,ship.heat-shipCoolingRate(ship))+1>shipHeatCapacity(ship)) state='Heat limited';
  else state='Recharging +3/turn';
  return {charge,capacity,state,damaged:condition<100};
}
