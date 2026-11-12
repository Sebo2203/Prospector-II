const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

function context(seed=1){
  let state=seed;
  const c=vm.createContext({G:{mode:'galaxy',turn:1,ship:{x:5,y:5},shipName:'Scout',
    crew:[{hp:10,skills:{eng:3}},{hp:10,skills:{}}],shipStats:{maxCrew:3,cargoCapacity:2},
    cargo:[],inventory:[],planets:{},enemies:{},credits:0,
    galaxy:Array.from({length:20},()=>Array.from({length:32},()=>({type:'VOID'}))),visited:[]},
    MAP_W:32,MAP_H:20,DEBUG:{on:false},effectiveSensorRange:()=>3,TILE:{station_wall:{pass:false},station_floor:{pass:true},SHIP:{pass:true},
      rw_locked_door:{pass:false},rw_open_door:{pass:true},q_contamination:{pass:true}},
    rnd:n=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return Math.floor(state/4294967296*n);},
    PW:p=>p.width,PH:p=>p.height,addLog:()=>{},renderAll:()=>{},
    earnCredits:n=>{c.G.credits+=n;},adjustCrewMoraleBase:()=>{},
    canSeePlanetTile:()=>false,crewSkillValue:(person,skill)=>person?.skills?.[skill]||0,
    maybeExposeRandomCrewToInfection:()=>{},applyCrewStatus:()=>{},giveSkillXP:()=>{},
    hasPlanetLOS:()=>true,doWaitPlanet:()=>{},getScanCoverage:m=>m.filter(Boolean).length/m.length,
    addCargo:item=>{if(c.G.cargo.length>=c.G.shipStats.cargoCapacity)return false;c.G.cargo.push(item);return true;},
  });
  for(const file of ['missions/expedition.js','missions/quarantine-ship.js','crew/oxygen.js']){
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),c);
  }
  const random=c.rnd;c.rnd=()=>0;c.placeQuarantineShip();c.rnd=random;return c;
}

test('Mercy placement is selected once across the galaxy and stays hidden until revealed',()=>{
  const positions=new Set();
  for(let seed=1;seed<=100;seed++){
    const c=context(seed*104729);c.G.expedition.quarantine=null;c.G.expedition.events=[];
    c.G.visited[6*c.MAP_W+6]=true;
    assert.equal(c.placeQuarantineShip(),true);
    const q=c.G.expedition.quarantine;
    assert.equal(q.discovered,false);assert.equal(q.lastTick,null);
    assert.equal(c.G.galaxy[q.y][q.x].name,q.name);
    assert.equal(!!c.G.visited[q.y*c.MAP_W+q.x],false);
    assert.equal(c.G.expedition.events.length,0);positions.add(q.x+','+q.y);
    const before=JSON.stringify(q);c.rnd=()=>{throw Error('Placement rerolled');};
    assert.equal(c.placeQuarantineShip(),false);assert.equal(JSON.stringify(q),before);
  }
  assert.ok(positions.size>80);
});

test('placement protects occupied, charted, border and nonempty cells; a full galaxy is safe',()=>{
  const c=context();c.G.expedition.quarantine=null;
  c.G.galaxy=Array.from({length:20},()=>Array.from({length:32},()=>({type:'BASE'})));
  const cells=[c.G.ship,{x:12,y:12},{x:13,y:12},{x:14,y:12},{x:15,y:12},{x:16,y:12},{x:0,y:1},{x:31,y:19},{x:17,y:12}];
  for(const {x,y} of cells)c.G.galaxy[y][x]={type:'VOID'};
  c.G.pirates=[cells[1]];c.G.neutralShips=[cells[2]];c.G.npcStranded=[cells[3]];c.G.nebulaLoot=[cells[4]];
  c.G.visited[12*c.MAP_W+16]=true;
  let first=true;c.rnd=n=>{assert.equal(n,first?1:12);first=false;return 0;};
  assert.equal(c.placeQuarantineShip(),true);assert.equal(c.G.expedition.quarantine.x,17);
  c.G.expedition.quarantine=null;c.rnd=()=>{throw Error('Empty candidate list rolled');};
  assert.equal(c.placeQuarantineShip(),false);assert.equal(c.G.expedition.quarantine,null);
});

test('story eligibility is optional, later spawning is saved once, and age drives the due turn',()=>{
  const absent=context();absent.G.expedition.quarantine=null;
  vm.runInContext('Math.random=()=>0.99',absent);absent.scheduleStoryEvents();
  assert.equal(absent.G.expedition.storySchedule.quarantine.status,'absent');
  absent.G.turn+=10000;absent.tickStoryEvents();assert.equal(absent.G.expedition.quarantine,null);
  const c=context();c.G.expedition.quarantine=null;vm.runInContext('Math.random=()=>0.5',c);c.scheduleStoryEvents();
  const plan=c.G.expedition.storySchedule.quarantine;
  assert.equal(plan.status,'pending');assert.ok(plan.dueTurn>=81&&plan.dueTurn<=601);
  c.G=JSON.parse(JSON.stringify(c.G));c.G.turn=plan.dueTurn-1;c.tickStoryEvents();assert.equal(c.G.expedition.quarantine,null);
  c.G.turn++;c.tickStoryEvents();assert.equal(c.G.expedition.storySchedule.quarantine.status,'spawned');
  assert.ok(c.G.expedition.quarantine.name);const before=JSON.stringify(c.G.expedition);
  c.rnd=()=>{throw Error('Spawn rerolled');};c.tickStoryEvents();assert.equal(JSON.stringify(c.G.expedition),before);
});

