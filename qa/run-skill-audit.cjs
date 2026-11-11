const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium,gameUrl,artifactPath,root}=require('./runtime.cjs');
const group=process.argv[2]||'ordinary';
if(!['ordinary','extended','focused'].includes(group))throw Error('Choose ordinary, extended or focused');
const hulls=[['scout','LIGHT_SCOUT','survey'],['freighter','BULK_FREIGHTER','trade'],['corvette','ATTACK_CORVETTE','rescue']];
const seeds=group==='ordinary'?[104729,130363,155921]:[104729,155921];
let profiles=hulls.flatMap(([id,ship,kind])=>seeds.map(seed=>({id:group+'-'+id+'-'+seed,ship,kind:group==='extended'?'survey':kind,seed,
 ...(group==='extended'?{retirementTarget:1000000}:{})})));
if(group==='focused')profiles=['science','social'].flatMap(training=>[104729,130363,155921].map(seed=>({id:group+'-'+training+'-'+seed,ship:'LIGHT_SCOUT',kind:'survey',seed,training,retirementTarget:1000000})));
if(process.argv[3])profiles=profiles.filter(p=>p.id.includes(process.argv[3]));
if(!profiles.length)throw Error('No profiles match the ID filter');
const limits={actions:group==='ordinary'?3000:12000,seconds:group==='ordinary'?60:120};
const pilot=fs.readFileSync(path.join(__dirname,'playthrough-pilot.js'),'utf8'),observer=fs.readFileSync(path.join(__dirname,'skill-audit-observer.js'),'utf8');
(async()=>{
 const browser=await chromium.launch({headless:true}),reports=[];
 try{
  const queue=[...profiles];
  async function worker(){for(let profile;profile=queue.shift();){
   const context=await browser.newContext({viewport:{width:1400,height:720}}),errors=[];
   try{
    await context.route(/^https?:/,r=>r.abort());const page=await context.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',msg=>{if(msg.type()==='error'&&msg.text().includes('Prospector input error'))errors.push(msg.text());});
    await page.addInitScript(seed=>{window.auditRandom=seed;Math.random=()=>{auditRandom=(Math.imul(auditRandom,1664525)+1013904223)>>>0;return auditRandom/4294967296;};},profile.seed);
    await page.goto(gameUrl);await page.waitForFunction(()=>MENU_STATE.screen==='main');
    await page.evaluate(p=>{window.auditRandom=p.seed;Math.random=()=>{auditRandom=(Math.imul(auditRandom,1664525)+1013904223)>>>0;return auditRandom/4294967296;};initGame(p.ship,'Skill Audit','Skill Audit');},profile);
    await page.waitForFunction(()=>G?.galaxy && G.log.some(e=>e.msg.includes('Ready for departure')));
    await page.addScriptTag({content:pilot});await page.evaluate(p=>installPlaythroughPilot(p),profile);
    await page.addScriptTag({content:observer});await page.evaluate(()=>installSkillAudit());
    console.log('START',profile.id);
    const start=Date.now(),deadline=start+limits.seconds*1000,samples=[];let previous=-1,stalls=0,reason='wall-clock bound',next=1000,lastProgress='',idleActions=0;
    while(Date.now()<deadline){
     const state=await page.evaluate(max=>{
      for(let i=0;i<24 && !G.dead && !G.retired && !PILOT.stop && PILOT.actions<max;i++)playthroughStep();
      return {actions:PILOT.actions,turn:G.turn,credits:G.credits,hull:G.ship.hp,fuel:G.fuel,dead:G.dead,retired:G.retired,stop:PILOT.stop,forced:!!G.forcedMove?.active,
       skills:G.crew.map(c=>({name:c.name,hp:c.hp,skills:{...c.skills},xp:{...c._skillXp}}))};
     },limits.actions);
     if(state.actions>=next){samples.push(state);console.log('PROGRESS',profile.id,JSON.stringify({actions:state.actions,turn:state.turn,levels:state.skills.map(c=>c.skills)}));next=state.actions+2000;}
     if(errors.length){reason='technical error';break;}
     if(state.dead||state.retired||state.stop||state.actions>=limits.actions){reason=state.dead?'death':state.retired?'retirement':state.stop||'action bound';break;}
     const progress=JSON.stringify([state.turn,state.skills]);
     idleActions=progress===lastProgress?idleActions+Math.max(0,state.actions-previous):0;lastProgress=progress;
     if(idleActions>=200){reason='controller repeated blocked/free actions';break;}
     stalls=state.actions===previous && !state.forced?stalls+1:0;if(stalls>=3){reason='controller stalled';break;}previous=state.actions;
     if(state.forced)await page.waitForTimeout(30);
    }
    const report=await page.evaluate(()=>({turn:G.turn,actions:PILOT.actions,mode:G.mode,credits:G.credits,earned:G.creditsEarned,dead:G.dead,retired:G.retired,deathCause:G.deathCause,
     visits:PILOT.visits,expeditions:PILOT.expeditions,scanned:G.planetsScanned,minutes:G.careerTime.minutes,audit:skillAuditSnapshot(),recentDecisions:PILOT.decisions.slice(-20),recentEvents:PILOT.events.slice(-15)}));
    Object.assign(report,{profile,limits,seconds:(Date.now()-start)/1000,reason,errors,samples});reports.push(report);
    fs.writeFileSync(artifactPath(profile.id+'-skills.json'),JSON.stringify(report,null,2));
    console.log('RESULT',profile.id,JSON.stringify({turn:report.turn,actions:report.actions,reason,credits:report.credits,skills:report.audit.crew.map(c=>({role:c.role,initial:c.initial,final:c.final,earned:c.earned,hp:c.hp})),errors}));
   }finally{await context.close();}
  }}
  await Promise.all([worker(),worker(),worker()]);
  const summary={version:JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,
   htmlSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'index.html'))).digest('hex'),pilotSha256:crypto.createHash('sha256').update(pilot).digest('hex'),group,
   method:'Fresh seeded native-action careers, debug off; no XP/resource/world grants, loss rerolls or resumes. Observer wraps XP grants without changing outcomes. Ordinary policy may retire; extended survey policy targets one million credits and is explicitly bounded. Focused policies deliberately repeat discovered pulsar observations or casino drinking contests; this is a grind/loophole test, not ordinary exploration. Three isolated contexts run concurrently.',reports};
  fs.writeFileSync(artifactPath(group+'-skill-audit.json'),JSON.stringify(summary,null,2));
  if(reports.some(r=>r.errors.length))process.exitCode=1;
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
