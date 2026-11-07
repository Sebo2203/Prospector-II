const {gameUrl,artifactPath,fixtureFile}=require('./runtime.cjs');
const {chromium}=require('./runtime.cjs'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
 await page.goto(gameUrl);
 await page.evaluate(()=>initGame('LIGHT_SCOUT','Palette Test','Original ship'));
 await page.waitForFunction(()=>G?.galaxy && G.log.some(e=>e.msg.includes('Ready for departure')));
 const button = name => page.getByRole('button',{name,exact:typeof name==='string'});
 const click = name => button(name).click();
 const tools = () => click('Debug Palette');
 assert.equal(await button('Debug Palette').isVisible(),false);
 await page.keyboard.press('Shift+B');
 const original=await page.evaluate(()=>serializeCareer(G));
 assert.equal(await page.evaluate(()=>debugDialog.open),true);
 await page.evaluate(()=>debugDialog.dispatchEvent(new KeyboardEvent('keydown',{key:'B',shiftKey:true,repeat:true,bubbles:true,cancelable:true})));
 assert.equal(await page.evaluate(()=>debugDialog.open),true,'holding the shortcut must not immediately close the menu');
 await page.keyboard.press('Shift+B');
 assert.equal(await page.evaluate(()=>debugDialog.open || DEBUG.on),false);
 assert.equal(await page.evaluate(()=>serializeCareer(G)),original,'closing the menu must preserve the career');
 await page.keyboard.press('Shift+B');
 assert.equal(await page.evaluate(()=>debugDialog.open),true);
 await click('Spawn Gear or Cargo');
 await page.getByRole('searchbox').fill('med');
 await page.keyboard.press('Shift+B');
 assert.equal(await page.evaluate(()=>debugDialog.open),false,'the shortcut also closes from a focused search field');
 await page.keyboard.press('Shift+B');
 await page.keyboard.press('ArrowRight');
 await page.keyboard.press('F2');
 assert.equal(await page.evaluate(()=>serializeCareer(G)),original);
 await click('Galaxy Spawn Report');
 assert.ok(await page.getByText('Map size',{exact:true}).isVisible());
 await click('Back to Tools');
 await click('Galaxy Gallery');
 assert.equal(await page.evaluate(()=>!!G.debugPalette),true);
 assert.equal(await page.evaluate(async()=>{await autosaveQueue.idle();return (await readStoredAutosave())?.record.raw;}),original);
 const counts=await page.evaluate(()=>({entries:G.debugPalette.entries.length,objects:DEBUG_GALAXY_OBJ_TYPES.length,tiles:Object.keys(TILE).length}));
 const age=await page.evaluate(()=>{const age=G.npcStranded[0].age;tickNpcStranded();if(G.npcStranded[0].age!==age)throw Error('Paused NPC aged');return age;});
 const spawnTest = await page.evaluate(()=>{
   const x=0, y=MAP_H-4;
   Object.assign(G.ship,{x,y});
   G.galaxy[y][x+1]={type:'VOID'};
   G.neutralShips.push({...G.neutralShips[0],x:x+1,y});
   G.galaxy[y+1][x]={type:'PULSAR'};
   G.galaxy[y-1][x]={type:'VOID'};
   G.visited[(y-1)*MAP_W+x]=false;
   renderAll();
   return {x,y,count:G.pulsars.length};
 });
 await tools();
 await page.getByRole('combobox',{name:'Galaxy object',exact:true}).selectOption({label:'Pulsar'});
 await click('Spawn Galaxy Object');
 assert.deepEqual(await page.evaluate(({x,y})=>({
   point:G.pulsars.slice(-1).map(pulsar=>[pulsar.x,pulsar.y])[0],
   shipCell:G.galaxy[y][x+1].type,
   known:G.visited[(y-1)*MAP_W+x],
 }),spawnTest),{point:[spawnTest.x,spawnTest.y-1],shipCell:'VOID',known:true});
 await page.evaluate(({x,y})=>{
   G.galaxy[y-1][x+1]={type:'PULSAR'};
   G.galaxy[y+1][x+1]={type:'PULSAR'};
 },spawnTest);
 await click('Spawn Galaxy Object');
 assert.equal(await page.evaluate(()=>G.pulsars.length),spawnTest.count+1);
 assert.match(await page.locator('#debug-action-status').textContent(),/No empty adjacent sector/);
 await page.getByRole('combobox',{name:'System biome',exact:true}).selectOption({label:'HABITABLE'});
 await click('Spawn System');
 assert.match(await page.locator('#debug-action-status').textContent(),/No empty adjacent sector for the system/);
 await page.evaluate(({x,y})=>{
   G.galaxy[y+1][x+1]={type:'VOID'};
   G.visited[(y+1)*MAP_W+x+1]=false;
 },spawnTest);
 await click('Spawn System');
 assert.deepEqual(await page.evaluate(({x,y})=>({
   biome:G.galaxy[y+1][x+1].planets?.[0]?.biome,
   generated:!!G.planets[(x+1)+','+(y+1)+':0'],
   known:G.visited[(y+1)*MAP_W+x+1],
   shipCell:G.galaxy[y][x+1].type,
 }),spawnTest),{biome:'HABITABLE',generated:true,known:true,shipCell:'VOID'});
 await click('Close');
 await tools();
 await click('Run NPCs Live');
 assert.equal(await page.evaluate(()=>G.debugPalette.simulate),true);
 await page.evaluate(()=>tickNpcStranded());
 assert.equal(await page.evaluate(()=>G.npcStranded[0].age),age+1);
 await click('Pause NPCs');
 await click('Close');
 for(const id of await page.evaluate(()=>G.debugPalette.entries.filter(e=>['galaxy','biome','civilization'].includes(e.kind)).map(e=>e.id))){
   const result=await page.evaluate(id=>{
     debugPaletteVisit(id);
     if(id.startsWith('galaxy:')){
       if(id==='galaxy:PIRATE_WING'){
         activateGameKey('f');
         if(G.shipCombat?.enemies.length!==2) throw Error('Pirate wing did not start a two-ship fight');
       }
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
 await page.setViewportSize({width:800,height:600});
 await tools();
 const credits=await page.evaluate(()=>G.credits);
 await click('Add 1,000 Credits');
 assert.equal(await page.evaluate(()=>G.credits),credits+1000);
 await click('Spawn Gear or Cargo');
 const categories=page.getByRole('combobox',{name:'Category'});
 await categories.selectOption('Gear — Weapons');
 assert.ok(await page.getByRole('heading',{name:'Gear — Weapons'}).isVisible());
 assert.equal(await button('Medikit').count(),0);
 await categories.selectOption('Gear — Consumables');
 await page.getByRole('searchbox',{name:'Filter gear or cargo'}).fill('medikit');
 const inventoryCount=await page.evaluate(()=>G.inventory.length);
 await button(/medikit/i).first().click();
 assert.equal(await page.evaluate(()=>G.inventory.length),inventoryCount+1);
 await click('Back to Tools');
 await click('Civilization Tools');
 await page.getByLabel('Tier',{exact:true}).selectOption({label:'Industrial'});
 await click('Spawn Civilization');
 assert.equal(await page.evaluate(()=>G.planets[G.curPlanet].civilization.tier),'industrial');
 await click('Force Hostility');
 assert.equal(await page.evaluate(()=>G.planets[G.curPlanet].civilization.state.hostile),true);
 await click('Back to Tools');
 await click('Find a Sample');
 await categories.selectOption('Star Types');
 assert.ok(await page.getByRole('heading',{name:'Star Types'}).isVisible());
 assert.equal(await button('Pulsar').count(),0);
 await categories.selectOption('Gear — Consumables');
 await page.getByRole('searchbox',{name:'Filter samples'}).fill('medikit');
 await button(/medikit/i).first().click();
 assert.equal(await page.evaluate(()=>G.mode),'planet');
 await page.evaluate(()=>{autoSave();saveToFile();});
 assert.equal(await page.evaluate(async()=>{await autosaveQueue.idle();return (await readStoredAutosave())?.record.raw;}),original);
 await page.evaluate(()=>{G.dead=true;G.ship.hp=0;renderAll();});
 await tools();
 await click('Galaxy Gallery');
 assert.equal(await page.evaluate(()=>G.dead||G.ship.hp<=0),false);
 await page.evaluate(()=>{
   TILE.PALETTE_FUTURE_TEST={...TILE.station_floor};
   DEBUG_ITEM_CATALOG.push({cat:'Future test',items:[{name:'Future Test Item',usable:'repair_kit'}]});
   DEBUG_GALAXY_OBJ_TYPES.push({id:'FUTURE_TEST',label:'Future Test Object',place:()=>({type:'DERELICT',name:'Future Test Object'})});
   COMMODITIES.future_goods={...COMMODITIES.food,id:'future_goods',name:'Future Goods'};
 });
 await tools();
 await click('Rebuild Palette');
 await click('Cancel');
 assert.equal(await page.evaluate(()=>G.debugPalette.entries.some(e=>e.id==='galaxy:FUTURE_TEST')),false);
 await click('Rebuild Palette');
 await click('Rebuild Galleries');
 for(const id of ['tile:PALETTE_FUTURE_TEST','item:Future test:Future Test Item','galaxy:FUTURE_TEST','cargo:future_goods']){
  assert.equal(await page.evaluate(id=>G.debugPalette.entries.some(e=>e.id===id),id),true);
 }
 await tools();
 await click('Find a Sample');
 await categories.selectOption('Gear — Future test');
 assert.ok(await button('Future Test Item').isVisible());
 await categories.selectOption('Cargo — Other Commodities');
 assert.ok(await button('Future Goods').isVisible());
 await click('Back to Tools');
 await click('Spawn Gear or Cargo');
 await categories.selectOption('Gear — Future test');
 assert.ok(await button('Future Test Item').isVisible());
 await categories.selectOption('Cargo — Other Commodities');
 await click('Future Goods');
 assert.ok(await page.evaluate(()=>G.cargo.some(item=>item.commodityId==='future_goods')));
 await click('Back to Tools');
 await click('Return to Career');
 assert.equal(await page.evaluate(()=>serializeCareer(G)),original);
 assert.equal(await button('Debug Palette').isVisible(),false);
 await page.keyboard.press('Shift+B');
 await click('Surface Gallery');
 assert.equal(await page.evaluate(()=>!!G.debugPalette && G.mode==='planet'),true);
 await tools();
 await click('Return to Career');
 assert.equal(await page.evaluate(()=>serializeCareer(G)),original);
 await page.evaluate(()=>{
   delete TILE.PALETTE_FUTURE_TEST;
   DEBUG_ITEM_CATALOG.pop();DEBUG_GALAXY_OBJ_TYPES.pop();
   delete COMMODITIES.future_goods;
   debugEnterPalette('galaxy');
 });
 await tools();
 await page.screenshot({path:artifactPath('Debug-palette-menu.png')});
 await click('Find a Sample');
 await page.screenshot({path:artifactPath('Debug-palette-directory.png')});
 await click('Back to Tools');
 await click('Return to Career');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({counts,checks:['all galaxy factories','all biome generators','all civilization scenarios','every surface sample render/examine','real ground item pickup','real cargo loading','real weapon equip','real NPC combat','live simulation toggle','search input','autosave isolation','exact career restore','re-entry','death recovery','new catalog entries automatically appear on rebuild'],errors},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
