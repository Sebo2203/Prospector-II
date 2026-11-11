const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function world(){
 const c=vm.createContext({G:{turn:1,mode:'galaxy',ship:{x:5,y:5},gasEntities:[],pirates:[],neutralShips:[],visited:Array(144).fill(true),galaxy:Array.from({length:12},()=>Array.from({length:12},()=>({type:'NEBULA'})))},MAP_W:12,MAP_H:12,DEBUG:{shipInvisible:false},
 effectiveSensorRange:()=>3,shipDisengagementActive:ship=>c.G.turn<(ship.disengagedUntil||0),addLog:()=>{},renderAll:()=>{}});
 for(const file of ['ships/gas-entities-and-pirates.js','combat/ship.js','world/galaxy-generation.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),c);
 c.startShipCombat=ship=>{c.engaged=ship;c.G.mode='shipcombat';};return c;
}
function monster(x=7,y=5){return {x,y,hp:150,alive:true,name:'Wraith',_homeCluster:[{x:5,y:5},{x:6,y:5},{x:7,y:5}]};}
test('visible early-game gas entities pursue and engulf within nebulae without a turn-300 lock',()=>{
 const c=world(),entity=monster();c.G.gasEntities=[entity];
 c.moveGasEntities();assert.equal(entity.x,6);assert.equal(c.engaged,undefined);
 c.moveGasEntities();assert.equal(c.engaged,entity);
});
test('manual Fire includes natural entities and bypasses civilian confirmation',()=>{
 const c=world(),entity=monster(9,5);c.G.gasEntities=[entity];assert.equal(c.galaxyAttackTarget(),entity,'large entities use the same extra detection range as their marker');
 c.attemptGalaxyAttack();assert.equal(c.engaged,entity);assert.equal(c.G.mode,'shipcombat');
});
test('nebula pursuit respects safe space, disengagement grace, debug invisibility and dead entities',()=>{
 for(const condition of ['safe','grace','invisible','dead']){
  const c=world(),entity=monster(5,5);c.G.gasEntities=[entity];
  if(condition==='safe')c.G.galaxy[5][5]={type:'VOID'};
  if(condition==='grace')entity.disengagedUntil=10;
  if(condition==='invisible')c.DEBUG.shipInvisible=true;
  if(condition==='dead')entity.alive=false;
  vm.runInContext('Math.random=()=>0.99',c);c.moveGasEntities();assert.equal(c.engaged,undefined);
 }
});
test('nebula entities are no longer guaranteed and have substantially lower cluster probabilities',()=>{
 const c=world();assert.equal(c.nebulaEntitySpawnChance(true,true),0.12);assert.equal(c.nebulaEntitySpawnChance(false,true),0.04);assert.equal(c.nebulaEntitySpawnChance(false,false),0.01);
});
