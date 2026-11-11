const SHIP_COMBAT_TACTICS=['brawler','skirmisher','sniper','missile'];
const SHIP_TACTIC_LABELS={brawler:'Close assault',skirmisher:'Skirmisher',sniper:'Long-range fire',missile:'Missile standoff',flee:'Fleeing',ram:'Ram attack'};

function shipCombatTactic(enemy){
  const ship=enemy.ship;
  if(ship._homeCluster)return 'ram';
  if(!shipSystemStats(ship).weaponSlots)return 'flee';
  const weapons=actorShipCombatWeapons(ship).filter(({slot,weapon})=>shipWeaponOnline(ship,slot)&&shipWeaponHasAmmo(ship,weapon));
  if(!weapons.length)return 'flee';
  if(weapons.some(({weapon})=>weapon.guided))return 'missile';
  if(SHIP_COMBAT_TACTICS.includes(ship.combatTactic)&&ship.combatTactic!=='missile')return ship.combatTactic;
  if(ship.type==='patrol'||ship.engineRating>=3)return 'skirmisher';
  if(weapons.some(({weapon})=>weapon.range>=7))return 'sniper';
  return 'brawler';
}

function shipCombatPreferredRange(enemy){
  const range=shipCombatEnemyRange(enemy),tactic=shipCombatTactic(enemy);
  return tactic==='ram'?1:tactic==='brawler'?Math.min(3,range):Math.max(2,range-1);
}

function shipCombatEnemyShouldReposition(combat,enemy){
  const tactic=shipCombatTactic(enemy),ship=enemy.ship;
  if(tactic==='ram')return !shipCombatEnemyCanFire(combat,enemy)&&!shipCombatEnemyThreat(combat,enemy);
  if(!shipCombatMoveRating(enemy)||!effectiveSensorRange(ship))return false;
  if(tactic==='flee')return true;
  if(!shipCombatEnemyThreat(combat,enemy))return true;
  const distance=shipCombatDistance(enemy,combat.player),preferred=shipCombatPreferredRange(enemy);
  if(ship.heat>=shipHeatCapacity(ship)*0.75&&distance>=preferred-1)return false;
  // Do not let an approaching foe indefinitely suppress a ready gun by forcing another retreat.
  if(shipCombatEnemyCanFire(combat,enemy)&&enemy.lastManeuverAt===G.turn-1)return false;
  if(tactic==='brawler')return distance>preferred+1;
  if(distance<preferred-1)return true;
  // Use reload/heat downtime to seek room or cover instead of always holding still.
  return !shipCombatEnemyCanFire(combat,enemy);
}

function shipCombatEnemyManeuverSatisfied(combat,enemy){
  const tactic=shipCombatTactic(enemy);
  if(tactic==='ram')return false; // Contact consumes a movement step instead of stopping at adjacency.
  if(tactic==='flee'||!shipCombatEnemyCanFire(combat,enemy))return false;
  const distance=shipCombatDistance(enemy,combat.player),preferred=shipCombatPreferredRange(enemy);
  return tactic==='brawler'||tactic==='ram'?distance<=preferred:distance>=preferred&&distance<=shipCombatEnemyRange(enemy);
}

// Bounded weighted routing can find a flank around cover rather than oscillating at a wall.
function shipCombatEnemyNextStep(combat,enemy,destination){
  const tactic=shipCombatTactic(enemy),recovering=shipCombatEnemyThreat(combat,enemy)&&!shipCombatEnemyCanFire(combat,enemy);
  const preferred=tactic==='ram'?0:shipCombatPreferredRange(enemy)+(recovering&&tactic==='skirmisher'?1:0);
  const index=combat.enemies.indexOf(enemy),incoming=combat.missiles.filter(missile=>missile.target===index&&
    shipCombatDistance(enemy,missile)<=shipCombatSensorRange(enemy.ship));
  const tacticalScore=point=>{
    const distance=shipCombatDistance(point,destination),clear=!buildTileLine(point.x,point.y,destination.x,destination.y).some(tile=>
      shipCombatAsteroid(combat,tile)||livingShipCombatEnemies(combat).some(actor=>actor!==enemy&&actor.x===tile.x&&actor.y===tile.y));
    let score=tactic==='flee'?Math.min(point.x,point.y,COMBAT_MAP.width-1-point.x,COMBAT_MAP.height-1-point.y)*4:
      tactic==='brawler'||tactic==='ram'?Math.max(0,distance-preferred)*3:Math.abs(distance-preferred)*3;
    if(tactic==='sniper'||tactic==='skirmisher')score+=clear?0:recovering?-1.5:8;
    if(tactic==='brawler' && !clear)score+=8;
    if(tactic==='missile')score+=clear?2:0;
    if(tactic!=='ram'&&point.x===destination.x&&point.y===destination.y)score+=100;
    score+=(shipCombatPlasma(combat,point)?.damage||0)*0.65;
    for(const missile of incoming)score+=Math.max(0,4-shipCombatDistance(point,missile))*3;
    return score;
  };
  const start={x:enemy.x,y:enemy.y,cost:0,first:null},open=[start],costs=new Map([[start.x+','+start.y,0]]);
  let best=start,bestScore=tacticalScore(start);
  while(open.length){
    open.sort((a,b)=>a.cost-b.cost);const node=open.shift();
    if(node.cost>costs.get(node.x+','+node.y))continue;
    const score=tacticalScore(node)+node.cost*0.22;
    if(score<bestScore-0.001){best=node;bestScore=score;}
    for(const [dx,dy]of COMBAT_STEPS){
      const point={x:node.x+dx,y:node.y+dy};
      const contact=tactic==='ram'&&point.x===combat.player.x&&point.y===combat.player.y;
      if(!contact&&!shipCombatOpen(combat,point))continue;
      const key=point.x+','+point.y,cost=node.cost+1+(shipCombatPlasma(combat,point)?.damage||0)*0.6;
      if(cost>=(costs.get(key)??Infinity))continue;
      costs.set(key,cost);open.push({...point,cost,first:node.first||point});
    }
  }
  return best.first;
}
