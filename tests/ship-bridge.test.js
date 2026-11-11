const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function bridge(){
 const c=vm.createContext({G:{crew:[],ship:{engine:2},fuel:10},DEBUG:{},effectiveEngineRating:ship=>(ship||c.G.ship).engine});
 for(const file of ['crew/skills.js','crew/status-effects.js','combat/ship-crew.js','combat/ship-tactics.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),c);
 return c;
}
const member=(role,cbt,nav,hp=25)=>({role,hp,skills:{cbt,nav},statuses:{}});
test('living capable crew supply bridge skills; specialists win ties without mandatory roles',()=>{
 const c=bridge(),captain=member('captain',3,3),nav=member('scout',1,3),gunner=member('mercenary',3,1);
 c.G.crew=[captain,nav,gunner];
 assert.equal(c.shipBridgeOperator('nav'),nav);assert.equal(c.shipBridgeOperator('cbt'),gunner);
 assert.equal(c.shipBridgeSkills().gunnery,3);assert.equal(c.shipBridgeSkills().piloting,3);
 gunner.hp=0;nav.statuses.stunned={id:'stunned',duration:2};
 assert.equal(c.shipBridgeOperator('nav'),captain);assert.equal(c.shipBridgeOperator('cbt'),captain);
 captain.statuses.asleep={id:'asleep',duration:2};assert.equal(c.shipBridgeSkills().gunnery,0);
});
test('existing injuries affect bridge effectiveness and propulsion is required to evade',()=>{
 const c=bridge(),crew=member('captain',6,6);c.G.crew=[crew];
 crew.statuses.concussion={id:'concussion',severity:1};
 assert.equal(c.shipBridgeSkills().gunnery,4);assert.equal(c.shipBridgeSkills().piloting,4);
 c.G.ship.engine=0;assert.equal(c.shipBridgeSkills().piloting,0);assert.equal(c.shipBridgeSkills().gunnery,4);
 c.G.ship.engine=2;c.G.fuel=0;assert.equal(c.shipBridgeSkills().piloting,0);
 c.DEBUG.infiniteFuel=true;assert.equal(c.shipBridgeSkills().piloting,4);
});
test('gunnery and piloting oppose each other while working engine upgrades do not add accuracy or evasion',()=>{
 const c=bridge();c.G.crew=[member('captain',4,4)];
 const chance=()=>c.shipCombatHitChance(c.shipBridgeSkills().gunnery,4,5);
 const before=chance();c.G.ship.engine=6;assert.equal(chance(),before);
 assert.ok(c.shipCombatHitChance(8,4,5)>before);assert.ok(c.shipCombatHitChance(4,8,5)<before);
 assert.ok(c.shipCombatHitChance(4,4,8)<before);
 assert.equal(c.shipCombatHitChance(10,0,1),0.98);assert.equal(c.shipCombatHitChance(0,10,100),0.15);
});
test('NPC bridge ratings derive from their vessel and explicit crew, without matching player progress',()=>{
 const c=bridge(),npc={engine:2,engineRating:2,maxHp:180};
 const before=c.shipBridgeSkills(npc);c.G.crew=[member('captain',10,10)];c.G.turn=10000;
 assert.deepEqual(c.shipBridgeSkills(npc),before);
 npc.bridgeSkills={gunnery:7,piloting:5};assert.equal(c.shipBridgeSkills(npc).gunnery,7);
 npc.engine=0;assert.equal(c.shipBridgeSkills(npc).piloting,0);
});
