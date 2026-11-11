const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function rules(){
 const c=vm.createContext({G:{ship:{}},SHIP_CLASSES:{},hullSize:()=>1,shipSystemStats:ship=>ship.systemStats||{}});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/combat/ship-collisions.js'),'utf8'),c);return c;
}
test('ram damage is mutual, boost is stronger and heavier targets reverse the size advantage',()=>{
 const c=rules(),plain=v=>JSON.parse(JSON.stringify(v));
 assert.deepEqual(plain(c.shipCombatRamDamage(1.5,1.5,false,2)),{target:8,recoil:8});
 assert.deepEqual(plain(c.shipCombatRamDamage(1.5,1.5,true,2)),{target:20,recoil:20});
 assert.deepEqual(plain(c.shipCombatRamDamage(2.5,1,false,2)),{target:20,recoil:3});
 assert.deepEqual(plain(c.shipCombatRamDamage(1,2.5,false,2)),{target:3,recoil:20});
});
test('collision size follows blueprints and stable NPC body profiles, never current hull damage',()=>{
 const c=rules();c.SHIP_CLASSES.TEST={size:3};
 assert.equal(c.shipCombatImpactSize(c.G.ship),1);
 assert.equal(c.shipCombatImpactSize({systemStats:{classId:'TEST'},maxHp:10}),3);
 assert.equal(c.shipCombatImpactSize({type:'cargo',maxHp:60,hp:1}),2.5);
 assert.equal(c.shipCombatImpactSize({_homeCluster:[],isMassive:false}),2);
 assert.equal(c.shipCombatImpactSize({_homeCluster:[],isMassive:true}),4);
 assert.equal(c.shipCombatImpactSize({maxHp:90,hp:90}),c.shipCombatImpactSize({maxHp:90,hp:1}));
});
