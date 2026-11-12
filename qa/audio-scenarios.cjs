const assert=require('node:assert/strict'),path=require('node:path');
const {chromium,gameUrl}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:/,r=>r.abort());
  await page.addInitScript(()=>{
   const q=window.audioQA={starts:[],oscillators:[],stops:0,decodes:[],ready:[],hold:true,release:null,buffers:new WeakMap()};
   const proto=AudioContext.prototype,decode=proto.decodeAudioData,buffer=proto.createBufferSource,oscillator=proto.createOscillator;
   proto.createOscillator=function(){
    const node=oscillator.call(this),start=node.start.bind(node),set=node.frequency.setValueAtTime.bind(node.frequency);let frequency=null;
    node.frequency.setValueAtTime=(value,when)=>{frequency=value;return set(value,when);};
    node.start=(when)=>{q.oscillators.push({type:node.type,frequency,when});return start(when);};return node;
   };
   proto.decodeAudioData=function(bytes){
    const input=new Uint8Array(bytes);
    const key=Object.keys(AUDIO_SAMPLES).find(key=>{
     const data=atob(AUDIO_SAMPLES[key].split(',')[1]);
     return data.length===input.length && input.every((v,i)=>v===data.charCodeAt(i));
    });
    q.decodes.push(key);
    const run=()=>decode.call(this,bytes).then(decoded=>{q.buffers.set(decoded,key);q.ready.push(key);return decoded;});
    if(key==='crewPain'&&q.hold)return new Promise((resolve,reject)=>{q.release=()=>{q.hold=false;return run().then(resolve,reject);};});
    return run();
   };
   proto.createBufferSource=function(){
    const node=buffer.call(this),start=node.start.bind(node),stop=node.stop.bind(node);
    node.start=(...args)=>{q.starts.push({key:q.buffers.get(node.buffer),duration:node.buffer.duration,channels:node.buffer.numberOfChannels,rate:node.buffer.sampleRate});return start(...args);};
    node.stop=(...args)=>{q.stops++;return stop(...args);};return node;
   };
  });
  await page.goto(gameUrl);await page.evaluate(()=>initGame('ATTACK_CORVETTE','Audio QA','Audio QA'));
  await page.waitForFunction(()=>G?.galaxy&&G.log.some(e=>e.msg.includes('Ready for departure')));
  await page.waitForFunction(()=>!AUTOSAVE_STATE.transition);
  await page.addScriptTag({path:path.join(__dirname,'ship-combat-fixture.js')});
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>audioQA.ready.length===23);
  const docking=await page.evaluate(()=>({samples:audioQA.starts.map(s=>s.key),oscillators:audioQA.oscillators}));
  assert.ok(!docking.samples.includes('dock'),'station entry does not play the door recording');
  assert.deepEqual(docking.oscillators.map(o=>[o.type,o.frequency]),[['sine',523],['sine',784],['sine',261]],'native docking restores the original synthesized chime');
  assert.ok(Math.abs(docking.oscillators[1].when-docking.oscillators[0].when-0.22)<1e-6);
  assert.ok(Math.abs(docking.oscillators[2].when-docking.oscillators[0].when-0.5)<1e-6);
  await page.evaluate(()=>{
   G.mode='galaxy';const key='qa:original-pain';getOrCreateScanPlanetData(key,'DESERT','full');
   const random=Math.random;Math.random=()=>0.99;
   try{doLandOnPlanet(key,{biome:'DESERT',name:'Audio QA',scanState:'full'});}finally{Math.random=random;}
   G.planets[key].grid[G.player.y][G.player.x]={type:'LAVA_FLOOR'};
   window.audioBefore=G.crew.map(c=>c.hp);Math.random=()=>0.5;applyStandingSurfaceHazards();
  });
  assert.ok(await page.evaluate(()=>G.crew.some((c,i)=>c.hp<audioBefore[i])),'a real surface hazard damages the crew');
  assert.equal(await page.evaluate(()=>audioQA.starts.filter(s=>s.key==='crewPain').length),0);
  await page.evaluate(async()=>{G.mode='galaxy';renderAll();await audioQA.release();});
  await page.evaluate(()=>Promise.resolve());
  assert.equal(await page.evaluate(()=>audioQA.starts.filter(s=>s.key==='crewPain').length),0,'stale ground decode is cancelled');
  await page.evaluate(()=>{G.mode='planet';applyStandingSurfaceHazards();});
  await page.waitForFunction(()=>audioQA.starts.some(s=>s.key==='crewPain'));
  const pain=await page.evaluate(()=>audioQA.starts.find(s=>s.key==='crewPain'));
  assert.equal(pain.channels,1);assert.ok(Math.abs(pain.duration-0.84)<1/pain.rate);
  assert.ok(await page.evaluate(()=>audioQA.starts.some(s=>s.key==='land')),'native landing plays original LAND');
  assert.equal(await page.evaluate(()=>audioQA.decodes.filter(k=>k==='crewPain').length),1);
  assert.ok(await page.evaluate(()=>{
   const before=serializeCareer(G),random=Math.random;Math.random=()=>{throw Error('Audio used rule RNG');};
   try{SFX.crewHit();SFX.crewHit();return before===serializeCareer(G);}finally{Math.random=random;}
  }));
  assert.ok(await page.evaluate(()=>audioQA.stops>=2),'rapid ground hurts replace the active voice');
  await page.evaluate(()=>{
   window.audioShip=(weapon='mass_driver',distance=4)=>{
    const c=bridgeFixture({weapons:[weapon,null]});c.player={x:13,y:8,dx:1,dy:0};
    const e=c.enemies[0];e.x=13+distance;e.y=8;e.ship.systems.engine.condition=0;e.ship.weaponReadyAt=[G.turn+999];
    G.ship.heat=0;G.ship.weaponReadyAt=[G.turn,0];G.ship.ammo.artemis=4;
    Math.random=()=>0.5;renderAll();return c;
   };
   window.audioScan=()=>{let first=true;Math.random=()=>{if(first){first=false;return 0;}return bridgeRandom();};doScan();};
   window.audioSurface=()=>{
    bridgeFixture({setupOnly:true});Math.random=bridgeRandom;
    const key='qa:audio';const p=getOrCreateScanPlanetData(key,'DESERT','full');
    for(const row of p.grid)for(let x=0;x<row.length;x++)row[x]={type:BIOMES.DESERT.floor};
    G.mode='planet';G.curPlanet=key;G.curSystem=null;G.shipCombat=null;G.enemies[key]=[];G.player={x:6,y:6};
    G.inventory=[];G.oxygen=100;p.grid[6][6]={type:'SHIP'};Math.random=()=>0.5;renderAll();return p;
   };
  });
  const count=()=>page.evaluate(()=>audioQA.starts.length);
  const keysSince=n=>page.evaluate(n=>audioQA.starts.slice(n).map(s=>s.key),n);
  async function cue(key,action){const n=await count();const result=await action();try{await page.waitForFunction(({n,key})=>audioQA.starts.slice(n).some(s=>s.key===key),{n,key});}catch(error){console.error(JSON.stringify(await page.evaluate(({n,key})=>({key,mode:G?.mode,turn:G?.turn,starts:audioQA.starts.slice(n),ready:audioQA.ready,log:G?.log.slice(-8),status:G?.shipCombat?shipCombatWeaponStatus(G.shipCombat,selectReadyShipCombatWeapon(G.shipCombat)):null,feedback:activeShipCombatFeedback()}),{n,key})));throw error;}return {n,result};}
  async function drained(){await page.waitForFunction(()=>!activeShipCombatFeedback());}
  const guns={mass_driver:'massDriver',railgun:'railgun',laser_cannon:'laserCannon',pulse_laser:'pulseLaser',artemis:'artemisLaunch'};
  for(const [id,key] of Object.entries(guns)){
   await page.evaluate(id=>audioShip(id),id);
   const {n,result}=await cue(key,()=>page.evaluate(()=>{
    Math.random=()=>0.999;const turn=G.turn;doShipFire();return G.turn-turn;
   }));assert.equal(result,1);await drained();
   assert.equal((await keysSince(n)).filter(k=>k===key).length,1,'one firing cue for each committed launch, even a miss');
   const blocked=await count(),turn=await page.evaluate(()=>G.turn);
   await page.evaluate(()=>doShipFire());await page.waitForTimeout(50);
   assert.equal(await count(),blocked,'reload refusal produces no shot');assert.equal(await page.evaluate(()=>G.turn),turn);
  }
  await page.evaluate(()=>{audioShip('artemis',8);Math.random=()=>0;});
  const launch=await cue('artemisLaunch',()=>page.evaluate(()=>doShipFire()));await drained();
  assert.ok(await page.evaluate(()=>G.shipCombat.missiles.length>0),'Artemis is still in flight after launch');
  assert.ok(!(await keysSince(launch.n)).includes('hullHit'),'launch is not an instant impact');
  await cue('hullHit',()=>page.evaluate(()=>{for(let i=0;i<4&&G.shipCombat.missiles.length;i++)advanceShipCombat();}));await drained();
  assert.equal((await keysSince(launch.n)).filter(k=>k==='artemisLaunch').length,1,'missile impact does not replay launch');
  await page.evaluate(()=>audioShip());
  await cue('massDriver',()=>page.evaluate(()=>{const c=G.shipCombat;c.enemies[0].ship.weaponReadyAt=[G.turn];Math.random=()=>0.5;fireShipCombatEnemy(c,c.enemies[0]);}));await drained();
  await page.evaluate(()=>{audioShip();G.ship.shieldCharge=shipShieldCapacity();});
  const shield=await cue('shieldHit',()=>page.evaluate(()=>{
   const c=G.shipCombat,e=c.enemies[0];e.ship.weaponReadyAt=[G.turn];Math.random=()=>0.5;
   const hp=G.ship.hp;fireShipCombatEnemy(c,e);return hp-G.ship.hp;
  }));assert.equal(shield.result,0);await drained();assert.ok(!(await keysSince(shield.n)).includes('hullHit'));
  await page.evaluate(()=>audioShip());
  const playedPain=await page.evaluate(()=>audioQA.starts.filter(s=>s.key==='crewPain').length);
  await page.evaluate(()=>{Math.random=()=>0;rollShipCombatCrewDamage(2,'audio scenario');SFX.crewHit();});
  assert.equal(await page.evaluate(()=>audioQA.starts.filter(s=>s.key==='crewPain').length),playedPain,'ship casualties never use ground pain');
  await cue('boost',()=>page.evaluate(()=>{audioShip();boostShipInCombat();}));await drained();
  const ram=await cue('ram',()=>page.evaluate(()=>{audioShip('mass_driver',1);moveShipInCombat(1,0);}));await drained();
  assert.ok(!(await keysSince(ram.n)).includes('hullHit'),'ram has one dedicated crash, no generic hull-hit duplicate');
  const rock=await cue('asteroid',()=>page.evaluate(()=>{const c=audioShip();c.asteroids=[{x:14,y:8}];boostShipInCombat();}));await drained();
  assert.ok(!(await keysSince(rock.n)).includes('hullHit'),'asteroid collision uses its dedicated fallback');
  await cue('wraith',()=>page.evaluate(()=>{const c=audioShip('mass_driver',1);c.enemies[0].ship._homeCluster=[{x:10,y:10}];fireShipCombatEnemy(c,c.enemies[0]);}));await drained();
  await cue('lightning',()=>page.evaluate(()=>{
   const c=audioShip();c.environment={type:'nebula',variant:'pink',layout:'gas',pockets:[{x:2,y:2,width:2,height:2}],lastTurn:G.turn,nextChargeAt:G.turn+99,charge:{pocket:0,dueTurn:G.turn+1},lastStrike:null};
   advanceShipCombat();
  }));await drained();
  await cue('lightning',()=>page.evaluate(()=>{
   bridgeFixture({setupOnly:true});G.galaxy[10][11]={type:'NEBULA'};G.crew.forEach(c=>c.skills.nav=0);Math.random=()=>0.3;tryMove(1,0);
  }));
  await page.evaluate(()=>{audioShip();G.fuel=0;});const refused=await count();
  await page.evaluate(()=>boostShipInCombat());await page.waitForTimeout(50);
  assert.ok(!(await keysSince(refused)).includes('boost'),'unavailable boost has no engine cue; an existing fuel alarm may still sound');
  await page.evaluate(()=>{
   bridgeFixture({setupOnly:true});G.mode='system';G.curSystem='10,10';G.selPlanet=0;G.selMoon=-1;
   G.galaxy[10][10]={type:'SYSTEM',name:'Audio Survey',starType:'YELLOW',planets:[{name:'Audio World',biome:'GAS_GIANT',scanState:'none',moons:[]}]};Math.random=()=>0;
  });await cue('scan',()=>page.evaluate(()=>doScan()));
  const scanned=await count();await page.evaluate(()=>doScan());assert.equal(await count(),scanned,'completed scan browsing stays silent');
  await page.evaluate(()=>{
   G.galaxy[10][10].planets[0]={name:'Interference',biome:'ANCIENT',scanState:'none',moons:[]};G.crew.forEach(c=>c.skills.nav=0);Math.random=bridgeRandom;getOrCreateScanPlanetData(getSelectedSystemBody().pKey,'ANCIENT','none');Math.random=()=>0.999;
  });const failedScan=await count();await page.evaluate(()=>doScan());assert.equal(await count(),failedScan,'failed scan has no success cue');
  // First useful results sound once; repeated partial scans, including after load, are quiet.
  await cue('scan',()=>page.evaluate(()=>audioScan()));
  assert.equal(await page.evaluate(()=>getSelectedSystemBody().targetDesc.scanState),'partial');
  const partial=await count();const repeat=await page.evaluate(()=>{
   const before={turn:G.turn,fuel:G.fuel};audioScan();return {turn:G.turn-before.turn,fuel:before.fuel-G.fuel};
  });assert.deepEqual(repeat,{turn:1,fuel:1},'quiet repeat scan still pays its ordinary action cost');
  assert.ok(!(await keysSince(partial)).includes('scan'),'repeat partial scan is quiet');
  const scanSave=await page.evaluate(async()=>{clearShipCombatFeedback();const saved=await autoSave();return {saved,loaded:saved&&await loadFromStorage(),error:AUTOSAVE_STATE.error};});assert.ok(scanSave.saved&&scanSave.loaded,JSON.stringify(scanSave));
  const loaded=await count();await page.evaluate(()=>audioScan());assert.ok(!(await keysSince(loaded)).includes('scan'),'save/load does not replay a known planet scan');
  await page.evaluate(()=>{
   G.selMoon=0;getSelectedSystemBody().pDesc.moons=[{name:'New Audio Moon',biome:'GAS_GIANT',scanState:'none'}];Math.random=()=>0;
  });await cue('scan',()=>page.evaluate(()=>doScan()));
  const moon=await count();await page.evaluate(()=>doScan());assert.ok(!(await keysSince(moon)).includes('scan'),'a moon gets its own first scan, then stays quiet');
  await page.evaluate(()=>{const p=audioSurface();p.grid[6][7]={type:'rw_locked_door'};});
  await cue('dock',()=>page.evaluate(()=>tryMove(1,0)));
  const openHatch=await count();await page.evaluate(()=>tryMove(1,0));assert.equal(await count(),openHatch,'walking through an open ringworld hatch stays silent');
  for(const [x,y,doorX,doorY] of [[6,9,6,8],[22,10,22,11]]){
   await page.evaluate(({x,y})=>{audioSurface();const state=ensureExpeditionState(),q=state.quarantine||(state.quarantine=createQuarantineIncident(1,1,'Mercy of Dawn'));generateQuarantineShip(q);G.curPlanet=q.mapKey;G.player={x,y};}, {x,y});
   await cue('dock',()=>page.keyboard.press('Enter'));
   assert.equal(await page.evaluate(({x,y})=>G.planets[G.curPlanet].grid[y][x].type,{x:doorX,y:doorY}),'rw_open_door');
   const opened=await count();await page.keyboard.press('Enter');assert.equal(await count(),opened,'an already open Mercy hatch does not replay the door cue');
  }
  await page.evaluate(()=>{const p=audioSurface();p.grid[6][7]={type:'ancient_locked_door'};G.crew.forEach(c=>c.skills.sci=0);});
  const locked=await count();await page.evaluate(()=>tryMove(1,0));assert.equal(await count(),locked,'refused lock stays silent');
  await cue('door',()=>page.evaluate(()=>{G.crew[0].skills.sci=5;tryMove(1,0);}));
  for(const [id,key] of [['gun_plasma','groundLaser'],['gun_breacher','groundBurst']]){
   await page.evaluate(id=>{audioSurface();G.crew.forEach(c=>{c.weapon='Bare hands';c.weaponUsable=null;});G.crew[0].weaponUsable=id;G.crew[0].weapon=id;G.rangeTarget={x:8,y:6};G._rangeFireMode='single';},id);
   await cue(key,()=>page.evaluate(()=>doRangedFire()));
   const n=await count();await page.evaluate(()=>{G.rangeTarget={...G.player};doRangedFire();});assert.equal(await count(),n,'refused ground shot stays silent');
  }
  await cue('groundLaser',()=>page.evaluate(()=>{audioSurface();tryEnemyRangedAttack({x:8,y:6,name:'Audio sentinel',rangedWeapon:{name:'energy pulse',maxRange:6,minDmg:1,maxDmg:2}},G.planets[G.curPlanet]);}));
  await cue('explosion',()=>page.evaluate(()=>{audioSurface();detonateC4(12,12);}));
  await cue('explosion',()=>page.evaluate(()=>{audioSurface();G.inventory=[{usable:'c4',_armed:true,_c4Timer:1}];processPlanetHazards();}));
  await cue('liftoff',()=>page.evaluate(()=>{audioSurface();doLiftOff();}));
  await cue('alarmWarn',()=>page.evaluate(()=>{bridgeFixture({setupOnly:true});G.fuel=G.maxFuel*.4;G._alarmFuelWarn=G._alarmFuelCrit=false;checkAlarms();}));
  const warned=await count();await page.evaluate(()=>checkAlarms());assert.equal(await count(),warned,'latched warning does not repeat');
  await cue('alarmCrit',()=>page.evaluate(()=>{G.fuel=G.maxFuel*.2;checkAlarms();}));
  assert.ok(await page.evaluate(()=>{
   audioShip();const before=serializeCareer(G),random=Math.random;Math.random=()=>{throw Error('Audio used rule RNG');};
   try{for(const id of Object.keys(SHIP_WEAPONS))SFX.shipFire(id);SFX.ram();SFX.asteroid();SFX.lightning();SFX.shieldHit();SFX.hullHit();SFX.coreHit();SFX.prepare();SFX.syncContext();return before===serializeCareer(G);}finally{Math.random=random;}
  }),'audio changes no serialized career or RNG state');
  await page.evaluate(()=>{G=null;SFX.syncContext();});const cancelled=await count();await page.waitForTimeout(250);assert.equal(await count(),cancelled,'menu cancels stale requests');
  assert.equal(await page.evaluate(()=>new Set(audioQA.ready).size),24,'all embedded recordings, including reserved wormhole, decode offline');
  assert.equal(await page.evaluate(()=>audioQA.decodes.length),24,'every recording is cached after one decode');
  const failed=await browser.newPage();failed.on('pageerror',e=>errors.push(e.message));await failed.route(/^https?:/,r=>r.abort());
  await failed.addInitScript(()=>{AudioContext.prototype.decodeAudioData=()=>Promise.reject(Error('QA decode refusal'));});
  await failed.goto(gameUrl);await failed.evaluate(()=>initGame('LIGHT_SCOUT','Silent QA','Silent QA'));
  await failed.waitForFunction(()=>G?.galaxy&&G.log.some(e=>e.msg.includes('Ready for departure')));
  assert.ok(await failed.evaluate(async()=>await autoSave()),'settle initial career IDs before comparing decoder-failure state');
  assert.ok(await failed.evaluate(async()=>{G.mode='planet';const before=JSON.stringify([G.turn,G.ship,G.crew]);SFX.crewHit();SFX.explosion();SFX.prepare();await new Promise(r=>setTimeout(r,40));return before===JSON.stringify([G.turn,G.ship,G.crew]);}));
  await failed.close();assert.deepEqual(errors,[]);
  console.log('PASS: 24 offline cached decodes; native weapon/miss/launch/delayed impact, shield, ram/asteroid/wraith, boost, nebula, scan, doors, ground weapons, C4, landing/liftoff/docking and alarm routing; refusal silence; ground-only pain; no duplicate collision/launch cues; stale cancellation; unchanged career/RNG; harmless decode failure. Scripted fixtures, not subjective listening.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
