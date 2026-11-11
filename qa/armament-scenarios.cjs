const assert=require('node:assert/strict');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
const {canvasText,clickTarget,assertMenuFits}=require('./systems-menu-helpers.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.text().startsWith('Prospector input error:'))errors.push(message.text());});
  await page.route(/^https?:/,route=>route.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('LIGHT_SCOUT','Armament QA','Armament QA'));
  await page.waitForFunction(()=>G?.galaxy&&G.log.some(entry=>entry.msg.includes('Ready for departure')));
  await page.keyboard.press('Enter');await page.keyboard.press('Enter');
  await page.evaluate(()=>{
   G.credits=5000;G.ship.weaponReadyAt=[G.turn+5];executeBaseAction('hangar_sub_armament');
   G.base.subSel=STATION_BUILDINGS[0].actions().findIndex(row=>row.id==='installweapon_0');renderAll();
  });
  await page.keyboard.press('Enter');
  const state=()=>page.evaluate(()=>JSON.stringify({credits:G.credits,weapons:G.installedWeapons,stores:G.hangarStores,
   ready:G.ship.weaponReadyAt,ammo:G.ship.ammo,turn:G.turn,time:G.careerTime}));
  const before=await state();
  assert.match(await canvasText(page),/FITTED HERE.*Already installed in this mount/);
  assert.ok(await page.locator('#ctx-bar [data-game-key="Enter"]').isDisabled());
  await page.keyboard.press('Enter');await page.evaluate(()=>executeBaseAction('confirminstall'));
  assert.equal(await state(),before,'same mount refuses payment, stock transfers, reload reset and service time');
  await page.evaluate(()=>{stationEquipmentStore(true).weapons.push({id:'mass_driver',readyAt:G.turn+20});renderAll();});
  const ownedBefore=await state();await page.keyboard.press('Enter');
  assert.equal(await state(),ownedBefore,'a spare owned copy still cannot replace an identical fitted weapon');
  await clickTarget(page,'Mass Driver');assert.equal(await state(),ownedBefore);
  // Two different mounts can legitimately use the same weapon type.
  await page.keyboard.press('Escape');
  await page.evaluate(()=>{executeBaseAction('upwslot');executeBaseAction('installweapon_1');});
  await page.keyboard.press('Enter');
  assert.deepEqual(await page.evaluate(()=>[G.installedWeapons,G.credits,G.ship.weaponReadyAt[1],stationEquipmentStore().weapons.length]),[['mass_driver','mass_driver'],4500,21,0]);
  await page.evaluate(()=>executeBaseAction('installweapon_0'));
  await clickTarget(page,'Pulse Laser');await clickTarget(page,'Buy and install [Enter]');
  assert.deepEqual(await page.evaluate(()=>[G.installedWeapons,G.credits,stationEquipmentStore().weapons[0]]),[['pulse_laser','mass_driver'],3700,{id:'mass_driver',readyAt:6}]);
  await page.evaluate(()=>executeBaseAction('installweapon_0'));
  // Capture real canvas text extents: each weapon's description and stats stay within its card.
  assert.ok(await page.evaluate(()=>{
   const drawn=[],original=ctx.fillText;
   ctx.fillText=function(text,x,y,maxWidth){
    const width=Math.min(this.measureText(String(text)).width,maxWidth??Infinity);
    const left=this.textAlign==='right'?x-width:this.textAlign==='center'?x-width/2:x;
    drawn.push({text:String(text),left,right:left+width,y,align:this.textAlign});
    return original.apply(this,arguments);
   };
   try{drawCanvas();}finally{ctx.fillText=original;}
   return drawn.filter(item=>item.y>=60&&item.y<=364).every(item=>item.left>=canvasWidth/2-410&&item.right<=canvasWidth/2+410)&&
    drawn.filter(item=>Object.values(SHIP_WEAPONS).some(weapon=>weapon.desc===item.text)).every(item=>item.align==='left');
  }));
  for(const viewport of [{width:1400,height:720},{width:900,height:650}]){
   await page.setViewportSize(viewport);
   for(const style of ['cockpit','classic']){
    await page.evaluate(style=>{OPTIONS.uiStyle=style;applyUIStyle();renderAll();},style);
    await assertMenuFits(page);await page.screenshot({path:artifactPath('Armament-picker-'+style+'-'+viewport.width+'.png')});
    await page.keyboard.press('Escape');await assertMenuFits(page);
    await page.screenshot({path:artifactPath('Armament-list-'+style+'-'+viewport.width+'.png')});
    await page.evaluate(()=>executeBaseAction('installweapon_0'));
   }
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: duplicate fitting is free/refused with or without stored copies; identical weapons on separate mounts remain legal; real replacement preserves old weapon/deadline; aligned blue armament cards/list fit both themes and sizes.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
