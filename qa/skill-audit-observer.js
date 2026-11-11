// Observation only: no RNG calls, resources, outcomes or training amounts changed.
window.installSkillAudit=function(){
 const records=new Map(),ids=new WeakMap(),milestones=[],sources={};let serial=0;
 const record=c=>{
  if(!ids.has(c)){
   const id=++serial;ids.set(c,id);records.set(id,{id,actor:c,name:c.name,role:c.role,joinedTurn:G.turn,
    initial:{...c.skills},initialXp:{...c._skillXp},earned:{},grants:{}});
  }
  return records.get(ids.get(c));
 };
 G.crew.forEach(record);
 const original=giveSkillXP;
 giveSkillXP=function(c,skill,amount){
  const valid=c && c.hp>0 && (c.skills?.[skill]||0)<10 && CREW_SKILLS.some(s=>s.id===skill) && Number.isFinite(amount) && amount>0;
  const before=c?.skills?.[skill]||0,r=valid?record(c):null;
  const result=original(c,skill,amount);
  if(valid){
   r.earned[skill]=(r.earned[skill]||0)+amount;r.grants[skill]=(r.grants[skill]||0)+1;
   const source=(new Error().stack.split('\n')[2]||'unknown').trim().replace(/ \(.*/, '');
   sources[skill]??={};sources[skill][source]=(sources[skill][source]||0)+amount;
   for(let level=before+1;level<=(c.skills?.[skill]||0);level++)milestones.push({id:r.id,name:r.name,role:r.role,skill,level,turn:G.turn,action:PILOT.actions});
  }
  return result;
 };
 window.skillAuditSnapshot=()=>{
  G.crew.forEach(record);
  return {crew:[...records.values()].map(({actor,...r})=>({...r,present:G.crew.includes(actor),hp:actor.hp,
   final:{...actor.skills},xp:{...actor._skillXp}})),milestones,sources};
 };
};
