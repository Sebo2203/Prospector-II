const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.text().startsWith('Prospector input error:'))errors.push(m.text());});
  await page.route(/^https?:/,r=>r.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('ATTACK_CORVETTE','Cover QA','Cover QA'));
  await page.waitForFunction(()=>G?.galaxy&&G.log.some(e=>e.msg.includes('Ready for departure')));
  await page.addScriptTag({path:require('node:path').join(__dirname,'ship-combat-fixture.js')});
  await page.evaluate(()=>{
   const c=bridgeFixture();c.asteroids=[{x:15,y:7,width:2,height:2}];
   c.enemies[0].x=19;c.enemies[0].y=8;renderAll();
  });
  const state=()=>page.evaluate(()=>JSON.stringify({turn:G.turn,player:G.shipCombat.player,hp:G.ship.hp,
   heat:G.ship.heat,fuel:G.fuel,ready:G.ship.weaponReadyAt,enemy:G.shipCombat.enemies[0].ship.hp}));
  let before=await state();assert.equal(await page.evaluate(()=>shipCombatBoostStatus()),'Ready','boost may collide with cover');
  await page.keyboard.press('f');assert.equal(await state(),before,'lower half of a rock blocks ordinary fire without spending a turn');
  await page.evaluate(()=>{G.shipCombat.player.x=14;renderAll();});
  before=await state();await page.keyboard.press('ArrowRight');assert.equal(await state(),before,'non-anchor asteroid tile blocks native movement');
  const paths=await page.evaluate(()=>{
   const c=G.shipCombat,enemy=c.enemies[0];
   const route=shipCombatMissilePath(c,c.player,enemy);
   const safe=route.every(p=>!shipCombatAsteroid(c,p));
   const moves=[];
   for(let i=0;i<4;i++){const next=shipCombatEnemyNextStep(c,enemy,c.player);if(!next)break;moves.push(next);enemy.x=next.x;enemy.y=next.y;}
   return {safe,moves,blocked:moves.some(p=>shipCombatAsteroid(c,p))};
  });
  assert.equal(paths.safe,true);assert.equal(paths.blocked,false);assert.ok(paths.moves.some(p=>p.y!==8),'enemy routes around broad cover');
  // Guided missiles actually leave cover, travel around all four cells and hit.
  const launch=await page.evaluate(()=>{
   const c=bridgeFixture({weapons:['artemis'],tactic:'brawler'});
   c.asteroids=[{x:15,y:7,width:2,height:2}];c.enemies[0].x=19;c.enemies[0].y=8;
   c.enemies[0].ship.systems.engine.condition=0;c.enemies[0].ship.weaponReadyAt=[G.turn+100];
   G.ship.ammo.artemis=3;Math.random=()=>0.01;
   const hp=c.enemies[0].ship.hp;doShipFire();
   return {missiles:c.missiles.length,hp,immediate:c.enemies[0].ship.hp};
  });assert.equal(launch.missiles,1);assert.equal(launch.immediate,launch.hp);
  const flight=await page.evaluate(()=>{
   const c=G.shipCombat,positions=[];
   for(let i=0;i<4&&c.missiles.length;i++){
    advanceShipCombat();positions.push(...c.missiles.map(m=>({x:m.x,y:m.y})));
   }
   Math.random=bridgeRandom;
   return {positions,safe:positions.every(p=>!shipCombatAsteroid(c,p)),hp:c.enemies[0].ship.hp,pending:c.missiles.length};
  });assert.equal(flight.safe,true);assert.ok(flight.hp<launch.hp);assert.equal(flight.pending,0);
  await page.evaluate(()=>{
   const c=bridgeFixture();c.asteroids=[{x:15,y:7,width:2,height:2},{x:8,y:5,width:2,height:1},{x:6,y:10,width:1,height:2},{x:10,y:9}];
   c.seenTiles.fill(true);renderAll();
  });
  const rocks=await page.evaluate(()=>JSON.stringify(G.shipCombat.asteroids));
  assert.ok(await page.evaluate(async()=>await autoSave()));assert.ok(await page.evaluate(async()=>await loadFromStorage()));
  assert.equal(await page.evaluate(()=>JSON.stringify(G.shipCombat.asteroids)),rocks);
  const invalid=await page.evaluate(()=>{
   const active=G,raw=JSON.parse(serializeCareer(G));raw.shipCombat.asteroids[0].width=3;
   try{installSaveSnapshot(parseSaveSnapshot(JSON.stringify(raw)));return false;}catch{return G===active;}
  });assert.equal(invalid,true,'invalid dimensions preserve the active career');
  const render=await page.evaluate(()=>{
   const c=G.shipCombat;c.asteroids=[{x:15,y:7,width:2,height:2}];
   c.seenTiles=[];c.seenTiles[8*COMBAT_MAP.width+16]=true;DEBUG.fullVision=false;
   const clip=[],drawn=[],rect=ctx.rect,image=ctx.drawImage,random=Math.random;
   Math.random=()=>{throw Error('render consumed gameplay RNG');};
   ctx.rect=function(x,y,w,h){clip.push([x,y,w,h]);return rect.call(this,x,y,w,h);};
   ctx.drawImage=function(source,...args){
    if(source===IMG.combat_asteroid_large_2x2)drawn.push({width:source.naturalWidth,height:source.naturalHeight,args});
    return image.call(this,source,...args);
   };
   try{drawCanvas();}finally{ctx.rect=rect;ctx.drawImage=image;Math.random=random;}
   OPTIONS.asciiMode=true;const chars=[],fill=ctx.fillText;
   ctx.fillText=function(text,x,y,...args){if(text==='#')chars.push([x,y]);return fill.call(this,text,x,y,...args);};
   try{drawCanvas();}finally{ctx.fillText=fill;OPTIONS.asciiMode=false;}
   return {clip,drawn,chars};
  });
  assert.equal(render.drawn.length,1,'a visible extension renders even when its anchor is uncharted');
  assert.deepEqual(render.drawn[0],{width:48,height:48,args:[12+15*24,12+7*24]},'large art is painted at native resolution without stretching');
  assert.deepEqual(render.clip,[[12+16*24,12+8*24,24,24]],'only the charted cell is unmasked');
  assert.deepEqual(render.chars,[[12+16*24+6,12+8*24+18]],'ASCII reveals exactly the same occupied cell');
  await page.evaluate(()=>{
   const c=G.shipCombat;c.asteroids=[{x:5,y:4},{x:9,y:4,width:2,height:1},
    {x:6,y:9,width:1,height:2},{x:15,y:7,width:2,height:2}];c.seenTiles=Array(27*17).fill(true);renderAll();
  });
  for(const viewport of [{width:1400,height:720},{width:900,height:620}]){
   await page.setViewportSize(viewport);
   for(const ascii of [false,true]){
    await page.evaluate(ascii=>{OPTIONS.asciiMode=ascii;renderAll();},ascii);
    await page.screenshot({path:artifactPath('Combat-cover-'+viewport.width+'-'+(ascii?'ascii':'sprites')+'.png')});
   }
  }
  await page.evaluate(()=>{OPTIONS.asciiMode=false;G.shipAnim=null;});
  const career=await page.evaluate(()=>serializeCareer(G));
  await page.evaluate(()=>{debugEnterPalette();debugPaletteVisit('galaxy:BRIDGE_DRILL');});
  const shapes=()=>page.evaluate(()=>G.shipCombat.asteroids.map(r=>(r.width??1)+'x'+(r.height??1)).sort());
  assert.deepEqual(await shapes(),['1x1','1x2','2x1','2x2']);
  await page.evaluate(()=>{G.shipCombat.asteroids=[];debugPaletteVisit('galaxy:BRIDGE_DRILL');});
  assert.deepEqual(await shapes(),['1x1','1x2','2x1','2x2'],'sample reset restores all cover shapes');
  await page.evaluate(async()=>{await autoSave();await autosaveQueue.idle();});
  assert.equal(await page.evaluate(async()=>(await readStoredAutosave()).record.raw),career,'sandbox cannot replace the retained career');
  await page.evaluate(()=>debugReturnFromPalette());assert.equal(await page.evaluate(()=>serializeCareer(G)),career);
  fs.writeFileSync(artifactPath('Combat-cover.json'),JSON.stringify({paths,flight,render,errors},null,2)+'\n');
  assert.deepEqual(errors,[]);
  console.log('PASS: multi-tile normal-thrust/fire blocking and collision-ready boost, enemy/missile routing and real guided impact, saved footprints and transactional rejection, clipped/ASCII art, scaled screenshots and isolated debug reset/return.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
