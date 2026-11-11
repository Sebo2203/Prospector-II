const ARTEMIS_FLIGHT_SPEED=4;
const ARTEMIS_FLIGHT_TICKS=4;

function launchShipCombatMissile(combat,source,target){
  const from=source<0?combat.player:combat.enemies[source];
  const to=target<0?combat.player:combat.enemies[target];
  const ship=source<0?G.ship:from.ship;
  combat.missiles.push({source,target,x:from.x,y:from.y,gunnery:shipBridgeSkills(ship).gunnery,
    range:shipCombatDistance(from,to),lastRound:combat.round,ticks:0});
  addCombatLog((source<0?'You launch':ship.name+' launches')+' an Artemis missile at '+
    (target<0?'your ship':to.ship.name)+'. Estimated flight '+Math.max(1,Math.ceil(shipCombatDistance(from,to)/ARTEMIS_FLIGHT_SPEED))+'t.','lw');
}

function advanceShipCombatMissiles(combat){
  const pending=[];
  for(const missile of combat.missiles){
    const target=missile.target<0?combat.player:combat.enemies[missile.target];
    if(missile.target>=0 && (target.escaped || target.ship.alive===false || target.ship.hp<=0)){
      addCombatLog('Artemis missile loses its target.','li');continue;
    }
    if(missile.lastRound>=combat.round){pending.push(missile);continue;}
    missile.lastRound=combat.round;
    missile.ticks++;
    const from={x:missile.x,y:missile.y};
    const path=shipCombatMissilePath(combat,missile,target);
    if(!path || path.length>ARTEMIS_FLIGHT_SPEED){
      const next=path?.[Math.min(ARTEMIS_FLIGHT_SPEED,path.length)-1];
      if(next){missile.x=next.x;missile.y=next.y;}
      if(missile.ticks>=ARTEMIS_FLIGHT_TICKS)addCombatLog('Artemis missile exhausts its fuel and self-destructs.','li');
      else pending.push(missile);
      continue;
    }
    const ship=missile.target<0?G.ship:target.ship,weapon=SHIP_WEAPONS.artemis;
    const pilot=missile.target<0&&effectiveEngineRating()>0&&(G.fuel>0||DEBUG.infiniteFuel)?shipBridgeOperator('nav'):null;
    const hit=Math.random()<shipCombatHitChance(missile.gunnery,shipBridgeSkills(ship).piloting,missile.range);
    let hull=0,critical=false;
    if(hit){
      const damage=weapon.minDmg+rnd(weapon.maxDmg-weapon.minDmg+1);
      const before=Object.values(ensureShipSystems(ship)).map(component=>component.condition);
      hull=missile.target<0?damageShipCombatPlayer(combat,damage,true,combat.enemies[missile.source].ship.name):damageShipCombatEnemy(combat,target,damage);
      if(G.ship.hp===0 && missile.target<0)G.deathCause='The ship was destroyed by an Artemis missile launched by '+combat.enemies[missile.source].ship.name+'.';
      critical=Object.values(ship.systems).some((component,index)=>component.condition<before[index]);
      addCombatLog('Artemis missile hits '+(missile.target<0?'your ship':ship.name)+' for '+damage+' ('+hull+' hull).',missile.target<0?'lc':'lg');
    }else addCombatLog('Artemis missile misses '+(missile.target<0?'your ship':ship.name)+'.','ln');
    if(missile.target<0&&!G.dead)trainShipBridge('nav',pilot);
    queueShipCombatFeedback(combat,from,target,{side:missile.target<0?'enemy':'player',hit,hull,critical,impactOnly:true});
    if(G.dead){combat.missiles=[];return;}
  }
  combat.missiles=pending.filter(missile=>missile.target<0 ||
    (!combat.enemies[missile.target].escaped && combat.enemies[missile.target].ship.alive!==false && combat.enemies[missile.target].ship.hp>0));
}

function shipCombatMissilePath(combat,from,target){
  const queue=[{x:from.x,y:from.y,parent:-1}],seen=new Set([from.x+','+from.y]);
  for(let index=0;index<queue.length;index++){
    const node=queue[index];
    if(node.x===target.x && node.y===target.y){
      const path=[];let cursor=index;
      while(queue[cursor].parent>=0){path.push(queue[cursor]);cursor=queue[cursor].parent;}
      return path.reverse();
    }
    const choices=COMBAT_STEPS.map(([dx,dy])=>({x:node.x+dx,y:node.y+dy,parent:index}));
    choices.sort((a,b)=>shipCombatDistance(a,target)-shipCombatDistance(b,target) ||
      Math.abs(a.x-target.x)+Math.abs(a.y-target.y)-Math.abs(b.x-target.x)-Math.abs(b.y-target.y));
    for(const point of choices){
      const key=point.x+','+point.y;
      if(seen.has(key) || point.x<0 || point.y<0 || point.x>=COMBAT_MAP.width || point.y>=COMBAT_MAP.height ||
        shipCombatAsteroid(combat,point))continue;
      if((point.x!==target.x || point.y!==target.y) && !shipCombatOpen(combat,point))continue;
      seen.add(key);queue.push(point);
    }
  }
  return null;
}

// Static galaxy targets use one additional career turn, including when another encounter starts.
function advanceBaseMissiles(){
  const pending=[];
  for(const missile of G.baseMissiles){
    if(missile.dueTurn>G.turn){pending.push(missile);continue;}
    const base=G.pirateBases.find(base=>base.x===missile.x && base.y===missile.y);
    if(base && !base.destroyed){
      const weapon=SHIP_WEAPONS.artemis;
      damagePirateBase(base,weapon,weapon.minDmg+rnd(weapon.maxDmg-weapon.minDmg+1));
    }else addCombatLog('Artemis bombardment missile loses its destroyed target.','li');
  }
  G.baseMissiles=pending;
}
