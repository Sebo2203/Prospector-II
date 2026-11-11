const assert=require('node:assert/strict');
const {chromium,gameUrl}=require('./runtime.cjs');

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:/,r=>r.abort());await page.goto(gameUrl);
  async function land(options={}){
   await page.evaluate(id=>initGame(id,'Landing QA','Landing QA'),options.id||'ATTACK_CORVETTE');
   await page.waitForFunction(()=>G?.galaxy&&G.log.some(e=>e.msg.includes('Ready for departure')));
   return page.evaluate(options=>{
    const key='qa:landing-impact',desc={biome:'DESERT',name:'Impact QA',scanState:'full'};
    getOrCreateScanPlanetData(key,desc.biome,'full');
    G.crew.forEach(c=>{c.skills.nav=options.nav||0;c._skillXp={};});
    G.ship.hp=options.hp??G.ship.maxHp;
    G.ship.shieldCharge=shipShieldCapacity();G.ship.shieldRechargeAt=G.turn+7;
    DEBUG.infiniteHull=!!options.debug;
    const hp=G.ship.hp,shield=G.ship.shieldCharge,recharge=G.ship.shieldRechargeAt,turn=G.turn;
    // Planet generation is real; approach, impact magnitude and critical rolls are controlled.
    const random=Math.random,rolls=[0,options.maxImpact?0.99:0,options.critical?0:0.99];
    Math.random=()=>rolls.shift()??(options.critical?0:0.99);
    try{doLandOnPlanet(key,desc);}finally{Math.random=random;DEBUG.infiniteHull=false;}
    return {damage:hp-G.ship.hp,shield:G.ship.shieldCharge,initialShield:shield,
     recharge:G.ship.shieldRechargeAt,initialRecharge:recharge,turns:G.turn-turn,
     engine:G.ship.systems.engine.condition,dead:G.dead,cause:G.deathCause,
     xp:G.crew.reduce((sum,c)=>sum+(c._skillXp?.nav||0),0),
     rough:G.log.filter(e=>e.msg.startsWith('Rough landing!')).map(e=>e.msg)};
   },options);
  }
  for(const [id,min,max]of [['LIGHT_SCOUT',3,10],['ATTACK_CORVETTE',5,15],['BULK_FREIGHTER',8,25]]){
   for(const maxImpact of [false,true]){
    const result=await land({id,maxImpact});
    assert.equal(result.damage,maxImpact?max:min,id+' retains size-scaled direct hull damage');
    assert.equal(result.shield,result.initialShield,'impact does not spend shield charge');
    assert.equal(result.recharge,result.initialRecharge,'impact does not delay shield recharge');
    assert.equal(result.turns,0);assert.equal(result.xp,3);
    assert.match(result.rough[0],/shields bypassed/i);
   }
  }
  const skill8=await land({nav:8});assert.equal(skill8.damage,5,'NAV 8 still has rare rough approaches');
  const skill9=await land({nav:9});
  assert.equal(skill9.damage,0);assert.deepEqual(skill9.rough,[]);assert.equal(skill9.xp,1,'NAV 9 retains guaranteed smooth landing');
  const critical=await land({critical:true});assert.equal(critical.engine,75,'direct impact retains existing component criticals');
  const fatal=await land({hp:1});
  assert.equal(fatal.dead,true,'charged shields cannot prevent a fatal crash');assert.equal(fatal.damage,1);
  assert.match(fatal.cause,/crash landing/);assert.equal(fatal.shield,20);
  const debug=await land({debug:true});assert.equal(debug.damage,0);assert.equal(debug.shield,20);assert.equal(debug.engine,100);
  assert.deepEqual(errors,[]);
  console.log('PASS: full-shield landing bypass, all starter size ranges, unchanged recharge/turns/XP, NAV 8/9, criticals, lethal crash and debug protection.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
