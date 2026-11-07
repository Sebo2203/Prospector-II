const assert=require('node:assert/strict');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('LIGHT_SCOUT','Landing QA','Landing QA'));
  await page.waitForFunction(()=>G?.galaxy && G.log.some(e=>e.msg.includes('Ready for departure')));
  await page.evaluate(()=>{
   const {x,y}=G.ship;
   G.galaxy[y][x]={type:'SYSTEM',name:'Revisit Test',planets:[{name:'Revisit World',biome:'FROZEN',scanState:'full'}]};
   G.mode='system';G.curSystem=x+','+y;G.selPlanet=0;G.selMoon=-1;
   doViewScan();const map=G.planets[G.scanViewKey];map.scanMask=Array(PW(map)*PH(map)).fill(true);renderAll();
  });
  const scan=()=>page.evaluate(()=>{
   const map=G.planets[G.scanViewKey],before=JSON.stringify(map),calls=[];
   const dark=drawSpriteDarkMatteKeyed,ascii=drawAsciiTile;
   drawSpriteDarkMatteKeyed=function(key,...args){if(key==='ship_tile')calls.push(key);return dark(key,...args);};
   drawAsciiTile=function(key,...args){if(key==='SHIP'||key==='ship_tile')calls.push(key);return ascii(key,...args);};
   try{drawScanView();}finally{drawSpriteDarkMatteKeyed=dark;drawAsciiTile=ascii;}
   return {ships:calls.length,unchanged:before===JSON.stringify(map),site:[map.spawnX,map.spawnY],landable:canLandAt(map,map.spawnX,map.spawnY)};
  });
  const first=await scan();assert.equal(first.ships,0);
  await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>G.mode),'planet');
  assert.ok(await page.evaluate(()=>G.planets[G.curPlanet].grid[G.player.y][G.player.x].type==='SHIP'));
  await page.keyboard.press('l');assert.equal(await page.evaluate(()=>G.mode),'system');await page.evaluate(()=>doViewScan());
  for(const ascii of [false,true]){
   await page.evaluate(ascii=>{OPTIONS.asciiMode=ascii;renderAll();},ascii);
   const revisit=await scan();assert.equal(revisit.ships,0);assert.ok(revisit.unchanged && revisit.landable);assert.deepEqual(revisit.site,first.site);
   await page.screenshot({path:artifactPath('Scan-revisited-'+(ascii?'ascii':'sprites')+'.png')});
  }
  assert.ok(await page.evaluate(async()=>await autoSave()));assert.ok(await page.evaluate(async()=>await loadFromStorage()));
  assert.equal((await scan()).ships,0);
  await page.keyboard.press('Enter');assert.deepEqual(await page.evaluate(()=>[G.player.x,G.player.y]),first.site);
  await page.keyboard.press('l');await page.evaluate(()=>doViewScan());
  const next=await page.evaluate(()=>{
   const map=G.planets[G.scanViewKey],x=map.spawnX===PW(map)-1?map.spawnX-1:map.spawnX+1,y=map.spawnY;
   map.grid[y][x]={type:'FROZEN_FLOOR'};G.scanCursorX=x;G.scanCursorY=y;renderAll();return [x,y];
  });
  await page.keyboard.press('Enter');assert.deepEqual(await page.evaluate(()=>[G.player.x,G.player.y]),next);
  assert.ok(await page.evaluate(([x,y])=>G.planets[G.curPlanet].grid[y][x].type!=='SHIP',first.site));
  assert.ok(await page.evaluate(()=>G.planets[G.curPlanet].grid[G.player.y][G.player.x].type==='SHIP'));
  assert.deepEqual(errors,[]);console.log('PASS: initial/revisit orbital scans hide own ship in sprites and ASCII; landing memory, map data, save/reload and relanding remain intact.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
