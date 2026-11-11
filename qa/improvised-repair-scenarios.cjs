const assert=require('node:assert/strict');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
const {canvasText,clickTarget,clickRepair,assertMenuFits}=require('./systems-menu-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('LIGHT_SCOUT','Repair QA','Repair QA'));
  await page.waitForFunction(()=>G?.galaxy && G.log.some(e=>e.msg.includes('Ready for departure')));
  const setup=(skill,roll)=>page.evaluate(({skill,roll})=>{
   closeShipSystems();G.mode='galaxy';G.shipCombat=null;G.pirates=[];G.neutralShips=[];G.gasEntities=[];
   G.ship.hp=G.ship.maxHp;G.fuel=G.maxFuel;G.ship.heat=0;
   for(const core of Object.values(G.ship.systems)){core.condition=100;core.bypassUntil=0;}
   if(!G.crew.some(c=>c.role==='engineer'))G.crew.push(randomCrewMember('engineer'));
   const engineer=G.crew.find(c=>c.role==='engineer');engineer.hp=engineer.maxHp;engineer.skills.eng=skill;engineer._skillXp={};
   const trader={name:'Repair Observer',type:'trader',x:G.ship.x,y:G.ship.y,hp:50,maxHp:50,guns:0,engineRating:1,alive:true};
   G.neutralShips=[trader];startShipCombat(trader,true);G.shipCombat.asteroids=[];
   G.ship.systems.sensors.condition=50;G.inventory=[];Math.random=()=>roll;openShipSystems();selectShipSystem('sensors');
   return [G.turn,G.shipCombat.round];
  },{skill,roll});
  // Mouse activation on a successful check, with no descriptive bypass hint.
  let before=await setup(3,0.1);
  let text=await canvasText(page);assert.ok(text.includes('Attempt improvised repair'));
  assert.ok(!/bypass|75%|Effective integrity/i.test(text));
  await clickRepair(page,'sensors','improvised');
  assert.deepEqual(await page.evaluate(()=>[G.turn,G.shipCombat.round,G.ship.systems.sensors.condition,G.ship.systems.sensors.bypassUntil-G.turn]),[before[0]+1,before[1]+1,50,14]);
  assert.ok((await canvasText(page)).includes('improvised repair 14 turns'));
  await page.keyboard.press('Escape');assert.ok(await page.evaluate(async()=>await autoSave()));
  assert.ok(await page.evaluate(async()=>await loadFromStorage()));
  assert.equal(await page.evaluate(()=>G.ship.systems.sensors.bypassUntil-G.turn),14);
  // Keyboard failure is a real action; skill 2 cannot worsen the core.
  before=await setup(2,0.99);await page.keyboard.press('Enter');
  assert.deepEqual(await page.evaluate(()=>[G.turn,G.shipCombat.round,G.ship.systems.sensors.condition,G.ship.systems.sensors.bypassUntil]),[before[0]+1,before[1]+1,50,0]);
  assert.ok(await page.evaluate(()=>G.log.some(e=>e.msg.includes('fails to improvise'))));
  // Very low skill can damage the core, rather than creating temporary support.
  before=await setup(0,0.99);await page.keyboard.press('Enter');
  assert.ok(await page.evaluate(()=>G.ship.systems.sensors.condition<50 && G.ship.systems.sensors.bypassUntil===0));
  assert.deepEqual(await page.evaluate(()=>[G.turn,G.shipCombat.round]),before.map(v=>v+1));
  // Fuel tank exposes only kit repair, including after keyboard navigation.
  await clickTarget(page,'Fuel tank');
  assert.deepEqual(await page.evaluate(()=>shipSystemsActions().map(a=>a.method)),['kit']);
  assert.ok(!(await canvasText(page)).includes('Attempt improvised repair'));
  await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>shipSystemsView.method),0);
  await setup(3,0.1);
  for(const viewport of [{width:1400,height:720},{width:1000,height:620}]){
   await page.setViewportSize(viewport);await assertMenuFits(page);
   await page.screenshot({path:artifactPath('Improvised-repair-'+viewport.width+'.png')});
  }
  assert.deepEqual(errors,[]);console.log('PASS: improvised repair success/failure/botch via mouse/keyboard, single combat response, save continuity, no hint and no fuel-tank action, scaled menus.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
