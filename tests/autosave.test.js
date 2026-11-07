const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function store(){
  const c=vm.createContext({setTimeout,clearTimeout});
  for(const file of ['career-snapshot.js','autosave-store.js']){
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/persistence',file),'utf8'),c);
  }
  return c;
}
function game(turn=1){
  return {saveVersion:2,entitySerial:1,mode:'galaxy',turn,maxFuel:100,fuel:100,ship:{x:0,y:0,hp:100,maxHp:100,
    systems:Object.fromEntries(['engine','reactor','shields','cooling','sensors','fuelTank'].map(id=>[id,{condition:100,bypassUntil:0}])),
    heat:0,shieldCharge:0,shieldRechargeAt:0,systemTurn:1,weaponReadyAt:[]},
    crew:[{name:'Captain',role:'captain',hp:30,_careerId:1}],galaxy:[[{type:'VOID'}]],
    shipStats:{classId:'LIGHT_SCOUT',maxFuel:100},planets:{},enemies:{},cargo:[],inventory:[],log:[],visited:[],
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
