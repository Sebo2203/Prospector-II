const assert = require('node:assert/strict');
const {chromium,gameUrl} = require('./runtime.cjs');

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
    const menuScreen = ()=>page.evaluate(()=>MENU_STATE.screen);
    const mode = ()=>page.evaluate(()=>G.mode);

    await click(700,292);
    assert.equal(await menuScreen(),'options');
    const ascii = await page.evaluate(()=>OPTIONS.asciiMode);
    await click(700,160);
    assert.notEqual(await page.evaluate(()=>OPTIONS.asciiMode),ascii);
    await press('Enter');
    assert.equal(await page.evaluate(()=>OPTIONS.asciiMode),ascii);
    await click(700,210);
    assert.equal(await menuScreen(),'keybindings');
    await click(700,153);
    assert.equal(await page.evaluate(()=>MENU_STATE._rebinding),'n');
    await press('k');
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
    await click(700,160);
    assert.equal(await menuScreen(),'naming');
    await page.keyboard.type('Pointer QA');
    await click(857,284);
    await page.keyboard.type('Menu Ship');
    await click(857,284);
    await page.waitForFunction(()=>G?.galaxy && G.log.some(entry=>entry.msg.includes('Ready for departure')));
    assert.deepEqual(await page.evaluate(()=>[G.shipStats.classId,G.shipName]),['BULK_FREIGHTER','Menu Ship']);

    await press('Enter');
    assert.equal(await mode(),'base');
    await page.evaluate(()=>{ G.fuel=G.maxFuel-5; renderAll(); });
    await click(200,65);
    assert.equal(await page.evaluate(()=>G.base.screen),'sub');
    await click(200,65);
    assert.equal(await page.evaluate(()=>G.base.hangarSub),'maintenance');
    await click(200,102);
    assert.equal(await page.evaluate(()=>G.fuel),await page.evaluate(()=>G.maxFuel));
    await press('Escape');
    await click(83,463);
    assert.equal(await mode(),'galaxy');

    await page.evaluate(()=>{
      G.neutralShips=[{type:'patrol',name:'Pointer Patrol',x:G.ship.x+1,y:G.ship.y}];
      renderAll();
    });
    await press('h');
    const patrolTurn = await page.evaluate(()=>G.turn);
    await page.locator('.cmp-btn[data-dx="1"][data-dy="0"]').click();
    assert.equal(await page.evaluate(()=>G.turn),patrolTurn);
    await click(350,313);
    assert.equal(await page.evaluate(()=>G.dialogue.node),'threats');
    await press('Escape');

    await page.locator('#options-menu-btn').click();
    assert.equal(await page.evaluate(()=>G.showOptions),true);
    await click(480,211);
    assert.equal(await page.evaluate(()=>G._kbScreen),true);
    await press('Escape');
    await press('Escape');
    assert.equal(await page.evaluate(()=>G.showOptions),false);

    await page.evaluate(()=>{
      const extra=['scientist','medic','mercenary','mercenary','mercenary','mercenary','mercenary','mercenary','redshirt'];
      G.crew.push(...extra.map(randomCrewMember));
      G.cargo=[
        {name:'Sample A',col:'#aaffaa',desc:'Mineral sample A.'},
        {name:'Sample B',col:'#aaaaff',desc:'Mineral sample B.'},
      ];
      renderAll();
    });
    await page.locator('#inventory-menu-btn').click();
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
    await press('Escape');
    await press('Escape');

    const before = await page.evaluate(()=>[G.ship.x,G.ship.y,G.turn]);
    await click(480,220);
    assert.deepEqual(await page.evaluate(()=>[G.ship.x,G.ship.y,G.turn]),before);
    await page.locator('.cmp-btn[data-dx="1"][data-dy="0"]').click();
    assert.equal(await page.evaluate(()=>G.ship.x),before[0]+1);

    await page.evaluate(()=>{ debugEnterPalette('galaxy'); debugPaletteVisit('galaxy:CASINO'); });
    await press('Enter');
    assert.equal(await mode(),'planet');
    const snapshot = await page.evaluate(()=>[G.player.x,G.player.y,G.turn,G.inventory.length]);
    await click(480,220);
    assert.deepEqual(await page.evaluate(()=>[G.player.x,G.player.y,G.turn,G.inventory.length]),snapshot);
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

    assert.deepEqual(errors,[]);
    console.log('PASS: pointer and keyboard menu actions, large crews, cargo details, modal isolation and the compass exception.');
  } finally { await browser.close(); }
})().catch(error=>{ console.error(error); process.exit(1); });
