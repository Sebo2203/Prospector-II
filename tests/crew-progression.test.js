const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function world(){
 const c=vm.createContext({G:{turn:1,mode:'galaxy',planets:{},crew:[{hp:20,skills:{nav:3},moraleBase:55}]},
  ensureCrewStatusState:()=>{},addLog:()=>{}});
 for(const file of ['crew/radio-and-roles.js','crew/skills.js','crew/morale.js','dialogue/crew-and-selection.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),c);
 return c;
}
test('training requires sustained activity at higher levels, carries XP and caps mastery',()=>{
 const c=world(),crew=c.G.crew[0];
 assert.equal(c.giveSkillXP(crew,'nav',40),false);assert.equal(crew.skills.nav,3);
 assert.equal(c.giveSkillXP(crew,'nav',60),true);assert.equal(crew.skills.nav,4);assert.equal(crew._skillXp.nav,0);
 c.giveSkillXP(crew,'nav',1e5);assert.equal(crew.skills.nav,10);assert.equal(crew._skillXp.nav,0);
 for(const amount of [0,-1,Infinity,NaN])assert.equal(c.giveSkillXP(crew,'sci',amount),false);
 assert.equal(c.giveSkillXP(crew,'invented',10),false);crew.hp=0;assert.equal(c.giveSkillXP(crew,'sci',50),false);
 assert.equal(crew.skills.sci,undefined);
});
test('a starting Navigator reaches level eight with 750 earned XP, retaining surplus',()=>{
 const c=world(),crew=c.G.crew[0];
 c.giveSkillXP(crew,'nav',749);assert.equal(crew.skills.nav,7);
 c.giveSkillXP(crew,'nav',77);assert.equal(crew.skills.nav,8);assert.equal(crew._skillXp.nav,76);
});
test('consumables and event rewards never increase base morale and expire through career turns',()=>{
 const c=world(),crew=c.G.crew[0];c.boostCrewFromDrink();c.boostCrewFromDrugs();c.boostCrewFromMildAntidepressants();
 for(let i=0;i<30;i++)c.adjustCrewEventMorale(3);
 assert.equal(crew.moraleBase,55);assert.equal(crew.eventMorale,12);
 assert.equal(c.crewMoraleScore(crew),121);
 for(let turn=2;turn<=181;turn++){c.G.turn=turn;c.tickCrewMorale();}
 assert.equal(c.crewMoraleScore(crew),55-c.timeAwayFromPortPenalty());assert.equal(crew.moraleBase,55);
 assert.deepEqual([crew.drinkGlow,crew.drugRush,crew.eventMorale],[0,0,0]);
});
test('payroll penalties are included in base once and morale readouts agree with arithmetic',()=>{
 const c=world(),crew=c.G.crew[0];crew.role='scout';c.G.credits=0;c.processCrewPayrollAtStarbase('Test');
 assert.equal(crew.moraleBase,45);assert.equal(c.crewMoraleScore(crew),45);
 const rows=c.crewMoraleBreakdown(crew);
 assert.equal(rows.find(row=>row.label==='Unpaid (in base)').value,1);
 assert.equal(rows.at(-1).value,45);
 c.adjustCrewEventMorale(-2);assert.equal(c.crewMoraleScore(crew),43);
});
