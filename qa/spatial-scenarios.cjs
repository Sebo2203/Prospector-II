const {gameUrl,artifactPath,fixtureFile}=require('./runtime.cjs');
const {chromium}=require('./runtime.cjs');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1400,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:/,r=>r.abort());
  await page.addInitScript(()=>{let state=2203;Math.random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};});
  await page.goto(gameUrl);
  await page.waitForFunction(()=>typeof initGame==='function');
  const checks=[];let steps=0;
  async function start(cls='BULK_FREIGHTER'){
    await page.evaluate(cls=>initGame(cls,'Spatial Test','Expedition'),cls);
    await page.waitForFunction(()=>G?.galaxy && G.log.some(e=>e.msg.includes('Ready for departure')));
    await page.evaluate(()=>{
      // Keep this rescue fixture near its station; the old corner placement can
      // exceed a stock Freighter's range under the current size-based fuel costs.
      const home={x:G.ship.x,y:G.ship.y},dx=home.x+2<MAP_W?1:-1;
      const site={x:home.x+dx*2,y:home.y};
      G.galaxy[home.y][home.x+dx]={type:'VOID'};
      G.galaxy[site.y][site.x]=debugBuildPaletteGalaxyObject('QUARANTINE',site.x,site.y);
      // Isolate this encounter from unrelated late-turn pirate interception.
      DEBUG.shipInvisible=true;G.cargo=[];
      const q=G.expedition.quarantine;G.ship.x=q.x;G.ship.y=q.y;renderAll();
    });
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>!!G.planets[G.curPlanet]?.isQuarantine),true);
    assert.equal(await page.locator('#expedition-overlay').count(),0);
  }
  async function walk(x,y){
    const moved=await page.evaluate(([tx,ty])=>{
      const pd=G.planets[G.curPlanet];const queue=[[G.player.x,G.player.y,[]]],seen=new Set([G.player.x+','+G.player.y]);
      let route;
      for(let i=0;i<queue.length;i++){
        const [x,y,trail]=queue[i];if(x===tx&&y===ty){route=trail;break;}
        for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){
          const nx=x+dx,ny=y+dy,key=nx+','+ny,type=pd.grid[ny]?.[nx]?.type;
          if(seen.has(key)||(!TILE[type]?.pass&&!['rw_locked_door','rw_locked_door'].includes(type)))continue;
          seen.add(key);queue.push([nx,ny,[...trail,[dx,dy]]]);
        }
      }
      if(!route)throw Error('No route to '+tx+','+ty);
      for(const [dx,dy] of route){
        const nx=G.player.x+dx,ny=G.player.y+dy;
        if(!TILE[pd.grid[ny][nx].type]?.pass){
          doInteract();if(!TILE[pd.grid[ny][nx].type]?.pass)throw Error('Door did not open');
        }
        const before=G.turn;tryMove(dx,dy);
        if(G.dead||G.mode!=='planet'||G.player.x!==nx||G.player.y!==ny||G.turn!==before+1)
          throw Error('Movement failed: '+JSON.stringify({x:nx,y:ny,turn:G.turn,log:G.log.slice(0,3)}));
      }
      return route.length;
    },[x,y]);steps+=moved;
  }
  async function fixture(type){
    const pos=await page.evaluate(type=>{const pd=G.planets[G.curPlanet];for(let y=0;y<pd.height;y++)for(let x=0;x<pd.width;x++)if(pd.grid[y][x].type===type)return{x,y};throw Error(type);},type);
    await walk(pos.x,pos.y);await page.keyboard.press('Enter');
  }
  async function near(id){
    const p=await page.evaluate(id=>{
      const s=quarantinePeople().find(s=>s.id===id),pd=G.planets[G.curPlanet];
      const p=[[0,-1],[-1,0],[1,0],[0,1]].map(([dx,dy])=>({x:s.x+dx,y:s.y+dy})).find(p=>TILE[pd.grid[p.y]?.[p.x]?.type]?.pass);
      return p;
    },id);await walk(p.x,p.y);
    assert.equal(await page.evaluate(()=>quarantineNearSurvivor()?.id),id,JSON.stringify(await page.evaluate(()=>({player:G.player,q:G.expedition.quarantine,mode:G.mode,cur:G.curPlanet,flag:quarantineInterior(),los:hasPlanetLOS(G.planets[G.curPlanet],G.player.x,G.player.y,quarantinePeople()[1].x,quarantinePeople()[1].y),near:quarantineNearSurvivor(),log:G.log.slice(0,4)}))));
  }
  async function airlock(){await walk(3,9);await page.keyboard.press('Enter');}
  async function deliver(){
    await page.keyboard.press('l');assert.equal(await page.evaluate(()=>G.mode),'galaxy');
    await page.evaluate(()=>{
      const targets=[];
      for(let y=0;y<G.galaxy.length;y++)for(let x=0;x<G.galaxy[y].length;x++)if(G.galaxy[y][x].type==='BASE')targets.push({x,y});
      targets.sort((a,b)=>(Math.abs(a.x-G.ship.x)+Math.abs(a.y-G.ship.y))-(Math.abs(b.x-G.ship.x)+Math.abs(b.y-G.ship.y)));
      const target=targets[0],queue=[[G.ship.x,G.ship.y,[]]],seen=new Set([G.ship.x+','+G.ship.y]);let route;
      for(let i=0;i<queue.length;i++){
        const [x,y,trail]=queue[i];if(x===target.x&&y===target.y){route=trail;break;}
        for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){
          const nx=x+dx,ny=y+dy,key=nx+','+ny,type=G.galaxy[ny]?.[nx]?.type;
          if(seen.has(key)||!['VOID','BASE','DERELICT','SYSTEM','CASINO'].includes(type))continue;
          seen.add(key);queue.push([nx,ny,[...trail,[dx,dy]]]);
        }
      }
      if(!route)throw Error('No safe station route');
      for(const [dx,dy] of route){
        const x=G.ship.x+dx,y=G.ship.y+dy,turn=G.turn;tryMove(dx,dy);
        if(G.dead||G.mode!=='galaxy'||G.ship.x!==x||G.ship.y!==y||G.turn!==turn+1)
          throw Error('Travel failed: '+JSON.stringify({expected:{x,y},actual:{x:G.ship.x,y:G.ship.y},fuel:G.fuel,log:G.log.slice(0,6)}));
      }
      doInteract();if(G.mode!=='base')throw Error('Dock failed: '+JSON.stringify({target,position:{x:G.ship.x,y:G.ship.y},fuel:G.fuel,log:G.log.slice(0,6)}));
    });
  }
  async function reload(){
    const before=await page.evaluate(()=>JSON.stringify(G.expedition.quarantine));
    assert.equal(await page.evaluate(async()=>{await autoSave();G=null;return await loadFromStorage();}),true);
    assert.equal(await page.evaluate(()=>JSON.stringify(G.expedition.quarantine)),before);
    await page.evaluate(()=>{restoreGameUI();renderAll();});
  }
  await start();
  assert.equal(await page.evaluate(()=>quarantinePeople().some(s=>s.met)),false);
  assert.equal(await page.evaluate(()=>canSeePlanetTile(27,15)),false);
  await page.keyboard.press('j');
  assert.equal(await page.evaluate(()=>G.mode),'planet');
  await page.keyboard.press('i');
  for(let i=0;i<3;i++)await page.keyboard.press('ArrowRight');
  await page.keyboard.press('6');
  assert.equal(await page.evaluate(()=>G._viewTab),'log');
  assert.equal(await page.evaluate(()=>G._logFilter),'records');
  assert.equal(await page.evaluate(()=>currentLogRecords().some(e=>e.msg.includes('Ilya Sen'))),false);
  const paused=await page.evaluate(()=>G.turn);await page.keyboard.press('ArrowDown');
  assert.equal(await page.evaluate(()=>G.turn),paused);await page.keyboard.press('Escape');
  const initialTurn=await page.evaluate(()=>G.turn);
  await page.keyboard.press('t');assert.equal(await page.evaluate(()=>G.turn),initialTurn);
  checks.push('unseen survivors remain unknown; remote treatment has no effect');
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>G.turn),initialTurn+1);
  await page.keyboard.press('l');assert.equal(await page.evaluate(()=>G.mode),'galaxy');
  await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>G.mode),'planet');
  checks.push('waiting advances a real turn; retreat and reboarding preserve the same deck');
  await fixture('q_log');await fixture('q_medical');await fixture('q_parts');await fixture('q_life_support');
  assert.equal(await page.evaluate(()=>G.expedition.quarantine.repaired),true);
  await reload();checks.push('physical repair consumes the recovered component and survives actual storage reload');
  await near('rowan');await page.keyboard.press('t');
  assert.equal(await page.evaluate(()=>quarantinePeople().find(s=>s.id==='rowan').injured),false);
  await page.keyboard.press('Enter');await airlock();
  assert.equal(await page.evaluate(()=>quarantinePeople().find(s=>s.id==='rowan').status),'onboard');
  await near('ilya');await page.keyboard.press('t');
  assert.equal(await page.evaluate(()=>quarantinePeople().find(s=>s.id==='ilya').infectious),false);
  await page.keyboard.press('Enter');await airlock();
  await near('mira');await page.keyboard.press('Enter');await airlock();
  assert.equal(await page.evaluate(()=>quarantinePeople().filter(s=>s.status==='onboard').length),3);
  await fixture('q_salvage');assert.equal(await page.evaluate(()=>G.cargo.some(i=>i.commodityId==='instruments')),true);
  await airlock();await reload();await deliver();
  assert.equal(await page.evaluate(()=>quarantinePeople().filter(s=>s.status==='delivered').length),3);
  const credits=await page.evaluate(()=>G.credits);
  await page.evaluate(()=>settleQuarantineAtStation(G.base.stationName));
  assert.equal(await page.evaluate(()=>G.credits),credits);
  checks.push('complete on-foot freighter rescue, real treatment, salvage, walk back, flight and station delivery');
  const beforeSale=await page.evaluate(()=>G.credits);
  await page.evaluate(()=>executeBaseAction('market_sell_all'));
  assert.ok(await page.evaluate(()=>G.credits)>beforeSale);
  assert.equal(await page.evaluate(()=>G.cargo.some(i=>i.commodityId==='instruments')),false);
  checks.push('salvage is sold through the existing commodity market, with no incident-specific payout shortcut');
  await start('LIGHT_SCOUT');
  // Fill the bunks explicitly: starting careers now have only two bridge crew.
  await page.evaluate(()=>{while(G.crew.length<G.shipStats.maxCrew)G.crew.push(randomCrewMember('redshirt'));});
  await fixture('q_log');await fixture('q_parts');await fixture('q_life_support');
  await near('mira');await page.keyboard.press('Enter');await airlock();
  await near('rowan');await page.keyboard.press('Enter');await airlock();
  assert.equal(await page.evaluate(()=>quarantinePeople().filter(s=>s.status==='onboard').length),1);
  assert.equal(await page.evaluate(()=>quarantinePeople().find(s=>s.id==='rowan').status),'waiting');
  checks.push('small hull cannot bypass passenger capacity; untransported survivor stays at the airlock');
  await deliver();
  await page.evaluate(()=>{G.mode='galaxy';const q=G.expedition.quarantine;G.ship.x=q.x;G.ship.y=q.y;doInteract();});
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>quarantinePeople().find(s=>s.id==='rowan').status),'onboard');
  checks.push('a return trip can retrieve the survivor left at the airlock');
  await start();await fixture('q_pods');await near('ilya');await page.keyboard.press('p');
  assert.equal(await page.evaluate(()=>quarantinePeople().find(s=>s.id==='ilya').status),'carried');
  await reload();
  const fixturePath=artifactPath('spatial-save.json');
  fs.writeFileSync(fixturePath,await page.evaluate(()=>serializeCareer(G)));
  const chooser=page.waitForEvent('filechooser');await page.evaluate(()=>loadFromFile());
  await (await chooser).setFiles(fixturePath);
  await page.waitForFunction(()=>!AUTOSAVE_STATE.transition &&
    G.log.some(e=>e.msg==='Save file loaded. Welcome back, Captain.'));
  assert.equal(await page.evaluate(()=>quarantinePeople().find(s=>s.id==='ilya').status),'carried');
  await airlock();
  assert.equal(await page.evaluate(()=>G.cargo.some(i=>i.quarantinePatient==='ilya')),true);
  await page.keyboard.press('i');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
  await page.keyboard.press('j');await page.keyboard.press('j');await page.keyboard.press('Escape');
  await page.keyboard.press('Space');
  assert.equal(await page.evaluate(()=>quarantinePeople().find(s=>s.id==='ilya').status),'lost');
  checks.push('isolation pod is physically carried, reloadable cargo; jettison loses its passenger');
  await start();await near('ilya');
  const noSupplies=await page.evaluate(()=>({turn:G.turn,items:G.inventory.length}));
  await page.keyboard.press('t');await page.keyboard.press('p');
  assert.equal(await page.evaluate(()=>G.turn),noSupplies.turn);
  assert.equal(await page.evaluate(()=>quarantinePeople().find(s=>s.id==='ilya').infectious),true);
  checks.push('missing antibiotics or isolation pod cannot be bypassed by pressing an action key');
  await start();await fixture('q_parts');await fixture('q_life_support');
  await near('ilya');
  await page.evaluate(()=>{G.expedition.quarantine.filtered=false;G.crew[0].statuses.suit_puncture={id:'suit_puncture',severity:1,intensity:1,duration:null};});
  for(let i=0;i<3;i++)await page.keyboard.press('Space');
  assert.equal(await page.evaluate(()=>!!G.crew[0].statuses.infection),true);
  checks.push('contaminated deck plus breached suit causes actual crew infection through ordinary wait ticks');
  await start();
  for(let i=0;i<230;i++)await page.evaluate(()=>doWaitPlanet());
  assert.equal(await page.evaluate(()=>G.expedition.quarantine.air),0);
  assert.ok(await page.evaluate(()=>quarantinePeople().some(s=>s.status==='dead')));
  checks.push('neglected life support really fails and people can die');
  await start();
  await page.evaluate(()=>G.crew.forEach(c=>{c.skills.eng=0;c.skills.med=0;}));
  await fixture('q_life_support');
  assert.equal(await page.evaluate(()=>G.expedition.quarantine.repaired),false);
  const airBefore=await page.evaluate(()=>G.expedition.quarantine.air);
  await page.keyboard.press('r');
  assert.ok(await page.evaluate(()=>G.expedition.quarantine.air)>airBefore);
  await page.evaluate(()=>G.crew[0].skills.eng=3);
  for(let i=0;i<3;i++)await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>G.expedition.quarantine.repaired),true);
  checks.push('unskilled repairs fail without parts; manual pumping buys time; a skilled engineer performs a multi-turn bypass');
  await fixture('q_filter');await near('ilya');
  await page.evaluate(()=>{G.crew[0].statuses.suit_puncture={id:'suit_puncture',severity:1,intensity:1,duration:null};});
  for(let i=0;i<3;i++)await page.keyboard.press('Space');
  assert.equal(await page.evaluate(()=>!!G.crew[0].statuses.infection),false);
  checks.push('operating the physical scrubber prevents contaminated-deck exposure');
  await start();await fixture('q_pods');await near('ilya');
  await page.keyboard.press('p');
  await page.evaluate(()=>{for(let i=0;i<G.shipStats.cargoCapacity;i++)G.cargo.push({name:'Test cargo',isCommodity:true,commodityId:'parts',value:100});});
  await airlock();
  assert.equal(await page.evaluate(()=>quarantinePeople().find(s=>s.id==='ilya').status),'carried');
  await page.keyboard.press('l');
  assert.equal(await page.evaluate(()=>quarantinePeople().find(s=>s.id==='ilya').status),'waiting');
  await page.keyboard.press('i');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
  await page.keyboard.press('j');await page.keyboard.press('j');await page.keyboard.press('Escape');
  await page.keyboard.press('Enter');await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>quarantinePeople().find(s=>s.id==='ilya').status),'onboard');
  assert.equal(await page.evaluate(()=>G.cargo.length),await page.evaluate(()=>G.shipStats.cargoCapacity));
  checks.push('a full cargo hold leaves a pod on the deck; freeing a real slot and reboarding permits transfer');
  await start('ATTACK_CORVETTE');await fixture('q_parts');await fixture('q_life_support');await near('rowan');
  await page.keyboard.press('Enter');await airlock();
  assert.equal(await page.evaluate(()=>quarantinePeople().find(s=>s.id==='rowan').status),'onboard');
  checks.push('corvette crew can carry an untreated injured survivor through the actual deck');
  await near('ilya');
  await page.screenshot({path:artifactPath('Quarantine-ship-preview.png')});
  await page.evaluate(()=>{OPTIONS.asciiMode=true;renderAll();});
  await page.screenshot({path:artifactPath('Quarantine-ship-ascii.png')});
  assert.deepEqual(errors,[]);
  const report={checks,walkedSurfaceSteps:steps,javascriptErrors:errors};
  fs.writeFileSync(artifactPath('spatial-report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
