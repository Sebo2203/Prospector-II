const assert = require('node:assert/strict');
const {chromium,gameUrl,artifactPath} = require('./runtime.cjs');

(async()=>{
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1000,height:620}});
    const errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route(/^https?:/,route=>route.abort());
    await page.goto(gameUrl);
    await page.waitForFunction(()=>G===null && canvasMenuTargets.length && !AUTOSAVE_STATE.loading);
    const game = page.locator('#gc');
    async function point(x,y){
      const rect = await game.boundingBox();
      const size = await game.evaluate(el=>({width:el.width,height:el.height}));
      return [rect.x+x*rect.width/size.width,rect.y+y*rect.height/size.height];
    }
    async function click(x,y){ await page.mouse.click(...await point(x,y)); }
    async function press(key){ await page.keyboard.press(key); }
    const action = text=>page.locator('#ctx-bar button').filter({hasText:text}).first();
    const escape = page.locator('#game-escape');
    const menuScreen = ()=>page.evaluate(()=>MENU_STATE.screen);
    const mode = ()=>page.evaluate(()=>G.mode);

    assert.equal(await escape.isVisible(),false);
    await click(700,292);
    assert.equal(await menuScreen(),'options');
    assert.equal(await escape.isVisible(),false);
    const ascii = await page.evaluate(()=>OPTIONS.asciiMode);
    await click(700,160);
    assert.notEqual(await page.evaluate(()=>OPTIONS.asciiMode),ascii);
    await press('Enter');
    assert.equal(await page.evaluate(()=>OPTIONS.asciiMode),ascii);
    await click(700,210);
    assert.equal(await menuScreen(),'keybindings');
    await click(700,153);
    assert.equal(await page.evaluate(()=>MENU_STATE._rebinding),'n');
    await page.locator('#pointer-keys-toggle').click();
    await page.locator('#pointer-keys [data-code="KeyK"]').click();
    assert.equal(await page.evaluate(()=>OPTIONS.keybinds.n),'KeyK');
    await click(700,419);
    assert.equal(await page.evaluate(()=>OPTIONS.keybinds.n),'KeyW');
    await press('Escape');
    await press('Escape');

    await click(700,195);
    assert.equal(await menuScreen(),'intro');
    const begin = await page.evaluate(()=>{
      const target = canvasMenuTargets.find(row=>row.activate===openShipSelection);
      return [target.x+target.w/2,target.y+target.h/2];
    });
    await click(...begin);
    assert.equal(await menuScreen(),'ship_select');
    assert.equal(await escape.isVisible(),false);
    await page.mouse.move(...await point(1010,160));
    assert.equal(await page.evaluate(()=>MENU_STATE.shipSel),2);
    assert.deepEqual(await page.evaluate(()=>Array.from(ctx.getImageData(880,292,1,1).data)),[14,26,46,255]);
    await press('ArrowLeft');
    assert.equal(await page.evaluate(()=>MENU_STATE.shipSel),1);
    await page.mouse.move(...await point(390,160));
    assert.equal(await page.evaluate(()=>MENU_STATE.shipSel),0);
    assert.equal(await menuScreen(),'ship_select');
    await press('Enter');
    assert.equal(await page.evaluate(()=>MENU_STATE.chosenClass),'LIGHT_SCOUT');
    await click(502,368);
    assert.equal(await menuScreen(),'ship_select');
    await click(700,160);
    assert.equal(await menuScreen(),'naming');
    assert.equal(await escape.isVisible(),false);
    await game.screenshot({path:artifactPath('Vessel-registration.png')});
    await page.locator('#pointer-keys-toggle').click();
    for(const key of ['p','i','l','o','t']) await page.locator('#pointer-keys').getByRole('button',{name:key,exact:true}).click();
    await click(857,367);
    for(const key of ['s','h','i','p']) await page.locator('#pointer-keys').getByRole('button',{name:key,exact:true}).click();
    await click(857,367);
    await page.waitForFunction(()=>G?.galaxy && G.log.some(entry=>entry.msg.includes('Ready for departure')));
    assert.deepEqual(await page.evaluate(()=>[G.shipStats.classId,G.crew.find(c=>c.role==='captain').name,G.shipName]),['BULK_FREIGHTER','pilot','ship']);
    assert.equal(await escape.isVisible(),true);
    assert.equal(await page.locator('#persist-hints').isVisible(),false);

    await action(/Dock at Starbase/).click();
    assert.equal(await mode(),'base');
    await page.evaluate(()=>{ G.fuel=G.maxFuel-5; renderAll(); });
    await click(200,65);
    assert.equal(await page.evaluate(()=>G.base.screen),'sub');
    await click(200,65);
    assert.equal(await page.evaluate(()=>G.base.hangarSub),'maintenance');
    await click(200,102);
    assert.equal(await page.evaluate(()=>G.fuel),await page.evaluate(()=>G.maxFuel));
    await escape.click();
    await escape.click();
    assert.equal(await mode(),'galaxy');

    await page.evaluate(()=>{
      G.neutralShips=[{type:'patrol',name:'Pointer Patrol',x:G.ship.x+1,y:G.ship.y}];
      renderAll();
    });
    await action(/Hail Pointer Patrol/).click();
    const patrolTurn = await page.evaluate(()=>G.turn);
    await page.locator('.cmp-btn[data-dx="1"][data-dy="0"]').click();
    assert.equal(await page.evaluate(()=>G.turn),patrolTurn);
    await action(/\[↓\] Select reply/).click();
    await action(/Ask about threats/).click();
    assert.equal(await page.evaluate(()=>G.dialogue.node),'threats');
    await escape.click();
    assert.equal(await page.evaluate(()=>G.dialogue),null);
    await page.locator('#minimap-max-btn').click();
    assert.equal(await page.locator('#minimap-overlay').isVisible(),true);
    await escape.click();
    assert.equal(await page.locator('#minimap-overlay').isVisible(),false);

    const legend=page.locator('#persist-hints');
    const toggle=page.locator('#shortcut-toggle');
    const footer=await page.locator('#persist-bar').boundingBox();
    assert.ok((await toggle.boundingBox()).y-footer.y<10);
    assert.equal(await legend.isVisible(),false);
    assert.equal(await toggle.getAttribute('aria-expanded'),'false');
    await toggle.click();
    assert.equal(await legend.isVisible(),true);
    assert.equal(await toggle.getAttribute('aria-expanded'),'true');
    await page.locator('#persist-bar').screenshot({path:artifactPath('Shortcut-legend.png')});
    assert.equal(await legend.locator('button,a,[tabindex],[onclick]').count(),0);
    for(const key of ['I','O']){
      const label=legend.locator('.ck').filter({hasText:new RegExp('^'+key+'$')});
      const color=await label.evaluate(el=>getComputedStyle(el).color);
      await label.hover();
      assert.equal(await label.evaluate(el=>getComputedStyle(el).color),color);
      await label.click();
      assert.equal(await mode(),'galaxy');
      assert.equal(await page.evaluate(()=>!!G.showOptions),false);
    }
    await toggle.focus();
    await press('Enter');
    assert.equal(await legend.isVisible(),false);
    assert.equal(await toggle.getAttribute('aria-expanded'),'false');
    await press('Space');
    assert.equal(await legend.isVisible(),true);
    await toggle.click();
    assert.equal(await legend.isVisible(),false);
    await action(/\[O\] Options/).click();
    assert.equal(await page.evaluate(()=>G.showOptions),true);
    await click(480,211);
    assert.equal(await page.evaluate(()=>G._kbScreen),true);
    await press('Escape');
    await click(480,309);
    assert.equal(await page.locator('#feedback-overlay').isVisible(),true);
    await page.locator('#feedback-msg').click();
    await page.locator('#pointer-keys-toggle').click();
    await page.locator('#pointer-keys').getByRole('button',{name:'a',exact:true}).click();
    assert.equal(await page.locator('#feedback-msg').inputValue(),'a');
    await escape.click();
    assert.equal(await page.locator('#feedback-overlay').isVisible(),false);
    assert.equal(await page.evaluate(()=>G.showOptions),true);
    await escape.click();
    assert.equal(await page.evaluate(()=>G.showOptions),false);

    await page.evaluate(()=>{
      const extra=['scientist','medic','mercenary','mercenary','mercenary','mercenary','mercenary','mercenary','redshirt'];
      G.crew.push(...extra.map(randomCrewMember));
      G.crew[0].hp=5;
      G.inventory=[{name:'Medikit',usable:'medikit',col:'#88ff88'}];
      G._viewInvSel=0;
      G.cargo=[
        {name:'Sample A',col:'#aaffaa',desc:'Mineral sample A.'},
        {name:'Sample B',col:'#aaaaff',desc:'Mineral sample B.'},
      ];
      renderAll();
    });
    await action(/\[I\] Inventory/).click();
    await action(/Use Medikit/).click();
    assert.ok(await page.evaluate(()=>G.crew[0].hp>5 && !G.inventory.length));
    await click(420,20);
    assert.equal(await page.evaluate(()=>G._viewTab),'crew');
    await click(125,130);
    assert.equal(await page.evaluate(()=>G._viewCrewSel),1);
    await press('ArrowDown');
    assert.equal(await page.evaluate(()=>G._viewCrewSel),2);
    await page.mouse.move(...await point(125,200));
    for(let i=3;i<=11;i++){
      await page.mouse.wheel(0,100);
      await page.waitForFunction(index=>G._viewCrewSel===index,i);
    }
    await page.waitForFunction(()=>G._viewCrewSel===11);
    await click(125,365);
    assert.equal(await page.evaluate(()=>G._viewCrewSel),11);
    await click(315,440);
    assert.equal(await page.evaluate(()=>G.dialogue.id),'crew_basic');
    await press('Escape');

    await click(535,20);
    assert.equal(await page.evaluate(()=>G._viewTab),'ship');
    const cargoPoint = [105,435];
    await page.mouse.move(...await point(...cargoPoint));
    assert.equal(await game.getAttribute('title'),'Sample B — Mineral sample B.');
    assert.equal(await page.evaluate(()=>G._cargoSel),0);
    await click(...cargoPoint);
    assert.equal(await page.evaluate(()=>G._cargoSel),1);
    assert.match(await page.locator('#crew-list').textContent(),/Mineral sample B/);
    await press('x');
    assert.equal(await page.evaluate(()=>G._cargoExamine),false);
    await press('x');
    assert.match(await page.locator('#crew-list').textContent(),/Mineral sample B/);
    await escape.click();
    assert.equal(await mode(),'inventory');
    await escape.click();

    const before = await page.evaluate(()=>[G.ship.x,G.ship.y,G.turn]);
    await click(480,220);
    assert.deepEqual(await page.evaluate(()=>[G.ship.x,G.ship.y,G.turn]),before);
    await action(/\[X\] Examine/).click();
    await click(5*24+12,6*24+12);
    const examined = await page.evaluate(()=>({
      x:Math.max(0,Math.min(MAP_W-VIEW_W,G.ship.x-Math.floor(VIEW_W/2)))+5,
      y:Math.max(0,Math.min(MAP_H-VIEW_H,G.ship.y-Math.floor(VIEW_H/2)))+6,
    }));
    assert.deepEqual(await page.evaluate(()=>G.examine),examined);
    assert.deepEqual(await page.evaluate(()=>[G.ship.x,G.ship.y,G.turn]),before);
    await escape.click();
    await page.locator('.cmp-btn[data-dx="1"][data-dy="0"]').click();
    assert.equal(await page.evaluate(()=>G.ship.x),before[0]+1);
    const wait = page.locator('.cmp-center');
    const turnBeforeWait=await page.evaluate(()=>G.turn);
    await wait.hover();
    assert.equal(await wait.evaluate(el=>getComputedStyle(el).cursor),'pointer');
    await wait.click();
    assert.equal(await page.evaluate(()=>G.turn),turnBeforeWait+1);

    await page.evaluate(()=>{ debugEnterPalette('galaxy'); debugPaletteVisit('galaxy:CASINO'); });
    await action(/Dock at The Void Royale/).click();
    assert.equal(await mode(),'planet');
    const snapshot = await page.evaluate(()=>[G.player.x,G.player.y,G.turn,G.inventory.length]);
    await click(480,220);
    assert.deepEqual(await page.evaluate(()=>[G.player.x,G.player.y,G.turn,G.inventory.length]),snapshot);
    await action(/\[X\] Examine/).click();
    await page.locator('.cmp-btn[data-dx="1"][data-dy="0"]').click();
    assert.equal(await page.evaluate(()=>G.examine.x),snapshot[0]+1);
    await click(2*24+12,3*24+12);
    assert.deepEqual(await page.evaluate(()=>G.examine),{x:2,y:3});
    assert.deepEqual(await page.evaluate(()=>[G.player.x,G.player.y,G.turn,G.inventory.length]),snapshot);
    await escape.click();
    assert.equal(await page.evaluate(()=>G.examine),null);
    await page.evaluate(()=>{
      G.mode='casino';
      ensureCasinoState();
      G.casino.screen='main';
      renderAll();
    });
    await click(350,170);
    assert.equal(await page.evaluate(()=>G.casino.screen),'poker');
    await click(350,201);
    assert.equal(await page.evaluate(()=>G.casino.poker.phase),'hold');
    await click(245,240);
    assert.equal(await page.evaluate(()=>G.casino.poker.hold[0]),true);
    await press('1');
    assert.equal(await page.evaluate(()=>G.casino.poker.hold[0]),false);

    await page.evaluate(()=>debugPaletteVisit('biome:HABITABLE'));
    await action(/Enter orbit/).click();
    assert.equal(await mode(),'system');
    assert.equal(await page.locator('#h-mode').textContent(),'ORBITAL VIEW');
    await action(/View scan/).click();
    assert.equal(await mode(),'scanview');
    assert.equal(await page.locator('#h-mode').textContent(),'ORBITAL SCAN');
    const cursor = await page.evaluate(()=>[G.scanCursorX,PW(G.planets[G.scanViewKey])]);
    await page.locator('.cmp-btn[data-dx="1"][data-dy="0"]').click();
    assert.equal(await page.evaluate(()=>G.scanCursorX),Math.min(cursor[0]+1,cursor[1]-1));
    const site=await page.evaluate(()=>{
      const data=G.planets[G.scanViewKey];
      const camX=Math.max(0,Math.min(PW(data)-VIEW_W,G.scanCursorX-Math.floor(VIEW_W/2)));
      const camY=Math.max(0,Math.min(PH(data)-VIEW_H,G.scanCursorY-Math.floor(VIEW_H/2)));
      for(let row=1;row<VIEW_H-1;row++) for(let col=0;col<VIEW_W;col++){
        const x=camX+col,y=camY+row;
        if((x!==G.scanCursorX || y!==G.scanCursorY) && canLandAt(data,x,y)) return {x,y,col,row};
      }
      throw Error('No alternate visible landing site');
    });
    await click(site.col*24+12,site.row*24+12);
    assert.equal(await mode(),'scanview');
    assert.deepEqual(await page.evaluate(()=>[G.scanCursorX,G.scanCursorY]),[site.x,site.y]);
    await action(/Land at selected site/).click();
    assert.equal(await mode(),'planet');
    assert.equal(await page.locator('#h-mode').textContent(),'SURFACE');
    assert.deepEqual(await page.evaluate(()=>[G.player.x,G.player.y]),[site.x,site.y]);

    // Isolate a three-tile sight line from the real landed ship at dusk and dawn.
    for(const brightening of [false,true]){
      const before=await page.evaluate(brightening=>{
        const data=G.planets[G.curPlanet], {x,y}=G.player;
        if(data.grid[y][x].type!=='SHIP') throw Error('Wait fixture must start on the ship');
        const fullVision=DEBUG.fullVision;
        DEBUG.fullVision=false;
        const step=x+3<PW(data)?1:-1;
        for(let distance=1;distance<=3;distance++) data.grid[y][x+step*distance]={type:'EARTH_FLOOR'};
        G.enemies[G.curPlanet]=[];
        const day=BIOMES[data.biome].dayLength;
        const start=brightening?3*day:2*day, end=start+day;
        const radius=()=>Math.round(planetVisionRadius(G.curPlanet));
        for(let t=start;t<end;t++){
          data.planetTurn=t;
          const previous=radius();
          data.planetTurn=t+1;
          const next=radius();
          if(previous===(brightening?2:3)&&next===(brightening?3:2)){
            data.planetTurn=t;
            revealPlanet(G.curPlanet,x,y);
            const index=y*PW(data)+x+step*3;
            return {x,y,index,turn:G.turn,planetTurn:t,fullVision,lit:data.lit[index]};
          }
        }
        throw Error('Could not find the day-night visibility boundary');
      },brightening);
      assert.equal(before.lit,!brightening);
      if(brightening) await press('.');
      else await page.locator('.cmp-center').click();
      const after=await page.evaluate(({index,fullVision})=>{
        DEBUG.fullVision=fullVision;
        const data=G.planets[G.curPlanet];
        return {x:G.player.x,y:G.player.y,turn:G.turn,planetTurn:data.planetTurn,lit:data.lit[index],visited:data.visited[index]};
      },before);
      assert.deepEqual(after,{
        x:before.x,y:before.y,turn:before.turn+1,planetTurn:before.planetTurn+1,lit:brightening,visited:true
      },'waiting on the ship refreshes sight and preserves discovered terrain');
    }

    await page.evaluate(()=>{
      G.crew[0].weapon='Pistol';
      G.crew[0].weaponUsable='gun';
      G.enemies[G.curPlanet]=[];
      renderAll();
    });
    await action(/Fire ranged weapon/).click();
    const shot=await page.evaluate(()=>{
      const data=G.planets[G.curPlanet];
      const {x,y}=G.player;
      const camX=Math.max(0,Math.min(PW(data)-VIEW_W,x-Math.floor(VIEW_W/2)));
      const camY=Math.max(0,Math.min(PH(data)-VIEW_H,y-Math.floor(VIEW_H/2)));
      const tx=x+1<PW(data)?x+1:x-1;
      const ty=G.rangeTarget.y;
      return {x:tx,y:ty,col:tx-camX,row:ty-camY,turn:G.turn};
    });
    await press(shot.x>site.x?'ArrowRight':'ArrowLeft');
    assert.deepEqual(await page.evaluate(()=>G.rangeTarget),{x:shot.x,y:shot.y});
    await click(shot.col*24+12,shot.row*24+12);
    assert.equal(await page.evaluate(()=>G.turn),shot.turn);
    await click(shot.col*24+12,shot.row*24+12);
    assert.equal(await page.evaluate(()=>G.turn),shot.turn+1);
    assert.equal(await page.evaluate(()=>G.rangeTarget),null);

    await page.evaluate(()=>{
      debugPaletteVisit('galaxy:PATROL');
      G.shipStats=buildShipStats('ATTACK_CORVETTE');
      G.installedWeapons=['pulse_laser'];
      startShipCombat(G.neutralShips.find(ship=>ship.type==='patrol'));
    });
    const combat = await page.evaluate(()=>[G.turn,G.ship.hp,G.shipCombat.pirate.hp]);
    await click(290,455);
    assert.deepEqual(await page.evaluate(()=>[G.turn,G.ship.hp,G.shipCombat.pirate.hp]),combat);
    const font = await page.evaluate(()=>G.shipCombat.logFontSize);
    await press('=');
    assert.equal(await page.evaluate(()=>G.shipCombat.logFontSize),font+1);
    await page.evaluate(()=>{
      const fire=doShipFire;
      window.qaFireCount=0;
      doShipFire=()=>{ qaFireCount++; fire(); };
    });
    await action(/Fire Pulse Laser/).click();
    assert.equal(await page.evaluate(()=>qaFireCount),1);

    assert.deepEqual(errors,[]);
    console.log('PASS: pointer and keyboard menu actions, large crews, cargo details, modal isolation and the compass exception.');
  } finally { await browser.close(); }
})().catch(error=>{ console.error(error); process.exit(1); });
