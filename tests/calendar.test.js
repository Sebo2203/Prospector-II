const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function world(){
 const c=vm.createContext({G:{mode:'galaxy',turn:1,fuel:50,oxygen:80,planets:{},ship:{heat:10,weaponReadyAt:[5]},crew:[{hp:10}]},BIOMES:{TEST:{dayLength:20},LOCK:{tidalLock:'day'}}});
 for(const file of ['actions/calendar.js','actions/turns.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),c);
 return c;
}
test('parallel clock records context durations and leaves gameplay state untouched except the existing turn increment',()=>{
 const c=world(),before=JSON.stringify(c.G);c.beginCareerTurn();
 const copy=JSON.parse(JSON.stringify(c.G));delete copy.careerTime;copy.turn=1;assert.equal(JSON.stringify(copy),before);
 assert.equal(c.G.careerTime.minutes,60);
 c.G.mode='planet';c.G.curPlanet='test';c.G.planets.test={biome:'TEST'};c.beginCareerTurn();c.beginCareerTurn('combat');c.beginCareerTurn('repair');
 c.G.mode='shipcombat';c.beginCareerTurn('waiting');
 assert.equal(c.G.turn,6);assert.equal(c.G.careerTime.minutes,82);
 assert.equal(c.G.careerTime.locations.planets,21);assert.equal(c.G.careerTime.locations.space,61);
 assert.equal(Object.values(c.G.careerTime.activities).reduce((a,b)=>a+b,0),82);
});
test('casino decks and artificial interiors have distinct location totals; services add no gameplay turns',()=>{
 const c=world();c.G.mode='planet';c.G.curPlanet='deck';c.G.planets.deck={isCasino:true};c.beginCareerTurn();
 c.G.planets.deck={isQuarantine:true};c.beginCareerTurn();
 c.G.mode='casino';c.beginCareerTurn('leisure');
 const turn=c.G.turn;c.recordCareerTime('services',30,'stations');assert.equal(c.G.turn,turn);
 assert.equal(c.G.careerTime.locations.stations,65);assert.equal(c.G.careerTime.locations.interiors,5);
});
test('local solar clock follows the existing dawn/day/dusk/night cycle without changing it',()=>{
 const c=world();c.G.planets.test={biome:'TEST',planetTurn:0};
 for(const [turn,time] of [[0,'06:00'],[20,'12:00'],[40,'18:00'],[60,'00:00'],[80,'06:00']]){
  c.G.planets.test.planetTurn=turn;assert.equal(c.planetLocalTimeText('test'),time);assert.equal(c.G.planets.test.planetTurn,turn);
 }
 c.G.planets.test.isCave=true;assert.equal(c.planetLocalTimeText('test'),'');
 delete c.G.planets.test.isCave;c.G.planets.test.biome='LOCK';assert.equal(c.planetLocalTimeText('test'),'Permanent day');
});
test('calendar rolls up minutes, days and thirty-day months without rounding or inventing past turns',()=>{
 const c=world();c.G.turn=500;assert.equal(c.careerClockText(),'D1 00:00');
 c.recordCareerTime('travel',43200+1440+125,'space');
 assert.equal(c.formatCareerDuration(c.G.careerTime.minutes),'1mo 1d 2h 5m');assert.equal(c.careerClockText(),'D32 02:05');
 assert.throws(()=>c.recordCareerTime('travel',-1,'space'));assert.throws(()=>c.recordCareerTime('unknown',5,'space'));
});
