const {gameUrl,artifactPath,fixtureFile}=require('./runtime.cjs');
const {chromium}=require('./runtime.cjs'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
 await page.goto(gameUrl);
 await page.evaluate(()=>initGame('LIGHT_SCOUT','Palette Test','Original ship'));
 await page.waitForFunction(()=>G?.galaxy && G.log.some(e=>e.msg.includes('Ready for departure')));
 await page.keyboard.press('Shift+B');
 const original=await page.evaluate(()=>JSON.stringify(G));
 await page.keyboard.press('F2');
 assert.equal(await page.evaluate(()=>!!G.debugPalette),true);
 assert.equal(await page.evaluate(async()=>{await autosaveQueue.idle();return (await readStoredAutosave())?.record.raw;}),original);
 const counts=await page.evaluate(()=>({entries:G.debugPalette.entries.length,objects:DEBUG_GALAXY_OBJ_TYPES.length,tiles:Object.keys(TILE).length}));
 const age=await page.evaluate(()=>{const age=G.npcStranded[0].age;tickNpcStranded();if(G.npcStranded[0].age!==age)throw Error('Paused NPC aged');return age;});
 await page.keyboard.press('Shift+B');await page.keyboard.press('F7');
 assert.equal(await page.evaluate(()=>G.debugPalette.simulate),true);
 await page.evaluate(()=>tickNpcStranded());
 assert.equal(await page.evaluate(()=>G.npcStranded[0].age),age+1);
 await page.keyboard.press('F7');await page.keyboard.press('Shift+B');
 for(const id of await page.evaluate(()=>G.debugPalette.entries.filter(e=>['galaxy','biome','civilization'].includes(e.kind)).map(e=>e.id))){
   const result=await page.evaluate(id=>{
     debugPaletteVisit(id);
     if(id.startsWith('galaxy:')){
       if(id==='galaxy:RESEARCH_SHIP'){
         const s=G.debugPalette.researchShip;G.scienceJob.active={type:'research_ship',id:'palette-research',target:{mapKey:s.mapKey},reward:900};
       }
       doInteract();
     } else if(id.startsWith('biome:')){
       const e=G.debugPalette.entries.find(e=>e.id===id);
       doInteract();
       if(G.mode==='system'&&e.biome!=='GAS_GIANT')doInteract();
     }
     return {mode:G.mode,id};
   },id);
 }
 await page.evaluate(()=>debugEnterPalette('surface'));
 for(const e of await page.evaluate(()=>G.debugPalette.entries.filter(e=>!!e.key).map(e=>({id:e.id,kind:e.kind,x:e.x,y:e.y})))){
   await page.evaluate(id=>{debugPaletteVisit(id);getExamineName(G.player.x+1,G.player.y);renderAll();},e.id);
 }
 const med=await page.evaluate(()=>G.debugPalette.entries.find(e=>e.kind==='item'&&e.item.usable==='medikit').id);
 await page.evaluate(id=>{debugPaletteVisit(id);tryMove(1,0);},med);
 assert.equal(await page.evaluate(()=>G.inventory.some(i=>i.usable==='medikit')),true);
 await page.evaluate(()=>{debugPaletteVisit('cargo:ore_fe');tryMove(1,0);doInteract();});
 assert.equal(await page.evaluate(()=>G.cargo.some(i=>i.commodityId==='ore_fe')),true);
 const gun=await page.evaluate(()=>G.debugPalette.entries.find(e=>e.kind==='item'&&e.item.usable==='gun').id);
 await page.evaluate(id=>{debugPaletteVisit(id);tryMove(1,0);G._viewInvSel=G.inventory.findIndex(i=>i.usable==='gun');},gun);
 await page.keyboard.press('i');await page.keyboard.press('Enter');await page.keyboard.press('Enter');
 assert.equal(await page.evaluate(()=>G.crew.some(c=>c.weaponUsable==='gun')),true);
 await page.keyboard.press('Escape');
 await page.evaluate(()=>{
   debugPaletteVisit('hostile:stalker');
   const npc=G.enemies[G.curPlanet].find(e=>e.x===G.player.x+1&&e.y===G.player.y);
   for(let i=0;i<10&&npc.alive&&npc.hp===npc.maxHp;i++)tryMove(1,0);
   if(npc.alive&&npc.hp===npc.maxHp)throw Error('NPC combat did not execute');
 });
 await page.keyboard.press('Shift+B');await page.keyboard.press('F6');
 await page.keyboard.type('medikit');
 assert.ok(await page.evaluate(()=>debugPaletteFilteredEntries().length)>0);
 await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>G.mode),'planet');
 await page.evaluate(()=>{autoSave();saveToFile();});
 assert.equal(await page.evaluate(async()=>{await autosaveQueue.idle();return (await readStoredAutosave())?.record.raw;}),original);
 await page.evaluate(()=>{G.dead=true;G.ship.hp=0;DEBUG.on=true;});
 await page.keyboard.press('F2');
 assert.equal(await page.evaluate(()=>G.dead||G.ship.hp<=0),false);
 await page.evaluate(()=>{
   TILE.PALETTE_FUTURE_TEST={...TILE.station_floor};
   DEBUG_ITEM_CATALOG.push({cat:'Future test',items:[{name:'Future Test Item',usable:'repair_kit'}]});
   DEBUG_GALAXY_OBJ_TYPES.push({id:'FUTURE_TEST',label:'Future Test Object',place:()=>({type:'DERELICT',name:'Future Test Object'})});
   DEBUG.on=true;
 });
 await page.keyboard.press('Shift+F2');
 for(const id of ['tile:PALETTE_FUTURE_TEST','item:Future test:Future Test Item','galaxy:FUTURE_TEST']){
  assert.equal(await page.evaluate(id=>G.debugPalette.entries.some(e=>e.id===id),id),true);
 }
 await page.keyboard.press('F4');assert.equal(await page.evaluate(()=>JSON.stringify(G)),original);
 await page.keyboard.press('F3');assert.equal(await page.evaluate(()=>!!G.debugPalette),true);
 await page.keyboard.press('F4');assert.equal(await page.evaluate(()=>JSON.stringify(G)),original);
 await page.evaluate(()=>{
   delete TILE.PALETTE_FUTURE_TEST;
   DEBUG_ITEM_CATALOG.pop();DEBUG_GALAXY_OBJ_TYPES.pop();
   DEBUG.on=true;debugEnterPalette('galaxy');DEBUG.on=true;renderAll();
 });
 await page.screenshot({path:artifactPath('Debug-palette-menu.png')});
 await page.keyboard.press('F6');await page.screenshot({path:artifactPath('Debug-palette-directory.png')});
 await page.keyboard.press('F4');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({counts,checks:['all galaxy factories','all biome generators','all civilization scenarios','every surface sample render/examine','real ground item pickup','real cargo loading','real weapon equip','real NPC combat','live simulation toggle','search input','autosave isolation','exact career restore','re-entry','death recovery','new catalog entries automatically appear on rebuild'],errors},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
