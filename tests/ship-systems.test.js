const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');

function career(classId='LIGHT_SCOUT'){
  const c=vm.createContext({G:null,DEBUG:{infiniteHull:false},
    rnd:()=>0,crewSkillValue:crew=>crew.skills?.eng||0});
  for(const file of ['ships/classes.js','ships/systems.js','combat/ship.js']){
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),c);
  }
  vm.runInContext(`G={turn:1,ship:{hp:100,maxHp:100},shipStats:buildShipStats('${classId}'),crew:[],installedWeapons:[],log:[]};
    G.maxFuel=G.shipStats.maxFuel;G.fuel=G.maxFuel;
    function addLog(message){G.log.push(message);}
    ensureShipSystems();`,c);
  return c;
}

test('sensor damage can disable a rating-one sensor while preserving its installed rating',()=>{
  const c=career('BULK_FREIGHTER');
  assert.equal(c.effectiveSensorRange(),1);
  c.damageShipSystem(c.G.ship,'sensors',25,'test');
  assert.equal(c.effectiveSensorRange(),0);
  assert.equal(c.G.shipStats.sensorRange,1);
});

test('a ruptured tank halves usable capacity once and restored integrity does not create fuel',()=>{
  const c=career();
  c.damageShipSystem(c.G.ship,'fuelTank',50,'test');
  assert.equal(c.G.maxFuel,50);assert.equal(c.G.fuel,50);assert.equal(c.G.shipStats.maxFuel,100);
  c.damageShipSystem(c.G.ship,'fuelTank',25,'test');
  assert.equal(c.G.maxFuel,50);
  c.G.ship.systems.fuelTank.condition=100;c.syncPlayerShipSystems();
  assert.equal(c.G.maxFuel,100);assert.equal(c.G.fuel,50);
});

test('mount size and reactor capacity constrain fitting, with installed weapons offline after reactor damage',()=>{
  const c=career('ATTACK_CORVETTE');
  const weapon=vm.runInContext('SHIP_WEAPONS.railgun',c);
  assert.equal(c.shipWeaponFitReason(0,weapon),'');
  c.G.installedWeapons=['railgun','railgun'];
  assert.equal(c.shipWeaponOnline(c.G.ship,1),true);
  c.damageShipSystem(c.G.ship,'reactor',50,'test');
  assert.equal(c.shipWeaponOnline(c.G.ship,1),false);
  c.G.shipStats.weaponSlots=3;
  assert.equal(c.shipWeaponFitReason(2,weapon),'Reactor capacity exceeded');
  const scout=career();
  assert.equal(scout.shipWeaponFitReason(0,weapon),'Requires a larger mount');
});

test('shield capacity is measured in damage points and recharge respects its damage delay',()=>{
  const c=career('ATTACK_CORVETTE');
  assert.equal(c.shipShieldCapacity(),20);
  c.G.ship.shieldCharge=0;c.G.ship.shieldRechargeAt=4;c.G.ship.heat=30;
  c.G.turn=3;c.tickShipSystems();
  assert.equal(c.G.ship.shieldCharge,0);
  c.G.turn=4;c.tickShipSystems();
  assert.equal(c.G.ship.shieldCharge,3);
  assert.ok(c.G.ship.heat<30);
});


test('an engineer reduces critical severity and the chance of subsystem damage',()=>{
  const without=career('BULK_FREIGHTER'),withEngineer=career('BULK_FREIGHTER');
  withEngineer.G.crew=[{hp:30,role:'engineer',skills:{eng:5}}];
  for(const c of [without,withEngineer]){
    vm.runInContext('Math.random=()=>0; rnd=()=>3;',c);
    c.rollShipSystemDamage(c.G.ship,10,'test');
  }
  assert.equal(without.G.ship.systems.sensors.condition,75);
  assert.equal(withEngineer.G.ship.systems.sensors.condition,85);
  for(const c of [without,withEngineer]){
    c.G.ship.systems.sensors.condition=100;
    vm.runInContext('Math.random=()=>0.15;',c);
    c.rollShipSystemDamage(c.G.ship,10,'test');
  }
  assert.equal(without.G.ship.systems.sensors.condition,75);
  assert.equal(withEngineer.G.ship.systems.sensors.condition,100);
});

test('all six cores have effects, and temporary bypass expiry preserves physical damage',()=>{
  const c=career('BULK_FREIGHTER');
  c.damageShipSystem(c.G.ship,'engine',25,'test');
  assert.equal(c.effectiveEngineRating(),0);
  c.G.ship.systems.engine.bypassUntil=16;
  assert.equal(c.effectiveEngineRating(),1);
  c.G.turn=16;c.tickShipSystems();
  assert.equal(c.effectiveEngineRating(),0);
  assert.equal(c.G.ship.systems.engine.condition,75);
  c.damageShipSystem(c.G.ship,'cooling',100,'test');
  assert.equal(c.shipCoolingRate(),1,'a broken cooler retains only radiative cooling');
  c.damageShipSystem(c.G.ship,'reactor',100,'test');
  assert.equal(c.effectiveSensorRange(),0);
  assert.equal(c.shipReactorOutput(),0);
});

test('weapon heat, deadlines and shield absorption share persistent state for player and NPC',()=>{
  const c=career('ATTACK_CORVETTE');
  c.G.installedWeapons=['railgun','mass_driver'];
  const npc={hp:100,maxHp:100,guns:2,atk:8,shields:1};
  c.ensureShipSystems(npc);
  for(const ship of [c.G.ship,npc]){
    assert.equal(c.shipWeaponAvailability(ship,0),'Ready');
    c.commitShipWeapon(ship,0);
    assert.equal(ship.heat,22);
    assert.equal(ship.weaponReadyAt[0],4);
    assert.equal(c.shipWeaponAvailability(ship,0),'Ready in 3');
    c.absorbShipHit(ship,12);
    assert.equal(ship.hp,100);
    assert.equal(ship.shieldCharge,8);
    assert.equal(ship.shieldRechargeAt,4);
  }
  c.G.turn=4;c.tickShipSystems();c.tickShipSystems(npc);
  for(const ship of [c.G.ship,npc]){
    assert.equal(c.shipWeaponAvailability(ship,0),'Ready');
    assert.equal(ship.shieldCharge,11);
  }
});
