const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
const {isSystemsOpen,canvasText,clickTarget,assertMenuFits}=require('./systems-menu-helpers.cjs');

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.text().startsWith('Prospector input error:'))errors.push(message.text());});
    await page.route(/^https?:/,route=>route.abort());await page.goto(gameUrl);
    await page.evaluate(()=>initGame('LIGHT_SCOUT','Hangar QA','Hangar QA'));
    await page.waitForFunction(()=>G?.galaxy && G.log.some(entry=>entry.msg.includes('Ready for departure')));
    await page.keyboard.press('Enter');await page.keyboard.press('Enter');
    for(let i=0;i<5;i++)await page.keyboard.press('ArrowDown');
    const clickHangarCore=async()=>{
      const point=await page.evaluate(()=>{
        const index=STATION_BUILDINGS[G.base.sel].actions().findIndex(action=>action.id==='ship_systems');
        const y=56+(index-(G.base.subScroll||0))*36+15;
        const target=canvasMenuTargets.find(target=>target.x===canvasWidth/2-410 && y>=target.y && y<target.y+target.h);
        if(!target)throw Error('Core Systems row has no pointer target');
        const bounds=canvas.getBoundingClientRect();
        return {x:bounds.x+(target.x+target.w/2)*bounds.width/canvasWidth,y:bounds.y+y*bounds.height/canvasHeight};
      });
      await page.mouse.click(point.x,point.y);
    };
    const verifyEntry=async label=>{
      assert.equal(await page.evaluate(()=>STATION_BUILDINGS[G.base.sel].actions()[G.base.subSel].id),'ship_systems');
      const before=await page.evaluate(()=>[G.turn,G.fuel,G.credits]);
      await page.keyboard.press('Enter');
      assert.ok(await isSystemsOpen(page),label+': keyboard activation must not immediately activate Close');
      await page.keyboard.press('Escape');assert.ok(!await isSystemsOpen(page));
      await page.keyboard.down('Enter');await page.keyboard.down('Enter');
      assert.ok(await isSystemsOpen(page),label+': held Enter must not close the new menu');
      await page.keyboard.up('Enter');
      await page.keyboard.press('Escape');assert.ok(!await isSystemsOpen(page),'Escape returns to the Hangar action list');
      await clickHangarCore();assert.ok(await isSystemsOpen(page),label+': native row click opens the same board');
      await page.keyboard.press('Escape');
      const context=page.locator('#ctx-bar [data-game-key="Enter"]');
      await context.click();assert.ok(await isSystemsOpen(page),label+': context click stays open');
      await page.keyboard.press('Escape');
      await context.focus();await page.keyboard.press('Enter');assert.ok(await isSystemsOpen(page),label+': keyboard activation of the context control stays open');
      await page.keyboard.press('Escape');await context.blur();
      await page.keyboard.press('F3');assert.ok(await isSystemsOpen(page),label+': F3 still works');
      assert.match(await canvasText(page),/HANGAR \/ CORE SYSTEMS/);
      assert.equal(await page.locator('dialog[open]').count(),0,'the Hangar page stays in the game canvas');
      await assertMenuFits(page);
      await page.screenshot({path:artifactPath(label+'-hangar-systems.png')});
      const selected=await page.evaluate(()=>shipSystemsView.id);
      const next=page.locator('#ctx-bar [data-game-key="ArrowDown"]');
      await next.focus();await page.keyboard.press('Enter');
      assert.notEqual(await page.evaluate(()=>shipSystemsView.id),selected,'focused context arrows activate the selected control, not a repair');
      await page.keyboard.press('Escape');
      assert.deepEqual(await page.evaluate(()=>[G.turn,G.fuel,G.credits]),before,'browsing does not charge resources or advance the career');
    };
    await verifyEntry('Fresh-career');
    // Native paid Scout refits must be visible in F3, independently of integrity.
    await page.keyboard.press('Escape');
    await page.evaluate(()=>{G.credits=1500;executeBaseAction('upengine');});
    for(const grade of [3,4]){
      if(grade===4)await page.evaluate(()=>executeBaseAction('upengine'));
      await page.keyboard.press('F3');
      assert.equal(await page.evaluate(()=>G.shipStats.engineRating),grade);
      assert.equal(await page.evaluate(()=>effectiveEngineRating()),grade);
      const labels=await canvasText(page);
      assert.ok(!labels.includes('Engines ('),'list rows omit engine ratings');
      const roman={3:'III',4:'IV'}[grade];
      assert.ok(labels.includes('Engines '+roman),'engine detail heading shows its installed Roman rating');
      assert.ok(labels.includes('Installed '+roman+' / effective '+roman));
      assert.ok(labels.includes('100% integrity'),'upgrading does not damage a healthy engine');
      await page.keyboard.press('Escape');
    }
    assert.equal(await page.evaluate(()=>G.credits),600,'both real upgrades charge their normal 450-credit price');
    await page.keyboard.press('F3');
    const state=await page.evaluate(()=>serializeCareer(G));
    for(let i=0;i<3;i++)await canvasText(page);
    assert.equal(await page.evaluate(()=>serializeCareer(G)),state,'readouts do not mutate the upgraded career');
    await page.screenshot({path:artifactPath('Engine-F3-upgraded.png')});
    await page.evaluate(()=>{G.ship.systems.engine.condition=75;renderAll();});
    assert.match(await canvasText(page),/Installed IV \/ effective III · reduced by engine damage/);
    await page.evaluate(()=>{G.ship.systems.engine.condition=100;G.ship.systems.reactor.condition=0;renderAll();});
    assert.match(await canvasText(page),/Installed IV \/ effective OFFLINE · reactor power offline/);
    await page.evaluate(()=>{G.ship.systems.reactor.condition=100;renderAll();});
    await page.keyboard.press('Escape');
    assert.ok(await page.evaluate(async()=>await autoSave()));
    assert.ok(await page.evaluate(async()=>await loadFromStorage()));
    await page.keyboard.press('F3');
    assert.ok((await canvasText(page)).includes('Installed IV / effective IV'),'confirmed save/load preserves the upgrade and its F3 readout');
    await page.keyboard.press('Escape');
    // Install an actual shield grade so all six existing core panels can be inspected.
    await page.evaluate(()=>executeBaseAction('upshield'));
    await page.keyboard.press('F3');
    const cores=[['engine','Engines IV'],['reactor','Reactor I'],
      ['shields','Shield generator I'],['cooling','Cooling I'],
      ['sensors','Sensors III'],['fuelTank','Fuel tank · Capacity 100']];
    for(const [id,heading] of cores){
      await clickTarget(page,{engine:'Engines',reactor:'Reactor',shields:'Shield generator',cooling:'Cooling',sensors:'Sensors',fuelTank:'Fuel tank'}[id]);
      const detail=await canvasText(page);
      assert.ok(detail.includes(heading),id+': installed value is inside the selected detail panel');
      assert.ok(!/rating/i.test(detail),'F3 omits the rating label');
      const rows=await page.evaluate(()=>{
        const labels=[],fill=ctx.fillText;
        ctx.fillText=function(value,x,y,...args){if(x===canvasWidth/2-410+20)labels.push(String(value));return fill.call(this,value,x,y,...args);};
        try{drawCanvas();}finally{ctx.fillText=fill;}return labels;
      });
      assert.deepEqual(rows,['Engines','Reactor','Shield generator','Cooling','Sensors','Fuel tank'],'all list rows retain only their plain names');
      await page.screenshot({path:artifactPath('Core-rating-'+id+'.png')});
    }
    await page.evaluate(()=>{G.ship.systems.fuelTank.condition=50;syncPlayerShipSystems();selectShipSystem('fuelTank');});
    const tank=await canvasText(page);
    assert.ok(tank.includes('Fuel tank · Capacity 100'),'tank heading preserves installed capacity after rupture');
    assert.match(tank,/Usable capacity 50 \/ 100/);
    await page.evaluate(()=>{G.ship.systems.fuelTank.condition=100;syncPlayerShipSystems();});
    await page.keyboard.press('Escape');
    await page.evaluate(()=>executeBaseAction('remove_refit_upshield'));
    await page.evaluate(()=>{G.base.sel=STATION_BUILDINGS.findIndex(building=>building.name==='Hangar');G.base.screen='sub';G.base.subMenu=null;G.base.subSel=STATION_BUILDINGS[G.base.sel].actions().findIndex(action=>action.id==='ship_systems');renderAll();});

    await page.evaluate(()=>damageShipSystem(G.ship,'sensors',25,'QA scenario'));
    await page.keyboard.press('Enter');
    const credits=await page.evaluate(()=>G.credits);
    for(let i=0;i<3;i++)await page.keyboard.press('ArrowDown');
    assert.equal(await page.evaluate(()=>shipSystemsView.id),'sensors');
    await page.keyboard.press('Enter');
    assert.deepEqual(await page.evaluate(()=>[G.ship.systems.sensors.condition,G.credits]),[100,credits-50]);
    assert.ok(await isSystemsOpen(page),'keyboard repair works and stays in the menu');
    await page.keyboard.down('Enter');await page.keyboard.down('Enter');await page.keyboard.up('Enter');
    assert.deepEqual(await page.evaluate(()=>[G.ship.systems.sensors.condition,G.credits]),[100,credits-50],'held activation cannot charge another repair');
    await clickTarget(page,'Back [Esc]');
    for(const viewport of [{width:1400,height:720},{width:800,height:600}]){
      await page.setViewportSize(viewport);await page.keyboard.press('Enter');
      for(const style of ['cockpit','classic']){
        await page.evaluate(style=>{OPTIONS.uiStyle=style;applyUIStyle();renderAll();},style);
        await assertMenuFits(page);
        await page.screenshot({path:artifactPath('Hangar-systems-'+style+'-'+viewport.width+'.png')});
      }
      await page.keyboard.press('Escape');
    }
    if(process.env.PROSPECTOR_QA_SAVE){
      // Optional supplied saves stay outside the repository and are never edited.
      const chooser=page.waitForEvent('filechooser');await page.evaluate(()=>loadFromFile());
      await(await chooser).setFiles(path.resolve(process.env.PROSPECTOR_QA_SAVE));
      await page.waitForFunction(()=>G?.mode==='base' && !AUTOSAVE_STATE.transition && !AUTOSAVE_STATE.loading && G.log[0]?.msg.includes('Save file loaded'));
      await verifyEntry('Provided-save');
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: real Hangar keyboard, held key, mouse, context and F3 access; canvas styling and navigation, paid repair, paid Scout engine refits 3→4, plain system rows, all six core detail headings with Roman ratings or tank capacity, integrity/installed/effective readouts with damage/reactor causes, confirmed save/load, and optional provided-save reproduction.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
