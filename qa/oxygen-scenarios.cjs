const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, gameUrl, artifactPath } = require('./runtime.cjs');

(async()=>{
  const browser = await chromium.launch({headless:true});
  try{
    const page = await browser.newPage({viewport:{width:1400,height:720}}), errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route(/^https?:/,route=>route.abort());
    await page.goto(gameUrl);
    await page.evaluate(()=>initGame('LIGHT_SCOUT','Oxygen QA','Oxygen QA'));
    await page.waitForFunction(()=>G?.galaxy && G.log.some(e=>e.msg.includes('Ready for departure')));
    const results = await page.evaluate(async()=>{
      Math.random=()=>0.5;
      DEBUG.infiniteOxy=false;
      const key='oxygen-ringworld';
      generateRingworld(key);
      const planet=G.planets[key];
      G.mode='planet';G.curPlanet=key;G.player={x:10,y:1};G.enemies[key]=[];
      G.underwater=false;G.oxygen=100;
      G.crew.forEach(c=>{c.statuses={};c.armorUsable='armor_flight';});
      applyCrewInjury(G.crew[0],'broken_foot',{silent:true});
      applyCrewInjury(G.crew[1],'broken_leg',{silent:true});
      for(let y=0;y<=2;y++)for(let x=9;x<=12;x++)planet.grid[y][x]={type:'rw_floor'};
      const recoveryCount=()=>G.log.filter(e=>e.msg==='Oxygen fully recovered.').reduce((sum,e)=>sum+(e.count||1),0);
      const walk=steps=>{
        const turn=G.turn,before=recoveryCount(),oxygen=[];
        for(let i=0;i<steps;i++){tryMove(i%2===0?1:-1,0);oxygen.push(G.oxygen);}
        return {turns:G.turn-turn,recoveries:recoveryCount()-before,oxygen};
      };
      const breathable=walk(12);
      G.oxygen=75;
      const recovery=walk(6);
      // A real export/import retains the injury, but must not revive the spam.
      const snapshot=parseSaveSnapshot(serializeCareer(G));
      installSaveSnapshot(snapshot);
      const imported=walk(4);
      G.planets[key].biome='DESTROYED_RINGWORLD';G.oxygen=100;
      const vacuum=walk(2);
      G.planets[key].biome='RINGWORLD';G.underwater=true;G.oxygen=100;
      G.crew.forEach(c=>{c.armorUsable='armor_diving';});
      for(let x=9;x<=12;x++)G.planets[key].grid[1][x]={type:'EARTH_WATER'};
      const submerged=walk(2),divers=G.crew.filter(c=>c.hp>0).length;
      DEBUG.infiniteOxy=true;G.oxygen=100;
      const debug=walk(2);
      return {version:GAME_VERSION,breathable,recovery,imported,vacuum,submerged,divers,debug};
    });
    fs.writeFileSync(artifactPath('oxygen-scenarios.json'),JSON.stringify(results,null,2)+'\n');
    assert.equal(results.breathable.turns,12,'each real move still spends one turn');
    assert.deepEqual(results.breathable.oxygen,Array(12).fill(100),'injured walkers breathe the ringworld air');
    assert.equal(results.breathable.recoveries,0,'full oxygen does not generate recovery spam');
    assert.deepEqual(results.recovery.oxygen,[83,91,99,100,100,100]);
    assert.equal(results.recovery.recoveries,1,'genuine recovery still announces completion once');
    assert.deepEqual(results.imported.oxygen,Array(4).fill(100),'current-format import preserves the fix');
    assert.equal(results.imported.recoveries,0);
    assert.ok(Math.abs(results.vacuum.oxygen[0]-96.6)<1e-8);
    assert.ok(Math.abs(results.vacuum.oxygen[1]-93.2)<1e-8,'hostile air retains drain plus two movement injuries');
    assert.equal(results.vacuum.recoveries,0);
    assert.ok(Math.abs(results.submerged.oxygen[1]-(100-2*(results.divers*2+0.4)))<1e-8,'submerged exertion still uses suit oxygen');
    assert.equal(results.submerged.recoveries,0);
    assert.deepEqual(results.debug.oxygen,[100,100],'infinite oxygen still applies');
    assert.deepEqual(errors,[]);
    console.log('PASS: injured ringworld movement, real recovery, current-format import, hostile-air/submerged exertion and infinite-oxygen protection.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
