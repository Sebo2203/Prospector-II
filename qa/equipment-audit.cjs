// Catalog-driven native equipment audit. Fixtures grant legal gear/credits and force bounded outcomes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:/,r=>r.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('ATTACK_CORVETTE','Equipment QA','Equipment QA'));
  await page.waitForFunction(()=>G?.log.some(e=>e.msg.includes('Ready for departure')));
  assert.ok(await page.evaluate(async()=>await autoSave()));
  await page.addScriptTag({path:path.join(__dirname,'ship-combat-fixture.js')});
  const report=await page.evaluate(()=>{
   const clone=x=>JSON.parse(JSON.stringify(x)),results=[];
   G.crew=[G.crew[0]];const c=G.crew[0];Object.assign(c,{weapon:'Bare hands',weaponUsable:null,armor:'Flight Suit',armorUsable:'armor_flight',implants:[],statuses:{}});
   for(const sk of CREW_SKILLS)c.skills[sk.id]=sk.id==='cbt'?1:0;
   G.inventory=[];G.cargo=[];G.pirates=[];G.neutralShips=[];G.gasEntities=[];G.npcStranded=[];
   G.ship.x=10;G.ship.y=10;G.galaxy[10][10]={type:'VOID'};G.curPlanet='qa:equipment';
   const p=getOrCreateScanPlanetData(G.curPlanet,'DESERT','full');
   for(const row of p.grid)for(let x=0;x<row.length;x++)row[x]={type:BIOMES.DESERT.floor};
   G.enemies[G.curPlanet]=[];G.player={x:10,y:10};G.mode='planet';G.oxygen=100;G.credits=50000;
   G.nextCrewTalkTurn=G.nextCrewGalaxyTalkTurn=100000;G._viewTab='inventory';renderAll();
   const base=serializeCareer(G),random=Math.random;
   const reset=()=>{clearShipCombatFeedback();installSaveSnapshot(parseSaveSnapshot(base));Math.random=random;return G.crew[0];};
   const civGoods=[];for(const tier of ['primitive','tribal','medieval','industrial','information'])for(let seed=1;seed<=32;seed++)civGoods.push(...generateCivBarterStock({tier,_stockSeed:seed}));
   const rows=[...civGoods,...DEBUG_ITEM_CATALOG.flatMap(g=>g.items),...PAWN_ITEM_POOL,...Object.values(CORP_ITEM_POOLS).flat(),...MEDBAY_ITEM_POOL].filter(i=>i.usable);
   const items=[...new Map(rows.map(i=>[i.usable+'|'+i.name,clone(i)])).values()];
   const run=(name,fn)=>{try{reset();fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}};
   const check=(test,message)=>{if(!test)throw Error(message);};
   const use=item=>{G.inventory=[clone(item)];G.mode='inventory';G._prevMode='planet';G._viewTab='inventory';G._viewInvSel=0;handleInventoryKey('Enter');};
   const equip=item=>{use(item);handleInventoryKey('Enter');closeInventoryMenu();};
   for(const [channel,stock] of [['pawn',PAWN_ITEM_POOL],['corp',Object.values(CORP_ITEM_POOLS).flat()],['med',MEDBAY_ITEM_POOL]]){
    for(const item of stock)run('purchase:'+channel+':'+item.name,()=>{
     G.mode='base';const key={pawn:'pawnStock',corp:'corpStock',med:'medbayStock'}[channel];G.base[key]=[{...clone(item),stock:2}];
     const credits=G.credits;executeBaseAction((channel==='med'?'medbuy':channel)+'_0');
     check(G.credits===credits-item.cost,'wrong purchase cost');check(G.base[key][0].stock===1,'wrong stock consumption');
     const bought=G.inventory.find(i=>i.usable===item.usable);check(bought,'paid purchase delivered no inventory item');
     if(item.usable==='jetpack')check(bought.fuel===15,'Jetpack lacks its 15 charges');
     if(item.miningMult)check(bought.miningMult===item.miningMult,'mining speed metadata lost');
    });
   }
   for(const item of PAWN_ITEM_POOL)run('radio-delivery:'+item.name,()=>{
    addPurchasedPawnItem(clone(item));const bought=G.inventory.find(i=>i.usable===item.usable);check(bought,'merchant delivered nothing');
    if(item.usable==='jetpack')check(bought.fuel===15,'radio Jetpack lacks charges');
    if(item.miningMult)check(bought.miningMult===item.miningMult,'radio mining speed lost');
   });
   for(const item of [...new Map(civGoods.filter(i=>i.usable).map(i=>[i.usable+'|'+i.name,i])).values()])run('barter:'+item.name,()=>{
    const offer={name:'Trade artifact',value:10000};G.inventory=[offer];Object.assign(BARTER,{active:true,civ:{tier:'information'},playerItems:[{item:offer,idx:0,source:'inventory'}],civItems:[{...clone(item),_remaining:1}],offered:new Set([0]),wanted:new Set([0])});
    confirmBarterTrade();const received=G.inventory.find(i=>i.name===item.name);check(received,'barter delivered nothing');
    if(item.miningMult)check(received.miningMult===item.miningMult,'barter lost mining speed');
   });
   const bonuses={gun:2,gun_sniper:5,gun_shotgun:3,gun_burst:3,gun_plasma:3,gun_breacher:4,knife:1,vibroblade:4};
   for(const item of items.filter(i=>Object.hasOwn(GROUND_WEAPONS,i.usable)))run('weapon:'+item.name,()=>{
    equip(item);const c=G.crew[0];check(c.weaponUsable===item.usable,'equip failed');
    const enemy={name:'Audit target',x:11,y:10,hp:100,maxHp:100,alive:true,stunTurns:999};G.enemies[G.curPlanet]=[enemy];
    Math.random=()=>0.5;
    if(item.usable==='tranq_darts'){
     G.inventory.push(clone(item));G.rangeTarget={x:11,y:10};doRangedFire();
     check(enemy.hp===100,'tranq dealt lethal damage');check(c.weaponUsable===null,'equipped dart not consumed');check(G.inventory.filter(i=>i.usable==='tranq_darts').length===1,'spare dart also consumed');
    }else if(item.usable==='stun_baton'){
     enemy.hp=1;enemy.maxHp=10;doCombat(enemy);check(enemy.alive&&enemy.hp===1,'non-lethal baton killed the target');
    }else{
     const hp=enemy.hp;if(GROUND_WEAPONS[item.usable].maxRange>1){G.rangeTarget={x:11,y:10};doRangedFire();check(hp-enemy.hp===c.atk+bonuses[item.usable]+1,'wrong ranged damage');}
     else{doCombat(enemy);check(hp-enemy.hp===c.atk+bonuses[item.usable],'wrong melee damage');}
     G.mode='inventory';G._prevMode='planet';G._viewTab='crew';G._viewCrewSel=0;handleInventoryKey('w');check(G.inventory.some(i=>i.usable===item.usable),'unequip lost weapon');
    }
   });
   for(const item of items.filter(i=>i.usable.startsWith('armor_')))run('armor:'+item.name,()=>{
    equip(item);check(G.crew[0].armorUsable===item.usable,'armor equip failed');
    const expected={armor_flight:1,armor_reinforced:2,armor_exosuit:3,armor_plate:1,armor_diving:0}[item.usable];
    check(armorDefBonus(G.crew[0])===expected,'wrong armor bonus');
    check(G.log.some(e=>e.msg.includes('DEF +'+expected+'.')),'equip log reports wrong armor protection');
    G.mode='inventory';G._prevMode='planet';G._viewTab='crew';handleInventoryKey('s');check(G.inventory.some(i=>i.usable===item.usable),'strip lost armor');
   });
   for(const imp of IMPLANT_CATALOG)run('implant:'+imp.name,()=>{
    const c=G.crew[0],before=clone(c);equip({name:imp.name,usable:'implant_'+imp.id,implantId:imp.id});
    check(c.implants.includes(imp.id),'implant install failed');
    for(const sk of CREW_SKILLS)if(imp.effect[sk.id])check(crewSkillValue(c,sk.id)===(before.skills[sk.id]||0)+imp.effect[sk.id],'inactive '+sk.id+' bonus');
    if(imp.effect.atk)check(crewImplantAtkBonus(c)===imp.effect.atk,'inactive attack bonus');
    if(imp.effect.def)check(crewImplantDefBonus(c)===imp.effect.def,'inactive defense bonus');
    if(imp.effect.maxHp)check(c.maxHp===before.maxHp+imp.effect.maxHp,'inactive max HP bonus');
    if(imp.effect.oxyRate){const oxygen=G.oxygen;applyOxygenDrain();check(Math.abs(oxygen-G.oxygen-BIOMES.DESERT.oxyDrain*imp.effect.oxyRate)<1e-8,'oxygen reduction inactive');}
    const maximum=c.maxHp;use({name:imp.name,usable:'implant_'+imp.id,implantId:imp.id});handleInventoryKey('Enter');check(c.implants.length===1&&c.maxHp===maximum,'duplicate install accepted');
   });
   run('tranq:missed stray target stays non-lethal',()=>{
    const item=items.find(i=>i.usable==='tranq_darts');equip(item);const enemy={name:'Stray target',x:11,y:10,hp:1,maxHp:10,alive:true,stunTurns:999};G.enemies[G.curPlanet]=[enemy];
    G.rangeTarget={x:12,y:10};Math.random=()=>0.99;doRangedFire();check(enemy.hp===1&&enemy.alive,'stray dart killed a bystander');
   });
   for(const usable of ['gun','tranq_darts'])run('line of fire:'+usable+':wall stops the shot',()=>{
    equip(items.find(i=>i.usable===usable));G.planets[G.curPlanet].grid[10][11]={type:BIOMES.DESERT.rock};
    const e={name:'Behind wall',x:12,y:10,hp:20,maxHp:20,alive:true,stunTurns:999};G.enemies[G.curPlanet]=[e];G.rangeTarget={x:12,y:10};Math.random=()=>0;doRangedFire();check(e.hp===20,'weapon shot through a solid wall');
   });
   run('line of fire:intervening creature takes the accurate bullet',()=>{
    equip(items.find(i=>i.usable==='gun'));const near={name:'Blocker',x:11,y:10,hp:50,maxHp:50,alive:true,stunTurns:999},far={name:'Behind',x:12,y:10,hp:50,maxHp:50,alive:true,stunTurns:999};
    G.enemies[G.curPlanet]=[near,far];G.rangeTarget={x:12,y:10};Math.random=()=>0.5;doRangedFire();check(near.hp<50&&far.hp===50,'bullet bypassed intervening creature');
   });
   run('implant:Adrenal amplifier affects actual ranged damage',()=>{
    const c=G.crew[0];c.implants=['adrenal_amp'];equip(items.find(i=>i.usable==='gun'));const enemy={name:'Target',x:11,y:10,hp:100,maxHp:100,alive:true,stunTurns:999};G.enemies[G.curPlanet]=[enemy];
    G.rangeTarget={x:11,y:10};Math.random=()=>0.5;doRangedFire();check(100-enemy.hp===c.atk+2+2+1,'ranged attack ignores implant ATK');
   });
   for(const [usable,setup,verify] of [
    ['medikit',()=>G.crew[0].hp-=12,()=>G.crew[0].hp===G.crew[0].maxHp-2],
    ['field_rations',()=>G.crew[0].hp-=12,()=>G.crew[0].hp===G.crew[0].maxHp-7],
    ['oxytank',()=>G.oxygen=20,()=>G.oxygen===100],
    ['repair_kit',()=>G.ship.hp-=20,()=>G.ship.hp===G.ship.maxHp-5],
    ['trauma_kit',()=>{G.crew[0].hp-=20;applyCrewStatus(G.crew[0],'broken_arm');},()=>!hasCrewInjury(G.crew[0])&&G.crew[0].hp===G.crew[0].maxHp],
    ['iodine_pills',()=>applyRadiationExposureToCrew(4,'audit'),()=>getCrewStatus(G.crew[0],'radiation').severity===2],
    ['rad_flush',()=>applyRadiationExposureToCrew(4,'audit'),()=>!getCrewStatus(G.crew[0],'radiation')],
    ['antibiotics',()=>applyCrewStatus(G.crew[0],'fever'),()=>!getCrewStatus(G.crew[0],'fever')],
    ['mild_antidepressants',()=>{G.crew[0].moraleBase=30;G.crew[0].drugRush=0;G.crew[0].eventMorale=0;G.crew[0].grief=0;},()=>crewMoraleScore(G.crew[0])>30],
    ['morale_drug',()=>{G.crew[0].moraleBase=30;G.crew[0].drugRush=0;G.crew[0].eventMorale=0;G.crew[0].grief=0;},()=>crewMoraleScore(G.crew[0])>30],
   ])run('consume:'+usable,()=>{setup();use(items.find(i=>i.usable===usable));check(verify(),'effect failed');check(!G.inventory.some(i=>i.usable===usable),'used item not consumed');});
   for(const usable of ['medikit','field_rations','oxytank','repair_kit','trauma_kit','iodine_pills','rad_flush','antibiotics'])run('refusal:'+usable+':no treatment needed',()=>{
    use(items.find(i=>i.usable===usable));check(G.inventory.some(i=>i.usable===usable),'item consumed without a valid treatment target');
   });
   run('refusal:oxygen tank in space',()=>{
    G.oxygen=20;G.inventory=[clone(items.find(i=>i.usable==='oxytank'))];G.mode='inventory';G._prevMode='galaxy';G._viewTab='inventory';G._viewInvSel=0;handleInventoryKey('Enter');check(G.oxygen===20&&G.inventory.length===1,'surface oxygen tank used in space');
   });
   run('refusal:sensor drone on planet',()=>{use(items.find(i=>i.usable==='sensor_drone'));check(G.inventory.length===1&&!G._activeDrones?.length,'drone consumed or launched on the surface');});
   run('implant:two-slot limit refuses a third implant without consumption',()=>{
    for(const id of ['neural_acc','bone_lace','reflex_coil'])equip(items.find(i=>i.usable==='implant_'+id));check(G.crew[0].implants.length===2&&G.inventory.some(i=>i.usable==='implant_reflex_coil'),'third implant installed or lost');
   });
   run('armor:actual incoming damage honors each defensive bonus',()=>{
    for(const usable of ['armor_flight','armor_reinforced','armor_exosuit','armor_plate','armor_diving']){
     equip(items.find(i=>i.usable===usable));const c=G.crew[0];c.hp=c.maxHp;const hp=c.hp;Math.random=()=>0.5;
     tryEnemyRangedAttack({name:'Armor test',x:11,y:10,rangedWeapon:{name:'Audit rifle',maxRange:3,accuracy:1,minDmg:10,maxDmg:10}},G.planets[G.curPlanet]);
     check(hp-c.hp===10-armorDefBonus(c),'armor protection is missing from incoming damage');
    }
   });
   run('armor:diving suit reduces actual submerged consumption',()=>{
    const c=G.crew[0];G.underwater=true;const start=G.oxygen;applyOxygenDrain();const ordinary=start-G.oxygen;G.oxygen=100;equip(items.find(i=>i.usable==='armor_diving'));applyOxygenDrain();check(100-G.oxygen<ordinary,'diving suit has no underwater benefit');
   });
   run('implant:lung filter affects only its share of a mixed crew',()=>{
    const c=G.crew[0],other=clone(c);delete other._careerId;c.implants=['lung_filter'];G.crew.push(other);const before=G.oxygen;applyOxygenDrain();check(Math.abs(before-G.oxygen-BIOMES.DESERT.oxyDrain*.875)<1e-8,'one filter incorrectly changes everyone or nobody');
   });
   run('passive:floodlight',()=>{G.planets[G.curPlanet].isRoguePlanet=true;const radius=planetVisionRadius(G.curPlanet);G.inventory=[clone(items.find(i=>i.usable==='floodlight'))];check(planetVisionRadius(G.curPlanet)===radius+2,'light does not extend sight');});
   run('passive:ore scanner',()=>{const p=G.planets[G.curPlanet];p.grid[10][18]={type:'MINERAL'};p.grid[10][19]={type:'MINERAL'};G.inventory=[clone(items.find(i=>i.usable==='ore_scanner'))];tickOreScanner();check(p.grid[10][18]._scanned&&!p.grid[10][19]._scanned,'wrong scanner range');});
   run('capture:net then crate',()=>{
    const e={name:'Live target',x:11,y:10,hp:10,maxHp:10,alive:true};G.enemies[G.curPlanet]=[e];use(items.find(i=>i.usable==='capture_net'));check(e.netted&&e.alive,'net failed');use(items.find(i=>i.usable==='contain_crate'));check(!e.alive&&G.inventory.some(i=>i.isCapturedCreature),'crate failed');
    const specimen=G.inventory.find(i=>i.isCapturedCreature),credits=G.credits;G.mode='base';executeBaseAction('bounty_redeem_0');
    check(G.credits===credits+specimen.bounty&&!G.inventory.includes(specimen),'specimen bounty was not redeemed');
    const paid=G.credits;executeBaseAction('bounty_redeem_0');check(G.credits===paid,'specimen bounty paid twice');
   });
   run('implant:removal targets the selected crew despite identical names',()=>{
    const first=G.crew[0],second=clone(first);delete second._careerId;first.name=second.name='Same Name';first.implants=['neural_acc'];second.implants=['pain_block'];second.maxHp+=10;G.crew.push(second);serializeCareer(G);G.mode='base';
    executeBaseAction('implant_remove_1_0');check(first.implants[0]==='neural_acc'&&!second.implants.length,'removed the other same-named crew implant');check(second.maxHp===first.maxHp,'max HP bonus was not reversed');
   });
   run('equipment:weapon and armor retain value/description/custom metadata when swapped',()=>{
    for(const [usable,key] of [['gun_breacher','_equippedItem'],['armor_plate','_equippedArmor']]){
     const original={...clone(items.find(i=>i.usable===usable)),value:275,desc:'Distinct audit provenance',provenance:'audit'};equip(original);
     equip(items.find(i=>i.usable===(usable==='gun_breacher'?'gun':'armor_flight')));
     const returned=G.inventory.find(i=>i.provenance==='audit');check(returned?.value===275&&returned.desc===original.desc,'equipment metadata/value lost on replacement');
    }
   });
   run('implant:Reflex Coil changes the actual ranged hit outcome',()=>{
    equip(items.find(i=>i.usable==='gun'));G.crew[0].implants=['reflex_coil'];const enemy={name:'Reflex target',x:15,y:10,hp:100,maxHp:100,alive:true,stunTurns:999};G.enemies[G.curPlanet]=[enemy];G.rangeTarget={x:15,y:10};Math.random=()=>0.58;doRangedFire();check(enemy.hp<100,'accuracy/CBT bonuses are absent from the shot');
   });
   run('stim:expires on the eighth-turn deadline',()=>{
    equip(items.find(i=>i.usable==='stim_pack'));G.turn=G.crew[0]._stimUntil;tickCrewStatuses();check(G.crew[0]._stimAtk===0,'stim lasts a ninth turn');
   });
   run('tranq:adjacent crew action consumes only equipped kit and stays non-lethal',()=>{
    const dart=items.find(i=>i.usable==='tranq_darts');equip(dart);G.inventory.push(clone(dart));const e={name:'Target',x:11,y:10,hp:1,maxHp:10,alive:true,stunTurns:999};G.enemies[G.curPlanet]=[e];Math.random=()=>0.5;doCombat(e);
    check(e.alive&&e.hp===1&&G.crew[0].weaponUsable===null&&G.inventory.filter(i=>i.usable==='tranq_darts').length===1,'adjacent dart dealt damage, remained equipped or consumed a spare');
   });
   run('stim:apply and reject stacking',()=>{equip(items.find(i=>i.usable==='stim_pack'));check(G.crew[0]._stimAtk===3&&G.crew[0]._stimUntil===G.turn+8,'stim failed');const until=G.crew[0]._stimUntil;equip(items.find(i=>i.usable==='stim_pack'));check(G.crew[0]._stimUntil===until&&G.inventory.some(i=>i.usable==='stim_pack'),'stim stacks or consumes refused dose');});
   const active=new Set([...Object.keys(GROUND_WEAPONS),'armor_flight','armor_reinforced','armor_exosuit','armor_plate','armor_diving',...IMPLANT_CATALOG.map(i=>'implant_'+i.id),
    'medikit','field_rations','oxytank','repair_kit','trauma_kit','iodine_pills','rad_flush','antibiotics','mild_antidepressants','morale_drug','floodlight','ore_scanner','capture_net','contain_crate','stim_pack']);
   const delegated={grapple:'field input scenarios below',jetpack:'field input scenarios below',mining_tool:'field input scenarios below',sensor_drone:'field input scenarios below',c4:'audio + field scenarios',quarantine_pod:'missions + quarantine rules',quarantine_coupling:'missions + quarantine rules'};
   const uncovered=items.filter(i=>!active.has(i.usable)&&!delegated[i.usable]);
   Math.random=random;reset();
   window.equipmentAudit={base,items,results,reset,use,equip};
   return {version:GAME_VERSION,shipEquipment:{weapons:Object.keys(SHIP_WEAPONS),modules:Object.keys(HULL_MODULES),unfinishedModules:['mining_drill']},items:items.map(i=>({name:i.name,usable:i.usable})),results,delegated,uncovered};
  });
  async function field(name,fn){
   try{await page.evaluate(()=>equipmentAudit.reset());await fn();report.results.push({name,pass:true});}
   catch(e){report.results.push({name,pass:false,error:e.message});}
  }
  await field('field:grapple leap, consumption and action cost',async()=>{
   const before=await page.evaluate(()=>{
    G.planets[G.curPlanet].grid[10][11]={type:BIOMES.DESERT.rock};
    const b={turn:G.turn,x:G.player.x};equipmentAudit.use(equipmentAudit.items.find(i=>i.usable==='grapple'));return b;
   });await page.keyboard.press('ArrowRight');
   assert.deepEqual(await page.evaluate(()=>({turn:G.turn,x:G.player.x,remaining:G.inventory.filter(i=>i.usable==='grapple').length})),{turn:before.turn+1,x:before.x+2,remaining:0});
  });
  await field('field:grapple blocked landing is free',async()=>{
   await page.evaluate(()=>{const p=G.planets[G.curPlanet];p.grid[10][11]=p.grid[10][12]={type:BIOMES.DESERT.rock};equipmentAudit.use(equipmentAudit.items.find(i=>i.usable==='grapple'));});
   const before=await page.evaluate(()=>[G.turn,G.player.x,G.inventory.length]);await page.keyboard.press('ArrowRight');assert.deepEqual(await page.evaluate(()=>[G.turn,G.player.x,G.inventory.length]),before);
  });
  await field('field:corporate Jetpack leap and remaining charges',async()=>{
   await page.evaluate(()=>{G.mode='base';G.base.corpStock=[{...CORP_ITEM_POOLS.eridani?.find(i=>i.usable==='jetpack'),...Object.values(CORP_ITEM_POOLS).flat().find(i=>i.usable==='jetpack'),stock:1}];executeBaseAction('corp_0');const item=G.inventory[0];G.mode='planet';equipmentAudit.use(item);});
   const before=await page.evaluate(()=>G.turn);await page.keyboard.press('ArrowRight');assert.deepEqual(await page.evaluate(()=>[G.player.x,G.inventory[0].fuel,G.turn]),[12,14,before+1]);
  });
  await field('field:Jetpack cancelled aim uses no charge',async()=>{
   await page.evaluate(()=>equipmentAudit.use(equipmentAudit.items.find(i=>i.usable==='jetpack')));const before=await page.evaluate(()=>[G.turn,G.player.x,G.inventory[0].fuel]);await page.keyboard.press('Escape');assert.deepEqual(await page.evaluate(()=>[G.turn,G.player.x,G.inventory[0].fuel]),before);
  });
  for(const [name,presses] of [['Handheld Drill',10],['Mining Laser',4]])await field('field:mining:'+name,async()=>{
   await page.evaluate(name=>{G.mode='base';executeBaseAction('upcargo');G.base.pawnStock=[{...PAWN_ITEM_POOL.find(i=>i.name===name),stock:1}];executeBaseAction('pawn_0');G.mode='planet';G.planets[G.curPlanet].grid[10][10]={type:'MINERAL',oreType:'fe',revealed:true};},name);
   const turn=await page.evaluate(()=>G.turn);for(let i=0;i<presses;i++)await page.keyboard.press('Enter');
   assert.equal(await page.evaluate(()=>G.cargo.length),1);assert.equal(await page.evaluate(()=>G.turn),turn+presses);
  });
  await field('field:mining automatically chooses a carried Mining Laser over the old drill',async()=>{
   await page.evaluate(()=>{G.mode='base';executeBaseAction('upcargo');G.inventory=[equipmentAudit.items.find(i=>i.name==='Handheld Drill'),equipmentAudit.items.find(i=>i.name==='Mining Laser')];G.mode='planet';G.planets[G.curPlanet].grid[10][10]={type:'MINERAL',oreType:'fe',revealed:true};});
   for(let i=0;i<4;i++)await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>G.cargo.length),1);
  });
  await field('field:mining progress belongs to its planet',async()=>{
   await page.evaluate(()=>{G.mode='base';executeBaseAction('upcargo');G.mode='planet';G.inventory=[equipmentAudit.items.find(i=>i.name==='Handheld Drill')];G.planets[G.curPlanet].grid[10][10]={type:'MINERAL',oreType:'fe',revealed:true};G._miningProgress={planetKey:'another-world',x:10,y:10,progress:9,total:10,oreKey:'fe',comId:'ore_iron'};});
   await page.keyboard.press('Enter');assert.ok(await page.evaluate(()=>G._miningProgress?.progress===1&&G._miningProgress.planetKey===G.curPlanet&&!G.cargo.length));
  });
  await field('field:Jetpack final charge removes the spent unit',async()=>{
   await page.evaluate(()=>equipmentAudit.use({...equipmentAudit.items.find(i=>i.usable==='jetpack'),fuel:1}));
   const before=await page.evaluate(()=>G.turn);await page.keyboard.press('ArrowRight');assert.deepEqual(await page.evaluate(()=>[G.player.x,G.turn,G.inventory.some(i=>i.usable==='jetpack')]),[12,before+1,false]);
  });
  await field('field:sensor drone advances, reveals and expires',async()=>{
   await page.evaluate(()=>{
    for(let y=6;y<17;y++)for(let x=6;x<17;x++)G.galaxy[y][x]={type:'VOID'};
    G.pulsars=[];G.blackHoles=[];G.mode='galaxy';G.inventory=[equipmentAudit.items.find(i=>i.usable==='sensor_drone')];G.ship.facing={dx:0,dy:-1};
    G.visited.fill(false);G._prevMode='galaxy';G.mode='inventory';G._viewTab='inventory';G._viewInvSel=0;Math.random=()=>0.5;handleInventoryKey('Enter');
   });assert.equal(await page.evaluate(()=>G._activeDrones.length),1);
   await page.keyboard.press('ArrowRight');assert.deepEqual(await page.evaluate(()=>[G._activeDrones[0].x,G._activeDrones[0].y,G._activeDrones[0].turnsLeft,G.visited[9*MAP_W+10]]),[10,9,5,true]);
   for(let i=0;i<5;i++)await page.keyboard.press(i%2?'ArrowRight':'ArrowLeft');assert.equal(await page.evaluate(()=>G._activeDrones.length),0);
  });
  await field('field:C4 arming, drop, saved fuse and delayed structural blast',async()=>{
   await page.evaluate(()=>equipmentAudit.use(equipmentAudit.items.find(i=>i.usable==='c4')));
   assert.deepEqual(await page.evaluate(()=>[G.inventory[0]._armed,G.inventory[0]._c4Timer]),[true,5]);
   await page.keyboard.press('d');await page.keyboard.press('Escape');
   assert.ok(await page.evaluate(()=>{const saved=parseSaveSnapshot(serializeCareer(G));return saved.planets[G.curPlanet].grid[10][10].drops.some(i=>i.usable==='c4'&&i._armed&&i._c4Timer===5);}));
   await page.evaluate(()=>{G.planets[G.curPlanet].grid[9][10]={type:'rw_locked_door'};Math.random=()=>0.5;});
   for(let i=0;i<5;i++)await page.keyboard.press('ArrowRight');
   assert.ok(await page.evaluate(()=>G.planets[G.curPlanet].grid[9][10].type!=='rw_locked_door'));assert.equal(await page.evaluate(()=>G.dead),false);
  });
  for(const id of ['mass_driver','railgun','laser_cannon','pulse_laser','artemis'])await field('ship weapon:'+id,async()=>{
   const data=await page.evaluate(id=>{
    const c=bridgeFixture({weapons:[id,null]});c.asteroids=[];c.player={x:10,y:8,dx:1,dy:0};c.enemies[0].x=13;c.enemies[0].y=8;
    c.enemies[0].ship.systems.engine.condition=0;c.enemies[0].ship.weaponReadyAt=[G.turn+999];G.ship.ammo.artemis=4;G.ship.weaponReadyAt=[G.turn,0];Math.random=()=>0.5;
    const turn=G.turn,hp=c.enemies[0].ship.hp;doShipFire();const after=G.turn;doShipFire();
    return {turns:after-turn,refused:G.turn===after,damage:hp-c.enemies[0].ship.hp,missiles:c.missiles.length,ammo:G.ship.ammo.artemis,valid:!!parseSaveSnapshot(serializeCareer(G))};
   },id);assert.equal(data.turns,1);assert.ok(data.refused&&data.valid);if(id==='artemis'){assert.equal(data.ammo,3);assert.ok(data.missiles>0);}else assert.ok(data.damage>0);
  });
  await field('ship module:fuel scoop',async()=>{
   assert.ok(await page.evaluate(()=>{
    G.mode='base';executeBaseAction('upmodslot');executeBaseAction('install_fuel_scoop');G.mode='galaxy';G.galaxy[10][10]={type:'NEBULA'};G.fuel=10;
    const turn=G.turn;let roll=0;Math.random=()=>[0,0.5,0.99][Math.min(roll++,2)];doFuelScoop('nebula');return G.installedModules.includes('fuel_scoop')&&G.fuel>10&&G.turn===turn+1;
   }));
  });
  await field('ship module:tractor tow and sale',async()=>{
   await page.evaluate(()=>{G.mode='base';executeBaseAction('upmodslot');executeBaseAction('install_tractor_beam');G.mode='galaxy';G.npcStranded=[{x:10,y:10,type:'dead',name:'Tow target'}];});
   await page.keyboard.press('t');assert.ok(await page.evaluate(()=>G.towedShip?.name==='Tow target'&&!G.npcStranded.length));
   assert.ok(await page.evaluate(()=>{G.mode='base';const credits=G.credits;executeBaseAction('sell_towed_ship');return G.credits>credits&&!G.towedShip;}));
  });
  await field('placeholder:ship mining drill cannot be bought',async()=>{
   assert.ok(await page.evaluate(()=>{G.mode='base';G.base.hangarSub='modules';const row=STATION_BUILDINGS[0].actions().find(r=>r.label.includes('Ship Mining Drill'));return row.disabled&&row.id==='noop'&&row.detail.includes('Coming soon');}));
  });
  await field('persistence:equipped gear, implant modifiers, charges and spare darts',async()=>{
   await page.evaluate(()=>{
    equipmentAudit.equip(equipmentAudit.items.find(i=>i.usable==='gun_breacher'));G.crew[0].implants=['neural_acc'];
    G.inventory=[{...equipmentAudit.items.find(i=>i.usable==='jetpack'),fuel:7},equipmentAudit.items.find(i=>i.name==='Mining Laser'),equipmentAudit.items.find(i=>i.usable==='tranq_darts')];
   });assert.ok(await page.evaluate(async()=>await autoSave()));assert.ok(await page.evaluate(async()=>await loadFromStorage()));
   assert.ok(await page.evaluate(()=>G.crew[0].weaponUsable==='gun_breacher'&&crewSkillValue(G.crew[0],'sci')===2&&G.inventory[0].fuel===7&&G.inventory[1].miningMult===2.5&&G.inventory[2].usable==='tranq_darts'));
  });
  await field('persistence:full equipped item metadata survives save/load and unequipping',async()=>{
   await page.evaluate(()=>equipmentAudit.equip({...equipmentAudit.items.find(i=>i.usable==='gun_breacher'),value:275,desc:'Persistent provenance',provenance:'audit'}));
   assert.ok(await page.evaluate(async()=>await autoSave()&&await loadFromStorage()));
   assert.ok(await page.evaluate(()=>{G.mode='inventory';G._prevMode='planet';G._viewTab='crew';handleInventoryKey('w');return G.inventory.some(i=>i.provenance==='audit'&&i.value===275&&i.desc==='Persistent provenance');}));
   assert.ok(await page.evaluate(()=>{const bad=JSON.parse(serializeCareer(G));bad.crew[0]._equippedItem={name:'Mismatch',usable:'gun'};try{parseSaveSnapshot(bad);return false;}catch(e){return true;}}));
  });
  await field('ui:learned skill and effective implant modifier remain distinct',async()=>{
   assert.ok(await page.evaluate(()=>{equipmentAudit.equip(equipmentAudit.items.find(i=>i.usable==='implant_neural_acc'));G.crew[0].skills.sci=3;G.crew[0].skills.eng=2;G.mode='inventory';G._prevMode='planet';G._viewTab='crew';G._viewCrewSel=0;renderAll();return G.crew[0].skills.sci===3&&crewSkillValue(G.crew[0],'sci')===5&&crewSkillValue(G.crew[0],'eng')===3;}));
   await page.screenshot({path:artifactPath('equipment-implants.png')});
  });
  report.errors=errors;fs.writeFileSync(artifactPath('equipment-audit.json'),JSON.stringify(report,null,2));
  const failures=report.results.filter(r=>!r.pass);
  console.log(JSON.stringify({items:report.items.length,checks:report.results.length,failed:failures,uncovered:report.uncovered,errors},null,2));
  if(!process.argv.includes('--report-only')){assert.deepEqual(failures,[]);assert.deepEqual(report.uncovered,[]);assert.deepEqual(errors,[]);}
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
