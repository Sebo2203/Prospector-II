const assert=require('node:assert/strict');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720},deviceScaleFactor:1.25}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route(/^https?:/,route=>route.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('LIGHT_SCOUT','Space QA','Space QA'));
  await page.waitForFunction(()=>G?.galaxy && G.log.some(entry=>entry.msg.includes('Ready for departure')));
  await page.evaluate(()=>{
    const ship={name:'Visible beyond weapon range',x:G.ship.x,y:G.ship.y,hp:150,maxHp:150,guns:1,alive:true,pirateType:'guard',engineRating:2};
    G.pirates=[ship,{...ship,name:'Beyond sensors'}];startShipCombat(ship);
    const combat=G.shipCombat;combat.player={x:8,y:8,dx:1,dy:0};
    combat.enemies[0].x=18;combat.enemies[0].y=8;
    combat.enemies[1].x=24;combat.enemies[1].y=8;
    combat.seenTiles.fill(true);combat.asteroids=[];combat.trails=[];renderAll();
  });
  const observe=()=>page.evaluate(()=>{
    const images=[],text=[],rects=[],fill=ctx.fillText,rect=ctx.fillRect,image=ctx.drawImage,random=Math.random;
    let rolls=0;Math.random=()=>{rolls++;return random();};
    ctx.fillText=function(t,x,y,...args){text.push({text:String(t),x,y});return fill.call(this,t,x,y,...args);};
    ctx.fillRect=function(x,y,w,h){rects.push({x,y,w,h,color:this.fillStyle});return rect.call(this,x,y,w,h);};
    ctx.drawImage=function(img,...args){images.push({key:Object.keys(IMG).find(key=>IMG[key]===img),x:args[0],y:args[1]});return image.call(this,img,...args);};
    try{drawCanvas();}finally{ctx.fillText=fill;ctx.fillRect=rect;ctx.drawImage=image;Math.random=random;}
    return {images,text,rects,rolls,targets:canvasMenuTargets.map(target=>target.title||'')};
  });
  let view=await observe();
  assert.equal(await page.evaluate(()=>shipCombatSensorRange()),15);
  assert.ok(view.targets.some(title=>title.startsWith('Visible beyond weapon range')));
  assert.ok(!view.targets.some(title=>title.startsWith('Beyond sensors')),'chart history cannot reveal a live ship outside current sensors');
  assert.ok(view.text.some(t=>t.text==='Sensor range 15'));
  assert.equal(view.rolls,0,'presentation does not consume gameplay random rolls');
  assert.ok(!view.rects.some(rect=>rect.w===24 && rect.h===24),'no tiled firing-range fill or rectangular fog mask');
  assert.ok(!view.rects.some(rect=>['#101c2a','#11151d','#20495d','#501d27'].includes(rect.color)),'range and ship-cell backgrounds are removed');
  await page.evaluate(()=>{damageShipSystem(G.ship,'sensors',50,'QA');renderAll();});
  view=await observe();assert.equal(await page.evaluate(()=>shipCombatSensorRange()),9);
  assert.ok(!view.targets.some(title=>title.startsWith('Visible beyond weapon range')),'sensor damage immediately hides a formerly visible ship');
  await page.evaluate(()=>{damageShipSystem(G.ship,'sensors',100,'QA');renderAll();});
  view=await observe();assert.ok(!view.targets.some(title=>title.includes('hull')));assert.ok(view.text.some(t=>t.text==='Sensors offline'));
  await page.evaluate(()=>{
    G.ship.systems.sensors.condition=100;
    const combat=G.shipCombat;
    combat.trails=Array.from({length:4},(_,index)=>({x:4+index,y:8,dx:1,dy:0,damage:8,expires:combat.round+index+1}));
    combat.trails.push({x:24,y:9,dx:-1,dy:0,damage:4,expires:combat.round+2});renderAll();
  });
  view=await observe();
  assert.equal(view.images.filter(image=>image.key?.startsWith('combat_plasma_')).length,4,'four original fade stages render; out-of-range exhaust stays hidden');
  assert.equal(new Set(view.images.filter(image=>image.key?.startsWith('combat_plasma_')).map(image=>image.key)).size,4);
  assert.ok(!view.text.some(t=>t.x<660 && t.y<420 && /^\d+$/.test(t.text)),'no numeric plasma tiles');
  assert.ok(view.text.some(t=>t.text.startsWith('Nearby plasma:')) && view.text.some(t=>t.text.includes('W 8/4')),'nearby hazard amounts and lifetimes are readable without hover');
  const before=await page.evaluate(()=>JSON.stringify([G.turn,G.ship.hp,G.shipCombat.trails]));
  for(const viewport of [{width:1400,height:720},{width:900,height:600}]){
    await page.setViewportSize(viewport);
    for(const ascii of [false,true]){
      await page.evaluate(ascii=>{OPTIONS.asciiMode=ascii;renderAll();},ascii);
      view=await observe();
      if(ascii){assert.ok(view.text.some(t=>t.text==='*'));assert.ok(!view.text.some(t=>t.x>=108 && t.x<204 && t.y<420 && t.text==='?'));}
      await page.screenshot({path:artifactPath('Combat-space-'+viewport.width+'-'+(ascii?'ascii':'sprites')+'.png')});
    }
  }
  assert.equal(await page.evaluate(()=>JSON.stringify([G.turn,G.ship.hp,G.shipCombat.trails])),before,'drawing and inspecting never change damage, expiry or time');
  assert.deepEqual(errors,[]);
  console.log('PASS: empty-space combat, explicit sensor versus weapon range, live contact/exhaust culling, original plasma fade sprites, keyboard-readable hazards, ASCII and scaled rendering.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
