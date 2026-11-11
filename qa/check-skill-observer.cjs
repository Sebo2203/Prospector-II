const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true}),results=[];
 try{for(const observe of [false,true]){
  const context=await browser.newContext(),page=await context.newPage();
  try{
   await context.route(/^https?:/,r=>r.abort());
   // Stabilize wall-clock timestamps on saved visual flashes; gameplay uses career turns.
   await page.addInitScript(()=>{Date.now=()=>1800000000000;window.auditRandom=104729;Math.random=()=>{auditRandom=(Math.imul(auditRandom,1664525)+1013904223)>>>0;return auditRandom/4294967296;};});
   await page.goto(gameUrl);await page.waitForFunction(()=>MENU_STATE.screen==='main');
   await page.evaluate(()=>{window.auditRandom=104729;Math.random=()=>{auditRandom=(Math.imul(auditRandom,1664525)+1013904223)>>>0;return auditRandom/4294967296;};initGame('LIGHT_SCOUT','Observer QA','Observer QA');});
   await page.waitForFunction(()=>G?.galaxy && G.log.some(e=>e.msg.includes('Ready for departure')));
   await page.addScriptTag({content:fs.readFileSync(path.join(__dirname,'playthrough-pilot.js'),'utf8')});
   await page.evaluate(()=>installPlaythroughPilot({kind:'survey',retirementTarget:1000000}));
   if(observe){await page.addScriptTag({content:fs.readFileSync(path.join(__dirname,'skill-audit-observer.js'),'utf8')});await page.evaluate(()=>installSkillAudit());}
   await page.evaluate(()=>{while(PILOT.actions<300 && !PILOT.stop && !G.dead && !G.retired)playthroughStep();});
   results.push(await page.evaluate(()=>{
    const game=JSON.parse(serializeCareer(G));
    // Interpolated sprite positions/timestamps are wall-clock presentation, not rules.
    delete game.shipAnim;
    return {game:JSON.stringify(game),rng:auditRandom,actions:PILOT.actions,turn:G.turn};
   }));
  }finally{await context.close();}
 }}finally{await browser.close();}
 if(results[1].game!==results[0].game){
  const differences=[];
  function compare(a,b,p='G'){
   if(a===b)return;
   if(a && b && typeof a==='object' && typeof b==='object'){for(const key of new Set([...Object.keys(a),...Object.keys(b)]))compare(a[key],b[key],p+'.'+key);}
   else if(differences.length<12)differences.push({path:p,before:a,after:b});
  }
  compare(JSON.parse(results[0].game),JSON.parse(results[1].game));throw Error('Observer state differences: '+JSON.stringify(differences));
 }
 assert.equal(results[1].rng,results[0].rng);assert.equal(results[1].actions,results[0].actions);
 fs.writeFileSync(artifactPath('skill-observer-validation.json'),JSON.stringify({passed:true,actions:results[0].actions,turn:results[0].turn,excludedPresentationFields:['shipAnim'],fixedWallClock:true},null,2));
 console.log('PASS: XP observer leaves gameplay (excluding sprite interpolation), RNG state and pilot actions identical over '+results[0].actions+' native actions.');
})().catch(e=>{console.error(e);process.exitCode=1;});
