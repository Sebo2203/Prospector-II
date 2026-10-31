const SURVEY_BONUS_MILESTONES = [
  { at:400,  reward:20, text:'Science Office files your first proper survey commendation.' },
  { at:1000, reward:35, text:'A clerk stamps your work priority in green and actually means it.' },
  { at:1800, reward:60, text:'Your survey packages start getting noticed by name.' },
  { at:3000, reward:90, text:'Science Office pays a small excellence bonus for your mapping record.' },
];

function awardSurveyMilestones(surveySold){
  ensureCrewMoraleState();
  if(surveySold <= 0) return;
  G.surveyCareerCredits += surveySold;
  while((G.surveyBonusTier || 0) < SURVEY_BONUS_MILESTONES.length &&
        G.surveyCareerCredits >= SURVEY_BONUS_MILESTONES[G.surveyBonusTier].at){
    const bonus = SURVEY_BONUS_MILESTONES[G.surveyBonusTier];
    earnCredits(bonus.reward);
    addLog(bonus.text,'lg');
    addLog('Survey bonus paid: '+bonus.reward+' cr.','lg');
    G.surveyBonusTier++;
  }
}

function randomCrewMember(roleKey){
  const role = CREW_ROLES[roleKey];
  const first = CREW_FIRST_NAMES[Math.floor(Math.random()*CREW_FIRST_NAMES.length)];
  const last  = CREW_LAST_NAMES[Math.floor(Math.random()*CREW_LAST_NAMES.length)];
  const baseSkills = ROLE_STARTING_SKILLS[roleKey] || { nav:0, sci:0, cbt:0, soc:0, med:0, eng:0 };
  return {
    role:        roleKey,
    name:        first+' '+last,
    hp:          role.hp,
    maxHp:       role.maxHp,
    atk:         role.atk,
    def:         role.def,
    weapon:      'Bare hands',
    weaponUsable: null,
    armor:       'Flight suit',
    armorUsable: 'armor_flight',  // flight suit = +1 DEF
    birthplace:  CREW_BIRTHPLACES[Math.floor(Math.random()*CREW_BIRTHPLACES.length)],
    age:         18 + Math.floor(Math.random()*23),
    trait:       CREW_TRAITS[Math.floor(Math.random()*CREW_TRAITS.length)],
    skills:      { ...baseSkills },
    moraleBase:  55,
    grief:       0,
    drinkGlow:   0,
    drugRush:    0,
    lowMoraleSince: null,
    unpaidDocks: 0,
    statuses:    {},
  };
}

