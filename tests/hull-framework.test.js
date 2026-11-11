const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function career(id='LIGHT_SCOUT'){
  const c=vm.createContext({G:null,DEBUG:{},rnd:()=>0,crewSkillValue:()=>0});
  for(const file of ['ships/classes.js','ships/hull-framework.js','ships/systems.js','combat/ship.js','persistence/career-snapshot.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),c);
  vm.runInContext(`G={mode:'base',turn:10,shipStats:buildShipStats('${id}'),shipRefits:{},hangarStores:{},
    ship:{x:0,y:0},crew:[{hp:30},{hp:30}],cargo:[],installedWeapons:[],installedModules:[],credits:10000,fuelSpent:0,
    base:{stationName:'Test Port'},log:[]};G.ship.hp=G.ship.maxHp=G.shipStats.maxHp;G.fuel=G.maxFuel=G.shipStats.maxFuel;
    function addLog(msg){G.log.push(msg);}function earnCredits(amount){G.credits+=amount;}ensureShipSystems();`,c);
  return c;
}
test('factory hulls fit derived envelopes, and later catalog entries do not change the three starters',()=>{
  const c=career();
  for(const id of c.hangarHullIds())assert.equal(c.hullFittingReason(c.buildShipStats(id),c.buildShipStats(id).maxHp),'');
  vm.runInContext(`registerShipHull({...SHIP_CLASSES.BULK_FREIGHTER,id:'TEST_HAULER',name:'Test hauler',size:3});`,c);
  assert.equal(c.hangarHullIds().length,4);
  assert.equal(vm.runInContext('STARTER_HULL_IDS.length',c),3);
  assert.ok(c.buildShipStats('TEST_HAULER').maxModuleSlots>c.buildShipStats('BULK_FREIGHTER').maxModuleSlots);
  assert.throws(()=>vm.runInContext(`registerShipHull({...SHIP_CLASSES.LIGHT_SCOUT,id:'BAD_HULL',weaponSlots:100});`,c),/Factory outfit/);
});
test('refits compete for shared space, reject before charging, and can be removed for a partial documented refund',()=>{
  const c=career();
  for(const id of ['upengine','upengine','upshield','upshield','upshield','upmodslot'])assert.equal(c.performHullRefit(id),true);
  assert.equal(c.hullRefitUsage(),12);
  const credits=c.G.credits;
  assert.equal(c.performHullRefit('upsensor'),false);assert.equal(c.G.credits,credits);
  assert.equal(c.performHullRefit('upmodslot',true),true);assert.equal(c.G.credits,credits+125);
  assert.equal(c.performHullRefit('upsensor'),true);assert.equal(c.hullRefitUsage(),11);
  assert.equal(c.G.shipRefits.upmodslot,0);
  assert.equal(c.performHullRefit('upmodslot',true),false,'factory floor prevents repeatedly selling a refit');
});
test('occupied mounts, cargo and berths prevent destructive refit removal',()=>{
  const c=career();c.performHullRefit('upwslot');c.G.installedWeapons=[null,'mass_driver'];
  assert.match(c.hullRefitPreview('upwslot',true).reason,/Store weapons/);
  c.performHullRefit('upcargo');c.G.cargo=[{}];assert.match(c.hullRefitPreview('upcargo',true).reason,/Unload cargo/);
  c.G.cargo=[];c.performHullRefit('upcrew');c.G.crew=Array.from({length:5},()=>({hp:30}));
  assert.match(c.hullRefitPreview('upcrew',true).reason,/crew berths/);
});
test('condition-adjusted hull quotes use listed factory prices and documented refit investment',()=>{
  for(const [from,to,expected]of [['LIGHT_SCOUT','BULK_FREIGHTER',3500],['LIGHT_SCOUT','ATTACK_CORVETTE',5000],
    ['BULK_FREIGHTER','LIGHT_SCOUT',1250],['BULK_FREIGHTER','ATTACK_CORVETTE',4250],
    ['ATTACK_CORVETTE','LIGHT_SCOUT',500],['ATTACK_CORVETTE','BULK_FREIGHTER',2000]]){
    const c=career(from);assert.equal(c.getHullPurchaseQuote(to).net,expected);
    c.performHullRefit('upfuel');assert.equal(c.getHullPurchaseQuote(to).tradeRefits,62);
    c.G.ship.hp/=2;assert.ok(c.getHullPurchaseQuote(to).net>expected);
  }
});
test('exchange rejects stale or incompatible quotes atomically and makes no money from a round trip',()=>{
  const c=career(),quote=c.getHullPurchaseQuote('BULK_FREIGHTER');c.G.fuel--;
  const before=JSON.stringify(c.G);assert.equal(c.commitHullPurchase(quote.id,quote.key),false);
  c.G.log=[];const state=JSON.parse(before);state.log=[];assert.deepEqual(JSON.parse(JSON.stringify(c.G)),state);
  c.G.cargo=[{},{}];assert.match(c.getHullPurchaseQuote('ATTACK_CORVETTE').reason,/Cargo/);
  c.G.cargo=[];c.G.towedShip={};assert.match(c.getHullPurchaseQuote('BULK_FREIGHTER').reason,/towed/);c.G.towedShip=null;
  for(const id of ['BULK_FREIGHTER','LIGHT_SCOUT']){const q=c.getHullPurchaseQuote(id);assert.equal(c.commitHullPurchase(id,q.key),true);}
  assert.equal(c.G.credits,5250);assert.ok(c.G.fuel<=99);
});
test('exchange preserves owned equipment, ammunition and reload deadlines in local station storage',()=>{
  const c=career('ATTACK_CORVETTE');c.G.installedWeapons=['artemis','railgun'];c.G.installedModules=['fuel_scoop'];
  c.G.ship.ammo={artemis:5};c.G.ship.weaponReadyAt=[15,11];
  const q=c.getHullPurchaseQuote('BULK_FREIGHTER');assert.equal(c.commitHullPurchase(q.id,q.key),true);
  assert.equal(c.G.ship.ammo.artemis,5);assert.equal(c.G.installedWeapons.length,0);
  assert.deepEqual(JSON.parse(JSON.stringify(c.stationEquipmentStore().weapons)),[{id:'artemis',readyAt:15},{id:'railgun',readyAt:11}]);
  assert.equal(c.shipWeaponInstallPrice(vm.runInContext('SHIP_WEAPONS.artemis',c)),0);
  assert.equal(c.restoreShipModule('fuel_scoop'),true);assert.equal(c.restoreShipModule('fuel_scoop'),false);
  c.G.base.stationName='Elsewhere';assert.equal(c.ownedShipWeaponCount('artemis'),0);
});
test('physical size affects fuel and drive performance; damaged engines and fuel guards use the same travel rule',()=>{
  const scout=career(),freight=career('BULK_FREIGHTER'),corvette=career('ATTACK_CORVETTE');
  assert.deepEqual([scout.shipTravelFuelCost(),freight.shipTravelFuelCost(),corvette.shipTravelFuelCost()],[0.8,2,1.3]);
  freight.G.shipStats.engineRating=2;assert.ok(freight.shipDrivePerformance()<scout.shipDrivePerformance());
  scout.G.fuel=0.79;assert.equal(scout.shipCanTravel(),false);scout.G.fuel=0.8;assert.equal(scout.shipCanTravel(),true);
  scout.G.ship.systems.engine.condition=0;assert.equal(scout.shipCanTravel(),false);
  scout.DEBUG.infiniteFuel=true;assert.equal(scout.spendShipFuel(2),0);assert.equal(scout.G.fuel,0.8);
  scout.DEBUG.infiniteFuel=false;scout.spendShipFuel(0.3);assert.equal(scout.G.fuel,0.5);assert.equal(scout.G.fuelSpent,0.3);
});
test('saved hull state rejects impossible envelopes, counterfeit refit credit, and corrupt local stores',()=>{
  const c=career();assert.doesNotThrow(()=>c.validateSavedHullState(c.G));
  c.G.hangarStores.Port={weapons:[{id:'artemis',readyAt:20}],modules:['fuel_scoop']};
  assert.doesNotThrow(()=>c.validateSavedHullState(c.G));
  for(const change of [g=>g.shipStats.weaponSlots=8,g=>g.shipStats.engineRating=2.1,g=>g.shipStats.refitSpace=999,g=>g.shipRefits.upfuel=10,
    g=>g.hangarStores.Port.weapons[0].id='invented',g=>g.hangarStores.Port.weapons[0].readyAt=-1,
    g=>g.hangarStores.Port.modules=['invented']]){
    const save=JSON.parse(JSON.stringify(c.G));change(save);assert.throws(()=>c.validateSavedHullState(save));
  }
});