test('charted remote contacts, offline sensors and obstructed signals do not announce a rescue',()=>{
  const c=context(),q=c.G.expedition.quarantine;Object.assign(q,{x:10,y:10});c.G.visited[10*c.MAP_W+10]=true;
  c.G.ship={x:5,y:10};c.revealQuarantineShip();assert.equal(q.discovered,false);
  c.G.ship.x=7;c.G.galaxy[10][8]={type:'NEBULA'};c.revealQuarantineShip();assert.equal(q.discovered,false);
  c.G.galaxy[10][8]={type:'VOID'};c.effectiveSensorRange=()=>0;c.revealQuarantineShip();assert.equal(q.discovered,false);
  c.effectiveSensorRange=()=>3;c.revealQuarantineShip();assert.equal(q.discovered,true);
  c.revealQuarantineShip();assert.equal(c.G.expedition.events.filter(e=>e.id==='quarantine:signal').length,1);
});

test('known casualties close a failed rescue without a station visit or payout, while unknown deaths stay unreported',()=>{
  const c=context(),q=c.G.expedition.quarantine;c.generateQuarantineShip(q);
  q.survivors.forEach(s=>Object.assign(s,{status:'dead',hp:0}));c.resolveQuarantineOutcome();
  assert.equal(q.status,'closed');assert.equal(c.G.expedition.events.some(e=>e.id==='quarantine:closed'),false);
  q.survivors.forEach(s=>s.seenCondition='found dead');c.resolveQuarantineOutcome();c.resolveQuarantineOutcome();
  assert.equal(c.G.expedition.events.filter(e=>e.id==='quarantine:closed').length,1);assert.equal(c.G.credits,0);
});

test('reveal never places a wreck or rolls RNG; a preset wreck signals once and persists',()=>{
  const c=context();vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/world/galaxy-generation.js'),'utf8'),c);
  const q=c.G.expedition.quarantine;c.G.expedition.events=[];
  c.rnd=()=>{throw Error('Exploration rolled RNG');};c.G.ship.x=q.x;c.G.ship.y=q.y;
  c.revealAround(q.x,q.y,1);assert.equal(q.discovered,true);assert.equal(q.lastTick,null);
  assert.equal(c.G.expedition.events.filter(e=>e.id==='quarantine:signal').length,1);
  const before=JSON.stringify(c.G.expedition);c.revealAround(q.x,q.y,3);
  c.G=JSON.parse(JSON.stringify(c.G));c.revealAround(q.x,q.y,3);
  assert.equal(JSON.stringify(c.G.expedition),before);
  c.G.expedition.quarantine=null;c.G.expedition.events=[];c.revealAround(18,12,3);
  assert.equal(c.G.expedition.quarantine,null);assert.equal(c.G.expedition.events.length,0);
});

test('nebula visibility blocks the preset signal until sensors actually reach the wreck',()=>{
  const c=context();vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/world/galaxy-generation.js'),'utf8'),c);
  const q=c.G.expedition.quarantine;
  c.G.galaxy[q.y][q.x]={type:'VOID'};
  Object.assign(q,{x:10,y:10});c.G.galaxy[10][10]={type:'DERELICT',name:'Mercy of Dawn'};
  for(let y=0;y<c.MAP_H;y++)c.G.galaxy[y][7]={type:'NEBULA'};
  c.revealAround(5,10,6);assert.equal(q.discovered,false);assert.equal(c.G.expedition.events.length,0);
  c.G.ship={x:10,y:10};c.revealAround(10,10,1);assert.equal(q.discovered,true);assert.equal(c.G.expedition.events.length,1);
});

test('debug reveals do not signal, and legacy known incidents retain their location and state',()=>{
  const c=context(),q=c.G.expedition.quarantine;c.G.visited[q.y*c.MAP_W+q.x]=true;
  c.DEBUG.on=true;c.revealQuarantineShip();assert.equal(q.discovered,false);
  c.DEBUG.on=false;c.G.debugPalette={};c.revealQuarantineShip();assert.equal(q.discovered,false);
  delete c.G.debugPalette;delete q.discovered;
  const before=JSON.stringify(q);c.revealQuarantineShip();assert.equal(JSON.stringify(q),before);
  assert.equal(c.G.expedition.events.length,0);
});

