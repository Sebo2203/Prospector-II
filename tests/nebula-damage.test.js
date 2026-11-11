const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function hazards(){
 const context=vm.createContext({});
 for(const file of ['ships/classes.js','ships/hull-framework.js','world/hazards.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),context);
 vm.runInContext('function rnd(n){return Math.floor(Math.random()*n);}',context);return context;
}
function discharge(context,hull,nav,major,strength){
 vm.runInContext(`{let draws=[${major},${strength}];Math.random=()=>draws.shift();}`,context);
 return context.rollNebulaDischarge(hull,nav);
}
test('nebula discharges scale with physical hull size across common and major rolls',()=>{
 const context=hazards();
 for(const [hull,low,high,bigLow,bigHigh] of [
  ['LIGHT_SCOUT',2,8,12,24],['ATTACK_CORVETTE',3,12,18,36],['BULK_FREIGHTER',5,20,30,60]]){
  assert.equal(discharge(context,hull,0,0.15,0).damage,low);
  assert.equal(discharge(context,hull,0,0.99,0.999999).damage,high);
  assert.equal(discharge(context,hull,0,0.149999,0).damage,bigLow);
  assert.equal(discharge(context,hull,0,0,0.999999).damage,bigHigh);
 }
});
test('navigation reduces every discharge without making experienced ships immune',()=>{
 const context=hazards();
 for(const hull of ['LIGHT_SCOUT','ATTACK_CORVETTE','BULK_FREIGHTER']){
  let previous=Infinity;
  for(let skill=0;skill<=10;skill++){
   const hit=discharge(context,hull,skill,0.1,0.999999);
   assert.ok(hit.major&&hit.damage>0&&hit.damage<=previous);previous=hit.damage;
  }
 }
 assert.equal(discharge(context,'BULK_FREIGHTER',3,0.1,0.999999).damage,51);
 assert.equal(discharge(context,'BULK_FREIGHTER',10,0.1,0.999999).damage,30);
});
test('seeded discharge samples include rare large arcs rather than uniformly inflating every hit',()=>{
 const context=hazards();
 vm.runInContext('let rng=104729;Math.random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};',context);
 let majors=0,total=0;const values=new Set();
 for(let i=0;i<10000;i++){const hit=context.rollNebulaDischarge('LIGHT_SCOUT',0);majors+=hit.major;total+=hit.damage;values.add(hit.damage);}
 assert.ok(majors>1400&&majors<1600);assert.ok(total/10000>6.7&&total/10000<7.2);
 assert.equal(values.size,20);
});
