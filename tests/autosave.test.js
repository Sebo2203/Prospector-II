const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function store(){
  const c=vm.createContext({setTimeout,clearTimeout});
  for(const file of ['ships/classes.js','ships/hull-framework.js','ships/systems.js','combat/ship.js','combat/ship-ai.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),c);
  for(const file of ['career-snapshot.js','autosave-store.js']){
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/persistence',file),'utf8'),c);
  }
  return c;
}
function game(turn=1){
  return {saveVersion:5,crewDeaths:0,shipRefits:{},hangarStores:{},baseMissiles:[],entitySerial:1,mode:'galaxy',turn,maxFuel:100,fuel:100,ship:{x:0,y:0,hp:100,maxHp:100,
    systems:Object.fromEntries(['engine','reactor','shields','cooling','sensors','fuelTank'].map(id=>[id,{condition:100,bypassUntil:0}])),
    heat:0,shieldCharge:0,shieldRechargeAt:0,systemTurn:1,weaponReadyAt:[]},
    crew:[{name:'Captain',role:'captain',hp:30,_careerId:1}],galaxy:[[{type:'VOID'}]],
    shipStats:JSON.parse(JSON.stringify(store().buildShipStats('LIGHT_SCOUT'))),planets:{},enemies:{},cargo:[],inventory:[],log:[],visited:[],
    installedWeapons:[],installedModules:[],npcStranded:[],neutralShips:[],pirates:[],gasEntities:[]};
}
test('autosave integrity rejects damaged snapshots and recovers the previous valid record',()=>{
  const c=store(),previous=c.makeAutosaveRecord(JSON.stringify(game(4))),current=c.makeAutosaveRecord(JSON.stringify(game(5)));
  assert.equal(c.selectAutosaveRecord(current,previous).record.summary.turn,5);
  const damaged={...current,raw:current.raw.slice(0,-3)};
  const recovery=c.selectAutosaveRecord(damaged,previous);assert.equal(recovery.recovered,true);assert.equal(recovery.record.summary.turn,4);
  assert.equal(c.selectAutosaveRecord(damaged,{...previous,checksum:'broken'}),null);
  assert.equal(c.selectAutosaveRecord({...current,summary:null},previous).recovered,true);
});
test('missile magazines round-trip and invalid player or uninitialized NPC ammunition is rejected',()=>{
  const c=store();const good=game();good.ship.ammo={artemis:7};
  assert.equal(c.parseSaveSnapshot(JSON.stringify(good)).ship.ammo.artemis,7);
  for(const ammo of [null,[],{artemis:-1},{artemis:1.5},{artemis:13},{artemis:'3'},{invented:1}]){
    const bad=game();bad.ship.ammo=ammo;
    assert.throws(()=>c.parseSaveSnapshot(JSON.stringify(bad)));
    const badNPC=game();badNPC.entitySerial=2;badNPC.pirates=[{_careerId:2,ammo}];
    assert.throws(()=>c.parseSaveSnapshot(JSON.stringify(badNPC)));
  }
});

test('flight snapshots retain actor targets and reject malformed projectiles or old schemas',()=>{
  const c=store(),snapshot=game(5);snapshot.entitySerial=2;
  snapshot.pirates=[{...JSON.parse(JSON.stringify(snapshot.ship)),_careerId:2,name:'Raider'}];
  snapshot.shipCombat={target:0,player:{x:13,y:8},round:3,weaponReady:[],seenTiles:[],trails:[],asteroids:[],
    enemies:[{ship:2,collection:'pirates',x:21,y:8,moveBank:0}],
    missiles:[{source:0,target:-1,x:17,y:8,gunnery:2,range:8,lastRound:2,ticks:1}]};
  const restored=c.parseSaveSnapshot(JSON.stringify(snapshot));
  assert.equal(restored.shipCombat.enemies[0].ship,restored.pirates[0]);
  assert.equal(restored.shipCombat.missiles[0].x,17);
  for(const change of [m=>m.source=4,m=>m.target=0,m=>m.x=27,m=>m.y=-1,m=>m.x=1.5,
    m=>m.lastRound=4,m=>m.ticks=4,m=>m.ticks=-1,m=>m.gunnery=Infinity,m=>m.range=9]){
    const bad=JSON.parse(JSON.stringify(snapshot));change(bad.shipCombat.missiles[0]);
    assert.throws(()=>c.parseSaveSnapshot(JSON.stringify(bad)));
  }
  const old=game();old.saveVersion=2;
  assert.throws(()=>c.parseSaveSnapshot(JSON.stringify(old)),/different format/);
  const base=game(5);base.pirateBases=[{x:0,y:0,hp:100,maxHp:100}];base.baseMissiles=[{x:0,y:0,dueTurn:6}];
  assert.equal(c.parseSaveSnapshot(JSON.stringify(base)).baseMissiles[0].dueTurn,6);
  for(const missile of [{x:0,y:0,dueTurn:5},{x:0,y:0,dueTurn:7},{x:1,y:0,dueTurn:6}]){
    assert.throws(()=>c.parseSaveSnapshot(JSON.stringify({...base,baseMissiles:[missile]})));
  }
});

test('combat saves retain asteroid dimensions and reject overlapping, oversized or off-map footprints',()=>{
 const c=store(),snapshot=game(5);snapshot.entitySerial=2;
 snapshot.pirates=[{...JSON.parse(JSON.stringify(snapshot.ship)),_careerId:2,name:'Raider'}];
 snapshot.shipCombat={target:0,player:{x:13,y:8},round:1,weaponReady:[],seenTiles:[],trails:[],missiles:[],
  asteroids:[{x:3,y:3,width:2,height:2},{x:7,y:3,width:1,height:2},{x:9,y:3}],
  enemies:[{ship:2,collection:'pirates',x:21,y:8,moveBank:0}]};
 assert.equal(c.parseSaveSnapshot(JSON.stringify(snapshot)).shipCombat.asteroids[0].width,2);
 for(const rock of [null,{x:1.5,y:3},{x:-1,y:3},{x:26,y:3,width:2},{x:3,y:16,height:2},
  {x:3,y:3,width:3},{x:3,y:3,width:0},{x:3,y:3,height:1.5},{x:3,y:3,height:null},{x:3,y:3,width:'2'}]){
  const bad=JSON.parse(JSON.stringify(snapshot));bad.shipCombat.asteroids=[rock];
  assert.throws(()=>c.parseSaveSnapshot(JSON.stringify(bad)));
 }
 const overlap=JSON.parse(JSON.stringify(snapshot));overlap.shipCombat.asteroids.push({x:4,y:4});
 assert.throws(()=>c.parseSaveSnapshot(JSON.stringify(overlap)));
});

test('nebula combat saves validate pending warnings, layouts and pursuit requirements',()=>{
 const c=store(),snapshot=game(5);snapshot.entitySerial=2;
 snapshot.pirates=[{...JSON.parse(JSON.stringify(snapshot.ship)),_careerId:2,name:'Raider',requiresPursuit:true}];
 snapshot.shipCombat={target:0,player:{x:13,y:8},round:1,weaponReady:[],seenTiles:[],trails:[],missiles:[],asteroids:[],
  enemies:[{ship:2,collection:'pirates',x:21,y:8,moveBank:0}],environment:{type:'nebula',variant:'blue',layout:'gas',
   pockets:[{x:4,y:3,width:2,height:2}],lastTurn:5,nextChargeAt:7,charge:{pocket:0,dueTurn:6},lastStrike:null}};
 assert.equal(c.parseSaveSnapshot(JSON.stringify(snapshot)).shipCombat.environment.charge.dueTurn,6);
 assert.equal(c.parseSaveSnapshot(JSON.stringify(snapshot)).pirates[0].requiresPursuit,true);
 for(const change of [e=>e.type='invented',e=>e.variant='red',e=>e.lastTurn=6,e=>e.nextChargeAt=20,
  e=>e.charge.dueTurn=5,e=>e.charge.pocket=1,e=>e.pockets[0].width=4,e=>e.pockets[0].height=3.5,
  e=>e.pockets[0].x=26,e=>e.pockets.push({...e.pockets[0]})]){
  const bad=JSON.parse(JSON.stringify(snapshot));change(bad.shipCombat.environment);assert.throws(()=>c.parseSaveSnapshot(JSON.stringify(bad)));
 }
 const bad=JSON.parse(JSON.stringify(snapshot));bad.pirates[0].requiresPursuit='true';assert.throws(()=>c.parseSaveSnapshot(JSON.stringify(bad)));
 for(const deadline of [-1,1.5,null]){
  const bad=JSON.parse(JSON.stringify(snapshot));bad.pirates[0].ramReadyAt=deadline;assert.throws(()=>c.parseSaveSnapshot(JSON.stringify(bad)));
 }
});

test('invalid saves and debug worlds cannot replace a career snapshot',()=>{
  const c=store();
  for(const bad of [null,{galaxy:[],crew:[]},{...game(),ship:null},{...game(),debugPalette:{}},{...game(),crew:[null]},
    {...game(),mode:'invented'},{...game(),mode:'planet'},{...game(),mode:'radio'},{...game(),saveVersion:0},
    {...game(),neutralShips:[{_careerId:1}]},{...game(),radio:{ship:1}}]){
    assert.throws(()=>c.makeAutosaveRecord(JSON.stringify(bad)));
  }
});
test('overlapping saves commit in order and coalesce to the newest pending snapshot',async()=>{
  const c=store(),writes=[],release=[];
  const queue=c.createAutosaveQueue(record=>new Promise(resolve=>{writes.push(record.raw);release.push(resolve);}),()=>{});
  const first=queue.save({raw:'first'}),middle=queue.save({raw:'middle'}),latest=queue.save({raw:'latest'});
  assert.deepEqual(writes,['first']);release.shift()();await first;await Promise.resolve();
  assert.deepEqual(writes,['first','latest']);release.shift()();assert.equal(await middle,true);assert.equal(await latest,true);assert.equal(await queue.idle(),true);
  await queue.save({raw:'latest'});assert.equal(writes.length,2);
});
test('failed writes resolve as failures and the same snapshot can be retried',async()=>{
  const c=store(),phases=[];let fail=true,persisted='previous';
  const queue=c.createAutosaveQueue(async record=>{if(fail)throw new Error('quota');persisted=record.raw;},phase=>phases.push(phase));
  assert.equal(await queue.save({raw:'new'}),false);assert.equal(persisted,'previous');assert.equal(await queue.idle(),false);
  fail=false;assert.equal(await queue.save({raw:'new'}),true);assert.equal(persisted,'new');assert.deepEqual(phases,['saving','error','saving','saved']);
});
test('unavailable database storage rejects instead of reporting a successful save',async()=>{
  const c=store();await assert.rejects(c.openAutosaveDatabase(),/unavailable/);await assert.rejects(c.openAutosaveDatabase(),/unavailable/);
});


test('invalid core damage, clocks and reload state are rejected before loading',()=>{
  const c=store();
  for(const corrupt of [
    save=>delete save.ship.systems.sensors,
    save=>save.ship.systems.sensors.condition=-1,
    save=>save.ship.systems.fuelTank.condition=101,
    save=>save.ship.systems.engine.bypassUntil=-4,
    save=>save.ship.heat=null,
    save=>save.ship.weaponReadyAt=['tomorrow'],
    save=>save.ship.systemTurn=save.turn+1,
    save=>save.fuel=save.maxFuel+1,
    save=>save.saveVersion=1,
  ]){
    const save=game();corrupt(save);
    assert.throws(()=>c.makeAutosaveRecord(JSON.stringify(save)));
  }
});
