const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function world(){
 const c=vm.createContext({G:{seed:1,turn:10,ship:{x:10,y:10,shieldCharge:0,weaponReadyAt:[]}},DEBUG:{},tickShipSystems(){},effectiveSensorRange(){return 1;}});
 c.G.galaxy=Array.from({length:20},()=>Array.from({length:20},()=>({type:'VOID'})));
 c.G.galaxy[10][10]={type:'NEBULA',nebulaVariant:'blue'};
 for(const file of ['world/line-of-sight-and-loot.js','combat/ship-environment.js','combat/ship-tactics.js','combat/ship-missiles.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),c);
 return c;
}
test('nebula layouts are seeded, varied, disjoint from rocks and clear of starting ships without gameplay RNG',()=>{
 const c=world(),layouts=new Set();vm.runInContext('Math.random=()=>{throw Error("terrain used gameplay RNG");}',c);
 for(let seed=1;seed<=256;seed++){
  c.G.seed=seed;const ships=[{x:10,y:10,hp:100,alive:true,shieldCharge:0}],combat={};c.createShipCombatArena(combat,ships);
  const again={};c.createShipCombatArena(again,ships);assert.equal(JSON.stringify(combat.environment),JSON.stringify(again.environment));
  const environment=combat.environment;layouts.add(environment.layout);assert.equal(environment.variant,'blue');assert.ok(environment.pockets.length>0);
  if(environment.layout==='gas')assert.equal(combat.asteroids.length,0);
  const occupied=new Set();
  for(const pocket of environment.pockets)for(let y=pocket.y;y<pocket.y+pocket.height;y++)for(let x=pocket.x;x<pocket.x+pocket.width;x++){
   const point={x,y},key=x+','+y;
   assert.ok(!occupied.has(key)&&!c.shipCombatAsteroid(combat,point));occupied.add(key);
   assert.ok([combat.player,...combat.enemies].every(actor=>c.shipCombatDistance(point,actor)>1));
  }
 }
 assert.deepEqual([...layouts].sort(),['gas','mixed']);
});
test('gas is traversable soft cover in both directions, including a firing ship inside it, without blocking guidance',()=>{
 const c=world(),combat={player:{x:2,y:4},enemies:[{x:8,y:4,ship:{hp:100,alive:true}}],asteroids:[],
  environment:{type:'nebula',pockets:[{x:4,y:3,width:2,height:2}]}};
 assert.equal(c.shipCombatGasPenalty(combat,combat.player,combat.enemies[0]),0.15);
 assert.equal(c.shipCombatGasPenalty(combat,combat.enemies[0],combat.player),0.15);
 assert.equal(c.shipCombatGasPenalty(combat,{x:4,y:3},{x:2,y:3}),0.15);
 assert.equal(c.shipCombatGasPenalty(combat,{x:1,y:1},{x:8,y:1}),0);
 assert.equal(c.shipCombatOpen(combat,{x:4,y:4}),true);
 assert.equal(c.shipCombatShotClear(combat,combat.player,combat.enemies[0]),true);
 assert.ok(c.shipCombatMissilePath(combat,combat.player,combat.enemies[0]).some(p=>c.shipCombatGas(combat,p)));
});
