const assert=require('node:assert/strict');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:/,route=>route.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('LIGHT_SCOUT','Feedback QA','Feedback QA'));
  await page.waitForFunction(()=>G?.galaxy && G.log.some(e=>e.msg.includes('Ready for departure')));
  await page.evaluate(()=>{
    const enemy={name:'Feedback Raider',x:G.ship.x,y:G.ship.y,hp:200,maxHp:200,guns:1,engineRating:2,alive:true,pirateType:'guard'};
    G.pirates=[enemy];startShipCombat(enemy);
    const combat=G.shipCombat;combat.asteroids=[{x:4,y:4},{x:5,y:5}];combat.player={x:8,y:8,dx:1,dy:0};
    combat.enemies[0].x=11;combat.enemies[0].y=8;enemy.weaponReadyAt=[G.turn+999];
    Math.random=()=>0.5;window.cues=[];
    for(const name of ['shipHit','hullHit','coreHit','shieldHit']){
      const original=SFX[name];SFX[name]=()=>{window.cues.push({name,time:performance.now()});original();};
    }
    renderAll();
  });
  await page.keyboard.press('f');
  const projectile=await page.evaluate(()=>{
    const active=activeShipCombatFeedback();active.born=performance.now()-55;
    const strokes=[],text=[],stroke=ctx.stroke,fill=ctx.fillText;
    ctx.stroke=function(...args){strokes.push({color:this.strokeStyle,dash:this.getLineDash()});return stroke.apply(this,args);};
    ctx.fillText=function(t,x,y,...args){text.push({text:String(t),x,y});return fill.call(this,t,x,y,...args);};
    try{drawCanvas();}finally{ctx.stroke=stroke;ctx.fillText=fill;}
    return {strokes,text,turn:G.turn,cores:JSON.stringify(G.ship.systems)};
  });
  assert.ok(projectile.strokes.some(stroke=>stroke.color==='#9dedd4' && !stroke.dash.length),'a short travelling player shot replaces the dotted line');
  assert.ok(!projectile.strokes.some(stroke=>stroke.dash.length));
  assert.ok(projectile.text.some(t=>t.text==='Reload in 1t'));
  assert.ok(!projectile.text.some(t=>/SELECTED TARGET|Nearby plasma/.test(t.text)));
  assert.equal(projectile.text.find(t=>t.text==='Feedback Raider').y,96,'removing the heading preserves the target-name spacing');
  await page.evaluate(()=>{G.shipCombat.enemies[0].ship.weaponReadyAt=[G.turn+1];Math.random=()=>0.5;});
  await page.keyboard.press('Space');
  await page.evaluate(()=>{G.shipCombat.enemies[0].ship.weaponReadyAt=[G.turn+1];Math.random=()=>0;});
  await page.keyboard.press('Space');
  assert.notEqual(await page.evaluate(()=>JSON.stringify(G.ship.systems)),projectile.cores,'the dramatic cue corresponds to real core damage');
  const state=await page.evaluate(()=>JSON.stringify([G.turn,G.ship.hp,G.ship.systems,G.shipCombat.round]));
  await page.waitForFunction(()=>window.cues.length===3 && !activeShipCombatFeedback());
  const cues=await page.evaluate(()=>window.cues);
  assert.deepEqual(cues.map(c=>c.name),['shipHit','hullHit','coreHit']);
  assert.ok(cues[1].time-cues[0].time>=240 && cues[2].time-cues[1].time>=300,'distinct impact cues play in attack order without collapsing together');
  assert.equal(await page.evaluate(()=>JSON.stringify([G.turn,G.ship.hp,G.ship.systems,G.shipCombat.round])),state,'playback advances no turns and applies no extra damage');
  assert.ok(await page.evaluate(()=>!('shipFeedback' in JSON.parse(serializeCareer(G)))));
  await page.screenshot({path:artifactPath('Combat-feedback.png')});
  await page.evaluate(()=>{Math.random=()=>0.5;G.ship.weaponReadyAt=[G.turn];G.ship.heat=0;renderAll();});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.keyboard.press('f');
  assert.equal(await page.evaluate(()=>{
    const active=activeShipCombatFeedback();active.born=performance.now()-55;
    let moving=0;const stroke=ctx.stroke;
    ctx.stroke=function(...args){if(this.strokeStyle==='#9dedd4')moving++;return stroke.apply(this,args);};
    try{drawCanvas();}finally{ctx.stroke=stroke;}return moving;
  }),0,'reduced motion replaces travel with impact feedback');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>G===null && !AUTOSAVE_STATE.transition);
  const count=await page.evaluate(()=>window.cues.length);await page.waitForTimeout(450);
  assert.equal(await page.evaluate(()=>window.cues.length),count,'menu return cancels pending combat cues');
  assert.deepEqual(errors,[]);
  console.log('PASS: travelling shots, no idle dotted line/footer/target heading, preserved spacing, compact reloads, real ordered outgoing/incoming/core cues, state-free playback and menu cancellation.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