test('100 generated decks connect all fixtures and survivors through operable doors',()=>{
  for(let seed=1;seed<=100;seed++){
    const c=context(seed),q=c.G.expedition.quarantine,pd=c.generateQuarantineShip(q);
    const queue=[[pd.spawnX,pd.spawnY]],seen=new Set([pd.spawnX+','+pd.spawnY]);
    for(let i=0;i<queue.length;i++){
      const [x,y]=queue[i];
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx,ny=y+dy,key=nx+','+ny,type=pd.grid[ny]?.[nx]?.type;
        if(!type || type==='station_wall' || seen.has(key))continue;
        seen.add(key);queue.push([nx,ny]);
      }
    }
    for(let y=0;y<pd.height;y++)for(let x=0;x<pd.width;x++){
      const type=pd.grid[y][x].type;
      if(type.startsWith('q_'))assert.ok(seen.has(x+','+y),`seed ${seed}: unreachable ${type}`);
      assert.ok(!['MINERAL','MINERAL_SAMPLE'].includes(type));
    }
    q.survivors.forEach(s=>assert.ok(seen.has(s.x+','+s.y),`seed ${seed}: unreachable person`));
    assert.equal(pd.visited.filter(Boolean).length,0);
  }
});

test('survivors cannot path through closed hatches and advance at most one tile per turn',()=>{
  const c=context(),pd={width:5,height:3,grid:[Array(5).fill({type:'station_wall'}),
    [{type:'station_wall'},{type:'station_floor'},{type:'rw_locked_door'},{type:'station_floor'},{type:'station_wall'}],
    Array(5).fill({type:'station_wall'})]};
  const person={x:1,y:1};c.quarantineStepToward(person,{x:3,y:1},pd);assert.equal(person.x,1);
  pd.grid[1][2].type='rw_open_door';c.quarantineStepToward(person,{x:3,y:1},pd);assert.equal(person.x,2);
});

test('air reserve advances with elapsed turns, survives reload, and repair stops depletion',()=>{
  const c=context(),q=c.G.expedition.quarantine;c.generateQuarantineShip(q);
  c.G.turn+=181;c.tickQuarantineIncident();assert.equal(q.air,0);
  const hp=q.survivors[0].hp;c.G=JSON.parse(JSON.stringify(c.G));c.G.turn+=16;c.tickQuarantineIncident();
  const reloaded=c.G.expedition.quarantine;assert.equal(reloaded.survivors[0].hp,hp-2);
  reloaded.repaired=true;c.G.turn+=100;c.tickQuarantineIncident();assert.equal(reloaded.survivors[0].hp,hp-2);
});

test('capacity leaves people at the airlock, while a cargo pod occupies a real slot',()=>{
  const c=context(),q=c.G.expedition.quarantine,pd=c.generateQuarantineShip(q);
  c.G.mode='planet';c.G.curPlanet=q.mapKey;c.G.player={x:pd.spawnX,y:pd.spawnY};c.G.shipStats.maxCrew=1;
  q.survivors.forEach((s,i)=>Object.assign(s,{status:'following',x:pd.spawnX,y:pd.spawnY,pod:i===2}));
  c.transferQuarantinePassengers();assert.equal(q.survivors[0].status,'onboard');
  assert.equal(q.survivors[1].status,'waiting');assert.equal(q.survivors[2].status,'onboard');
  assert.equal(c.G.cargo[0].quarantinePatient,q.survivors[2].id);
});

test('only onboard passengers deliver; repeated docking cannot duplicate rewards',()=>{
  const c=context(),q=c.G.expedition.quarantine;c.generateQuarantineShip(q);
  q.survivors[0].status='onboard';q.survivors[1].status='following';
  c.settleQuarantineAtStation('Alpha');c.settleQuarantineAtStation('Omega');
  assert.equal(c.G.credits,100);assert.equal(q.survivors[1].status,'following');
  assert.equal(q.survivors[0].status,'delivered');
});

test('jettisoning an occupied pod abandons its passenger without a rescue reward',()=>{
  const c=context(),q=c.G.expedition.quarantine;c.generateQuarantineShip(q);
  Object.assign(q.survivors[0],{status:'onboard',pod:true});c.G.turn++;c.tickQuarantineIncident();
  c.settleQuarantineAtStation('Alpha');assert.equal(q.survivors[0].status,'lost');assert.equal(c.G.credits,0);
});

test('legacy saves initialize empty history without invented discoveries',()=>{
  const c=context();delete c.G.expedition;const state=c.ensureExpeditionState();
  assert.equal(state.events.length,0);assert.equal(state.quarantine,null);
});

test('repeat surveys update knowledge without duplicating discovery history',()=>{
  const c=context();c.G.planets.world={scanMask:[true,false]};
  const body={pKey:'world',targetDesc:{name:'Haven',biome:'FOREST',scanState:'partial'}};
  c.recordSurveyFinding(body);c.G.planets.world.scanMask.fill(true);c.recordSurveyFinding(body);
  assert.equal(c.G.expedition.surveys.world.coverage,1);
  assert.equal(c.G.expedition.events.filter(e=>e.kind==='discovery').length,1);
});
