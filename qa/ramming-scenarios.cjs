const assert=require('node:assert/strict'),path=require('node:path');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.text().startsWith('Prospector input error:'))errors.push(m.text());});
  await page.route(/^https?:/,r=>r.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('ATTACK_CORVETTE','Ramming QA','Ramming QA'));
  await page.waitForFunction(()=>G?.galaxy&&G.log.some(e=>e.msg.includes('Ready for departure')));
  await page.addScriptTag({path:path.join(__dirname,'ship-combat-fixture.js')});
  await page.evaluate(()=>{
   window.ramFixture=(x=14)=>{
    const c=bridgeFixture(),enemy=c.enemies[0];enemy.x=x;enemy.y=8;
    enemy.ship.systems.engine.condition=0;enemy.ship.weaponReadyAt=[G.turn+100];
    enemy.ship.systemStats.shields=2;enemy.ship.shieldCharge=40;enemy.ship.shieldRechargeAt=G.turn+100;
    G.ship.shieldCharge=20;G.ship.shieldRechargeAt=G.turn+100;Math.random=()=>0.99;renderAll();return c;
   };
   window.ramState=()=>({turn:G.turn,hp:G.ship.hp,fuel:G.fuel,heat:G.ship.heat,shield:G.ship.shieldCharge,
    recharge:G.ship.shieldRechargeAt,ready:G.ship.weaponReadyAt.slice(),player:G.shipCombat?{...G.shipCombat.player}:null,
    enemy:G.pirates[0].hp,enemyShield:G.pirates[0].shieldCharge,enemyRecharge:G.pirates[0].shieldRechargeAt});
  });
  await page.evaluate(()=>ramFixture());const before=await page.evaluate(()=>ramState());
  await page.keyboard.press('ArrowRight');const normal=await page.evaluate(()=>ramState());
  assert.equal(normal.hp,before.hp-10);assert.equal(normal.enemy,before.enemy-10);assert.equal(normal.turn,before.turn+1);
  assert.equal(normal.player.x,13);assert.equal(normal.fuel,before.fuel);assert.equal(normal.shield,before.shield);assert.equal(normal.enemyShield,before.enemyShield);
  assert.equal(normal.recharge,before.recharge);assert.equal(normal.enemyRecharge,before.enemyRecharge);assert.deepEqual(normal.ready,before.ready);
  await page.evaluate(()=>ramFixture(15));const boostBefore=await page.evaluate(()=>ramState());
  await page.locator('#ctx-bar [data-game-key="b"]').click();const boosted=await page.evaluate(()=>ramState());
  assert.equal(boosted.hp,boostBefore.hp-25);assert.equal(boosted.enemy,boostBefore.enemy-25);
  assert.equal(boosted.player.x,14);assert.equal(boosted.turn,boostBefore.turn+1);assert.equal(boosted.fuel,boostBefore.fuel-3);
  assert.equal(boosted.shield,20);assert.equal(boosted.enemyShield,40);assert.equal(boosted.heat,16);assert.deepEqual(boosted.ready,boostBefore.ready);
  await page.evaluate(()=>ramFixture(14));await page.keyboard.press('b');assert.equal(await page.evaluate(()=>G.shipCombat.player.x),13,'first-cell impact stops before movement');
  const crashes=await page.evaluate(()=>{
   const result=[];
   for(const [width,height,x,y]of [[1,1,14,8],[2,1,15,8],[2,2,15,7]]){
    const c=ramFixture(23);c.asteroids=[{x,y,width,height}];const hp=G.ship.hp,fuel=G.fuel,turn=G.turn;
    boostShipInCombat();result.push({damage:hp-G.ship.hp,x:c.player.x,turns:G.turn-turn,fuel:fuel-G.fuel,shield:G.ship.shieldCharge});
   }
   return result;
  });assert.deepEqual(crashes,[{damage:25,x:13,turns:1,fuel:3,shield:20},{damage:35,x:14,turns:1,fuel:3,shield:20},{damage:50,x:14,turns:1,fuel:3,shield:20}]);
  const free=await page.evaluate(()=>{
   const c=ramFixture(23);c.asteroids=[{x:14,y:8}];const before=JSON.stringify(ramState());tryMove(1,0);
   const rock=before===JSON.stringify(ramState());c.player.x=26;c.player.dx=1;c.asteroids=[];
   const edge=JSON.stringify(ramState());boostShipInCombat();return {rock,edge:edge===JSON.stringify(ramState())};
  });assert.deepEqual(free,{rock:true,edge:true});
  const fatal=await page.evaluate(()=>{
   const results=[];
   for(const asteroid of [false,true]){
    const c=ramFixture(),enemy=c.enemies[0];G.ship.hp=1;enemy.ship.hp=1;if(asteroid)c.asteroids=[{x:14,y:8}];
    const turn=G.turn;asteroid?boostShipInCombat():tryMove(1,0);
    results.push({dead:G.dead,cause:G.deathCause,turns:G.turn-turn,enemy:enemy.ship.hp,mode:G.mode});
   }
   return results;
  });assert.ok(fatal.every(f=>f.dead&&f.turns===1&&f.mode==='galaxy'));assert.equal(fatal[0].enemy,0);
  assert.match(fatal[0].cause,/ramming collision/);assert.match(fatal[1].cause,/asteroid/);
  assert.ok(await page.evaluate(async()=>await autoSave()));assert.ok(await page.evaluate(async()=>await loadFromStorage()));assert.equal(await page.evaluate(()=>G.dead),true);
  const debug=await page.evaluate(()=>{
   const c=ramFixture();DEBUG.infiniteHull=true;const hp=G.ship.hp;tryMove(1,0);
   return {hp:G.ship.hp,expected:hp,enemy:c.enemies[0].ship.hp};
  });assert.equal(debug.hp,debug.expected);assert.equal(debug.enemy,80);
  const injury=await page.evaluate(()=>{
   ramFixture();Math.random=()=>0;const hp=G.crew[0].hp;tryMove(1,0);
   return {engine:G.ship.systems.engine.condition,hurt:G.crew[0].hp<hp,shield:G.ship.shieldCharge};
  });assert.equal(injury.engine,75);assert.equal(injury.hurt,true);assert.equal(injury.shield,20);
  await page.evaluate(()=>{
   window.wraithFixture=mobility=>{
    bridgeFixture({hull:'LIGHT_SCOUT'});G.mode='galaxy';G.shipCombat=null;G.pirates=[];
    const wraith={name:'Pursuit Wraith',x:10,y:10,hp:150,maxHp:150,atk:20,engineRating:mobility,shields:0,guns:0,
      alive:true,variant:'blue',_homeCluster:[{x:10,y:10}]};G.gasEntities=[wraith];startShipCombat(wraith,true);
    G.shipCombat.asteroids=[];Math.random=()=>0.99;renderAll();return G.turn;
   };
  });
  const start=await page.evaluate(()=>wraithFixture(3));
  for(let i=0;i<12;i++)await page.keyboard.press('ArrowLeft');
  const chase=await page.evaluate(()=>({turn:G.turn,hp:G.ship.hp,ram:G.log.some(e=>e.msg.includes('Pursuit Wraith rams')),
    overlapping:G.shipCombat.player.x===G.shipCombat.enemies[0].x&&G.shipCombat.player.y===G.shipCombat.enemies[0].y,
    cooldown:G.gasEntities[0].ramReadyAt,bank:G.shipCombat.enemies[0].moveBank}));
  assert.equal(chase.turn,start+12);assert.ok(chase.hp<100&&chase.ram,'faster wraith rams during uninterrupted player movement');assert.equal(chase.overlapping,false);
  assert.ok(await page.evaluate(async()=>await autoSave()));assert.ok(await page.evaluate(async()=>await loadFromStorage()));
  assert.deepEqual(await page.evaluate(()=>[G.gasEntities[0].ramReadyAt,G.shipCombat.enemies[0].moveBank]),[chase.cooldown,chase.bank]);
  await page.screenshot({path:artifactPath('Ramming-wraith-pursuit.png')});
  await page.evaluate(()=>wraithFixture(2));for(let i=0;i<12;i++)await page.keyboard.press('ArrowLeft');
  assert.equal(await page.evaluate(()=>G.ship.hp),100,'equal mobility does not manufacture a catch-up attack');
  const boostEscape=await page.evaluate(()=>{
   wraithFixture(3);const c=G.shipCombat;c.enemies[0].x=14;c.player.dx=-1;const hp=G.ship.hp;boostShipInCombat();
   return {hp:G.ship.hp,expected:hp,x:c.player.x,ram:G.log.some(e=>e.msg.includes('Pursuit Wraith rams'))};
  });assert.equal(boostEscape.hp,boostEscape.expected);assert.equal(boostEscape.x,11);assert.equal(boostEscape.ram,false);
  assert.deepEqual(errors,[]);
  console.log('PASS: native normal/boost ramming, two-way direct hull loss, full fuel/heat/turn costs, first/non-anchor asteroid impacts and size scaling, fatal/mutual outcomes and saves, criticals/casualties/debug protection, moving-target wraith catch-up, equal-speed escape and saved cadence.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
