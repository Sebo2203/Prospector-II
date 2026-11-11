const assert=require('node:assert/strict');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('LIGHT_SCOUT','Training QA','Training QA'));
  await page.waitForFunction(()=>G?.galaxy && G.log.some(e=>e.msg.includes('Ready for departure')));
  // Normal scans generate real terrain. Only subsequent landing/action rolls are fixed.
  await page.evaluate(()=>{
   const key=G.ship.x+','+G.ship.y;G.curSystem=key;G.selPlanet=0;G.selMoon=-1;G.mode='system';
   const desc={name:'Training Desert',biome:'DESERT',scanState:'partial',moons:[]};
   G.galaxy[G.ship.y][G.ship.x]={type:'SYSTEM',name:'Training System',starType:'YELLOW',planets:[desc]};
   getOrCreateScanPlanetData(key+':0','DESERT','full');Math.random=()=>0.5;
  });
  const approach=await page.evaluate(()=>{
   const body=getSelectedSystemBody(),nav=G.crew.find(c=>c.role==='scout');nav._skillXp={};
   const fuel=G.fuel,hp=G.ship.hp;
   doLandOnPlanet(body.pKey,body.targetDesc);doLiftOff();
   const first=nav._skillXp.nav;
   let roll=0;Math.random=()=>roll++===0?0:0.99;
   doLandOnPlanet(body.pKey,body.targetDesc);doLiftOff();Math.random=()=>0.5;
   return {first,xp:nav._skillXp.nav,fuel:G.fuel-fuel,hull:G.ship.hp-hp};
  });
  assert.equal(approach.first,1);assert.equal(approach.xp,4);assert.equal(approach.fuel,-2);assert.ok(approach.hull<0);
  // A paid successful scan can train even if its mask was already covered.
  const paid=await page.evaluate(()=>{
   const body=getSelectedSystemBody(),nav=G.crew.find(c=>c.role==='scout');body.targetDesc.scanState='partial';
   const before=[G.turn,G.fuel,nav._skillXp.nav];doScan();const after=[G.turn,G.fuel,nav._skillXp.nav];
   doScan();return {before,after,free:[G.turn,G.fuel,nav._skillXp.nav]};
  });
  assert.deepEqual(paid.after,[paid.before[0]+1,paid.before[1]-1,paid.before[2]+2]);assert.deepEqual(paid.free,paid.after);
  // Each direct measurement repeats real hazard, a world turn and the wait fuel cost.
  const start=await page.evaluate(()=>{
   G.mode='base';G.base.recruitSel=2;executeBaseAction('recruit_confirm');G.mode='galaxy';
   G.pirates=[];G.neutralShips=[];G.gasEntities=[];G.npcStranded=[];G.blackHoles=[];
   G.pulsars=[{x:40,y:40,name:'Training Pulsar'}];G.ship.x=40;G.ship.y=40;G.galaxy[40][40]={type:'PULSAR',name:'Training Pulsar'};
   G.ship.hp=G.ship.maxHp;G.fuel=100;G.ship.heat=0;G.ship.shieldCharge=0;
   for(const core of Object.values(G.ship.systems)){core.condition=100;core.bypassUntil=0;}
   G.crew.forEach(c=>{c.statuses={};c.hp=c.maxHp;});Math.random=()=>0.5;
   const c=G.crew.find(c=>c.role==='scientist');c._skillXp={};renderAll();
   return {turn:G.turn,fuel:G.fuel,hull:G.ship.hp,minutes:G.careerTime.minutes};
  });
  await page.keyboard.press('Enter');await page.keyboard.press('Enter');
  const observed=await page.evaluate(()=>({turn:G.turn,fuel:G.fuel,hull:G.ship.hp,xp:G.crew.find(c=>c.role==='scientist')._skillXp.sci,
   radiation:getCrewStatus(G.crew.find(c=>c.role==='scientist'),'radiation').intensity,minutes:G.careerTime.minutes}));
  assert.deepEqual(observed,{turn:start.turn+2,fuel:start.fuel-1,hull:start.hull-54,xp:4,radiation:8,minutes:start.minutes+120});
  await page.screenshot({path:artifactPath('Repeatable-pulsar-study.png')});
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>G.ship.hp),19);
  await page.keyboard.press('Enter');
  assert.ok(await page.evaluate(()=>G.dead && G.ship.hp===0));
  assert.equal(await page.evaluate(()=>G.crew.find(c=>c.role==='scientist')._skillXp.sci),4,'fatal observations grant no further XP');
  const boundaries=await page.evaluate(()=>{
   G.dead=false;G.mode='galaxy';G.stranded=null;G.ship.hp=100;G.fuel=50;G.crew.forEach(c=>{c.hp=c.maxHp;c.statuses={};});
   const result=[];
   for(const distance of [2,4,5]){
    G.ship.x=40+distance;G.ship.y=40;G.crew.forEach(c=>c.statuses={});const before=G.turn;
    doWaitGalaxy();result.push([G.turn-before,getCrewStatus(G.crew[0],'radiation')?.intensity||0]);
   }
   G.ship.x=40;G.ship.hp=100;G.crew.forEach(c=>c.statuses={});G.ship.systems.engine.condition=0;
   G.stranded={sos:false,turnsStranded:0,rescuePhase:null,rescueShip:null};const before=G.turn;doStrandedWait();
   return {result,stranded:[G.turn-before,G.ship.hp,getCrewStatus(G.crew[0],'radiation').intensity]};
  });
  assert.deepEqual(boundaries,{result:[[1,2],[1,1],[1,0]],stranded:[1,73,4]});
  assert.deepEqual(errors,[]);
  console.log('PASS: linear skill targets, repeat landing XP with launch fuel and crash risk, paid-scan XP/free completed scan, repeat pulsar XP with exact turns/fuel/damage/radiation, lethal stop, proximity boundaries and stranded exposure.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
