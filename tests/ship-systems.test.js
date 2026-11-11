const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');

function career(classId='LIGHT_SCOUT'){
  const c=vm.createContext({G:null,DEBUG:{infiniteHull:false},
    rnd:()=>0,crewSkillValue:crew=>crew.skills?.eng||0});
  for(const file of ['ships/classes.js','ships/hull-framework.js','ships/systems.js','combat/ship.js']){
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),c);
  }
  vm.runInContext(`G={turn:1,ship:{hp:100,maxHp:100},shipStats:buildShipStats('${classId}'),crew:[],cargo:[],shipRefits:{},hangarStores:{},installedModules:[],installedWeapons:[],log:[]};
    G.ship.maxHp=G.shipStats.maxHp;G.maxFuel=G.shipStats.maxFuel;G.fuel=G.maxFuel;
    function addLog(message){G.log.push(message);}
    ensureShipSystems();Math.random=()=>0.5;`,c);
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


test('engineers do not reduce critical severity or chance',()=>{
  const without=career('BULK_FREIGHTER'),withEngineer=career('BULK_FREIGHTER');
  withEngineer.G.crew=[{hp:30,role:'engineer',skills:{eng:5}}];
  for(const c of [without,withEngineer]){
    vm.runInContext('Math.random=()=>0; rnd=()=>3;',c);
    c.rollShipSystemDamage(c.G.ship,10,'test');
  }
  assert.equal(without.G.ship.systems.sensors.condition,75);
  assert.equal(withEngineer.G.ship.systems.sensors.condition,75);
  for(const c of [without,withEngineer]){
    c.G.ship.systems.sensors.condition=100;
    vm.runInContext('Math.random=()=>0.15;',c);
    c.rollShipSystemDamage(c.G.ship,10,'test');
  }
  assert.equal(without.G.ship.systems.sensors.condition,75);
  assert.equal(withEngineer.G.ship.systems.sensors.condition,75);
});

test('tank criticals can explode at every integrity level, bypassing shields without recursive damage',()=>{
  for(const condition of [100,75,50,25,0]){
    const c=career('ATTACK_CORVETTE');
    c.G.ship.systems.fuelTank.condition=condition;c.G.fuel=20;
    vm.runInContext('Math.random=()=>0; rnd=()=>30;',c);
    c.damageShipSystem(c.G.ship,'fuelTank',25,'critical');
    assert.equal(c.G.ship.hp,50);assert.equal(c.G.fuel,15);
    assert.equal(c.G.ship.shieldCharge,20,'internal blast bypasses rather than drains shields');
    assert.equal(Object.values(c.G.ship.systems).filter(core=>core.condition<100).length,1);
  }
});

