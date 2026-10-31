const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,'../src',name),'utf8');
test('every galaxy generator tile type has a palette representative',()=>{
  const c=vm.createContext({});vm.runInContext(read('debug/overlays-and-spawning.js'),c);
  const registered=new Set(vm.runInContext('DEBUG_GALAXY_OBJ_TYPES.map(e=>e.id)',c));
  registered.add('VOID');registered.add('SYSTEM');registered.add('NEBULA');
  for(const match of read('world/galaxy-generation.js').matchAll(/type:\s*'([A-Z_]+)'/g)){
    assert.ok(registered.has(match[1]),'Register new galaxy object in DEBUG_GALAXY_OBJ_TYPES: '+match[1]);
  }
  assert.ok(registered.has('QUARANTINE'));
});
test('surface and scenario catalogs are obtained from runtime content definitions',()=>{
  const c=vm.createContext({TILE:{NEW_TEST_TERRAIN:{pass:true}},DEBUG_ITEM_CATALOG:[{items:[{name:'New test item',usable:'new_test'}]}],
    IMPLANT_CATALOG:[],CORP_ITEM_POOLS:{corp:[{name:'New store item',usable:'store_test'}]},PAWN_ITEM_POOL:[],MEDBAY_ITEM_POOL:[],
    COMMODITIES:{new_cargo:{name:'New cargo'}},CREATURE_BODY_TYPES:[{key:'new_body',label:'New creature'}],HOSTILE_BODY_TYPES:[]});
  vm.runInContext(read('debug/playground.js'),c);
  const rows=c.debugSurfaceSampleDefinitions();
  for(const label of ['NEW_TEST_TERRAIN','New test item','New store item','New cargo','New creature']) assert.ok(rows.some(e=>e.label===label),label);
  assert.equal(new Set(rows.map(e=>e.id)).size,rows.length);
});
test('aquatic maps without spawn coordinates use a finite passable landing point',()=>{
  const c=vm.createContext({PW:p=>p.width,PH:p=>p.height,TILE:{floor:{pass:true},wall:{pass:false}}});
  vm.runInContext(read('debug/playground.js'),c);
  const pd={width:3,height:3,grid:Array.from({length:3},()=>Array.from({length:3},()=>({type:'wall'})))};
  pd.grid[1][1].type='floor';assert.deepEqual(JSON.parse(JSON.stringify(c.debugPaletteLandingPoint(pd))),{x:1,y:1});
  pd.grid[1][1].type='wall';assert.throws(()=>c.debugPaletteLandingPoint(pd),/no landing point/);
});

test('aquatic contact fixture provides water even on a completely dry generated planet',()=>{
  const c=vm.createContext({PW:p=>p.width,PH:p=>p.height});
  vm.runInContext(read('debug/playground.js'),c);
  const pd={width:40,height:20,spawnX:4,spawnY:4,grid:Array.from({length:20},()=>Array.from({length:40},()=>({type:'EARTH_FLOOR'})))};
  pd.grid[4][4]={type:'SHIP'};c.debugPrepareAquaticPaletteSurface(pd);
  assert.equal(pd.grid[4][4].type,'SHIP');
  assert.ok(pd.grid.flat().filter(t=>t.type==='EARTH_WATER').length>200);
});
