const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
const {canvasText}=require('./systems-menu-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.text().startsWith('Prospector input error:'))errors.push(message.text());});
  await page.route(/^https?:/,route=>route.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('ATTACK_CORVETTE','Nebula QA','Nebula QA'));
  await page.waitForFunction(()=>G?.galaxy&&G.log.some(entry=>entry.msg.includes('Ready for departure')));
  // Optional read-only import for reproducing a report. No personal save is bundled or rewritten.
  if(process.env.PROSPECTOR_QA_SAVE){
   const raw=fs.readFileSync(process.env.PROSPECTOR_QA_SAVE,'utf8');
   await page.evaluate(raw=>{installSaveSnapshot(parseSaveSnapshot(raw));restoreGameUI();renderAll();},raw);
  }
  const original=await page.evaluate(()=>({hull:G.ship.hp,max:G.ship.maxHp,shield:G.ship.shieldCharge,capacity:shipShieldCapacity()}));
  await page.keyboard.press('Shift+B');
  await page.getByRole('checkbox',{name:'Infinite fuel',exact:true}).check();
  assert.equal(await page.getByRole('checkbox',{name:'Infinite hull',exact:true}).isChecked(),false);
  await page.keyboard.press('Shift+B');
  await page.evaluate(()=>{
   G.mode='galaxy';G.shipCombat=null;G.stranded=null;G.dialogue=null;G.ship.x=10;G.ship.y=10;
   G.pirates=[];G.pirateBases=[];G.neutralShips=[];G.gasEntities=[];G.npcStranded=[];G.pulsars=[];G.blackHoles=[];G._pirateRoamerTarget=0;
   G.nextCrewGalaxyTalkTurn=G.turn+1000;G.nextCrewTalkTurn=G.turn+1000;
   for(let y=9;y<=11;y++)for(let x=9;x<=11;x++)G.galaxy[y][x]={type:'NEBULA',nebulaVariant:'blue'};
   for(const core of Object.values(G.ship.systems)){core.condition=100;core.bypassUntil=0;}
   G.crew.forEach(crew=>{crew.skills.nav=crew.role==='scout'?3:1;crew.skills.eng=0;});
   G.ship.hp=G.ship.maxHp;G.shipStats.shields=1;G.ship.systems.shields.condition=100;G.ship.shieldCharge=20;Math.random=()=>0.2;
   window.nebulaState=()=>({hull:G.ship.hp,shield:G.ship.shieldCharge,fuel:G.fuel,turn:G.turn,
    message:G.log.find(entry=>entry.msg.startsWith('Charged nebula gas'))?.msg});
   renderAll();
  });
  const before=await page.evaluate(()=>window.nebulaState());
  await page.keyboard.press('ArrowRight');
  let state=await page.evaluate(()=>window.nebulaState());
  assert.deepEqual([state.hull,state.shield,state.fuel,state.turn],[before.hull,16,before.fuel,before.turn+1]);
  assert.match(state.message,/4 damage \(4 shield, 0 hull\)/);
  for(let i=0;i<4;i++)await page.keyboard.press('Space');
  assert.equal(await page.evaluate(()=>G.ship.shieldCharge),20,'separated small hits can recharge without hull loss');
  await page.evaluate(()=>{G.ship.shieldCharge=0;});
  await page.keyboard.press('ArrowLeft');
  state=await page.evaluate(()=>window.nebulaState());
  assert.equal(state.hull,before.hull-4);assert.equal(state.fuel,before.fuel);
  assert.match(state.message,/4 damage \(0 shield, 4 hull\)/);
  assert.equal(await page.locator('#g-hull').textContent(),String(state.hull));
  await page.evaluate(()=>{G.ship.shieldCharge=1;});await page.keyboard.press('ArrowRight');
  state=await page.evaluate(()=>window.nebulaState());
  assert.equal(state.hull,before.hull-7);assert.match(state.message,/1 shield, 3 hull/);
  await page.evaluate(()=>{G.ship.systems.shields.condition=0;G.ship.shieldCharge=0;});
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.evaluate(()=>G.ship.hp),before.hull-11,'infinite fuel does not protect an unshielded hull');
  await page.screenshot({path:artifactPath('Nebula-damage-report.png')});
  // The independent hull switch suppresses hull damage, and the log must say so explicitly.
  await page.keyboard.press('Shift+B');
  await page.getByRole('checkbox',{name:'Infinite hull',exact:true}).check();
  await page.keyboard.press('Shift+B');await page.keyboard.press('ArrowRight');
  state=await page.evaluate(()=>window.nebulaState());
  assert.equal(state.hull,before.hull-11);assert.match(state.message,/0 hull — debug hull protection/);
  await page.keyboard.press('Shift+B');
  await page.getByRole('checkbox',{name:'Infinite hull',exact:true}).uncheck();
  await page.keyboard.press('Shift+B');await page.keyboard.press('ArrowLeft');
  assert.equal(await page.evaluate(()=>G.ship.hp),before.hull-15);
  // Fuel interference also reports actual loss rather than claiming damage debug mode prevented.
  await page.evaluate(()=>{Math.random=()=>0.05;});await page.keyboard.press('ArrowRight');
  assert.ok(await page.evaluate(()=>G.fuel>0&&G.log.some(entry=>entry.msg.includes('extra fuel loss prevented by debug'))));
  await page.keyboard.press('Shift+B');
  await page.getByRole('checkbox',{name:'Infinite fuel',exact:true}).uncheck();
  await page.keyboard.press('Shift+B');
  const fuel=await page.evaluate(()=>G.fuel);await page.keyboard.press('ArrowLeft');
  assert.equal(await page.evaluate(()=>G.fuel),fuel-2.3,'normal travel and nebula interference both spend fuel when protection is off');
  assert.ok(await page.evaluate(()=>G.log.some(entry=>entry.msg.includes('lost 1 extra fuel'))));
  assert.ok(await page.evaluate(async()=>await autoSave()&&await loadFromStorage()));
  // The same native approach/roll attracts a larger arc on a larger hull, independent of plating.
  const sizeChecks=[];
  for(const [hull,small,major] of [['LIGHT_SCOUT',3,20],['ATTACK_CORVETTE',4,31],['BULK_FREIGHTER',6,51]]){
   await page.evaluate(hull=>{
    window.prepareNebulaHull=(id,major)=>{
     G.shipStats=buildShipStats(id);G.ship.maxHp=G.shipStats.maxHp;G.ship.hp=G.ship.maxHp;
     G.ship.systems.shields.condition=0;G.ship.shieldCharge=0;G.maxFuel=G.shipStats.maxFuel;G.fuel=G.maxFuel;
     G.ship.x=10;G.ship.y=10;G.dead=false;G.mode='galaxy';G.stranded=null;
     for(const core of Object.values(G.ship.systems)){core.condition=100;core.bypassUntil=0;}G.ship.systems.shields.condition=0;
     DEBUG.infiniteFuel=true;DEBUG.infiniteHull=false;
     let draws=0;Math.random=major?()=>[0.2,0.01,0.999999][draws++]??0.99:()=>0.2;
    };
    window.prepareNebulaHull(hull,false);
   },hull);
   let hp=await page.evaluate(()=>G.ship.hp);await page.keyboard.press('ArrowRight');
   assert.equal(await page.evaluate(()=>G.ship.hp),hp-small,hull+' minor spark');
   await page.evaluate(hull=>window.prepareNebulaHull(hull,true),hull);
   hp=await page.evaluate(()=>G.ship.hp);await page.keyboard.press('ArrowRight');
   assert.equal(await page.evaluate(()=>G.ship.hp),hp-major,hull+' major arc');
   assert.ok((await page.evaluate(()=>window.nebulaState())).message.includes('Major discharge.'));
   sizeChecks.push({hull,small,major});
  }
  await page.evaluate(()=>{window.prepareNebulaHull('ATTACK_CORVETTE',true);G.shipStats.shields=1;G.ship.systems.shields.condition=100;G.ship.shieldCharge=20;});
  await page.keyboard.press('ArrowRight');
  assert.deepEqual(await page.evaluate(()=>[G.ship.hp,G.ship.shieldCharge]),[99,0]);
  assert.match((await page.evaluate(()=>window.nebulaState())).message,/31 damage \(20 shield, 11 hull\).*Major discharge/);
  await page.screenshot({path:artifactPath('Nebula-major-discharge.png')});
  await page.keyboard.press('i');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
  assert.match(await canvasText(page),/Nebula discharge.*×1\.5/);
  await page.screenshot({path:artifactPath('Ship-nebula-signature.png')});await page.keyboard.press('Escape');
  await page.evaluate(()=>{
   window.prepareNebulaHull('BULK_FREIGHTER',true);G.shipStats.maxHp=160;G.ship.maxHp=160;G.ship.hp=160;
  });
  await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>G.ship.hp),109,'plating upgrades do not attract a stronger arc');
  await page.evaluate(()=>{window.prepareNebulaHull('LIGHT_SCOUT',true);G.ship.hp=1;});
  await page.keyboard.press('ArrowRight');assert.ok(await page.evaluate(()=>G.dead&&G.ship.hp===0&&G.deathCause.includes('nebula')));
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({check:'PASS: shield absorption/recharge, actual hull/gauge loss, independent debug switches, truthful fuel/protection logs and save/load',
   imported:!!process.env.PROSPECTOR_QA_SAVE,original,shieldedHull:before.hull,unshieldedHull:before.hull-4,sizeChecks}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
