const {gameUrl,artifactPath,fixtureFile}=require('./runtime.cjs');
const {chromium}=require('./runtime.cjs'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:/,r=>r.abort());await page.goto(gameUrl);
 let contracts=0;
 for(const cls of ['LIGHT_SCOUT','BULK_FREIGHTER','ATTACK_CORVETTE']){
  await page.evaluate(cls=>initGame(cls,'Career Test','Career Test'),cls);
  await page.waitForFunction(()=>G?.galaxy && G.log.some(e=>e.msg.includes('Ready for departure')));
  const result=await page.evaluate(async()=>{
   doInteract();
   const start=G.credits,earned=G.creditsEarned;
   G.inventory=[{name:'Antibiotics',usable:'antibiotics',value:50},{name:'Medikit',usable:'medikit',value:80},{name:'Rock Sample',value:40}];
   G.scienceJob.active=null;
   G.planets.test={width:2,height:1,biome:'HABITABLE',scanMask:[true,true],explored:[true,false],visited:[true,true],civilization:{}};
   const survey=getPendingSurveySaleValue();executeBaseAction('sell');
   if(G.inventory.length!==2||G.inventory.some(i=>!i.usable))throw Error('Useful equipment sold');
   if(G.credits-start!==40+survey)throw Error('Payout mismatch');
   if(G.creditsEarned-earned!==40+survey)throw Error('Career earnings mismatch');
   const paid=G.credits;executeBaseAction('sell');if(G.credits!==paid)throw Error('Duplicate survey payout');
   const state=ensureScienceJobState();
   state.active={id:'civ-test',type:'civilization',reward:750};
   if(!completeScienceJob())throw Error('Already sold survey should still document a new civilization');
   state.active={id:'civ-repeat',type:'civilization',reward:750};
   if(completeScienceJob())throw Error('Civilization reported twice');
   abandonScienceJob();
   let completed=0;
   for(let i=0;i<18;i++){
    G.turn=state.cooldownUntil;G.mode='base';
    const types=remainingScienceJobTypes();
    if(!types.length)throw Error('Contracts exhausted');
    const targetType=['biodata','alien_corpses','research_ship'][i%3];
    state.nextIndex=types.indexOf(targetType);
    if(!startScienceJob())throw Error('Could not start '+targetType);
    const job=state.active;
    if(job.type==='biodata')for(let j=0;j<20;j++)G.inventory.push({name:'Biodata Sample',value:10});
    if(job.type==='alien_corpses')for(let j=0;j<5;j++)G.inventory.push({name:'Alien Corpse',value:10});
    if(job.type==='research_ship'){
     const distance=Math.abs(job.target.x-G.ship.x)+Math.abs(job.target.y-G.ship.y);
     if(distance>30)throw Error('Research search unreasonably distant');
     G.inventory.push({name:'Research Ship Data',scienceJobId:'wrong'});
     if(completeScienceJob())throw Error('Wrong research data accepted');
     G.inventory.push({name:'Research Ship Data',scienceJobId:job.id});
    }
    const reward=job.reward,before=G.credits;
    if(!completeScienceJob()||G.credits-before!==reward)throw Error('Contract completion failed');
    if(completeScienceJob())throw Error('Repeated reward');completed++;
    await autoSave();G=null;if(!await loadFromStorage())throw Error('Reload failed');
    // Refresh the state reference after production deserialization.
    Object.assign(state,ensureScienceJobState());G.scienceJob=state;
   }
   const retired=G.npcStranded.find(s=>s.type==='dead');
   if(!retired)throw Error('Research ship never retired');
   retired.boardedAge=50;tickNpcStranded();
   if(G.galaxy[retired.y][retired.x]._npcStranded)throw Error('Ghost marker after reload/expiry');
   G.cargo=[];
   const canDeliver=remainingScienceJobTypes().includes('data_box');
   if(canDeliver!==(G.shipStats.cargoCapacity>0))throw Error('Cargo eligibility wrong');
   if(canDeliver){
    G.turn=state.cooldownUntil;state.nextIndex=remainingScienceJobTypes().indexOf('data_box');
    if(!startScienceJob())throw Error('Delivery acceptance failed');
    G.cargo=G.cargo.filter(i=>i.questItem!=='science_data_box');
    executeBaseAction('science_abandon');if(state.active)throw Error('Lost delivery remains blocking');
   }
   state.lastType=null;G.turn=state.cooldownUntil;G.mode='base';
   state.nextIndex=remainingScienceJobTypes().indexOf('research_ship');
   if(!startScienceJob())throw Error('Physical research expedition failed to start');
   const physical=state.active;
   G.mode='galaxy';G.ship.x=physical.target.x;G.ship.y=physical.target.y;doInteract();
   const pd=G.planets[G.curPlanet];
   // Suppress unrelated combat here to isolate actual console recovery/provenance.
   G.enemies[G.curPlanet]=[];
   const queue=[[G.player.x,G.player.y,[]]],seen=new Set([G.player.x+','+G.player.y]);let route;
   for(let i=0;i<queue.length;i++){
    const [x,y,trail]=queue[i];if(pd.grid[y][x].scienceJobData){route=trail;break;}
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
     const nx=x+dx,ny=y+dy,key=nx+','+ny;
     if(seen.has(key)||!TILE[pd.grid[ny]?.[nx]?.type]?.pass)continue;
     seen.add(key);queue.push([nx,ny,[...trail,[dx,dy]]]);
    }
   }
   if(!route)throw Error('Research console not reachable');
   for(const [dx,dy] of route)tryMove(dx,dy);
   if(!G.inventory.some(i=>i.scienceJobId===physical.id))throw Error('Physical console did not supply matching data');
   G.mode='base';executeBaseAction('science_job');
   if(state.active)throw Error('Recovered research data was not accepted');
   return {completed,retired:!!retired};
  });contracts+=result.completed;
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({contracts,classes:3,checks:['real station sample sales','gear preservation','survey idempotence','career earnings','civilization report after survey sale','repeat report refusal','renewable contracts','matching research data','production save/load','research ship marker expiry','cargo eligibility','lost delivery recovery'],errors},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
