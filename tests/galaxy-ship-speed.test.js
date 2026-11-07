const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function world(){
 const c=vm.createContext({G:{ship:{x:5,y:10,engineRating:3},neutralShips:[],pirates:[],gasEntities:[],turn:1,mode:'galaxy'},DEBUG:{},MAP_W:20,MAP_H:20,
   effectiveEngineRating:ship=>ship?.engineRating??c.G.ship.engineRating,effectiveSensorRange:()=>2,
   ensureNeutralCombatStats:ship=>ship,shipSystemStats:ship=>({weaponSlots:ship.guns||0}),shipDisengagementActive:()=>false});
 c.G.galaxy=Array.from({length:20},()=>Array.from({length:20},()=>({type:'VOID'})));
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/ships/neutral-movement.js'),'utf8'),c);return c;
}
test('galaxy ships share fractional relative engine budgets and the pirate roaming cap',()=>{
 const c=world(),ship={engineRating:1};
 assert.deepEqual(Array.from({length:6},()=>c.galaxyShipMoveBudget(ship,true)),[0,0,1,0,0,1]);
 c.G.ship.engineRating=1;ship.engineRating=3;ship._chaseMoveBank=0;
 assert.equal(c.galaxyShipMoveBudget(ship,true),3);assert.equal(c.galaxyShipMoveBudget(ship,false),2);
 ship.engineRating=0;assert.equal(c.galaxyShipMoveBudget(ship,true),0);
 c.G.ship.engineRating=2;ship.engineRating=2;assert.equal(c.galaxyShipMoveBudget(ship,true),1);
});
test('civilian flight uses engine budgets both near the player and when fleeing',()=>{
 const c=world(),ship={type:'science',x:6,y:10,engineRating:1,guns:0,alive:true,speed:1,destX:18,destY:10};c.G.neutralShips=[ship];
 c.moveNeutralShips();c.moveNeutralShips();assert.equal(ship.x,6);
 c.moveNeutralShips();assert.equal(ship.x,7,'science routing has no separate odd/even movement gate');
 ship.fleeingPlayer=true;
 c.moveNeutralShips();c.moveNeutralShips();assert.equal(ship.x,7);
 c.moveNeutralShips();assert.equal(ship.x,8);
 c.G.ship.engineRating=1;ship.engineRating=3;ship._chaseMoveBank=0;
 c.moveNeutralShips();assert.equal(ship.x,11,'a faster civilian opens the gap by three steps');
});
test('escape choices exclude the player, hazards, map boundaries and occupied sectors',()=>{
 const c=world(),ship={x:5,y:10,alive:true};c.G.neutralShips=[ship,{x:6,y:10,alive:true}];c.G.galaxy[10][4]={type:'BLACK_HOLE'};
 const choices=c.galaxyShipEscapeChoices(ship);assert.equal(choices.length,2);
 assert.ok(choices.every(p=>p.x===5 && Math.abs(p.y-10)===1));
 ship.x=0;ship.y=0;assert.equal(c.galaxyShipEscapeChoices(ship).length,2);
});

test('relative speed banks stay exact across five-turn cycles and separate combat from galaxy credit',()=>{
 const c=world(),actor={_chaseMoveBank:0.75,moveBank:0};
 assert.deepEqual(Array.from({length:5},()=>c.shipRelativeMoveBudget(actor,3,5,'moveBank')),[0,1,0,1,1]);
 assert.equal(actor.moveBank,0);assert.equal(actor._chaseMoveBank,0.75);
 assert.equal(c.shipRelativeMoveBudget(actor,1,2,'moveBank'),0);assert.equal(actor.moveBank,0.5);
 assert.equal(c.shipRelativeMoveBudget(actor,0,2,'moveBank'),0);assert.equal(actor.moveBank,0);
});
test('civilian engine defaults distinguish traders and scientists from cargo',()=>{
 const c=vm.createContext({});
 for(const file of ['ships/classes.js','combat/ship.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),c);
 for(const [type,rating] of [['trader',2],['science',2],['cargo',1],['patrol',3]])assert.equal(c.ensureNeutralCombatStats({type}).engineRating,rating);
 assert.equal(c.ensureNeutralCombatStats({type:'trader',engineRating:1}).engineRating,1,'explicit individual fittings remain authoritative');
});
