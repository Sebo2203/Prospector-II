const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function world(){
 const c=vm.createContext({G:{mode:'galaxy',turn:4,ship:{x:5,y:5},shipStats:{cargoCapacity:2},credits:500,inventory:[],cargo:[],neutralShips:[],log:[],pirateBounties:{credits:0,kills:0}},DEBUG:{},
  addCombatLog:(msg,cls)=>c.G.log.push({msg,cls}),addLog:(msg,cls)=>c.G.log.push({msg,cls}),earnCredits:n=>c.G.credits+=n});
 c.rnd=n=>Math.floor(n*0.25);
 for(const file of ['economy/commodities.js','economy/shops-and-implants.js','core/cargo-and-analytics.js','combat/ship-rewards.js','combat/ship.js','ships/gas-entities-and-pirates.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),c);
 c.renderAll=()=>{};return c;
}
test('every ship role has weighted nothing/cash/equipment/cargo rewards from real catalogs',()=>{
 const c=world();
 for(const type of ['cargo','trader','science','patrol','guard','roamer']){
  const counts={none:0,credits:0,equipment:0,cargo:0};
  for(let roll=0;roll<100;roll++){
   let first=true;c.rnd=n=>{if(first){first=false;return roll;}return 0;};
   const reward=c.rollShipSalvage(['guard','roamer'].includes(type)?{pirateType:type}:{type});counts[reward.kind]++;
   if(reward.kind==='equipment')assert.ok(reward.item.usable && reward.item.desc && !reward.item.questItem);
   if(reward.kind==='cargo')assert.ok(reward.items.every(item=>item.isCommodity && item.boughtPrice===0 && !item.questItem));
  }
  assert.deepEqual(Object.values(counts),Array.from(vm.runInContext('SHIP_SALVAGE_PROFILES.'+type+'.weights',c)));
 }
});
test('pirate kills defer cash until station settlement and cannot pay twice',()=>{
 const c=world(),ship={name:'Guard',pirateType:'guard',hp:0,alive:false};
 const enemy={ship,collection:'pirates'},combat={};
 c.resolveShipCombatKill(combat,enemy);assert.equal(c.G.credits,500);assert.equal(c.G.pirateBounties.kills,1);assert.equal(c.G.pirateBounties.credits,75);
 c.resolveShipCombatKill(combat,enemy);assert.equal(c.G.pirateBounties.kills,1);
 c.settlePirateBountiesAtStation('Alpha');assert.equal(c.G.credits,500);
 c.G.mode='base';c.G.base={stationName:'Alpha'};c.G.stationReputation=-40;
 c.settlePirateBountiesAtStation('Alpha');assert.equal(c.G.credits,500);
 c.G.stationReputation=0;c.settlePirateBountiesAtStation('Alpha');assert.equal(c.G.credits,575);
 c.settlePirateBountiesAtStation('Alpha');assert.equal(c.G.credits,575);assert.equal(c.G.pirateBounties.kills,0);
});
test('civilian cash is immediate, pirate cash adds to claims, and civilian violence still costs reputation',()=>{
 const c=world();c.rnd=n=>Math.floor(n*0.4);
 c.resolveShipCombatKill({}, {collection:'neutralShips',ship:{name:'Trader',type:'trader',hp:0,alive:false}});
 assert.ok(c.G.credits>500);assert.equal(c.G.stationReputation,-20);assert.equal(c.G.pirateBounties.kills,0);
 const before=c.G.credits;
 c.resolveShipCombatKill({}, {collection:'pirates',ship:{name:'Raider',pirateType:'guard',hp:0,alive:false}});
 assert.equal(c.G.credits,before);assert.ok(c.G.pirateBounties.credits>90);
});
test('cargo overflow persists at encounter coordinates and collection removes only the recovered unit',()=>{
 const c=world();c.rnd=n=>n-1;c.G.shipStats.cargoCapacity=0;
 c.awardShipSalvage({name:'Freighter',type:'cargo'},false);
 assert.equal(c.G.nebulaLoot.length,3);assert.ok(c.G.nebulaLoot.every(item=>item.x===5 && item.y===5));
 assert.equal(c.collectNebulaLootAt(5,5),false);assert.equal(c.G.nebulaLoot.length,3);
 c.G.shipStats.cargoCapacity=1;assert.equal(c.collectNebulaLootAt(5,5),true);assert.equal(c.G.nebulaLoot.length,2);assert.equal(c.G.cargo.length,1);
 assert.ok(c.G.log.some(entry=>entry.msg.includes(c.G.cargo[0].name+' recovered')));
});
