// Broad native-action measurements. Mortality and caps are outcomes, not assertions.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium,gameUrl,artifactPath,root}=require('./runtime.cjs');
const args=process.argv.slice(2),option=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
const smoke=args.includes('--smoke'),seeds=Number(option('--seeds',6)),cap=Number(option('--cap',90));
if(!Number.isInteger(seeds)||seeds<1||seeds>32||!Number.isInteger(cap)||cap<10||cap>200)throw Error('Use 1–32 seeds and a 10–200 action cap');
const hulls=['LIGHT_SCOUT','BULK_FREIGHTER','ATTACK_CORVETTE'],policies=['ranged','mixed'],environments=['space','nebula'];
const threats=['raider','skirmisher','sniper','missile','wraith','devourer'];
let primary=[],fleets=[],chains=[];
for(const hull of hulls)for(const trained of [false,true])for(const environment of environments)for(const policy of policies){
 for(const threat of threats)for(let seed=1;seed<=seeds;seed++)primary.push({family:'single',hull,trained,environment,policy,threat,seed});
 for(let seed=1;seed<=2;seed++)fleets.push({family:'fleet',fleet:true,hull,trained,environment,policy,threat:'fleet',seed});
 chains.push({family:'chain',hull,trained,environment,policy,seed:3});
}
const selected=spec=>[['--hull','hull'],['--threat','threat'],['--env','environment'],['--policy','policy'],['--family','family']]
 .every(([flag,key])=>option(flag,null)===null||spec[key]===option(flag,null));
primary=primary.filter(selected);fleets=fleets.filter(selected);chains=chains.filter(selected);
if(smoke){primary=primary.slice(0,12);fleets=fleets.slice(0,2);chains=chains.slice(0,2);}
const output=artifactPath('combat-integration'+(smoke?'-smoke':'')+'.json');
const report={version:JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,
 buildHash:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'index.html'))).digest('hex'),
 controller:'combat-integration-policy.js v1',setupSeed:111126,options:{seeds,cap,smoke,args},
 method:'Fixture-assisted native-action combat. Three player hulls; starting CBT1/NAV3 versus trained CBT6/NAV6; four authored ship threats and two natural-entity profiles; seeded space/nebula layouts; ranged and selective-ram policies. Fixed legal fitting grants, no economic acquisition, no healing/resupply. Natural opponents also have controlled space counterparts. Decisions read visible contacts/charted terrain, never pending lightning. Presentation suppressed; all rules/turns/RNG/damage/XP native. Deaths and bounds retained. Chains carry state through paid travel. Resume pairs replay from identical seeds, without resetting RNG on load.',
 planned:{single:primary.length,fleet:fleets.length,chains:chains.length},results:[],capFollowups:[],chains:[],resumePairs:[],errors:[]};
