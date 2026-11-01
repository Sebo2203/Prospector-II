const {gameUrl,artifactPath}=require('./runtime.cjs');
const {chromium}=require('./runtime.cjs'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true}),page=await browser.newPage();await page.route(/^https?:/,r=>r.abort());
 await page.goto(gameUrl);await page.evaluate(()=>initGame('LIGHT_SCOUT','Review','Review'));await page.waitForFunction(()=>G?.galaxy&&G.log.some(e=>e.msg.includes('Ready for departure')));
 const report=await page.evaluate(()=>{
  const keys=[];for(let y=1;y<MAP_H-1&&keys.length<40;y++)for(let x=1;x<MAP_W-1&&keys.length<40;x++)if(generateCivDescriptor(x+','+y+':0')?.species==='Aquatic')keys.push(x+','+y+':0');
  let state=21371;const random=Math.random;const rows=[];
  try{Math.random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
   for(const key of keys){generateHabitablePlanet(key);const surface=G.planets[key];generateUnderwaterMap(key+':uw',key);const underwater=G.planets[key+':uw'];rows.push({key,tier:surface.civilization?.tier,waterTiles:surface.grid.flat().filter(c=>c.type==='EARTH_WATER').length,seabedPassable:underwater.grid.flat().filter(c=>TILE[c.type]?.pass).length,locals:G.enemies[key+':uw'].filter(e=>e.civLocal).length});}
  }finally{Math.random=random;}
  return{method:'40 normal habitable generators selected for native aquatic civilization descriptors; seeded Math.random for repeatability; no palette terrain adapter',seed:21371,total:rows.length,dryAquaticWorlds:rows.filter(r=>r.waterTiles===0),withWater:rows.filter(r=>r.waterTiles>0).length};
 });fs.writeFileSync(artifactPath('foundation-worldgen-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
