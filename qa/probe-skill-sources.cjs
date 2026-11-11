// Fixture-assisted source diagnostics. These are NOT unassisted careers.
const fs=require('node:fs');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true}),reports=[];
 try{for(const source of ['pulsar','drinking']){
  const context=await browser.newContext(),page=await context.newPage(),errors=[];
  try{
   await context.route(/^https?:/,r=>r.abort());page.on('pageerror',e=>errors.push(e.message));await page.goto(gameUrl);
   await page.waitForFunction(()=>MENU_STATE.screen==='main');
   await page.evaluate(()=>{window.probeRng=2203;Math.random=()=>{probeRng=(Math.imul(probeRng,1664525)+1013904223)>>>0;return probeRng/4294967296;};initGame('LIGHT_SCOUT','XP Probe','XP Probe');});
   await page.waitForFunction(()=>G?.galaxy && G.log.some(e=>e.msg.includes('Ready for departure')));
   const report=await page.evaluate(source=>{
    const start={turn:G.turn,credits:G.credits};let actions=0,contests=0;
    if(source==='pulsar'){
     G.mode='base';G.base.recruitSel=2;executeBaseAction('recruit_confirm');
     let found;for(let y=0;y<MAP_H;y++)for(let x=0;x<MAP_W;x++)if(G.galaxy[y][x].type==='PULSAR')found={x,y};
     if(!found)throw Error('Generated probe world has no pulsar');
     // Deliberate fixture: position at a real generated pulsar; no travel evidence claimed.
     G.ship.x=found.x;G.ship.y=found.y;G.mode='galaxy';
     const c=G.crew.find(c=>c.role==='scientist'),initial={...c.skills};
     while(c.skills.sci<8 && !G.dead && c.hp>0 && actions<2500){doInteract();actions++;}
     return {source,fixture:'Native 200-credit scientist recruitment, then positioned at generated pulsar; bypassed travel, not training rules',start,initial,final:c.skills,xp:c._skillXp,actions,turn:G.turn,credits:G.credits,fuel:G.fuel,hull:G.ship.hp,dead:G.dead,deathCause:G.deathCause};
    }
    // Deliberate fixture: enter the actual minimum-stake drinking screen directly.
    G.mode='casino';ensureCasinoState().screen='drink';G.casino.drinkSel=0;
    const c=G.crew.find(c=>c.role==='captain'),initial={...c.skills};
    while(c.skills.soc<8 && !G.dead && contests<2500){
     if(!G.casino.contest){if(G.credits<35)break;contests++;}
     handleCasinoKey('Enter');actions++;
    }
    return {source,fixture:'Positioned at minimum-stake casino screen; original 500 credits, no added money/XP or forced rolls',start,initial,final:c.skills,xp:c._skillXp,actions,contests,turn:G.turn,credits:G.credits,hp:c.hp,dead:G.dead};
   },source);
   report.errors=errors;reports.push(report);console.log(JSON.stringify(report));
  }finally{await context.close();}
 }}finally{await browser.close();}
 fs.writeFileSync(artifactPath('skill-source-probes.json'),JSON.stringify({method:'Fixture-assisted native source stress checks, NOT fresh-career survival/arrival evidence.',reports},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
