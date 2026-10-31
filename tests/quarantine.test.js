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
    MAP_W:32,MAP_H:20,DEBUG:{on:false},TILE:{station_wall:{pass:false},station_floor:{pass:true},SHIP:{pass:true},
      q_door:{pass:false},q_sealed_door:{pass:false},q_open_door:{pass:true},q_contamination:{pass:true}},
    rnd:n=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return Math.floor(state/4294967296*n);},
    PW:p=>p.width,PH:p=>p.height,addLog:()=>{},renderAll:()=>{},
    earnCredits:n=>{c.G.credits+=n;},adjustCrewMoraleBase:()=>{},
    canSeePlanetTile:()=>false,crewSkillValue:(person,skill)=>person?.skills?.[skill]||0,
    maybeExposeRandomCrewToInfection:()=>{},applyCrewStatus:()=>{},giveSkillXP:()=>{},
    hasPlanetLOS:()=>true,doWaitPlanet:()=>{},getScanCoverage:m=>m.filter(Boolean).length/m.length,
    addCargo:item=>{if(c.G.cargo.length>=c.G.shipStats.cargoCapacity)return false;c.G.cargo.push(item);return true;},
  });
  for(const file of ['missions/expedition.js','missions/quarantine-ship.js']){
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),c);
  }
  const random=c.rnd;c.rnd=()=>0;c.maybeDiscoverQuarantineShip([{x:10,y:10}]);c.rnd=random;return c;
}

test('Mercy is a chance discovery, not guaranteed placement or a startup message',()=>{
  const c=context();c.G.expedition.quarantine=null;c.G.expedition.events=[];
  let rolls=0;c.rnd=n=>{assert.equal(n,1000);rolls++;return 1;};
  assert.equal(c.maybeDiscoverQuarantineShip([{x:15,y:12}]),false);
  assert.equal(rolls,1);assert.equal(c.G.expedition.quarantine,null);assert.equal(c.G.expedition.events.length,0);
  c.rnd=()=>0;assert.equal(c.maybeDiscoverQuarantineShip([{x:15,y:12}]),true);
  assert.equal(c.G.expedition.quarantine.x,15);assert.equal(c.G.expedition.quarantine.lastTick,null);
  assert.match(c.G.expedition.events[0].text,/Nearby distress transmission.*16,13/);
  const before=JSON.stringify(c.G.expedition);c.maybeDiscoverQuarantineShip([{x:20,y:12}]);
  assert.equal(JSON.stringify(c.G.expedition),before);
});

test('discovery preserves occupied sectors, existing objects and the galaxy border',()=>{
  const c=context();c.G.expedition.quarantine=null;c.rnd=()=>0;
  c.G.pirates=[{x:12,y:12}];c.G.neutralShips=[{x:13,y:12}];c.G.npcStranded=[{x:14,y:12}];
  c.G.nebulaLoot=[{x:15,y:12}];c.G.galaxy[12][16]={type:'BASE',name:'Unchanged'};
  const cells=[c.G.ship,...c.G.pirates,...c.G.neutralShips,...c.G.npcStranded,...c.G.nebulaLoot,
    {x:16,y:12},{x:0,y:1},{x:31,y:19},{x:-1,y:2},{x:17,y:12}];
  c.maybeDiscoverQuarantineShip(cells);
  assert.equal(c.G.expedition.quarantine.x,17);assert.equal(c.G.galaxy[12][16].name,'Unchanged');
});

test('debug worlds and inactive careers cannot trigger the random event',()=>{
  for(const flag of ['debugPalette','dead','retired']){
    const c=context();c.G.expedition.quarantine=null;c.G[flag]=true;
    c.rnd=()=>{throw Error('Unexpected roll');};assert.equal(c.maybeDiscoverQuarantineShip([{x:12,y:12}]),false);
  }
  const c=context();c.G.expedition.quarantine=null;c.DEBUG.on=true;
  assert.equal(c.maybeDiscoverQuarantineShip([{x:12,y:12}]),false);
});

test('initial reveals, repeated visits and reloads do not create or reroll the encounter',()=>{
  const c=context();c.G.expedition.quarantine=null;c.G.expedition.events=[];
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/world/galaxy-generation.js'),'utf8'),c);
  c.rnd=()=>0;c.revealAround(5,5,3);
  assert.equal(c.G.expedition.quarantine,null);assert.equal(c.G.expedition.events.length,0);
  let rolls=0;c.rnd=()=>{rolls++;return 1;};c.revealAround(18,12,3,true);
  assert.ok(rolls>0);const previous=rolls;c.revealAround(18,12,3,true);assert.equal(rolls,previous);
  c.G=JSON.parse(JSON.stringify(c.G));c.revealAround(18,12,3,true);assert.equal(rolls,previous);
  c.rnd=()=>0;c.revealAround(25,12,3,true);
  assert.ok(c.G.expedition.quarantine);const q=c.G.expedition.quarantine;
  assert.equal(c.G.visited[q.y*c.MAP_W+q.x],true);assert.equal(q.lastTick,null);
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
    [{type:'station_wall'},{type:'station_floor'},{type:'q_door'},{type:'station_floor'},{type:'station_wall'}],
    Array(5).fill({type:'station_wall'})]};
  const person={x:1,y:1};c.quarantineStepToward(person,{x:3,y:1},pd);assert.equal(person.x,1);
  pd.grid[1][2].type='q_open_door';c.quarantineStepToward(person,{x:3,y:1},pd);assert.equal(person.x,2);
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
