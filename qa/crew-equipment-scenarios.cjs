const assert=require('node:assert/strict');
const {chromium,gameUrl}=require('./runtime.cjs');
const {clickTarget}=require('./systems-menu-helpers.cjs');

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.text().startsWith('Prospector input error:'))errors.push(m.text());});
  await page.route(/^https?:/,r=>r.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('LIGHT_SCOUT','Equipment QA','Equipment QA'));
  await page.waitForFunction(()=>G?.galaxy&&G.log.some(e=>e.msg.includes('Ready for departure')));
  const turn=await page.evaluate(()=>{
   G.inventory=[];
   applyPawnItem(CORP_ITEM_POOLS.margo.find(i=>i.usable==='gun_breacher'));
   G.crew.forEach(c=>{c.weapon='Bare hands';c.weaponUsable=null;});
   G.crew[0].weapon='Service Pistol';G.crew[0].weaponUsable='gun';
   G._viewInvSel=0;return G.turn;
  });
  await page.waitForFunction(()=>!canvasMenuBlocked());
  await page.keyboard.press('i');
  assert.equal(await page.evaluate(()=>G.mode),'inventory');
  assert.equal(await page.evaluate(()=>inventoryEquipType(G.inventory[0])),'weapon','purchased Assault Carbine is recognized as equipment');
  assert.ok(await page.evaluate(()=>canvasMenuTargets.some(t=>t.label==='Select crew [Enter]')));
  // Keyboard selection and cancel are free and retain the item.
  await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>G._equipGunIdx),0);
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>G.inventory[0].usable),'gun_breacher');
  await page.keyboard.press('i');
  // The primary canvas control suppresses the duplicate context control.
  await clickTarget(page,'Select crew [Enter]');await clickTarget(page,'Confirm [Enter]');
  assert.deepEqual(await page.evaluate(()=>[G.crew[0].weapon,G.crew[0].weaponUsable,G.inventory.map(i=>i.usable)]),['Assault Carbine','gun_breacher',['gun']]);
  await page.keyboard.press('w');
  assert.equal(await page.evaluate(()=>G.inventory.filter(i=>i.usable==='gun_breacher').length),1,'unequip returns exactly one carbine');
  await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowDown');
  assert.equal(await page.evaluate(()=>G.inventory[G._viewInvSel].usable),'gun_breacher');
  // Exercise the context fallback by removing only transient canvas hit areas.
  await page.evaluate(()=>{canvasMenuTargets.length=0;renderContextBar();});
  await page.locator('#ctx-bar button').filter({hasText:'Equip to crew'}).click();
  await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>G.crew[1].weaponUsable),'gun_breacher');
  assert.equal(await page.evaluate(()=>G.turn),turn,'equipping/cancel/unequip spend no gameplay turns');
  await page.keyboard.press('Escape');
  assert.ok(await page.evaluate(async()=>await autoSave()));assert.ok(await page.evaluate(async()=>await loadFromStorage()));
  assert.deepEqual(await page.evaluate(()=>[G.crew[1].weapon,G.crew[1].weaponUsable]),['Assault Carbine','gun_breacher']);
  assert.deepEqual(await page.evaluate(()=>Object.keys(GROUND_WEAPONS).filter(usable=>inventoryEquipType({usable})!=='weapon')),[],'every catalog weapon can be equipped');
  const shot=await page.evaluate(()=>{
   const key='qa:carbine-fire';generatePlanet(key,'HABITABLE');
   G.mode='planet';G.curPlanet=key;G.player={x:10,y:10};G.oxygen=100;
   for(let x=10;x<=14;x++)G.planets[key].grid[10][x]={type:'EARTH_FLOOR'};
   const target={name:'Carbine target',x:11,y:10,hp:50,maxHp:50,alive:true,stunTurns:50};G.enemies[key]=[target];
   const shooter=G.crew[1],turn=G.turn;G.rangeTarget={x:11,y:10};
   const random=Math.random;Math.random=()=>0.5;
   try{doRangedFire();}finally{Math.random=random;}
   return {damage:50-target.hp,expected:shooter.atk+4+1,turns:G.turn-turn,range:GROUND_WEAPONS[shooter.weaponUsable].maxRange};
  });
  assert.deepEqual(shot,{damage:shot.expected,expected:shot.expected,turns:1,range:4});
  assert.deepEqual(errors,[]);
  console.log('PASS: real catalog Carbine acquisition, keyboard cancel/equip, mouse canvas/context equip, weapon return/re-equip, no extra turns, autosave reload and live range-four/+4-ATK shot; all ground weapons recognized.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
