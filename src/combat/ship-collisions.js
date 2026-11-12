function shipCombatImpactSize(ship){
  if(ship===G.ship)return hullSize();
  const blueprint=SHIP_CLASSES[shipSystemStats(ship).classId||ship.classId];
  if(blueprint)return blueprint.size;
  if(ship._homeCluster)return ship.isMassive?4:2;
  const civilian={cargo:2.5,trader:1.5,science:1,patrol:1.5}[ship.type];
  const factoryHull=Number.isFinite(ship.maxHp)&&ship.maxHp>0?ship.maxHp:60;
  return civilian||Math.max(0.75,Math.min(4,Math.sqrt(factoryHull/40)));
}

function shipCombatCollisionAt(combat,point){
  const rock=combat.asteroids.find(rock=>point.x>=rock.x&&point.x<rock.x+(rock.width??1)&&point.y>=rock.y&&point.y<rock.y+(rock.height??1));
  if(rock)return {rock};
  const enemy=livingShipCombatEnemies(combat).find(enemy=>enemy.x===point.x&&enemy.y===point.y);
  return enemy?{enemy}:null;
}

function shipCombatRamDamage(attackerSize,defenderSize,boosted,roll){
  const impact=(6+roll)*(boosted?2.5:1);
  return {target:Math.max(1,Math.round(impact*attackerSize/defenderSize)),
    recoil:Math.max(1,Math.round(impact*defenderSize/attackerSize))};
}

function ramShipCombatEnemy(combat,enemy,boosted=false,incoming=false){
  const pilot=effectiveEngineRating()>0&&(G.fuel>0||DEBUG.infiniteFuel)?shipBridgeOperator('nav'):null;
  const playerSize=shipCombatImpactSize(G.ship),enemySize=shipCombatImpactSize(enemy.ship);
  const damage=shipCombatRamDamage(incoming?enemySize:playerSize,incoming?playerSize:enemySize,boosted,rnd(5));
  const playerDamage=incoming?damage.target:damage.recoil,enemyDamage=incoming?damage.recoil:damage.target;
  const before=Object.values(ensureShipSystems()).map(system=>system.condition);
  const enemyBefore=Object.values(ensureShipSystems(enemy.ship)).map(system=>system.condition);
  // Resolve the target and the player's recoil even when the target is destroyed.
  const enemyHull=damageShipCombatEnemy(combat,enemy,enemyDamage,true,'ramming collision');
  const playerHull=damageShipCombatPlayer(combat,playerDamage,true,enemy.ship.name+' ramming collision',true);
  addCombatLog((incoming?enemy.ship.name+' rams your ship':(boosted?'BOOST RAM':'RAM')+' into '+enemy.ship.name)+
    ' — '+playerHull+' hull lost, '+enemyHull+' enemy hull lost. Shields bypassed.','lc');
  if(!G.dead)trainShipBridge('nav',pilot);
  const critical=incoming?Object.values(G.ship.systems).some((system,index)=>system.condition<before[index]):
    Object.values(enemy.ship.systems).some((system,index)=>system.condition<enemyBefore[index]);
  queueShipCombatFeedback(combat,incoming?enemy:combat.player,incoming?combat.player:enemy,
    {side:incoming?'enemy':'player',hit:true,hull:incoming?playerHull:enemyHull,critical,impactOnly:true,
      impact:incoming&&enemy.ship._homeCluster?'wraith':'ram'});
  if(G.ship.hp===0)G.deathCause='The ship was destroyed in a '+(boosted?'boosted ':'')+'ramming collision with '+enemy.ship.name+'.';
  return {playerHull,enemyHull};
}

function crashShipCombatAsteroid(combat,rock){
  const area=(rock.width??1)*(rock.height??1),damage=Math.round((6+rnd(5))*2.5*Math.sqrt(area));
  const hull=damageShipCombatPlayer(combat,damage,true,'an asteroid collision',true);
  queueShipCombatFeedback(combat,combat.player,rock,{side:'enemy',hit:true,hull,impactOnly:true,impact:'asteroid'});
  addCombatLog('BOOST COLLISION with '+(rock.width??1)+'×'+(rock.height??1)+' asteroid — '+hull+' hull lost. Shields bypassed.','lc');
  if(G.ship.hp===0)G.deathCause='The ship was destroyed by boosting into an asteroid.';
}

function finishShipCombatManeuver(combat,action,hit=false){
  if(G.dead){beginCareerTurn('combat');finishCareerTurn();renderAll();return;}
  advanceShipCombat(combat,hit,action);
}
