const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('LIGHT_SCOUT','Station art QA','Station art QA'));
  await page.waitForFunction(()=>G?.galaxy&&G.log.some(e=>e.msg.includes('Ready for departure')));
  const report=await page.evaluate(()=>{
   const art=[['Starbase',()=>drawSprite('starbase',0,0)],['Casino',()=>DRAW.casino(ctx,0,0)],
    ['Pirate base',()=>DRAW.pirate_base(ctx,0,0)],['Derelict',()=>drawDerelictStation(ctx,0,0)]];
   const sheet=document.createElement('canvas');sheet.width=704;sheet.height=330;
   const s=sheet.getContext('2d');s.fillStyle='#11151d';s.fillRect(0,0,sheet.width,sheet.height);s.imageSmoothingEnabled=false;
   s.font='bold 16px monospace';s.fillStyle='#d5e0e5';s.fillText('STATIONS / TRANSPARENT ART AT 1x AND 3x',14,24);
   const stats=[];
   for(let a=0;a<art.length;a++){
    const [name,draw]=art[a];ctx.clearRect(0,0,24,24);draw();const mask=ctx.getImageData(0,0,24,24).data;
    const transparent=Array.from(mask).filter((v,i)=>i%4===3&&v===0).length;
    if(transparent<50||transparent>540)throw Error(name+' has missing art or an opaque matte');
    for(const i of [0,23,23*24,24*24-1])if(mask[i*4+3])throw Error(name+' painted a tile corner');
    let preserved=0;
    for(let b=0;b<3;b++){
     DRAW.void(ctx,0,0);if(b)DRAW.nebula(ctx,0,0,b===1?'blue':'pink',10,10);
     const before=ctx.getImageData(0,0,24,24).data;draw();const after=ctx.getImageData(0,0,24,24).data;
     for(let i=0;i<mask.length;i+=4)if(mask[i+3]===0){
      for(let channel=0;channel<4;channel++)if(before[i+channel]!==after[i+channel])throw Error(name+' overwrote transparent background');
      preserved++;
     }
     const x=a*176+14,y=b*92+54;s.drawImage(canvas,0,0,24,24,x,y+16,24,24);s.drawImage(canvas,0,0,24,24,x+45,y,72,72);
     s.fillStyle='#a8bac4';s.font='11px monospace';s.fillText(name+' / '+['space','blue','pink'][b],x,y+84);
    }
    stats.push({name,transparent,preserved});
   }
   const career=JSON.stringify(G);debugEnterPalette('galaxy');
   const original=drawDerelictStation;let wreckCalls=0;
   drawDerelictStation=(...args)=>{wreckCalls++;return original(...args);};
   try{
    for(const id of ['galaxy:DERELICT','biome:DERELICT','galaxy:QUARANTINE']){
     debugPaletteVisit(id);G.ship.x--;wreckCalls=0;drawCanvas();if(!wreckCalls)throw Error(id+' bypassed wreck art');
     G.ship.x++;doInteract();if(!G.planets[G.curPlanet]?.isDerelict)throw Error(id+' no longer boards');
    }
    OPTIONS.asciiMode=true;debugPaletteVisit('galaxy:DERELICT');drawCanvas();OPTIONS.asciiMode=false;
   }finally{drawDerelictStation=original;debugReturnFromPalette();}
   if(JSON.stringify(G)!==career)throw Error('Palette changed career');
   return {stats,checks:['real alpha and no opaque tile corners','background preserved over space and both nebulae','galaxy and biome derelicts plus Mercy use shared wreck art','native boarding and ASCII retained','exact career restoration'],image:sheet.toDataURL()};
  });
  fs.writeFileSync(artifactPath('Station-art-preview.png'),Buffer.from(report.image.split(',')[1],'base64'));delete report.image;
  assert.deepEqual(errors,[]);console.log(JSON.stringify({...report,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
