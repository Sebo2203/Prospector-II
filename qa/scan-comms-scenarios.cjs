const assert=require('node:assert/strict');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
const {canvasText}=require('./systems-menu-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());await page.goto(gameUrl);
  await page.evaluate(()=>{window.scanRng=2203;window.scanRandom=()=>{scanRng=(Math.imul(scanRng,1664525)+1013904223)>>>0;return scanRng/4294967296;};Math.random=scanRandom;initGame('LIGHT_SCOUT','Scan QA','Scan QA');});
  await page.waitForFunction(()=>G?.galaxy && G.log.some(e=>e.msg.includes('Ready for departure')));
  const cases=[
   {biome:'DESERT',hint:false},
   {biome:'VOLCANIC',partial:true,hint:false},
   {biome:'HABITABLE',civilization:true,hint:true},
   ...['BLOOM','TALKING_TREES','RINGWORLD','DESTROYED_RINGWORLD','NUCLEAR_WAR','ANCIENT'].map(biome=>({biome,hint:true})),
   {biome:'HABITABLE',civilization:true,moon:true,hint:true},
   {biome:'GAS_GIANT',hint:false},
   {biome:'GAS_GIANT',specialMoon:true,hint:true},
   {biome:'ANCIENT',failed:true,hint:false},
  ];
  for(const config of cases){
   const result=await page.evaluate(config=>{
    G.mode='system';G.curSystem=G.ship.x+','+G.ship.y;G.selPlanet=0;G.selMoon=config.moon?0:-1;
    G.crew.forEach(c=>{c.skills.nav=config.failed?0:c.role==='scout'?3:1;c._skillXp={};});
    const desc={name:'Survey Subject',biome:config.biome,scanState:'none',avgTemp:17,gravity:'8.1',atmosphere:'Survey atmosphere',radius:0.7,moons:[]};
    if(config.specialMoon)desc.moons=[{name:'Hidden Station Name',biome:'ANCIENT_STATION',isAncientStation:true}];
    const parent=config.moon?{name:'Parent',biome:'GAS_GIANT',scanState:'full',moons:[desc]}:desc;
    G.galaxy[G.ship.y][G.ship.x]={type:'SYSTEM',name:'Survey System',starType:'YELLOW',planets:[parent]};
    const body=getSelectedSystemBody();delete G.planets[body.pKey];delete G.enemies[body.pKey];Math.random=scanRandom;
    if(config.biome!=='GAS_GIANT'){
     const p=getOrCreateScanPlanetData(body.pKey,config.biome,desc.scanState);
     if(config.civilization)p.civilization={tierLabel:'Industrial',species:'Hidden Species Name',aggression:'Hostile'};
     else delete p.civilization;
     if(['DESERT','VOLCANIC'].includes(config.biome))for(const row of p.grid)for(const cell of row)
      if(cell.type.startsWith('ANCIENT')||cell.type.startsWith('ancient_'))cell.type=BIOMES[config.biome].floor;
    }
    G.fuel=G.maxFuel;G.log=[];const before={turn:G.turn,fuel:G.fuel,log:G.log.length};let first=true;
    Math.random=()=>{if(first){first=false;return config.failed?0.99:config.partial?0.7:0;}return scanRandom();};
    doScan();renderAll();
    const messages=G.log.slice(0,G.log.length-before.log).map(e=>e.msg);
    return {messages,turn:G.turn-before.turn,fuel:G.fuel-before.fuel,state:desc.scanState,
     readings:bodyScanReadings(desc,G.planets[body.pKey])};
   },config);
   assert.equal(result.turn,1);assert.equal(result.fuel,-1);
   const hints=result.messages.filter(msg=>msg.startsWith('Scan:'));
   assert.equal(hints.length,config.hint?1:0,JSON.stringify(config));
   assert.ok(result.messages.every(msg=>!/(Avg Temp|Gravity|Atmosphere|Radius|Oxygen|Minerals|Lifeforms|Biodata|Hazards|Terrain coverage):/.test(msg)));
   assert.ok(result.messages.every(msg=>!/Hidden|Industrial|Hostile|Civilization detected|Ringworld|Bloom|Nuclear|Whispering|Station Name/i.test(msg)));
   if(config.failed){assert.ok(['none','failed'].includes(result.state));assert.ok(result.messages.some(msg=>msg.startsWith('Scan failed.')));}
   else {
    assert.ok(['partial','full'].includes(result.state));
    if(!config.hint)assert.deepEqual(result.messages,[],'ordinary successful scans are silent');
    const text=await canvasText(page);for(const [,value] of result.readings)assert.ok(text.includes(value),'orbital detail retained: '+value);
    if(config.civilization && !config.moon)await page.screenshot({path:artifactPath('Scan-comms-civilization.png')});
    if(config.biome==='BLOOM')await page.screenshot({path:artifactPath('Scan-comms-special-world.png')});
   }
  }
  // The selected moon's coverage is independent of its fully scanned parent.
  await page.evaluate(()=>{
   const body=getSelectedSystemBody(),pdata=G.planets[body.pKey];
   const moon={...body.targetDesc,scanState:'partial'};
   G.galaxy[G.ship.y][G.ship.x].planets=[{name:'Scanned Parent',biome:'GAS_GIANT',scanState:'full',moons:[moon]}];
   G.selPlanet=0;G.selMoon=0;G.planets[G.curSystem+':0:m0']=pdata;
   pdata.scanMask=Array.from({length:100},(_,i)=>i<37);renderAll();
  });
  assert.ok((await canvasText(page)).includes('Terrain scanned: 37%'));
  const viewBefore=await page.evaluate(()=>JSON.stringify([G.turn,G.fuel,G.log]));
  await canvasText(page);
  assert.equal(await page.evaluate(()=>JSON.stringify([G.turn,G.fuel,G.log])),viewBefore);
  await page.evaluate(()=>{G.planets[getSelectedSystemBody().pKey].scanMask=Array.from({length:1000},(_,i)=>i<999);renderAll();});
  assert.ok((await canvasText(page)).includes('Terrain scanned: 99%'),'partial data must not round up to complete');
  await page.screenshot({path:artifactPath('Orbital-terrain-progress.png')});
  await page.evaluate(()=>{const body=getSelectedSystemBody();body.targetDesc.scanState='full';G.planets[body.pKey].scanMask.fill(true);renderAll();});
  assert.ok((await canvasText(page)).includes('Terrain scanned: 100%'));
  await page.evaluate(()=>{G.selMoon=-1;renderAll();});
  assert.ok(!(await canvasText(page)).includes('Terrain scanned:'),'gas giants have no terrain percentage');
  await page.evaluate(()=>{G.selMoon=0;renderAll();});
  // Reading a complete body remains free and does not replay its anomaly hint.
  assert.ok(await page.evaluate(()=>{
   const body=getSelectedSystemBody();body.targetDesc.scanState='full';const before=[G.turn,G.fuel];doScan();
   return G.turn===before[0] && G.fuel===before[1] && G.log[0].msg.includes('already fully scanned');
  }));
  assert.deepEqual(errors,[]);console.log('PASS: restrained comms, retained orbital details/costs, selected-moon terrain progress at 37/99/100 percent, read-only rendering, no gas-giant terrain percentage, failure warnings and free completed scans.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
