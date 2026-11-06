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
  const chart=await page.evaluate(()=>{
   const points=[
    {x:27,y:26,type:'BASE'}, {x:31,y:26,type:'SYSTEM',starType:'YELLOW'},
    {x:35,y:26,type:'DERELICT'}, {x:39,y:26,type:'CASINO'}, {x:43,y:26,type:'PIRATE_BASE'},
    {x:27,y:30,type:'BLACK_HOLE'}, {x:31,y:30,type:'PULSAR'},
    {x:35,y:30,type:'ROGUE_PLANET'}, {x:39,y:30,type:'NEBULA',nebulaVariant:'blue'},
    {x:43,y:30,type:'NEBULA',nebulaVariant:'pink'}
   ];
   const hidden={x:55,y:30,type:'DERELICT'};
   const farStations=[{x:3,y:3,type:'BASE'},{x:MAP_W-4,y:MAP_H-4,type:'BASE'}];
   G.ship.x=35;G.ship.y=36;G.shipStats.sensorRange=3;
   G.galaxy=Array.from({length:MAP_H},()=>Array.from({length:MAP_W},()=>({type:'VOID'})));
   G.visited.fill(false);
   for(let y=21;y<42;y++)for(let x=21;x<51;x++)G.visited[y*MAP_W+x]=true;
   for(const {x,y} of farStations) G.visited[y*MAP_W+x]=true;
   for(const cell of [...points,...farStations,hidden]) G.galaxy[cell.y][cell.x]=cell;
   G.pirates=[];G.pirateBases=[];G.npcStranded=[];G.nebulaLoot=[];G.gasEntities=[];G._activeDrones=[];
   G.neutralShips=[{x:37,y:36,type:'trader'},{x:40,y:36,type:'trader'},{x:45,y:36,type:'trader'}];
   const small=document.getElementById('galaxy-minimap');
   renderGalaxyMinimap();
   const smallScale=Math.min((small.width-6)/MAP_W,(small.height-6)/MAP_H);
   const smallX=Math.floor((small.width-MAP_W*smallScale)/2);
   if(smallScale!==(small.height-6)/MAP_H||smallX>4) throw Error('Sidebar minimap is squeezed or has wide side margins');
   const smallY=Math.floor((small.height-MAP_H*smallScale)/2);
   const smallPaint=small.getContext('2d');
   const miniColor=(x,y,dx=0,dy=0)=>{
    const pixel=smallPaint.getImageData(smallX+Math.floor(x*smallScale)+dx,smallY+Math.floor(y*smallScale)+dy,1,1);
    return Array.from(pixel.data.slice(0,3)).join(',');
   };
   if(farStations.some(({x,y})=>miniColor(x,y)!=='255,223,131'))
    throw Error('Minimap does not show landmarks at both ends of the galaxy');
   if(miniColor(27,26)!=='255,223,131'||miniColor(35,26)!=='157,183,214'||miniColor(27,30)!=='255,159,72')
    throw Error('Minimap station, wreck, and hazard markers are missing or indistinct');
   if(miniColor(hidden.x,hidden.y)!=='53,55,71'||miniColor(28,38)!=='14,18,30')
    throw Error('Minimap does not distinguish explored space from fog');
   if(miniColor(G.ship.x,G.ship.y)!=='127,255,155'||miniColor(G.ship.x,G.ship.y,2)!=='127,255,155')
    throw Error('Minimap player cross is missing');
   const before=small.toDataURL();
   OPTIONS.asciiMode=true;
   openGalaxyMinimapOverlay();
   renderGalaxyMinimap();
   OPTIONS.asciiMode=false;
   if(small.toDataURL()!==before) throw Error('Opening the chart changed the small minimap');

   const map=document.getElementById('galaxy-minimap-large');
   const paint=map.getContext('2d');
   const tileSize=Math.floor(Math.min((map.width-6)/MAP_W,(map.height-6)/MAP_H));
   const ox=Math.floor((map.width-MAP_W*tileSize)/2),oy=Math.floor((map.height-MAP_H*tileSize)/2);
   const colors=(x,y)=>{
    const pixels=paint.getImageData(Math.ceil(ox+x*tileSize)+1,Math.ceil(oy+y*tileSize)+1,6,6).data;
    const result=new Set();
    for(let i=0;i<pixels.length;i+=4)result.add([...pixels.slice(i,i+3)].join(','));
    return result;
   };
   for(const {x,y,type} of points){
    if(colors(x,y).size<3)throw Error(type+' lacks visible full-map art');
   }
   if(!colors(hidden.x,hidden.y).has('36,37,49')||colors(hidden.x,hidden.y).size!==1)
    throw Error('Unscanned wreck appeared on the full map');
   if(colors(37,36).size<3||colors(40,36).size<3||colors(45,36).size!==1)
    throw Error('The full map lost a visible contact or showed one outside radio range');
   const legend=document.getElementById('minimap-legend-rows');
   if(legend.querySelectorAll('canvas').length!==15)throw Error('Missing graphical map key entries');
   return ['ten landmark sprites in ASCII mode','hidden wreck and out-of-range ship concealed',
    'visible ship and radio contact rendered','whole-galaxy minimap landmark, fog, and player contrast'];
  });
  for(const [width,height] of [[1400,720],[800,600]]){
   await page.setViewportSize({width,height});
   await page.waitForFunction(()=>{
    const {left,top,right,bottom}=document.getElementById('minimap-overlay-body').getBoundingClientRect();
    const map=document.getElementById('galaxy-minimap-large');
    const bounds=map.getBoundingClientRect();
    return left>=0&&top>=0&&right<=innerWidth&&bottom<=innerHeight &&
     map.width===Math.round(bounds.width*devicePixelRatio) &&
     map.height===Math.round(bounds.height*devicePixelRatio);
   });
   if(width===1400)await page.locator('#minimap-overlay').screenshot({path:artifactPath('Full-galaxy-map.png')});
  }
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#minimap-overlay').isVisible(),false);
  const backgrounds=await page.evaluate(()=>{
   G.crew[0].skills.nav=2;
   return [false,true].map(ascii=>{
    OPTIONS.asciiMode=ascii;
    drawCanvas();
    const {camX,camY}=canvasMapView;
    const {a,d}=ctx.getTransform();
    return [16,24].map(mx=>{
     const x=Math.ceil((mx-camX)*TS*a), y=Math.ceil((32-camY)*TS*d);
     const data=ctx.getImageData(x,y,Math.floor(4*TS*a)-1,Math.floor(4*TS*d)-1).data;
     const colors=new Set();
     for(let i=0;i<data.length;i+=4)colors.add(data.slice(i,i+4).join(','));
     return [...colors];
    });
   });
  });
  assert.deepEqual(backgrounds,Array.from({length:2},()=>[['20,20,30,255'],['4,4,12,255']]),
   'fog and empty space have no tile seams at fractional scaling in either render mode');
  await page.evaluate(()=>{OPTIONS.asciiMode=false;drawCanvas();});
  await page.locator('#galaxy-minimap-panel').screenshot({path:artifactPath('Galaxy-minimap-small-window.png')});
  for(const [width,height] of [[2560,1440],[1400,720],[800,600]]){
   await page.setViewportSize({width,height});
   await page.waitForFunction(width=>Math.abs(document.getElementById('root').getBoundingClientRect().width-width)<1,width);
   assert.ok(await page.evaluate(()=>{
    const rect=id=>document.getElementById(id).getBoundingClientRect();
    const compass=rect('compass-grid'), panel=rect('galaxy-minimap-panel');
    const mini=rect('galaxy-minimap'), button=rect('minimap-max-btn');
    return compass.right<panel.left && panel.right<button.left &&
     mini.left>panel.left && mini.right<panel.right && mini.top>panel.top && mini.bottom<panel.bottom &&
     Math.abs(compass.top-panel.top)<0.1 && Math.abs(panel.top-button.top)<0.1;
   }), 'the small map fits between the compass and map button at every viewport scale');
  }
  const terrain=await page.evaluate(()=>{
   const flat=document.createElement('canvas');
   flat.width=flat.height=TS;
   const paint=flat.getContext('2d');
   paint.fillStyle='#99bbdd';
   paint.fillRect(0,0,TS,TS);
   const counts=[];
   for(const biome of ['FROZEN','DESERT']){
    const floor=BIOMES[biome].floor, sprite=TILE[floor].sprite;
    const realSprite=IMG[sprite], realAscii=ASCII[sprite];
    IMG[sprite]=flat;
    ASCII[sprite]={...realAscii,ch:' '};
    const grid=Array.from({length:VIEW_H},()=>Array.from({length:VIEW_W},()=>({type:floor})));
    const visible=Array(VIEW_W*VIEW_H).fill(true), lit=visible.map(()=>false);
    G.curPlanet=G.scanViewKey='qa:terrain';
    G.planets[G.curPlanet]={grid,width:VIEW_W,height:VIEW_H,biome,spawnX:18,spawnY:14,
     planetTurn:2*(BIOMES[biome].dayLength||20),visited:visible,scanMask:visible,lit};
    G.player={x:18,y:14};
    G.scanCursorX=18;G.scanCursorY=14;
    for(const mode of ['planet','scanview']) for(const ascii of [false,true]){
     G.mode=mode;
     OPTIONS.asciiMode=ascii;
     for(const revealed of [false,true]){
      visible.fill(revealed);
      drawCanvas();
      const {a,d}=ctx.getTransform();
      const pixels=ctx.getImageData(1,Math.ceil(2*TS*d),Math.floor(7*TS*a)-2,Math.floor(7*TS*d)-2).data;
      const colors=new Set();
      for(let i=0;i<pixels.length;i+=4){
       if(pixels[i+3]!==255) throw Error(biome+' '+mode+' has a transparent pixel between opaque tiles');
       colors.add(pixels.slice(i,i+3).join(','));
      }
      counts.push(colors.size);
     }
    }
    IMG[sprite]=realSprite;
    ASCII[sprite]=realAscii;
   }
   return counts;
  });
  assert.deepEqual(terrain,Array(16).fill(1),'walking and scanning share seamless fog and floors in both render modes');
  await page.setViewportSize({width:1400,height:720});
  await page.waitForFunction(()=>{
   const mini=document.getElementById('galaxy-minimap');
   return mini.getBoundingClientRect().width===mini.width && canvas.width===canvasWidth;
  });
  assert.ok(await page.evaluate(()=>{
   G.mode='planet';
   OPTIONS.asciiMode=false;
   const data=G.planets[G.curPlanet];
   return ['FROZEN','DESERT'].every(biome=>{
    data.biome=biome;
    for(const row of data.grid) for(const cell of row) cell.type=BIOMES[biome].floor;
    drawCanvas();
    const first=ctx.getImageData(0,2*TS,TS,TS).data, second=ctx.getImageData(TS,2*TS,TS,TS).data;
    return first.some((channel,i)=>channel!==second[i]);
   });
  }), 'adjacent snow and sand tiles sample different grain from the original textures');
  await page.locator('#galaxy-minimap-panel').screenshot({path:artifactPath('Galaxy-minimap.png')});
  report.checks.push(...chart,'full map fits native and scaled windows','seamless galaxy backgrounds at fractional scaling',
   'small map fits between compass and button','seamless walking and scan terrain','world-anchored snow and sand grain');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({...report,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
