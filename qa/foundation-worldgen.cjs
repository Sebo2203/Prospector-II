const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, gameUrl, artifactPath } = require('./runtime.cjs');

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage();
    await page.route(/^https?:/,route=>route.abort());
    await page.goto(gameUrl);
    await page.evaluate(()=>initGame('LIGHT_SCOUT','Generation Audit','Generation Audit'));
    await page.waitForFunction(()=>G?.galaxy && G.log.some(entry=>entry.msg.includes('Ready for departure')));
    const report=await page.evaluate(async()=>{
      const keys=[];
      for(let y=1;y<MAP_H-1 && keys.length<100;y++) for(let x=1;x<MAP_W-1 && keys.length<100;x++){
        const key=x+','+y+':0';
        if(generateCivDescriptor(key)?.species==='Aquatic') keys.push(key);
      }
      const seed=21371;
      let state=seed;
      const random=Math.random;
      const rows=[];
      try{
        Math.random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
        for(const key of keys){
          generateHabitablePlanet(key);
          const surface=G.planets[key], underKey=key+':uw';
          generateUnderwaterMap(underKey,key);
          const underwater=G.planets[underKey], locals=G.enemies[underKey].filter(enemy=>enemy.civLocal);
          const shore=[[surface.spawnX+1,surface.spawnY],[surface.spawnX-1,surface.spawnY]]
            .find(([x,y])=>aquaticHabitatContains(surface.aquaticHabitat,x,y) && surface.grid[y][x].type==='EARTH_WATER');
          const walk=shore ? [shore] : [], reached=new Set();
          for(let i=0;i<walk.length;i++){
            const [x,y]=walk[i], spot=x+','+y;
            if(reached.has(spot) || !TILE[underwater.grid[y]?.[x]?.type]?.pass) continue;
            reached.add(spot);
            for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
              if(dx || dy) walk.push([x+dx,y+dy]);
            }
          }
          rows.push({key,tier:surface.civilization.tier,locals:locals.length,shore:!!shore,
            reachable:locals.every(local=>reached.has(local.x+','+local.y))});
        }
      }finally{Math.random=random;}
      const [first]=keys, underKey=first+':uw';
      const underwater=G.planets[underKey];
      const civ=underwater.civilization;
      ensureCivilizationState(underwater).relation=4;
      if(!await autoSave() || !await loadFromStorage()) throw Error('Aquatic career did not reload');
      const shared=G.planets[first].civilization===G.planets[underKey].civilization &&
        G.planets[first].civilization.state.relation===civ.state.relation;
      const crew=G.crew[0];
      Object.assign(crew,{moraleBase:0,drinkGlow:0,drugRush:0,grief:0});
      const score=crewMoraleScore(crew);
      adjustCrewMoraleBase(3);
      const boost=crewMoraleScore(crew);
      adjustCrewMoraleBase(-5);
      return {seed,total:rows.length,tiers:[...new Set(rows.map(row=>row.tier))],
        failed:rows.filter(row=>!row.shore || !row.reachable || !row.locals),shared,
        morale:[score,boost,crewMoraleScore(crew)]};
    });
    assert.equal(report.total,100);
    assert.equal(report.tiers.length,5);
    assert.deepEqual(report.failed,[]);
    assert.equal(report.shared,true);
    assert.deepEqual(report.morale,[0,3,0]);
    fs.writeFileSync(artifactPath('foundation-worldgen-report.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report,null,2));
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