test('tank explosions are rare, require fuel, respect debug hull protection and can kill NPCs',()=>{
  for(const state of ['ordinary','empty','protected']){
    const c=career();
    if(state==='empty')c.G.fuel=0;
    if(state==='protected')c.DEBUG.infiniteHull=true;
    vm.runInContext('Math.random=()=>'+(state==='ordinary'?0.03:0),c);
    c.damageShipSystem(c.G.ship,'fuelTank',25,'critical');assert.equal(c.G.ship.hp,100);
  }
  const c=career(),npc={name:'Target',hp:15,maxHp:100,guns:1};
  vm.runInContext('Math.random=()=>0; rnd=n=>n===31?0:n-1;',c);
  assert.equal(c.absorbShipHit(npc,1),15);
  assert.equal(npc.hp,0);
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

test('Artemis uses a finite shared magazine, medium mounts and guarded commits for both sides',()=>{
  const c=career('ATTACK_CORVETTE');
  c.G.installedWeapons=['artemis','artemis'];c.G.ship.ammo.artemis=1;
  assert.equal(c.shipWeaponAvailability(c.G.ship,0),'Ready');
  assert.equal(c.commitShipWeapon(c.G.ship,0),true);
  assert.equal(c.G.ship.ammo.artemis,0);assert.equal(c.G.ship.heat,10);
  assert.equal(c.G.ship.weaponReadyAt[0],5);
  assert.equal(c.shipWeaponAvailability(c.G.ship,1),'No Artemis missiles');
  assert.equal(c.commitShipWeapon(c.G.ship,1),false);
  assert.equal(c.G.ship.ammo.artemis,0);assert.equal(c.G.ship.heat,10);
  const scout=career();
  const artemis=vm.runInContext('SHIP_WEAPONS.artemis',scout);
  assert.equal(scout.shipWeaponFitReason(0,artemis),'Requires a larger mount');
  const npc={hp:100,guns:2,atk:8,installedWeapons:['artemis','mass_driver'],ammo:{artemis:1}};
  c.ensureShipSystems(npc);assert.equal(c.commitShipWeapon(npc,0),true);
  assert.equal(npc.ammo.artemis,0);assert.equal(c.commitShipWeapon(npc,0),false);
});

test('occasional raiders keep their missile equipment and finite supply without rolling UI randomness',()=>{
  const c=career();let missiles=0;
  for(let seed=0;seed<128;seed++){
    c.G.seed=seed;
    const npc={name:'Cruiser',x:15,y:12,pirateType:'guard',hp:80,guns:2,atk:9};
    c.ensureShipSystems(npc);
    if(npc.installedWeapons.includes('artemis')){
      missiles++;assert.equal(npc.ammo.artemis,3);npc.ammo.artemis=1;
      npc.x++;c.ensureShipSystems(npc);assert.equal(npc.ammo.artemis,1);
    }
  }
  assert.equal(missiles,16);
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

function improvisingCareer(skill,roll){
 const c=career();
 c.G.mode='galaxy';c.G.inventory=[];c.G.crew=[{role:'engineer',name:'Test Engineer',hp:20,skills:{eng:skill}}];
 c.G.ship.systems.sensors.condition=50;
 c.giveSkillXP=(crew,id,amount)=>{crew.earned=amount;};c.crewDisplayName=crew=>crew.name;
 c.renderAll=()=>{};c.revealAround=()=>{};
 c.doWaitGalaxy=()=>{c.G.turn++;c.tickShipSystems();};
 vm.runInContext('Math.random=()=>'+roll,c);
 return c;
}

test('improvised repair skill check distinguishes support, failure and low-skill damage',()=>{
 for(const [skill,roll,outcome] of [[0,0.24,'success'],[0,0.25,'failure'],[0,0.75,'damage'],[1,0.85,'damage'],[2,0.99,'failure'],[10,0.94,'success'],[10,0.95,'failure']]){
  const c=improvisingCareer(skill,roll),turn=c.G.turn;
  assert.equal(c.repairShipSystem('sensors','improvised'),true);
  assert.equal(c.G.turn,turn+1,'every committed attempt spends one turn');
  assert.equal(c.G.inventory.length,0,'no kit required or consumed');
  const core=c.G.ship.systems.sensors;
  assert.equal(core.condition,outcome==='damage'?45:50);
  assert.equal(core.bypassUntil,outcome==='success'?turn+15:0);
  assert.equal(c.G.crew[0].earned,outcome==='success'?2:1);
 }
});

test('improvised repair uses the strongest living engineer and awards that engineer experience',()=>{
 const c=improvisingCareer(0,0.8),novice=c.G.crew[0];
 const expert={role:'engineer',name:'Expert',hp:20,skills:{eng:10}};
 c.G.crew.push(expert,{role:'engineer',name:'Dead',hp:0,skills:{eng:10}});
 c.repairShipSystem('sensors','improvised');
 assert.ok(c.G.ship.systems.sensors.bypassUntil>c.G.turn);
 assert.equal(novice.earned,undefined);assert.equal(expert.earned,2);
});

test('unavailable improvised repairs consume no action, skill roll or experience',()=>{
 for(const state of ['tank','healthy','active','noengineer','away']){
  const c=improvisingCareer(0,0.99),turn=c.G.turn;
  if(state==='healthy')c.G.ship.systems.sensors.condition=100;
  if(state==='active')c.G.ship.systems.sensors.bypassUntil=turn+5;
  if(state==='noengineer')c.G.crew[0].hp=0;
  if(state==='away'){c.G.mode='planet';c.G.planets={};c.G.player={x:0,y:0};}
  vm.runInContext('Math.random=()=>{throw Error("Invalid attempt rolled");}',c);
  assert.equal(c.repairShipSystem(state==='tank'?'fuelTank':'sensors','improvised'),false);
  assert.equal(c.G.turn,turn);assert.equal(c.G.crew[0].earned,undefined);
 }
});
