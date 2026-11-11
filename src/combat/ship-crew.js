// Engines move the hull; the living bridge crew aim and evade.
function shipBridgeOperator(skill){
  const preferred=skill==='nav'?'scout':'mercenary';
  return G.crew.filter(crewCanContributeCombat).sort((a,b)=>
    crewSkillValue(b,skill)-crewSkillValue(a,skill)||Number(b.role===preferred)-Number(a.role===preferred)||
    Number(b.role==='captain')-Number(a.role==='captain'))[0]||null;
}

function shipBridgeSkills(ship=G.ship){
  if(ship===G.ship){
    const gunner=shipBridgeOperator('cbt'),pilot=shipBridgeOperator('nav');
    return {gunner,pilot,gunnery:gunner?Math.min(10,crewSkillValue(gunner,'cbt')):0,
      piloting:pilot&&effectiveEngineRating(ship)>0&&(G.fuel>0||DEBUG.infiniteFuel)?Math.min(10,crewSkillValue(pilot,'nav')):0};
  }
  const rank=Math.min(6,1+Math.floor((ship.maxHp||30)/60));
  const skills=ship.bridgeSkills||{gunnery:ship._homeCluster?3:ship.type==='patrol'?3:rank,
    piloting:ship._homeCluster?3:ship.type==='patrol'?3:ship.engineRating>=3?3:2};
  return {gunnery:skills.gunnery,piloting:effectiveEngineRating(ship)>0?skills.piloting:0};
}

function trainShipBridge(skill,operator=shipBridgeOperator(skill)){
  if(operator?.hp>0)giveSkillXP(operator,skill,1);
}

function rollShipCombatCrewDamage(hullDamage,source){
  if(hullDamage<=0||G.ship.hp<=0||DEBUG.infiniteCrewHp)return null;
  const living=G.crew.filter(crew=>crew.hp>0);
  if(!living.length||Math.random()>=Math.min(0.45,0.10+hullDamage*0.0125))return null;
  const crew=living[rnd(living.length)],damage=Math.min(crew.hp,2+rnd(7)+Math.ceil(hullDamage/2));
  crew.hp-=damage;
  addCombatLog(crewDisplayName(crew)+(crew.hp<=0?' has died':' is wounded')+' in a shipboard impact from '+source+' ('+damage+' HP).','lc');
  if(crew.hp>0&&Math.random()<0.45){
    const injuries=['bleeding','concussion','burns','stunned'],id=injuries[rnd(injuries.length)];
    applyCrewInjury(crew,id,{amount:id==='stunned'?1:Math.min(3,Math.ceil(damage/8)),duration:id==='stunned'?2:null,source:'ship combat'});
  }
  pruneDead();
  if(!crewAlive()){
    G.dead=true;G.deathCause='All crew were killed by '+source+' during ship combat. The ship drifted on without a living crew.';
    G.shipCombat=null;G.mode='galaxy';
  }
  return {crew,damage};
}
