function skillXpForLevel(level){ return 25 * level; }

function giveSkillXP(crewMember, skillId, amount){
  if(!crewMember || crewMember.hp <= 0 || !CREW_SKILLS.some(skill=>skill.id===skillId) ||
     !Number.isFinite(amount) || amount<=0) return false;
  if(!crewMember.skills) crewMember.skills = { nav:0, sci:0, cbt:0, soc:0, med:0, eng:0 };
  if(!crewMember._skillXp) crewMember._skillXp = {};
  let currentLevel = crewMember.skills[skillId] || 0;
  if(currentLevel >= 10) return false; // already maxed
  crewMember._skillXp[skillId] = (crewMember._skillXp[skillId] || 0) + amount;
  let levelled=false;
  while(currentLevel<10 && crewMember._skillXp[skillId]>=skillXpForLevel(currentLevel+1)){
    crewMember._skillXp[skillId] -= skillXpForLevel(currentLevel+1);
    crewMember.skills[skillId] = ++currentLevel;
    addLog(crewDisplayName(crewMember)+' — '+
      (CREW_SKILLS.find(s=>s.id===skillId)?.label||skillId)+
      ' skill increased to '+crewMember.skills[skillId]+'!','ll');
    levelled=true;
  }
  if(currentLevel===10) crewMember._skillXp[skillId]=0;
  return levelled;
}
// Six skill categories, 0–10 scale.
const CREW_SKILLS = [
  { id:'nav', label:'Navigation', abbr:'NAV', col:'#70d8ff',
    desc:'Ship evasion, survival landings, nebula navigation, scan quality' },
  { id:'sci', label:'Science',    abbr:'SCI', col:'#70f090',
    desc:'Biodata analysis, alien comms, future: hacking' },
  { id:'cbt', label:'Combat',     abbr:'CBT', col:'#f07070',
    desc:'Ship gunnery; attack accuracy and damage in ground combat' },
  { id:'soc', label:'Social',     abbr:'SOC', col:'#d488ff',
    desc:'Command, morale, discipline, negotiation and social pressure' },
  { id:'med', label:'Medicine',   abbr:'MED', col:'#ff6688',
    desc:'Chance to heal crew injuries and rare diseases' },
  { id:'eng', label:'Engineering',abbr:'ENG', col:'#ffaa44',
    desc:'Repairs, ship modifications, planet construction' },
];

// Default starting skills by role
const ROLE_STARTING_SKILLS = {
  captain:   { nav:1, sci:0, cbt:1, soc:4, med:0, eng:1 },
  scout:     { nav:3, sci:3, cbt:1, soc:1, med:0, eng:0 },
  engineer:  { nav:0, sci:1, cbt:1, soc:0, med:0, eng:3 },
  scientist: { nav:1, sci:4, cbt:0, soc:1, med:1, eng:0 },
  medic:     { nav:0, sci:2, cbt:0, soc:1, med:4, eng:0 },
  mercenary: { nav:1, sci:0, cbt:4, soc:0, med:0, eng:1 },
  redshirt:  { nav:1, sci:0, cbt:1, soc:0, med:0, eng:1 },
};

// Returns the DEF bonus from equipped armor
function armorDefBonus(c){
  if(c.armorUsable === 'armor_exosuit')    return 3;
  if(c.armorUsable === 'armor_reinforced') return 2;
  if(c.armorUsable === 'armor_flight')     return 1;
  if(c.armorUsable === 'armor_plate')      return 1;
  if(c.armorUsable === 'armor_diving')     return 0;
  return 0; // naked
}

// Returns display name: "Captain Vasquez" for specials, "Vasquez" for grunts
function crewDisplayName(c){
  const role = CREW_ROLES[c.role];
  const lastName = c.name ? c.name.split(' ').slice(-1)[0] : 'Unknown';
  if(role && role.special) return role.label+' '+lastName;
  return lastName;
}

