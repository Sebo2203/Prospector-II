const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
const {canvasText,assertMenuFits}=require('./systems-menu-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.text().startsWith('Prospector input error:'))errors.push(message.text());});
  await page.route(/^https?:/,route=>route.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('ATTACK_CORVETTE','Bridge QA','Bridge QA'));
  await page.waitForFunction(()=>G?.galaxy&&G.log.some(entry=>entry.msg.includes('Ready for departure')));
  await page.addScriptTag({path:require('node:path').join(__dirname,'ship-combat-fixture.js')});
  // Actual hull impacts: shields/debug flags, fatal operators, fallback, morale and crew-only defeat.
  const casualty=await page.evaluate(()=>{
   const c=window.bridgeFixture({trained:true});G.ship.shieldCharge=20;
   const hp=G.crew.map(c=>c.hp);Math.random=()=>0.99;damageShipCombatPlayer(c,10,false,'Shield test');
   const shieldSafe=G.crew.every((crew,index)=>crew.hp===hp[index]);G.ship.shieldCharge=0;
   DEBUG.infiniteCrewHp=true;damageShipCombatPlayer(c,10,false,'Debug test');
   const crewSafe=G.crew.every((crew,index)=>crew.hp===hp[index]);DEBUG.infiniteCrewHp=false;
   G.crew[0].hp=1;const victim=G.crew[0],survivor=G.crew[1],beforeHull=G.ship.hp;
   let draws=[0.99,0,0,0,0.99];Math.random=()=>draws.shift()??0.99;
   damageShipCombatPlayer(c,20,false,'Actual Wingman');
   return {shieldSafe,crewSafe,victimDead:victim.hp===0,remaining:G.crew.length,gunnery:shipBridgeSkills().gunnery,
    grief:survivor.grief,hull:beforeHull-G.ship.hp,log:G.log.some(entry=>entry.msg.includes('has died')&&entry.msg.includes('Actual Wingman'))};
  });
  assert.deepEqual(casualty,{shieldSafe:true,crewSafe:true,victimDead:true,remaining:1,gunnery:1,grief:14,hull:20,log:true});
  assert.ok(await page.evaluate(async()=>await autoSave()));assert.ok(await page.evaluate(async()=>await loadFromStorage()));
  assert.equal(await page.evaluate(()=>G.crew.length),1);
  assert.equal(await page.evaluate(()=>G.crewDeaths),1);
  const terminal=await page.evaluate(()=>{
   const c=window.bridgeFixture();G.ship.shieldCharge=0;G.crew=G.crew.slice(0,1);G.crew[0].hp=1;
   let draws=[0.99,0,0,0];Math.random=()=>draws.shift()??0.99;
   damageShipCombatPlayer(c,12,false,'Actual Wingman');renderAll();
   return {dead:G.dead,hull:G.ship.hp,cause:G.deathCause,combat:G.shipCombat};
  });assert.equal(terminal.dead,true);assert.ok(terminal.hull>0);assert.match(terminal.cause,/All crew.*Actual Wingman/);assert.equal(terminal.combat,null);
  await page.screenshot({path:artifactPath('Bridge-crew-defeat.png')});
  assert.equal(await page.locator('#ctx-bar [data-game-key="f"]').count(),0);
  assert.ok(await page.evaluate(()=>{
   window.bridgeFixture();G.crew=G.crew.slice(0,1);G.crew[0].hp=1;
   applyCrewInjury(G.crew[0],'heavy_bleeding',{amount:2,source:'ship combat'});
   G.crew[0].statuses.heavy_bleeding.tick=2;Math.random=()=>0.99;
   advanceShipCombat();return G.dead&&G.ship.hp>0&&G.shipCombat===null&&G.deathCause.includes('wounds during ship combat');
  }),'delayed bleeding deaths retain a space-combat cause and end the encounter');
  // Risk-coupled training: committed firing/under-fire piloting, no XP for rejected shots or inspection.
  const training=await page.evaluate(()=>{
   const c=window.bridgeFixture();c.enemies[0].x=17;G.installedWeapons=['mass_driver'];Math.random=()=>0.99;
   const gunner=shipBridgeOperator('cbt'),pilot=shipBridgeOperator('nav');
   doShipFire();const first=gunner._skillXp.cbt||0;doShipFire();
   const refused=gunner._skillXp.cbt||0;shipBridgeSkills();shipBridgeSkills();
   return {first,refused,nav:pilot._skillXp.nav||0};
  });assert.deepEqual(training,{first:1,refused:1,nav:1});
  // Launch skill is frozen; impact uses the defender's current bridge crew rather than either engine grade.
  const guided=await page.evaluate(()=>{
   const c=window.bridgeFixture({trained:true,weapons:['artemis']});c.enemies[0].x=17;
   const npc=c.enemies[0].ship;npc.systems.engine.condition=0;npc.weaponReadyAt=[G.turn+100];G.ship.ammo.artemis=2;
   Math.random=()=>0.9;doShipFire();const launch=c.missiles[0].gunnery;
   G.crew.forEach(c=>c.skills.cbt=0);const saved=serializeCareer(G);installSaveSnapshot(parseSaveSnapshot(saved));
   advanceShipCombat();return {launch,hp:G.pirates[0].hp,pending:G.shipCombat?.missiles.length||0};
  });assert.equal(guided.launch,6);assert.ok(guided.hp<90);assert.equal(guided.pending,0);
  const invalid=await page.evaluate(()=>{
   const c=window.bridgeFixture({weapons:['artemis']});G.ship.ammo.artemis=2;Math.random=()=>0.99;doShipFire();
   const raw=JSON.parse(serializeCareer(G));let refused=0;
   for(const value of [-1,11,0.5,null]){const save=structuredClone(raw);save.shipCombat.missiles[0].gunnery=value;try{parseSaveSnapshot(JSON.stringify(save));}catch{refused++;}}
   for(const change of [ship=>ship.combatTactic='invented',ship=>ship.bridgeSkills.gunnery=11]){
    const save=structuredClone(raw);change(save.pirates[0]);try{parseSaveSnapshot(JSON.stringify(save));}catch{refused++;}
   }return refused;
  });assert.equal(invalid,6);
  assert.ok(await page.evaluate(()=>{
   const c=window.bridgeFixture();Math.random=()=>0.99;advanceShipCombat();
   const raw=JSON.parse(serializeCareer(G));let count=0;
   for(const value of [-1,0,1.5,G.turn+1,null]){const copy=structuredClone(raw);copy.shipCombat.enemies[0].lastManeuverAt=value;try{parseSaveSnapshot(JSON.stringify(copy));}catch{count++;}}
   return count===5;
  }),'maneuver cadence validates before loading');
  // Real AI actions distinguish charging, withdrawal, guided cover fire, fallback and flanking.
  const roles=await page.evaluate(()=>{
   const result={};
   for(const tactic of ['brawler','skirmisher','sniper','missile']){
    const c=window.bridgeFixture({tactic}),enemy=c.enemies[0];Math.random=()=>0.99;
    enemy.x=tactic==='brawler'?18:16;const before=shipCombatDistance(enemy,c.player);advanceShipCombat();advanceShipCombat();
    result[tactic]=[before,shipCombatDistance(enemy,c.player)];
   }
   let c=window.bridgeFixture({tactic:'missile'}),enemy=c.enemies[0];enemy.x=20;c.asteroids=[{x:17,y:8}];Math.random=()=>0.99;
   advanceShipCombat();result.coverLaunch=c.missiles.some(m=>m.target===-1);
   enemy.ship.ammo.artemis=0;enemy.ship.installedWeapons=['mass_driver'];result.fallback=shipCombatTactic(enemy);
   c=window.bridgeFixture({tactic:'sniper'});enemy=c.enemies[0];enemy.x=20;enemy.y=8;
   c.asteroids=Array.from({length:9},(_,i)=>({x:17,y:i+4}));
   const path=[];for(let i=0;i<14&&G.mode==='shipcombat';i++){advanceShipCombat();path.push([enemy.x,enemy.y]);}
   result.flanked=path.some(([x,y])=>x<17||y<4||y>12);result.path=path;
   c=window.bridgeFixture({hull:'LIGHT_SCOUT',tactic:'sniper'});enemy=c.enemies[0];enemy.x=18;Math.random=()=>0.99;
   for(let i=0;i<6&&G.mode==='shipcombat';i++)moveShipInCombat(1,0);
   result.returnFire=G.log.some(entry=>entry.msg.includes('Bridge sniper fires'));
   c=window.bridgeFixture({hull:'BULK_FREIGHTER',tactic:'sniper'});enemy=c.enemies[0];enemy.x=20;
   enemy.ship.heat=shipHeatCapacity(enemy.ship);const heat=enemy.ship.heat;
   for(let i=0;i<4;i++)advanceShipCombat();result.cooled=enemy.ship.heat<heat;
   return result;
  });
  assert.ok(roles.brawler[1]<roles.brawler[0]);assert.ok(roles.skirmisher[1]>roles.skirmisher[0]);
  assert.ok(roles.sniper[1]>roles.sniper[0]);assert.ok(roles.missile[1]>roles.missile[0]);
  assert.equal(roles.coverLaunch,true);assert.notEqual(roles.fallback,'missile');assert.equal(roles.flanked,true,JSON.stringify(roles.path));
  assert.equal(roles.returnFire,true);assert.equal(roles.cooled,true);
  await page.evaluate(()=>{const c=window.bridgeFixture({tactic:'sniper'});Math.random=()=>0.99;advanceShipCombat();});
  await assertMenuFits(page);await page.screenshot({path:artifactPath('Bridge-tactics.png')});
  assert.match(await canvasText(page),/Gunnery CBT.*Helm NAV.*Long-range fire/);
  // Isolated real four-role drill resets actors, injuries, flags and career state.
  await page.evaluate(()=>{window.bridgeFixture();Math.random=window.bridgeRandom;G.shipAnim=null;});
  const career=await page.evaluate(()=>serializeCareer(G));
  await page.evaluate(()=>{debugEnterPalette();debugPaletteVisit('galaxy:BRIDGE_DRILL');});
  assert.deepEqual(await page.evaluate(()=>G.shipCombat.enemies.map(shipCombatTactic)),['brawler','skirmisher','sniper','missile']);
  await page.evaluate(()=>{G.ship.shieldCharge=0;G.shipCombat.enemies[0].ship.hp=1;G.crew[0].hp=1;DEBUG.infiniteCrewHp=true;debugPaletteVisit('galaxy:BRIDGE_DRILL');});
  assert.ok(await page.evaluate(()=>!DEBUG.infiniteHull&&!DEBUG.infiniteCrewHp&&G.crew.every(c=>c.hp===c.maxHp)&&G.shipCombat.enemies.every(e=>e.ship.hp===90)));
  await page.screenshot({path:artifactPath('Bridge-debug-drill.png')});
  await page.evaluate(async()=>{await autoSave();await autosaveQueue.idle();});
  assert.equal(await page.evaluate(async()=>(await readStoredAutosave())?.record.raw),career);
  await page.evaluate(()=>debugReturnFromPalette());assert.equal(await page.evaluate(()=>serializeCareer(G)),career);
  fs.writeFileSync(artifactPath('Bridge-scenarios.json'),JSON.stringify({casualty,terminal,training,guided,roles,errors},null,2));
  assert.deepEqual(errors,[]);
  console.log('PASS: crew-based gunnery/evasion, shield/debug protection, wounded/dead operator fallback and grief, crew-only defeat, risky training, saved missile launch skill, validation, distinct real tactics/flanking and resettable isolated bridge drill.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
