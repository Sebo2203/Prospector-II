const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function career(){
  const c=vm.createContext({G:{turn:1,maxFuel:90,ship:{x:20,y:20},shipStats:{cargoCapacity:0},inventory:[],cargo:[],planets:{},
    galaxy:Array.from({length:40},()=>Array.from({length:40},()=>({type:'VOID'}))),npcStranded:[],credits:0,base:{stationName:'Starbase Alpha'}},
    MAP_W:40,MAP_H:40,rnd:()=>0,pick:items=>items[0],PW:p=>p.width,PH:p=>p.height,
    SURVEY_SCAN_TILE_VALUE:1,SURVEY_EXPLORE_TILE_VALUE:2,SURVEY_FULL_SCAN_BONUS:10,
    earnCredits:n=>{c.G.credits+=n;},addLog:()=>{},trackEvent:()=>{},analyticsBaseParams:x=>x,
    recordExpeditionEvent:()=>{},addCargo:item=>{c.G.cargo.push(item);return true;}});
  for(const p of ['missions/science.js','actions/survey-and-scan.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',p),'utf8'),c);
  return c;
}
test('science handover excludes gear, supplies, quest items, live creatures and reserved specimens',()=>{
  const c=career();c.G.scienceJob={active:{type:'artifact'}};
  c.G.inventory=[{name:'Ancient Artifact',value:200},{name:'Biodata Sample',value:10},
    {name:'Antibiotics',usable:'antibiotics',value:50},{name:'Gun',usable:'gun',value:100},
    {name:'Quest',questItem:'key',value:100},{name:'Specimen',isCapturedCreature:true,value:100}];
  assert.deepEqual(Array.from(c.scienceSaleItems(),i=>i.name),['Biodata Sample']);
});
test('artificial interiors do not earn survey money; explored tiles belong to the scanned union',()=>{
  const c=career(),planet={width:2,height:1,biome:'HABITABLE',scanMask:[false,true],explored:[true,false]};
  assert.equal(c.getSurveySaleValue(planet),13);
  for(const flag of ['isDerelict','isCasino','isQuarantine','isAncientStation'])assert.equal(c.getSurveySaleValue({...planet,[flag]:true}),0);
  c.G.planets={planet,interior:{...planet,isDerelict:true}};
  assert.equal(c.getSurveyPayoutBreakdown().pending,13);
  planet.surveySoldValue=13;assert.equal(c.getSurveyPayoutBreakdown().pending,0);
});
test('all completed contract types still produce work; cargo-less ships are never offered deliveries',()=>{
  const c=career(),s=c.ensureScienceJobState();
  s.completedTypes=['artifact','research_ship','civilization','alien_corpses','biodata','data_box'];s.lastType='biodata';
  const types=Array.from(c.remainingScienceJobTypes());
  assert.ok(types.length>0);assert.ok(!types.includes('data_box'));assert.ok(!types.includes('artifact'));assert.ok(!types.includes('biodata'));
});
test('a civilization earns a contract once without consuming its ordinary survey payout',()=>{
  const c=career(),s=c.ensureScienceJobState();
  c.G.planets.world={width:2,height:1,biome:'HABITABLE',visited:[true,false],scanMask:[true,false],civilization:{}};
  s.active={type:'civilization',id:'job1',reward:750};
  const before=c.getPendingSurveySaleValue();assert.equal(c.completeScienceJob(),true);
  assert.equal(c.getPendingSurveySaleValue(),before);assert.equal(c.G.credits,750);
  s.active={type:'civilization',id:'job2',reward:750};assert.equal(c.completeScienceJob(),false);assert.equal(c.G.credits,750);
});
test('research data must match the active expedition, and legacy jobs retain compatibility',()=>{
  const c=career(),s=c.ensureScienceJobState();s.active={type:'research_ship',id:'new',reward:900};
  c.G.inventory=[{name:'Research Ship Data',scienceJobId:'old'}];
  assert.equal(c.completeScienceJob(),false);
  c.G.inventory.push({name:'Research Ship Data',scienceJobId:'new'});assert.equal(c.completeScienceJob(),true);
  s.active={type:'research_ship',reward:900};assert.equal(c.completeScienceJob(),true);
});
test('relinquishing lost delivery cargo releases the job, preserves other cargo and enforces cooldown',()=>{
  const c=career(),s=c.ensureScienceJobState();s.active={type:'data_box',id:'lost'};
  c.G.cargo=[{questItem:'mystery_delivery'}];
  assert.equal(c.abandonScienceJob(),true);assert.equal(s.active,null);assert.ok(s.cooldownUntil>c.G.turn);
  assert.equal(c.G.cargo.length,1);assert.equal(c.startScienceJob(),false);
});
test('research search positions respect practical range and do not overwrite occupied tiles',()=>{
  const c=career(),spot=c.findScienceJobVoidTile();
  const distance=Math.abs(spot.x-20)+Math.abs(spot.y-20);assert.ok(distance>=8&&distance<=30);
  c.G.galaxy[spot.y][spot.x]._npcStranded={};
  assert.notDeepEqual(c.findScienceJobVoidTile(),spot);
});
