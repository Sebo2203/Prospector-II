const assert = require('node:assert/strict');
const { chromium, gameUrl } = require('./runtime.cjs');

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route(/^https?:/,route=>route.abort());
    await page.goto(gameUrl);
    await page.evaluate(()=>initGame('LIGHT_SCOUT','Clock Audit','Clock Audit'));
    await page.waitForFunction(()=>G?.galaxy && G.log.some(entry=>entry.msg.includes('Ready for departure')));
    const surface=await page.evaluate(()=>{
      const key='turn-test';
      generatePlanet(key,'FROZEN');
      const planet=G.planets[key];
      G.mode='planet';G.curPlanet=key;G.player={x:10,y:10};G.enemies[key]=[];
      G.crew.forEach(c=>{c.armorUsable='armor_vac';});
      G.crew[0].weapon='Sniper Rifle';G.crew[0].weaponUsable='gun_sniper';
      applyCrewStatus(G.crew[0],'hangover',{duration:20,silent:true});
      G.oxygen=100;
      planet.planetTurn=5;
      planet.grid[10][10]={type:'ICE_FLOOR'};
      planet.grid[10][11]={type:'ICE_FLOOR'};
      const initial=G.turn;
      G.rangeTarget={x:10,y:10};
      doRangedFire();
      const invalid=G.turn-initial;
      G.rangeTarget={x:11,y:10};
      doRangedFire();
      const shot=[G.turn-initial,planet.planetTurn,G.oxygen,getCrewStatus(G.crew[0],'hangover').duration];
      doWaitPlanet();
      return {invalid,shot,wait:[G.turn-initial,planet.planetTurn,G.oxygen,getCrewStatus(G.crew[0],'hangover').duration]};
    });
    assert.deepEqual(surface,{invalid:0,shot:[1,6,98.5,19],wait:[2,7,97,18]});
    const orbit=await page.evaluate(()=>{
      const {x,y}=G.ship;
      G.galaxy[y][x]={type:'SYSTEM',name:'Clock Audit',planets:[{name:'Audit Giant',biome:'GAS_GIANT'}]};
      G.mode='system';G.curSystem=x+','+y;G.selPlanet=0;G.fuel=50;
      const initial=G.turn;
      Math.random=()=>0;
      doScan();doScan();
      return [G.turn-initial,G.fuel,getCrewStatus(G.crew[0],'hangover').duration];
    });
    assert.deepEqual(orbit,[1,49,17],'paid scan takes a turn and a fuel unit, revisiting a completed scan is free');
    const station=await page.evaluate(()=>{
      G.mode='casino';
      const initial=G.turn;
      casinoStartPoker();
      casinoFinishPoker();
      return [G.turn-initial,getCrewStatus(G.crew[0],'hangover').duration];
    });
    assert.deepEqual(station,[1,16],'one paid casino hand takes one turn');
    assert.deepEqual(errors,[]);
    console.log('PASS: surface shots and waits, scan costs, and a station casino hand share the career clock.');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
