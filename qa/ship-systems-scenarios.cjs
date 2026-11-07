const assert=require('node:assert/strict');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
const {isSystemsOpen,canvasText,clickTarget,clickRepair,assertMenuFits}=require('./systems-menu-helpers.cjs');

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1400,height:720}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.route(/^https?:/,route=>route.abort());
    await page.goto(gameUrl);
    await page.evaluate(()=>initGame('BULK_FREIGHTER','Systems QA','Systems QA'));
    await page.waitForFunction(()=>G?.galaxy && G.log.some(entry=>entry.msg.includes('Ready for departure')));
    const systemsButton=page.getByRole('button',{name:'Ship systems',exact:false});
    const openingTurn=await page.evaluate(()=>G.turn);
    assert.equal(await systemsButton.count(),0,'galaxy context omits the redundant F3 control');
    await page.keyboard.press('F3');assert.ok(await isSystemsOpen(page));
    const paused=await page.evaluate(()=>[G.turn,G.ship.x,G.ship.y,G.fuel]);
    await page.locator('.cmp-btn').first().click();await page.keyboard.press('Space');
    await page.keyboard.press('f');await page.keyboard.press('i');
    assert.deepEqual(await page.evaluate(()=>[G.turn,G.ship.x,G.ship.y,G.fuel]),paused,'inspection blocks world controls');
    await page.keyboard.press('Escape');
    await page.keyboard.press('i');
    await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(()=>G._viewTab),'ship');
    const clickInspect=async()=>{
      const point=await page.evaluate(()=>{
        const target=canvasMenuTargets.find(target=>target.activate===openShipSystems);
        if(!target) throw Error('Missing static Inspect / repair button');
        const bounds=canvas.getBoundingClientRect();
        return {x:bounds.x+(target.x+target.w/2)*bounds.width/canvasWidth,y:bounds.y+(target.y+target.h/2)*bounds.height/canvasHeight};
      });
      await page.mouse.click(point.x,point.y);
    };
    const coreText=()=>page.evaluate(()=>{
      const labels=[],fillText=ctx.fillText;
      ctx.fillText=function(text,x,y,...rest){if(y>=230 && y<=265) labels.push(text);return fillText.call(this,text,x,y,...rest);};
      try{drawCanvas();}finally{ctx.fillText=fillText;}
      return labels;
    });
    for(const viewport of [{width:1400,height:720},{width:800,height:600}]){
      await page.setViewportSize(viewport);
      await page.waitForFunction(()=>canvas.width===Math.round(canvas.getBoundingClientRect().width*devicePixelRatio));
      assert.equal(await systemsButton.count(),0,'ship inventory context omits the redundant F3 control');
      assert.equal(await page.locator('#ctx-bar [data-game-key="j"]').count(),0,'jettison remains in the ship menu, not the context bar');
      assert.ok(!(await coreText()).some(text=>String(text).startsWith('Shields')),'an unfitted shield slot has no label or integrity text');
      for(let index=0;index<6;index++){
        const point=await page.evaluate(index=>{
          const width=(canvasWidth-110)/6,x=40+index*(width+6)+width/2,y=247;
          if(canvasMenuTargets.some(target=>x>=target.x && x<target.x+target.w && y>=target.y && y<target.y+target.h)) throw Error('Core readout is still interactive');
          const bounds=canvas.getBoundingClientRect();
          return {x:bounds.x+x*bounds.width/canvasWidth,y:bounds.y+y*bounds.height/canvasHeight};
        },index);
        await page.mouse.move(point.x,point.y);
        assert.notEqual(await page.locator('#gc').evaluate(element=>getComputedStyle(element).cursor),'pointer');
        await page.mouse.click(point.x,point.y);assert.equal(await isSystemsOpen(page),false);
      }
      await clickInspect();assert.ok(await isSystemsOpen(page));
      assert.match(await canvasText(page),/INVENTORY CREW SHIP LOG .*SHIP SYSTEMS/,'inspection retains the real ship-menu tabs');
      await assertMenuFits(page);
      await page.screenshot({path:artifactPath('Ship-systems-menu-'+viewport.width+'.png')});
      await clickTarget(page,'Back [Esc]');
      assert.equal(await page.evaluate(()=>G._viewTab),'ship');
      await page.keyboard.press('F3');assert.ok(await isSystemsOpen(page));await page.keyboard.press('Escape');
      await page.screenshot({path:artifactPath('Ship-overview-'+viewport.width+'.png')});
    }
    assert.equal(await page.evaluate(()=>G.turn),openingTurn,'all inspection paths remain free');
    await page.setViewportSize({width:1400,height:720});
    await page.keyboard.press('Escape');
    await page.evaluate(()=>{damageShipSystem(G.ship,'engine',25,'access scenario');tryMove(1,0);});
    assert.ok(await page.evaluate(()=>G.stranded));
    await page.keyboard.press('i');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
    await clickInspect();assert.ok(await isSystemsOpen(page),'a stranded overlay must not cover the static inspection control');
    await clickRepair(page,'engine','bypass');
    assert.deepEqual(await page.evaluate(()=>[G.mode,G._viewTab,G.stranded===null,effectiveEngineRating()]),['inventory','ship',true,1]);
    await page.keyboard.press('Escape');await page.keyboard.press('Escape');
    await page.evaluate(()=>{
      const engine=G.ship.systems.engine;engine.condition=100;engine.bypassUntil=0;
      DEBUG.shipInvisible=true;
      damageShipSystem(G.ship,'sensors',25,'scenario');
      G.ship.x=3;G.ship.y=3;
      for(let y=0;y<8;y++)for(let x=0;x<8;x++)G.galaxy[y][x]={type:'VOID'};
      G.visited[3*MAP_W+4]=false;
      G.pirates=[];G.neutralShips=[];G.gasEntities=[];
    });
    const discovery=await page.evaluate(()=>G.visited.filter(Boolean).length);
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(()=>G.ship.x),4);
    assert.equal(await page.evaluate(()=>G.visited.filter(Boolean).length),discovery,'blind travel must not reveal new terrain');
    assert.equal(await page.evaluate(()=>G.visited[3*MAP_W+4]),false);
    await page.keyboard.press('F3');
    assert.ok(await isSystemsOpen(page));
    await clickTarget(page,'Sensors');
    assert.match(await canvasText(page),/OFFLINE · Existing charts retained/);
    await clickRepair(page,'sensors','bypass');
    assert.equal(await page.evaluate(()=>effectiveSensorRange()),1,'a bypass can restore a rating-one sensor at 75% integrity');
    await page.evaluate(()=>G.inventory.push({name:'Repair Kit',usable:'repair_kit'}));
    await page.evaluate(()=>renderAll());
    const before=await page.evaluate(()=>G.turn);
    await clickRepair(page,'sensors','kit');
    assert.deepEqual(await page.evaluate(before=>[G.turn-before,G.ship.systems.sensors.condition,effectiveSensorRange()],before),[1,85,1], 'an engineer restores a rating-one sensor with a kit');
    assert.equal(await page.evaluate(()=>G.inventory.some(item=>item.usable==='repair_kit')),false);
    await page.keyboard.press('Escape');
    await page.evaluate(()=>damageShipSystem(G.ship,'fuelTank',50,'scenario'));
    assert.equal(await page.evaluate(()=>G.maxFuel),90);
    assert.ok(await page.evaluate(()=>G.fuel<=90));
    assert.ok(await page.evaluate(()=>autoSave()));
    assert.ok(await page.evaluate(()=>loadFromStorage()));
    assert.equal(await page.evaluate(()=>G.maxFuel),90);
    await page.evaluate(()=>{
      G.mode='base';G.base.stationName='Starbase Alpha';G.credits=1000;
      renderAll();
    });
    await page.keyboard.press('F3');
    const fuel=await page.evaluate(()=>G.fuel);
    await clickRepair(page,'fuelTank','station');
    assert.deepEqual(await page.evaluate(()=>[G.maxFuel,G.fuel,G.ship.systems.fuelTank.condition]),[180,fuel,100]);
    await page.keyboard.press('Escape');
    await page.evaluate(()=>{
      G.mode='system';G.curSystem=G.ship.x+','+G.ship.y;
      G.galaxy[G.ship.y][G.ship.x]={type:'SYSTEM',name:'Sensor QA',starType:'YELLOW',
        planets:[{name:'Sensor Test',biome:'FROZEN'}]};
      damageShipSystem(G.ship,'sensors',50,'scenario');
    });
    const scan=await page.evaluate(()=>{const before=[G.turn,G.fuel];doScan();return [G.turn-before[0],G.fuel-before[1]];});
    assert.deepEqual(scan,[0,0],'offline scanning is blocked before charging time or fuel');
    assert.equal(await systemsButton.count(),0,'orbital context omits the generic F3 control');
    await page.keyboard.press('F3');
    assert.ok(await isSystemsOpen(page),'F3 still opens the board from orbit');
    await page.screenshot({path:artifactPath('Ship-systems.png')});
    await page.keyboard.press('Escape');

    await page.evaluate(()=>{G.selPlanet=0;doInteract();});
    assert.equal(await page.evaluate(()=>G.mode),'planet');
    assert.equal(await systemsButton.count(),0,'planetside context omits the generic F3 control');
    await page.keyboard.press('F3');assert.ok(await isSystemsOpen(page));await page.keyboard.press('Escape');

    // A fresh real career exercises the shared combat and core rules.
    await page.evaluate(()=>initGame('ATTACK_CORVETTE','Mount QA','Mount QA'));
    await page.waitForFunction(()=>G?.galaxy && G.shipName==='Mount QA' && G.log.some(entry=>entry.msg.includes('Ready for departure')));
    await page.keyboard.press('i');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
    assert.ok((await coreText()).includes('Shields 100%'),'a fitted shield generator still has a visible status');
    await page.keyboard.press('Escape');
    await page.evaluate(()=>{
      Math.random=()=>0.25;
      G.pirates=[];G.neutralShips=[];G.gasEntities=[];
      G.ship.x=10;G.ship.y=10;
      G.galaxy[10][11]={type:'PIRATE_BASE',name:'Turret QA'};
      G.pirateBases=[{x:11,y:10,name:'Turret QA',hp:100,maxHp:100,destroyed:false}];
      const hull=G.ship.hp;tryMove(1,0);
      if(G.ship.hp!==hull || G.ship.shieldCharge!==0) throw Error('Galaxy defense turrets bypassed shields');
      G.ship.shieldCharge=20;
      G.pirates=[{name:'System Test Raider',x:G.ship.x,y:G.ship.y,hp:500,maxHp:500,alive:true,
        pirateType:'guard',engineRating:2,guns:2,atk:8,shields:1}];
      G.installedWeapons=['railgun','mass_driver'];
      startShipCombat(G.pirates[0]);
      const combat=G.shipCombat,enemy=combat.enemies[0];
      combat.asteroids=[];enemy.x=combat.player.x+3;enemy.y=combat.player.y;
      enemy.ship.weaponReadyAt=[G.turn+100,G.turn+100];
      damageShipSystem(G.ship,'sensors',100,'scenario');
      renderAll();
    });
    const blind=await page.evaluate(()=>{const turn=G.turn;doShipFire();return [G.turn-turn,shipCombatContactVisible(G.shipCombat,G.shipCombat.enemies[0])];});
    assert.deepEqual(blind,[0,false],'no target lock or free enemy tracking while blind');
    await page.evaluate(()=>damageShipSystem(G.ship,'engine',100,'scenario'));
    const disabled=await page.evaluate(()=>{const {x,y}=G.shipCombat.player,turn=G.turn;moveShipInCombat(-1,0);return [G.turn-turn,G.shipCombat.player.x-x,G.shipCombat.player.y-y];});
    assert.deepEqual(disabled,[0,0,0]);
    await page.keyboard.press('F3');
    await clickRepair(page,'engine','bypass');
    assert.equal(await page.evaluate(()=>effectiveEngineRating()),2);
    const repairTurn=await page.evaluate(()=>G.turn);
    await clickRepair(page,'sensors','bypass');
    assert.deepEqual(await page.evaluate(turn=>[G.turn-turn,effectiveSensorRange(),G.ship.systems.sensors.bypassUntil-G.turn],repairTurn),[1,1,14]);
    await page.keyboard.press('Escape');
    const boost=await page.evaluate(()=>{
      G.shipCombat.player.dx=-1;G.shipCombat.player.dy=0;G.ship.heat=0;
      return [G.turn,G.shipCombat.player.x,G.fuel];
    });
    await page.getByRole('button',{name:/Boost forward/}).click();
    assert.deepEqual(await page.evaluate(before=>[G.turn-before[0],G.shipCombat.player.x-before[1],G.fuel-before[2]],boost),[1,-2,-2]);
    const blockedBoost=await page.evaluate(()=>{
      const combat=G.shipCombat;combat.asteroids=[{x:combat.player.x-1,y:combat.player.y}];
      const before=[G.turn,G.fuel,G.ship.heat];boostShipInCombat();return [before,[G.turn,G.fuel,G.ship.heat]];
    });
    assert.deepEqual(blockedBoost[0],blockedBoost[1],'blocked boost consumes no resources or turn');
    await page.evaluate(()=>{
      const combat=G.shipCombat;combat.asteroids=[];
      combat.enemies[0].x=combat.player.x+3;
      G.ship.heat=shipHeatCapacity()-SHIP_WEAPONS.railgun.heat+1;
    });
    const hot=await page.evaluate(()=>{const turn=G.turn;doShipFire();return [G.turn-turn,shipCombatWeaponStatus(G.shipCombat,shipCombatWeapons()[0])];});
    assert.deepEqual(hot,[0,'Too hot']);
    const heat=await page.evaluate(()=>G.ship.heat);
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(()=>G.ship.heat),heat-16,'waiting doubles passive cooling');
    await page.keyboard.press('1');
    await page.keyboard.press('f');
    assert.deepEqual(await page.evaluate(()=>[G.ship.weaponReadyAt[0]-G.turn,G.ship.weaponReadyAt[1]||0]),[2,0]);
    const railDeadline=await page.evaluate(()=>G.ship.weaponReadyAt[0]);
    await page.keyboard.press('2');await page.keyboard.press('f');
    assert.deepEqual(await page.evaluate(deadline=>[G.ship.weaponReadyAt[0]===deadline,G.ship.weaponReadyAt[1]-G.turn],railDeadline),[true,1],'mount reloads are independent');

    await page.evaluate(()=>{G.ship.shieldCharge=20;damageShipCombatPlayer(G.shipCombat,7);});
    const hull=await page.evaluate(()=>G.ship.hp);
    await page.keyboard.press('Space');await page.keyboard.press('Space');
    assert.deepEqual(await page.evaluate(()=>[G.ship.hp,G.ship.shieldCharge]),[hull,13]);
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(()=>G.ship.shieldCharge),16,'shield recharge starts after the hit delay');
    await page.evaluate(()=>{G.inventory.push({name:'Repair Kit',usable:'repair_kit'});damageShipSystem(G.ship,'fuelTank',50,'scenario');});
    const ruptured=await page.evaluate(()=>[G.turn,G.fuel,G.maxFuel]);
    await page.keyboard.press('F3');await clickRepair(page,'fuelTank','kit');
    assert.deepEqual(await page.evaluate(before=>[G.turn-before[0],G.fuel,G.maxFuel],ruptured),[1,ruptured[1],90],'field tank repair restores capacity, consumes one combat action and creates no fuel');
    await page.keyboard.press('Escape');
    await page.evaluate(()=>{
      const combat=G.shipCombat,enemy=combat.enemies[0];
      G.ship.systems.engine.condition=100;G.ship.systems.engine.bypassUntil=0;
      G.ship.systems.sensors.condition=100;G.ship.systems.sensors.bypassUntil=0;
      G.ship.systems.reactor.condition=60;
      G.ship.heat=40;G.ship.shieldCharge=5;G.ship.shieldRechargeAt=G.turn+10;G.ship.weaponReadyAt[0]=G.turn+6;
      enemy.ship.heat=35;enemy.ship.systems.sensors.condition=25;
      combat.player.x=0;combat.trails=[];renderAll();
    });
    await page.keyboard.press('r');
    assert.equal(await page.evaluate(()=>G.mode),'galaxy');
    assert.deepEqual(await page.evaluate(()=>[G.ship.heat,G.ship.shieldCharge,G.ship.weaponReadyAt[0]-G.turn,G.ship.systems.reactor.condition]),[32,5,5,60]);
    await page.evaluate(()=>startShipCombat(G.pirates[0],true));
    assert.deepEqual(await page.evaluate(()=>[G.ship.heat,G.ship.shieldCharge,G.pirates[0].heat,G.pirates[0].systems.sensors.condition]),[32,5,30,25],'re-engagement does not reset either ship');
    const snapshot=await page.evaluate(()=>[G.ship.systems,G.ship.weaponReadyAt,G.ship.heat,G.ship.shieldCharge,G.pirates[0].systems,G.pirates[0].weaponReadyAt]);
    assert.ok(await page.evaluate(()=>autoSave()));assert.ok(await page.evaluate(()=>loadFromStorage()));
    assert.deepEqual(await page.evaluate(()=>[G.ship.systems,G.ship.weaponReadyAt,G.ship.heat,G.ship.shieldCharge,G.pirates[0].systems,G.pirates[0].weaponReadyAt]),snapshot);
    assert.ok(await page.evaluate(()=>G.shipCombat.enemies[0].ship===G.pirates[0] && G.shipCombat.weaponReady===G.ship.weaponReadyAt));
    await page.screenshot({path:artifactPath('Tactical-systems.png')});

    const blindEnemy=await page.evaluate(()=>{
      const combat=G.shipCombat,enemy=combat.enemies[0];
      enemy.ship.systems.sensors.condition=0;enemy.ship.weaponReadyAt=[G.turn,G.turn];enemy.ship.heat=0;
      enemy.x=combat.player.x+2;enemy.y=combat.player.y;
      const before=[enemy.x,enemy.y,G.ship.hp,G.ship.shieldCharge];
      advanceShipCombat();return [before,[enemy.x,enemy.y,G.ship.hp,G.ship.shieldCharge]];
    });
    assert.deepEqual(blindEnemy[0],blindEnemy[1],'a blind NPC cannot track or shoot the current player position');

    // Expiry is on the career clock, and bypasses do not permanently heal cores.
    const expiry=await page.evaluate(()=>{
      G.mode='galaxy';G.shipCombat=null;G.pirates=[];G.neutralShips=[];G.gasEntities=[];
      damageShipSystem(G.ship,'sensors',100,'scenario');
      const before=G.turn;repairShipSystem('sensors','bypass');
      const until=G.ship.systems.sensors.bypassUntil;
      while(G.turn<until){beginCareerTurn();finishCareerTurn();}
      return [G.turn-before,effectiveSensorRange(),G.ship.systems.sensors.condition];
    });
    assert.deepEqual(expiry,[15,0,0]);
    await page.evaluate(()=>{damageShipSystem(G.ship,'engine',100,'scenario');tryMove(1,0);});
    assert.ok(await page.evaluate(()=>G.stranded && effectiveEngineRating()===0));
    const supported=await page.evaluate(()=>{
      const before=G.crew.map(crew=>crew.hp);doStrandedWait();
      return [before,G.crew.map(crew=>crew.hp),strandedLifeSupportFailing()];
    });
    assert.deepEqual(supported,[supported[0],supported[0],false],'a disabled drive with fuel and a working reactor does not drain life support');
    const rescued=await page.evaluate(()=>{
      const rescue={name:'Rescue Test',rescueCost:0,fuelGift:5,rescuing:true};
      G.stranded.rescueShip=rescue;G.stranded.rescuePhase='offer';doAcceptRescue();
      return [G.stranded,effectiveEngineRating()>0,G.ship.systems.engine.condition];
    });
    assert.deepEqual(rescued,[null,true,80],'SOS rescue can recover a disabled drive without an engineer');
    const unpowered=await page.evaluate(()=>{
      damageShipSystem(G.ship,'reactor',100,'scenario');tryMove(1,0);
      const before=G.crew.map(crew=>crew.hp);doStrandedWait();
      return [G.crew.map((crew,index)=>crew.hp-before[index]),strandedLifeSupportFailing()];
    });
    assert.deepEqual(unpowered,[[-3,-3,-3],true],'a failed reactor still exposes the crew while stranded');


    await page.evaluate(()=>{
      G.mode='base';G.base={screen:'sub',sel:0,subSel:0,stationName:'Starbase Alpha'};
      G.shipStats=buildShipStats('LIGHT_SCOUT');G.installedWeapons=['mass_driver'];G.credits=5000;
      for(const component of Object.values(G.ship.systems)){component.condition=100;component.bypassUntil=0;}
      G.base.weaponSlot=0;G.base.weaponSel=Object.keys(SHIP_WEAPONS).indexOf('railgun');
    });
    const rejected=await page.evaluate(()=>{const credits=G.credits;executeBaseAction('confirminstall');return [G.credits-credits,G.installedWeapons[0]];});
    assert.deepEqual(rejected,[0,'mass_driver'],'a medium weapon cannot be bought into a light mount');
    const upgraded=await page.evaluate(()=>{executeBaseAction('upreactor');executeBaseAction('upcooling');return [shipReactorOutput(),shipCoolingRate(),G.shipStats.reactorRating,G.shipStats.coolingRating];});
    assert.deepEqual(upgraded,[9,8,2,2]);
    await page.keyboard.press('Shift+B');
    const debug=page.locator('#debug-dialog');
    await debug.getByRole('button',{name:'Damage Sensors (25%)',exact:true}).click();
    assert.equal(await page.evaluate(()=>G.ship.systems.sensors.condition),75);
    await debug.getByRole('button',{name:'Rupture fuel tank',exact:true}).click();
    assert.equal(await page.evaluate(()=>G.maxFuel),50);
    await debug.getByRole('button',{name:'Restore all cores',exact:true}).click();
    assert.equal(await page.evaluate(()=>G.maxFuel),100);
    await page.keyboard.press('Shift+B');
    for(const viewport of [{width:800,height:600},{width:640,height:480}]){
      await page.setViewportSize(viewport);await page.keyboard.press('F3');
      assert.ok(await isSystemsOpen(page));
      await assertMenuFits(page);
      await page.keyboard.press('Escape');
    }
    // A held field-repair key must consume exactly one kit/turn even below the repair cap.
    await page.evaluate(()=>{
      G.mode='inventory';G._prevMode='system';G._viewTab='ship';
      G.inventory=G.inventory.filter(item=>item.usable!=='repair_kit');
      G.inventory.push({name:'Repair Kit',usable:'repair_kit'},{name:'Repair Kit',usable:'repair_kit'});
      damageShipSystem(G.ship,'engine',100,'held-key scenario');renderAll();
    });
    await page.keyboard.press('F3');
    const heldTurn=await page.evaluate(()=>G.turn);
    await page.keyboard.down('Enter');await page.keyboard.down('Enter');await page.keyboard.up('Enter');
    assert.equal(await page.evaluate(()=>G.turn),heldTurn+1);
    assert.equal(await page.evaluate(()=>G.inventory.filter(item=>item.usable==='repair_kit').length),1);
    assert.ok(await isSystemsOpen(page),'field repair retains its parent page across location turn dispatch');
    await page.keyboard.press('Escape');
    assert.deepEqual(errors,[]);
    console.log('PASS: passive core readouts, empty unfitted shields, static inspect access, context cleanup, stranded inventory repair, core damage, blind travel/locks/scans, engineer repair/bypass/expiry, heat, independent reloads, shield delay, persistent retreat/load, SOS recovery, fitting and upgrades.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
