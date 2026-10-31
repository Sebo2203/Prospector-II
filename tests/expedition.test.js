const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'../src/missions/expedition.js'),'utf8');

function expedition(fuel=100){
  const G = { mode:'galaxy', turn:5, fuel, fuelSpent:0, credits:500, crew:[{hp:10}],
    ship:{x:5,y:5}, galaxy:Array.from({length:15},()=>Array.from({length:15},()=>({type:'VOID'}))),
    visited:[], planets:{} };
  const context = vm.createContext({ G, MAP_W:15, MAP_H:15, rnd:()=>0, addLog:()=>{}, renderAll:()=>{},
    earnCredits:amount=>{G.credits+=amount;}, adjustCrewMoraleBase:()=>{},
    applyCrewStatus:(crew,id)=>{crew[id]=true;}, getScanCoverage:mask=>mask.filter(Boolean).length/mask.length });
  vm.runInContext(source,context);
  context.placeQuarantineShip();
  Object.assign(G.ship,G.expedition.quarantine);
  return context;
}

test('distress placement preserves occupied cells and only reveals its own coordinate',()=>{
  const c = expedition();
  const q = c.G.expedition.quarantine;
  assert.equal(c.G.visited.filter(Boolean).length,1);
  assert.equal(c.G.galaxy[q.y][q.x].type,'DERELICT');
  assert.ok(Math.abs(q.x-5)+Math.abs(q.y-5)>=4);
  c.placeQuarantineShip();
  assert.equal(c.G.expedition.events.length,1);
});

test('rescue paths retain costs, exposure and a single delayed payout across reload',()=>{
  for(const [choice,cost,payout,exposure] of [['isolated',20,300,false],['open',0,180,true],['beacon',5,100,false],['salvage',0,-80,false]]){
    const c = expedition();
    c.resolveQuarantine(choice);
    assert.equal(c.G.fuel,100-cost);
    assert.equal(c.G.turn,6);
    assert.equal(!!c.G.crew[0].fever,exposure);
    const creditsAfterChoice = c.G.credits;
    c.G = JSON.parse(JSON.stringify(c.G));
    // earnCredits closes over the original fixture; reconnect after round-trip.
    c.earnCredits = amount=>{c.G.credits+=amount;};
    c.settleQuarantineAtStation('Starbase Alpha');
    assert.equal(c.G.credits,creditsAfterChoice+payout);
    const settledCredits = c.G.credits;
    c.settleQuarantineAtStation('Waypoint Omega');
    c.resolveQuarantine(choice);
    assert.equal(c.G.credits,settledCredits);
    assert.equal(c.G.expedition.events.filter(e=>e.kind==='consequence').length,1);
    assert.match(c.expeditionLegacy(),choice==='salvage'?/Three lives lost/:/survivors/);
  }
});

test('insufficient fuel and remote choice attempts cannot consume a decision',()=>{
  const c=expedition(4);
  c.resolveQuarantine('isolated'); c.resolveQuarantine('beacon');
  assert.equal(c.G.turn,5);
  assert.equal(c.G.expedition.quarantine.choice,null);
  c.G.ship.x++;
  c.resolveQuarantine('salvage');
  assert.equal(c.G.credits,500);
});

test('legacy saves gain empty records without fabricated discoveries or incident',()=>{
  const c=expedition();
  delete c.G.expedition;
  const state=c.ensureExpeditionState();
  assert.equal(state.events.length,0);
  assert.equal(Object.keys(state.surveys).length,0);
  assert.equal(state.quarantine,null);
});

test('repeat surveys update knowledge without duplicating first-discovery history',()=>{
  const c=expedition();
  c.G.planets.world={scanMask:[true,false],civilization:{tierLabel:'Tribal',species:'Fungoid'}};
  const body={pKey:'world',targetDesc:{name:'Haven',biome:'FOREST',scanState:'partial'}};
  c.recordSurveyFinding(body);
  c.G.planets.world.scanMask.fill(true);
  c.recordSurveyFinding(body);
  assert.equal(c.G.expedition.surveys.world.coverage,1);
  assert.equal(c.G.expedition.events.filter(e=>e.kind==='discovery').length,1);
});
