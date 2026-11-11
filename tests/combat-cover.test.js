const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function arena(){
 const c=vm.createContext({DEBUG:{},G:{seed:1,ship:{x:10,y:10,weaponReadyAt:[],shieldCharge:0}},
  tickShipSystems(){},effectiveSensorRange(){return 0;}});
 for(const file of ['world/line-of-sight-and-loot.js','combat/ship-environment.js','combat/ship-tactics.js','combat/ship-missiles.js']){
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),c);
 }
 return c;
}
test('whole asteroid footprints block movement and ordinary fire while guided routes avoid every occupied cell',()=>{
 const c=arena(),combat={player:{x:1,y:4},asteroids:[{x:3,y:3,width:2,height:2},{x:8,y:3,width:1,height:2},{x:10,y:3,width:2,height:1}],
  enemies:[{x:6,y:4,ship:{hp:100,alive:true}}]};
 for(const rock of combat.asteroids){
  const cells=c.shipCombatAsteroidTiles(rock);assert.equal(cells.length,(rock.width||1)*(rock.height||1));
  for(const cell of cells){assert.ok(c.shipCombatAsteroid(combat,cell));assert.equal(c.shipCombatOpen(combat,cell),false);}
 }
 assert.equal(c.shipCombatAsteroid(combat,{x:5,y:4}),false);
 assert.equal(c.shipCombatShotClear(combat,combat.player,combat.enemies[0]),false,'lower half blocks fire even though anchor is on another row');
 assert.equal(c.shipCombatShotClear(combat,combat.enemies[0],combat.player),false);
 assert.equal(c.shipCombatWeaponCanReach(combat,combat.player,combat.enemies[0],{range:8,guided:true}),true);
 const route=c.shipCombatMissilePath(combat,combat.player,combat.enemies[0]);assert.ok(route.length>0);
 assert.ok(route.every(point=>!c.shipCombatAsteroid(combat,point)));
 assert.deepEqual({x:route.at(-1).x,y:route.at(-1).y},{x:6,y:4});
});
test('seeded cover stays sparse, repeatable, within bounds and clear of every spawn with rare rectangular and square rocks',()=>{
 const c=arena();vm.runInContext('Math.random=()=>{throw Error("cover consumed gameplay RNG");}',c);
 let rocks=0,large=0;const shapes=new Set();
 for(let seed=0;seed<1024;seed++){
  c.G.seed=seed;
  const ships=Array.from({length:4},()=>({hp:100,alive:true,shieldCharge:0})),combat={};c.createShipCombatArena(combat,ships);
  const again={};c.createShipCombatArena(again,ships);assert.equal(JSON.stringify(combat.asteroids),JSON.stringify(again.asteroids));
  const occupied=new Set();
  for(const rock of combat.asteroids){
   const width=rock.width??1,height=rock.height??1;rocks++;if(width*height>1)large++;shapes.add(width+'x'+height);
   assert.ok(width<=2&&height<=2);
   for(const point of c.shipCombatAsteroidTiles(rock)){
    assert.ok(point.x>=0&&point.y>=0&&point.x<27&&point.y<17);
    assert.ok([combat.player,...combat.enemies].every(actor=>c.shipCombatDistance(actor,point)>1));
    const key=point.x+','+point.y;assert.ok(!occupied.has(key));occupied.add(key);
   }
  }
  assert.ok(occupied.size<=16,'large rocks share the existing sixteen-tile cover budget');
 }
 assert.deepEqual([...shapes].sort(),['1x1','1x2','2x1','2x2']);
 assert.ok(large>0&&large/rocks<0.1,'large rocks remain a small minority');
});
