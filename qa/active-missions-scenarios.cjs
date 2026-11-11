const assert=require('node:assert/strict');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1400,height:720}});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route(/^https?:/,route=>route.abort());
    await page.goto(gameUrl);
    await page.evaluate(()=>initGame('LIGHT_SCOUT','Missions QA','Missions QA'));
    await page.waitForFunction(()=>G?.galaxy && G.log.some(entry=>entry.msg.includes('Ready for departure')));
    const toggle=page.getByRole('button',{name:'Active Missions',exact:true});
    const panel=page.getByRole('region',{name:'Active missions and contracts'});
    assert.equal(await toggle.getAttribute('aria-expanded'),'false');
    const before=await page.evaluate(()=>[G.turn,G.ship.x,G.ship.y]);
    await toggle.click();
    assert.match(await panel.textContent(),/No active missions or contracts/);
    assert.doesNotMatch(await panel.textContent(),/Mercy|Survey/);
    await toggle.focus();
    await page.keyboard.press('Enter');
    assert.equal(await panel.isVisible(),false);
    await page.keyboard.press('Enter');
    assert.equal(await panel.isVisible(),true);
    await panel.focus();
    await page.keyboard.press('ArrowDown');
    assert.deepEqual(await page.evaluate(()=>[G.turn,G.ship.x,G.ship.y]),before);
    await page.keyboard.press('Escape');
    assert.equal(await panel.isVisible(),false);
    await toggle.click();
    await page.evaluate(()=>{
      const science=ensureScienceJobState();
      science.nextIndex=remainingScienceJobTypes().indexOf('biodata');
      if(!startScienceJob())throw Error('Biodata contract did not start');
      for(let i=0;i<19;i++)G.inventory.push({name:'Biodata Sample',value:10});
      renderAll();
    });
    assert.match(await panel.textContent(),/19 \/ 20 biodata samples · 1 remaining/);
    await page.evaluate(()=>{G.inventory.push({name:'Biodata Sample',value:10});renderAll();});
    assert.match(await panel.textContent(),/20 \/ 20.*0 remaining/);
    assert.match(await panel.textContent(),/Ready to return/);
    await page.evaluate(()=>{if(!completeScienceJob())throw Error('Contract did not complete');renderAll();});
    assert.match(await panel.textContent(),/No active missions or contracts/);
    await page.evaluate(()=>{
      const science=ensureScienceJobState();
      science.cooldownUntil=G.turn;
      science.nextIndex=remainingScienceJobTypes().indexOf('alien_corpses');
      if(!startScienceJob())throw Error('Corpse contract did not start');
      G.inventory.push({name:'Alien Corpse'},{name:'Alien Corpse'});
      renderAll();
    });
    assert.match(await panel.textContent(),/2 \/ 5 alien corpses · 3 remaining/);
    await page.evaluate(()=>abandonScienceJob());
    const destination=await page.evaluate(()=>{
      // The tracker needs one cargo slot; keep the granted refit within the Scout's real limits.
      G.shipStats=buildShipStats('LIGHT_SCOUT',{cargo:1});G.shipRefits={upcargo:1};syncPlayerShipSystems();
      const science=ensureScienceJobState();
      science.cooldownUntil=G.turn;
      science.nextIndex=remainingScienceJobTypes().indexOf('data_box');
      G.base.stationName='Starbase Alpha';
      if(!startScienceJob())throw Error('Delivery contract did not start');
      renderAll();
      return missionStationDestination('Waypoint Omega');
    });
    assert.ok((await panel.textContent()).includes(destination));
    assert.match(await panel.textContent(),/Secured data box aboard/);
    await page.evaluate(()=>{G.cargo=[];renderAll();});
    assert.match(await panel.textContent(),/Data box missing/);
    const reported=await page.evaluate(()=>{
      abandonScienceJob();
      const science=ensureScienceJobState();
      science.cooldownUntil=G.turn;
      science.nextIndex=remainingScienceJobTypes().indexOf('research_ship');
      if(!startScienceJob())throw Error('Research contract did not start');
      const target=science.active.target;
      target.reportedX=target.x+7;target.reportedY=target.y+7;
      renderAll();
      return {reported:'[X:'+(target.reportedX+1)+' Y:'+(target.reportedY+1)+']',
        actual:'[X:'+(target.x+1)+' Y:'+(target.y+1)+']'};
    });
    assert.ok((await panel.textContent()).includes(reported.reported));
    assert.ok(!(await panel.textContent()).includes(reported.actual),'hidden ship coordinates must not replace its reported fix');
    await page.evaluate(()=>{
      G.inventory.push({name:'Research Ship Data',scienceJobId:'wrong-contract'});
      renderAll();
    });
    assert.doesNotMatch(await panel.textContent(),/Research data recovered/);
    await page.evaluate(()=>{
      G.inventory.push({name:'Research Ship Data',scienceJobId:G.scienceJob.active.id});
      const incident=G.expedition.quarantine;
      incident.discovered=true;incident.startedTurn=G.turn;incident.rosterKnown=false;
      incident.survivors=[
        {id:'known',name:'Known passenger',met:true,status:'onboard'},
        {id:'hidden',name:'Unseen passenger',met:false,status:'waiting'},
      ];
      G.cargo.push({questItem:'mystery_delivery'});
      renderAll();
    });
    assert.match(await panel.textContent(),/Research data recovered/);
    assert.match(await panel.textContent(),/1 passenger aboard/);
    assert.doesNotMatch(await panel.textContent(),/Unseen|2 survivor|still on the wreck|Survey work|SURVEY:/);
    assert.match(await panel.textContent(),/Mysterious package/);
    assert.equal(await page.evaluate(()=>{try{parseSaveSnapshot(serializeCareer(G));return 'valid';}catch(error){return error.message;}}),'valid','mission fixture must remain a valid career');
    assert.ok(await page.evaluate(()=>autoSave()));
    assert.ok(await page.evaluate(()=>loadFromStorage()));
    await page.evaluate(()=>renderAll());
    assert.match(await panel.textContent(),/1 passenger aboard/);
    await panel.focus();
    const scrollTurn=await page.evaluate(()=>G.turn);
    await page.keyboard.press('End');
    await page.waitForFunction(()=>document.getElementById('active-missions-panel').scrollTop>0);
    assert.equal(await page.evaluate(()=>G.turn),scrollTurn,'scrolling mission objectives must not advance the game');
    await page.keyboard.press('Home');
    const anchor=await page.locator('#hud-tools').boundingBox();
    for(const [width,height] of [[1400,720],[800,600]]){
      await page.setViewportSize({width,height});
      await page.waitForFunction(width=>Math.abs(document.getElementById('root').getBoundingClientRect().width-width)<0.1,width);
      for(const uiStyle of ['cockpit','classic']){
        await page.evaluate(uiStyle=>{OPTIONS.uiStyle=uiStyle;applyUIStyle();renderAll();},uiStyle);
        const bounds=await page.evaluate(()=>{
          const rect=id=>document.getElementById(id).getBoundingClientRect();
          return {below:rect('active-missions-toggle').top>=rect('shortcut-toggle').bottom,
            separate:rect('active-missions-panel').right<rect('hud-tools').left,
            aboveVersion:rect('active-missions-panel').bottom<=rect('version-tag').top,
            visible:rect('active-missions-panel').height>20};
        });
        assert.deepEqual(bounds,{below:true,separate:true,aboveVersion:true,visible:true});
      }
    }
    await page.setViewportSize({width:1400,height:720});
    await page.waitForFunction(()=>Math.abs(document.getElementById('root').getBoundingClientRect().width-1400)<0.1);
    assert.deepEqual(await page.locator('#hud-tools').boundingBox(),anchor,'the tracker must not move the compass or map');
    await page.evaluate(()=>{OPTIONS.uiStyle='cockpit';applyUIStyle();});
    await page.screenshot({path:artifactPath('Active-missions.png')});
    await page.getByRole('button',{name:'Shortcuts',exact:true}).click();
    assert.equal(await panel.isVisible(),false);
    assert.equal(await page.locator('#persist-hints').isVisible(),true);
    await toggle.click();
    assert.equal(await page.locator('#persist-hints').isVisible(),false);
    await page.evaluate(()=>{G.scienceJob.active=null;G.expedition.quarantine.status='closed';G.cargo=[];renderAll();});
    assert.match(await panel.textContent(),/No active missions or contracts/);
    await page.evaluate(()=>{
      G.scienceJob.active={type:'artifact',target:{x:3,y:4,planetName:'Ancient <World>',systemName:'Test System'}};
      renderAll();
    });
    assert.match(await panel.textContent(),/Ancient <World> · Test System \[X:4 Y:5\]/);
    assert.equal(await panel.locator('world').count(),0,'mission names must render as text');
    await page.evaluate(()=>{
      G.inventory.push({name:'Ancient Artifact'});
      renderAll();
    });
    assert.match(await panel.textContent(),/Artifact recovered/);
    await page.evaluate(()=>{
      G.scienceJob.active={type:'civilization'};
      G.planets.missionCiv={civilization:{species:'Aquatic'},visited:[true],explored:new Array(40).fill(true)};
      renderAll();
    });
    assert.match(await panel.textContent(),/Civilization documented/);
    assert.doesNotMatch(await panel.textContent(),/Survey work awaiting sale|SURVEY:/);
    assert.deepEqual(errors,[]);
    console.log('PASS: mission dropdown controls, live counts, destinations, hidden intel, completion, persistence and footer layout.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