function write(){fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
function counts(rows){return rows.reduce((out,r)=>(out[r.outcome]=(out[r.outcome]||0)+1,out),{});}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  page.on('console',m=>{if(m.text().startsWith('Prospector input error:'))report.errors.push(m.text());});
  await page.route(/^https?:/,r=>r.abort());await page.goto(gameUrl);
  await page.evaluate(()=>{
   let state=111126;Math.random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
   initGame('ATTACK_CORVETTE','Integration Audit','Integration Audit');
  });
  await page.waitForFunction(()=>G?.galaxy&&G.log.some(e=>e.msg.includes('Ready for departure')));
  await page.addScriptTag({path:path.join(__dirname,'ship-combat-fixture.js')});
  await page.addScriptTag({path:path.join(__dirname,'combat-integration-policy.js')});
  const started=Date.now();write();
  for(const [family,specs]of [['single',primary],['fleet',fleets]]){
   for(let offset=0;offset<specs.length;offset+=12){
    const batch=specs.slice(offset,offset+12);
    try{report.results.push(...await page.evaluate(({batch,cap})=>COMBAT_AUDIT.batch(batch,cap),{batch,cap}));}
    catch(error){report.errors.push({family,batch,error:error.stack});write();throw error;}
    report.elapsedSeconds=Math.round((Date.now()-started)/1000);write();
    console.log(JSON.stringify({family,completed:Math.min(offset+12,specs.length),total:specs.length,seconds:report.elapsedSeconds,
     outcomes:counts(report.results),crashes:report.results.reduce((n,r)=>n+r.metrics.asteroidCrashes,0)}));
   }
  }
  // Recreate capped cases from their original seed with a larger bound; keep them separate from the matrix.
  if(cap<200){
   const bounded=report.results.filter(r=>r.outcome==='cap').map(({family,hull,trained,environment,policy,threat,seed,fleet})=>
    ({family,hull,trained,environment,policy,threat,seed,fleet}));
   for(let offset=0;offset<bounded.length;offset+=4){
    report.capFollowups.push(...await page.evaluate(specs=>COMBAT_AUDIT.batch(specs,200,true),bounded.slice(offset,offset+4)));write();
   }
  }
  for(const spec of chains){report.chains.push(await page.evaluate(spec=>COMBAT_AUDIT.gauntlet(spec),spec));write();}
  // Balanced held-out checks across hull/crew/env/policy using seed 3 and a tougher sniper.
  const pairs=chains.map(spec=>({...spec,family:'resume',threat:'sniper'}));
  for(let offset=0;offset<pairs.length;offset+=4){
   report.resumePairs.push(...await page.evaluate(specs=>COMBAT_AUDIT.resumePairs(specs),pairs.slice(offset,offset+4)));write();
  }
  const groups=(key)=>[...new Set(report.results.map(r=>r[key]))].map(value=>{
   const rows=report.results.filter(r=>r[key]===value);
   return {value,fights:rows.length,outcomes:counts(rows),meanTurns:Math.round(rows.reduce((n,r)=>n+r.turns,0)/rows.length*10)/10,
    crewLossFights:rows.filter(r=>r.crewLost>0).length,
    events:rows.reduce((out,r)=>{for(const [key,value]of Object.entries(r.metrics))out[key]=(out[key]||0)+value;return out;},{})};
  });
  report.summary={all:counts(report.results),byHull:groups('hull'),byCrew:groups('trained'),byEnvironment:groups('environment'),
   byPolicy:groups('policy'),byThreat:groups('threat'),byLayout:groups('layout'),byFamily:groups('family'),
   capFollowups:counts(report.capFollowups),chainsCompleted:report.chains.filter(c=>c.completed).length,chains:report.chains.length,
   resumeCompared:report.resumePairs.length,resumeActuallyReloaded:report.resumePairs.filter(p=>p.reloaded).length,
   resumeMismatches:report.resumePairs.filter(p=>!p.identical),caps:report.results.filter(r=>r.outcome==='cap').map(r=>({hull:r.hull,trained:r.trained,
    environment:r.environment,policy:r.policy,threat:r.threat,seed:r.seed,final:r.final,trace:r.trace}))};
  report.elapsedSeconds=Math.round((Date.now()-started)/1000);write();
  assert.deepEqual(report.errors,[]);assert.equal(report.results.length,primary.length+fleets.length);
  assert.ok(report.results.every(r=>r.actions>0&&r.turns>0));assert.deepEqual(report.summary.resumeMismatches,[],'save/load must preserve deterministic combat continuation');
  console.log(JSON.stringify({version:report.version,fights:report.results.length,outcomes:report.summary.all,
   chains:report.chains.length,chainsCompleted:report.summary.chainsCompleted,resumeCompared:report.resumePairs.length,
   resumed:report.summary.resumeActuallyReloaded,seconds:report.elapsedSeconds,report:output}));
 }catch(error){if(!report.errors.length)report.errors.push(error.stack);write();throw error;}
 finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
