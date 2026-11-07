const assert=require('node:assert/strict');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route(/^https?:/,route=>route.abort());await page.goto(gameUrl);
    await page.evaluate(()=>initGame('LIGHT_SCOUT','UI QA','UI QA'));
    await page.waitForFunction(()=>G?.galaxy && G.log.some(entry=>entry.msg.includes('Ready for departure')));
    await page.evaluate(()=>{
      Math.random=()=>0.5;
      const ship={name:'UI Raider',x:G.ship.x,y:G.ship.y,hp:200,maxHp:200,alive:true,pirateType:'guard',engineRating:2,guns:1,atk:6,shields:0};
      G.pirates=[ship];G.installedWeapons=['mass_driver'];startShipCombat(ship);
      G.shipCombat.asteroids=[];ship.weaponReadyAt=[G.turn+100];renderAll();
    });
    const readout=()=>page.evaluate(()=>{
      const text=[],allText=[],allPositions=[],lines=[],rects=[],fill=ctx.fillText,stroke=ctx.stroke,rect=ctx.fillRect;
      ctx.fillText=function(value,x,y,...rest){allText.push(String(value));allPositions.push({text:String(value),x,y});if(x>=674)text.push({text:String(value),y});return fill.call(this,value,x,y,...rest);};
      ctx.fillRect=function(x,y,w,h){rects.push({x,y,w,h,color:this.fillStyle});return rect.call(this,x,y,w,h);};
      ctx.stroke=function(...args){if(ctx.getLineDash().length)lines.push(ctx.strokeStyle);return stroke.apply(this,args);};
      try{drawCanvas();}finally{ctx.fillText=fill;ctx.stroke=stroke;ctx.fillRect=rect;}
      return {text:text.map(entry=>entry.text),positions:text,lines,allText,allPositions,rects};
    });
    let view=await readout();
    assert.ok(!view.text.some(text=>/shield|recharg/i.test(text)),'unfitted shields have no combat readout');
    assert.ok(!view.text.includes('COMMS LOG'),'there is no second combat log');
    assert.ok(!view.allText.some(text=>text==='TACTICAL COMBAT'||text.includes('Asteroids: cover')||text.startsWith('Move: compass')),'the top title and repeated hints are removed');
    const fire=page.locator('#ctx-bar [data-game-key="f"]'),boost=page.locator('#ctx-bar [data-game-key="b"]');
    assert.ok(await fire.isDisabled());assert.match(await fire.textContent(),/Out of range/);
    const turn=await page.evaluate(()=>G.turn);await page.keyboard.press('f');
    assert.equal(await page.evaluate(()=>G.turn),turn);
    assert.match(await page.locator('#log-list').textContent(),/Out of range/,'failed action messages use the sidebar');
    await page.evaluate(()=>{const combat=G.shipCombat;combat.enemies[0].x=combat.player.x+3;combat.enemies[0].y=combat.player.y;renderAll();});
    assert.ok(await fire.isEnabled());assert.equal((await readout()).lines.length,0,'idle targeting has no dotted line');
    for(const condition of ['reload','heat','power','sensors','cover']){
      await page.evaluate(condition=>{
        G.ship.heat=0;G.ship.weaponReadyAt=[G.turn];
        for(const core of Object.values(G.ship.systems)){core.condition=100;core.bypassUntil=0;}
        G.shipCombat.asteroids=[];
        if(condition==='reload')G.ship.weaponReadyAt=[G.turn+2];
        if(condition==='heat')G.ship.heat=shipHeatCapacity();
        if(condition==='power')G.ship.systems.reactor.condition=0;
        if(condition==='sensors')G.ship.systems.sensors.condition=0;
        if(condition==='cover')G.shipCombat.asteroids=[{x:G.shipCombat.player.x+1,y:G.shipCombat.player.y}];
        renderAll();
      },condition);
      assert.ok(await fire.isDisabled(),condition+' prevents pointer firing');
      const current=await readout();assert.ok(!current.lines.includes('#81d7aa'),condition+' cannot show a ready aim line');
      const before=await page.evaluate(()=>[G.turn,G.fuel]);await page.keyboard.press('f');
      assert.deepEqual(await page.evaluate(()=>[G.turn,G.fuel]),before,'invalid fire is free');
    }
    await page.evaluate(()=>{
      G.shipCombat.asteroids=[];G.ship.heat=0;G.ship.weaponReadyAt=[G.turn];
      for(const core of Object.values(G.ship.systems))core.condition=100;
      G.shipCombat.asteroids=[{x:G.shipCombat.player.x+1,y:G.shipCombat.player.y}];renderAll();
    });
    assert.ok(await boost.isDisabled());assert.match(await boost.textContent(),/Path blocked/);
    await page.evaluate(()=>{G.shipCombat.asteroids=[];G.fuel=1;renderAll();});
    assert.ok(await boost.isDisabled());assert.match(await boost.textContent(),/Needs 2 fuel/);
    await page.evaluate(()=>{G.fuel=G.maxFuel;G.shipStats.shields=1;G.ship.shieldCharge=20;renderAll();});
    for(const state of ['full','delayed','charging','damaged','failed','unpowered','heatlimited']){
      const expected=await page.evaluate(state=>{
        G.ship.systems.shields.condition=100;G.ship.systems.reactor.condition=100;
        G.ship.shieldCharge=20;G.ship.shieldRechargeAt=G.turn;G.ship.heat=0;
        if(state==='delayed'){G.ship.shieldCharge=10;G.ship.shieldRechargeAt=G.turn+2;}
        if(state==='charging')G.ship.shieldCharge=10;
        if(state==='damaged'){G.ship.systems.shields.condition=50;G.ship.shieldCharge=10;}
        if(state==='failed')G.ship.systems.shields.condition=0;
        if(state==='unpowered')G.ship.systems.reactor.condition=0;
        if(state==='heatlimited'){G.ship.shieldCharge=10;G.ship.heat=shipHeatCapacity()+shipCoolingRate();}
        renderAll();return shipShieldReadout().state;
      },state);
      view=await readout();assert.ok(view.text.some(text=>text.startsWith(expected)),state+' is accurately labelled');
      if(state==='damaged')assert.ok(view.text.some(text=>text.includes('damaged')));
    }
    await page.evaluate(()=>{
      G.shipStats.shields=0;G.ship.shieldCharge=0;G.ship.heat=0;G.ship.systems.reactor.condition=100;
      G.ship.systems.shields.condition=100;G.shipCombat.asteroids=[];G.ship.weaponReadyAt=[G.turn];renderAll();
    });
    await page.keyboard.press('F3');
    assert.equal(await page.evaluate(()=>canvasMenuTargets.some(target=>target.label==='Shield generator')),false);
    await page.keyboard.press('Escape');await page.keyboard.press('f');
    assert.equal(await page.evaluate(()=>G.turn),turn+1);
    assert.match(await page.locator('#log-list').textContent(),/Mass Driver hits UI Raider/);
    assert.ok(await page.evaluate(()=>!('log' in G.shipCombat) && G.log.some(entry=>entry.category==='combat' && !entry.archive)));
    const font=await page.locator('#log-list .log-entry').first().evaluate(element=>parseFloat(getComputedStyle(element).fontSize));
    await page.keyboard.press('=');
    assert.equal(await page.locator('#log-list .log-entry').first().evaluate(element=>parseFloat(getComputedStyle(element).fontSize)),font+1);
    assert.ok(await page.evaluate(()=>autoSave()));assert.ok(await page.evaluate(()=>loadFromStorage()));
    assert.match(await page.locator('#log-list').textContent(),/Mass Driver hits UI Raider/);
    assert.ok(await page.evaluate(()=>{
      const save=JSON.parse(serializeCareer(G));
      const entry=save.log.find(entry=>entry.msg.includes('Mass Driver hits'));
      const msg=entry.msg,turn=entry.turn;entry.msg='[UI Raider] '+msg;entry.archive=true;delete entry.category;
      save.shipCombat.log=[msg];save.shipCombat.logFontSize=12;
      installSaveSnapshot(parseSaveSnapshot(JSON.stringify(save)));renderAll();
      return !('log' in G.shipCombat) && G.log.some(entry=>entry.category==='combat' && !entry.archive && entry.turn===turn && entry.msg.endsWith(msg));
    }),'older schema-2 combat logs are promoted once without losing their turn');
    await page.getByRole('button',{name:'Shortcuts',exact:true}).click();
    assert.ok(await page.locator('#combat-shortcuts').isVisible());assert.ok(await page.locator('#travel-shortcuts').isHidden());
    await page.getByRole('button',{name:'Shortcuts',exact:true}).click();
    await page.screenshot({path:artifactPath('Combat-UI-unshielded.png')});
    assert.ok(await page.evaluate(()=>{
      G.shipCombat.enemies[0].ship.hp=1;G.ship.weaponReadyAt=[G.turn];G.ship.heat=0;
      doShipFire();
      const victories=G.log.filter(entry=>entry.msg.includes('UI Raider destroyed.'));
      return G.mode==='galaxy' && victories.length===1 && victories[0].count===1 && victories[0].category==='combat' && G.log.indexOf(victories[0])<G.log.findIndex(entry=>entry.msg.includes('Mass Driver hits'));
    }),'victory is recorded exactly once in the sidebar/history');

    await page.evaluate(()=>{
      G.mode='galaxy';G.shipCombat=null;
      const gas={name:'Natural Wraith',x:G.ship.x,y:G.ship.y,hp:40,maxHp:40,alive:true,atk:4,engineRating:2,guns:1,_homeCluster:[{x:G.ship.x,y:G.ship.y}]};
      G.gasEntities=[gas];startShipCombat(gas);renderAll();
    });
    view=await readout();let target=view.text.slice(view.text.indexOf('Natural Wraith'));
    assert.ok(!view.text.includes('WEAPON MOUNTS'),'mounts no longer interrupt the right-hand ship readouts');
    assert.ok(view.allPositions.some(entry=>entry.text==='WEAPON MOUNTS' && entry.x<674 && entry.y>420),'mounts occupy the strip under the arena');
    assert.equal(view.positions.at(-1).y,462,'natural target details are anchored to the panel bottom');
    assert.ok(target.some(text=>text.includes('Ram range')));assert.ok(!target.some(text=>/Heat|Shields|Weapon range/.test(text)));
    await page.evaluate(()=>{
      G.mode='galaxy';G.shipCombat=null;
      const trader={name:'Unarmed Trader',type:'trader',x:G.ship.x,y:G.ship.y,guns:0,alive:true};
      G.neutralShips=[trader];startShipCombat(trader);renderAll();
    });
    view=await readout();assert.ok(view.text.includes('Unarmed'));assert.ok(!view.text.includes('Mounts offline'));
    await page.evaluate(()=>{
      G.mode='galaxy';G.shipCombat=null;
      G.shipStats=buildShipStats('ATTACK_CORVETTE',{weapons:1,shields:5,reactor:2});
      G.installedWeapons=['railgun','laser_cannon','pulse_laser'];G.ship.systems.engine.condition=0;
      G.ship.systems.reactor.condition=75;G.ship.systems.cooling.condition=0;
      G.ship.shieldCharge=10;G.ship.shieldRechargeAt=G.turn+2;
      const enemy={name:'Long Range Heavy Cruiser With Reinforced Armour',x:G.ship.x,y:G.ship.y,hp:300,maxHp:300,guns:2,atk:8,engineRating:2,shields:2,alive:true,pirateType:'guard'};
      G.pirates=[enemy];startShipCombat(enemy);enemy.shieldCharge=10;renderAll();
    });
    for(const viewport of [{width:1400,height:720},{width:1000,height:620}]){
      await page.setViewportSize(viewport);view=await readout();
      assert.ok(view.allPositions.every(entry=>entry.y<=472),'three mounts and damaged systems fit the canvas');
      assert.equal(view.positions.at(-1).y,462,'expanded enemy details retain the bottom anchor');
      const shipEnd=view.positions.filter(entry=>entry.y<200).at(-1).y;
      const enemyStart=view.positions.find(entry=>entry.text.startsWith('Long Range Heavy')).y;
      assert.ok(enemyStart>shipEnd+40,'ship and enemy details leave flexible space in the middle');
      const cards=await page.evaluate(()=>canvasMenuTargets.filter(target=>target.x<674 && target.y>420 && target.activate).map(target=>({x:target.x,y:target.y,w:target.w,h:target.h})));
      assert.equal(cards.length,3,'all three mount cards remain interactive below the map');
      assert.ok(cards.every(card=>card.x>=12 && card.x+card.w<=660 && card.y+card.h<=472));
      assert.ok(await page.evaluate(()=>{
        const before=G.turn;
        const cards=canvasMenuTargets.filter(target=>target.x<674 && target.y>420 && target.activate);
        cards[1].activate();
        const selected=G.shipCombat.weapon===1 && G.turn===before;
        selectShipCombatWeapon(0);
        return selected;
      }),'mount card activation selects its weapon without spending a turn');
      await page.screenshot({path:artifactPath('Combat-UI-damaged-'+viewport.width+'.png')});
    }

    await page.evaluate(()=>{G.mode='galaxy';G.shipCombat=null;G.cargo=[{name:'UI Test Cargo',desc:'Cargo details remain accessible.'}];G.shipStats.cargoCapacity=1;renderAll();});
    await page.keyboard.press('i');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#ctx-bar [data-game-key="x"]').count(),0);
    assert.equal(await page.locator('#ctx-bar [data-game-key="Escape"]').count(),0);
    assert.ok(await page.evaluate(()=>{
      const keys=new Set(canvasMenuTargets.filter(target=>target.shortcut).map(target=>target.shortcut));
      return [...document.querySelectorAll('#ctx-bar button')].every(button=>!keys.has(button.dataset.gameKey));
    }),'explicit menu buttons replace their duplicate context controls');
    await page.keyboard.press('x');assert.match(await page.locator('#sidebar').textContent(),/UI Test Cargo/);
    // Bars, result colors and the real save/menu/Continue path share a fresh encounter.
    await page.evaluate(()=>initGame('ATTACK_CORVETTE','Color QA','Color QA'));
    await page.waitForFunction(()=>G?.shipName==='Color QA' && G.log.some(entry=>entry.msg.includes('Ready for departure')));
    await page.evaluate(()=>{
      const enemy={name:'Color Raider',x:G.ship.x,y:G.ship.y,hp:150,maxHp:300,guns:1,atk:6,engineRating:2,shields:1,alive:true,pirateType:'guard'};
      G.pirates=[enemy];G.installedWeapons=['mass_driver'];startShipCombat(enemy);
      enemy.shieldCharge=10;enemy.weaponReadyAt=[G.turn+100];
      const combat=G.shipCombat;combat.asteroids=[];combat.enemies[0].x=combat.player.x+3;combat.enemies[0].y=combat.player.y;renderAll();
    });
    view=await readout();
    const own=view.text.slice(0,view.text.indexOf('Color Raider'));
    assert.ok(!own.some(text=>text.startsWith('Hull ')),'the left gauge owns the player hull display');
    for(const [label,color] of [['Hull 150/300','#e4b98c'],['Shields 10/20','#81c5df']]){
      const y=view.positions.find(entry=>entry.text===label).y;
      assert.ok(view.rects.some(rect=>rect.y===y+5 && rect.w===127 && rect.color===color),'selected target has an accurate half-full '+label+' bar');
    }
    for(const test of [
      {side:'player',hit:true,cls:'lg',rgb:'rgb(144, 240, 160)'},
      {side:'player',hit:false,cls:'ln',rgb:'rgb(145, 154, 162)'},
      {side:'enemy',hit:false,cls:'ll',rgb:'rgb(255, 224, 144)'},
      {side:'enemy',hit:true,cls:'lc',rgb:'rgb(240, 144, 144)'}
    ]){
      await page.evaluate(test=>{
        const enemy=G.shipCombat.enemies[0].ship;
        Math.random=()=>test.hit?0.5:0.999999;
        G.ship.heat=0;G.ship.weaponReadyAt=[G.turn];enemy.heat=0;
        enemy.weaponReadyAt=[G.turn+(test.side==='enemy'?1:100)];renderAll();
      },test);
      await page.keyboard.press(test.side==='player'?'f':'Space');
      const entry=await page.evaluate(test=>G.log.find(entry=>test.side==='player'?entry.msg.startsWith('Mass Driver '+(test.hit?'hits':'misses')+' Color Raider'):entry.msg.startsWith('Color Raider fires') && (test.hit?!entry.msg.includes('miss.'):entry.msg.includes('miss.'))),test);
      assert.equal(entry.cls,test.cls);
      const node=page.locator('#log-list .log-entry').filter({hasText:entry.msg}).last();
      assert.equal(await node.evaluate(element=>getComputedStyle(element).color),test.rgb);
    }
    const snapshot=()=>page.evaluate(()=>JSON.stringify([G.turn,G.ship.hp,G.fuel,G.credits,G.ship.systems,G.shipCombat.round,G.shipCombat.player,G.shipCombat.trails,G.shipCombat.enemies.map(enemy=>[enemy.ship.hp,enemy.ship.heat,enemy.ship.weaponReadyAt])]));
    for(const pointer of [false,true]){
      const before=await snapshot();
      if(pointer)await page.locator('#game-escape').click();else await page.keyboard.press('Escape');
      await page.waitForFunction(()=>G===null && !AUTOSAVE_STATE.transition);
      assert.equal(await page.evaluate(()=>MENU_STATE.screen),'main');
      await page.keyboard.press('Enter');
      await page.waitForFunction(()=>G?.mode==='shipcombat' && !AUTOSAVE_STATE.transition && !AUTOSAVE_STATE.loading);
      assert.equal(await snapshot(),before,'Escape saves and resumes the same encounter without disengaging or advancing time');
      assert.ok(await page.evaluate(()=>['lg','ln','ll','lc'].every(cls=>G.log.some(entry=>entry.cls===cls && entry.category==='combat'))));
    }
    await page.screenshot({path:artifactPath('Combat-target-bars-and-colors.png')});
    assert.deepEqual(errors,[]);
    console.log('PASS: shared sidebar combat history, legacy log recovery, truthful shields/actions/aiming, quiet diagnostics, natural and unarmed targets, shortcuts and compact three-mount layout.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
